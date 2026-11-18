# -*- coding: utf-8 -*-
"""从维基文库抓取《周易》64 卦的卦辞、爻辞、大象、小象，转简体后输出 JSON。"""
import json, re, subprocess, sys, urllib.request, time

API = "https://zh.wikisource.org/w/api.php?action=parse&page={}&prop=wikitext&format=json&formatversion=2"
NS = "周易/"

SHORT2FULL = {
    '乾': '乾为天', '坤': '坤为地', '屯': '水雷屯', '蒙': '山水蒙', '需': '水天需', '訟': '天水讼',
    '師': '地水师', '比': '水地比', '小畜': '风天小畜', '履': '天泽履', '泰': '地天泰', '否': '天地否',
    '同人': '天火同人', '大有': '火天大有', '謙': '地山谦', '豫': '雷地豫', '隨': '泽雷随', '蠱': '山风蛊',
    '臨': '地泽临', '觀': '风地观', '噬嗑': '火雷噬嗑', '賁': '山火贲', '剝': '山地剥', '復': '地雷复',
    '无妄': '天雷无妄', '大畜': '山天大畜', '頤': '山雷颐', '大過': '泽风大过', '坎': '坎为水', '離': '离为火',
    '咸': '泽山咸', '恒': '雷风恒', '遯': '天山遁', '大壯': '雷天大壮', '晉': '火地晋', '明夷': '地火明夷',
    '家人': '风火家人', '睽': '火泽睽', '蹇': '水山蹇', '解': '雷水解', '損': '山泽损', '益': '风雷益',
    '夬': '泽天夬', '姤': '天风姤', '萃': '泽地萃', '升': '地风升', '困': '泽水困', '井': '水风井',
    '革': '泽火革', '鼎': '火风鼎', '震': '震为雷', '艮': '艮为山', '漸': '风山渐', '歸妹': '雷泽归妹',
    '豐': '雷火丰', '旅': '火山旅', '巽': '巽为风', '兌': '兑为泽', '渙': '风水涣', '節': '水泽节',
    '中孚': '风泽中孚', '小過': '雷山小过', '既濟': '水火既济', '未濟': '火水未济',
}

def clean(s):
    s = re.sub(r'-\{|\}-', '', s)
    s = re.sub(r'<span[^>]*>|</span>', '', s)
    s = re.sub(r'<[^>]+>', '', s)
    s = re.sub(r'\{\{\*\|[^}]*\}\}', '', s)
    s = re.sub(r'\{\{[^}]*\}\}', '', s)
    s = re.sub(r'\[\[(?:[^|\]]*\|)?([^\]]*)\]\]', r'\1', s)
    s = s.replace("'''", '').replace("''", '')
    s = re.sub(r'\s+', '', s)
    return s.strip()

def fetch(short):
    url = API.format(urllib.parse.quote(NS + short))
    for _ in range(3):
        try:
            with urllib.request.urlopen(url, timeout=30) as r:
                d = json.load(r)
            return d['parse']['wikitext']
        except Exception as e:
            time.sleep(1.5)
    return None

def parse(t):
    lines = t.split('\n')
    state = ''
    ci, yao, xiang, xiao = '', [], '', []
    for ln in lines:
        s = ln.strip()
        if "易經" in s and s.startswith('*'):
            state = 'jing'; continue
        if s.startswith("*'''彖曰") or '彖曰' in s[:12] and s.startswith('*'):
            state = 'tuan'; continue
        if s.startswith("*'''象曰") or ('象曰' in s[:12] and s.startswith('*')):
            state = 'xiang'; continue
        if s.startswith("*'''文言") or ('文言曰' in s[:14] and s.startswith('*')):
            state = 'wenyan'; continue
        if s.startswith('*') and not s.startswith('**') and not s.startswith('*#'):
            if state: state = ''
        if state == 'jing':
            if s.startswith('**'):
                x = clean(s[2:])
                if x: ci = ci or x
            elif s.startswith('*#'):
                x = clean(s[2:])
                if x: yao.append(x)
        elif state == 'xiang':
            if s.startswith('**'):
                x = clean(s[2:])
                if x: xiang = xiang or x
            elif s.startswith('*#'):
                x = clean(s[2:])
                if x: xiao.append(x)
    return ci, yao, xiang, xiao

def split_yao(x):
    """把「初九：潛龍勿用。」拆成 (爻题, 爻辞)"""
    m = re.match(r'^(.{2,3}?)[：:](.*)$', x)
    if m:
        return m.group(1), m.group(2)
    return '', x

def t2s(s):
    p = subprocess.run(['opencc', '-c', 't2s'], input=s, capture_output=True, text=True)
    return p.stdout.strip() if p.returncode == 0 else s

out = {}
problems = []
for short, full in SHORT2FULL.items():
    t = fetch(short)
    if not t:
        problems.append((short, 'fetch')); continue
    t = t2s(t)
    ci, yao, xiang, xiao = parse(t)
    ci, xiang = t2s(ci), t2s(xiang)
    yao = [t2s(y) for y in yao]
    xiao = [t2s(x) for x in xiao]
    if not ci or len(yao) < 6 or not xiang or len(xiao) < 6:
        problems.append((short, len(yao), len(xiao))); continue
    ys, ysx = [], []
    for y in yao[:6]:
        k, v = split_yao(y)
        ys.append([k, v])
    for i, x in enumerate(xiao[:6]):
        ysx.append(x)
    # 用九 / 用六
    yong = None
    if len(yao) > 6 and len(xiao) > 6:
        k, v = split_yao(yao[6]); yong = [k, v, xiao[6]]
    out[full] = {'ci': ci, 'xiang': xiang, 'yao': ys, 'xiao': ysx, 'yong': yong}

print('ok', len(out), 'problems', problems)
with open('/var/minis/workspace/divination/_raw_yao.json', 'w') as f:
    json.dump(out, f, ensure_ascii=False, indent=1)
