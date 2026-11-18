# -*- coding: utf-8 -*-
"""解析已抓取的维基文库《周易》文本，输出 json（繁体），再一次性转简体。"""
import json, os, re, subprocess

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
    s = re.sub(r'<[^>]+>', '', s)
    s = re.sub(r'\{\{另\|([^|}]*)[^}]*\}\}', r'\1', s)
    s = re.sub(r'\{\{\*\|[^}]*\}\}', '', s)
    s = re.sub(r'\{\{[^}]*\}\}', '', s)
    s = re.sub(r'\[\[(?:[^|\]]*\|)?([^\]]*)\]\]', r'\1', s)
    s = s.replace("'''", '').replace("''", '')
    s = re.sub(r'\s+', '', s)
    return s.strip()


def parse(t):
    raw = t.split('\n')
    lines = []
    for ln in raw:
        if re.match(r'^(style=|\||\}\})', ln.strip()) and lines:
            lines[-1] = lines[-1] + ln.strip()
        else:
            lines.append(ln)
    ci, yao, xiang, xiao = '', [], '', []
    state = ''
    for ln in lines:
        s = ln.strip()
        if s.startswith('*') and '易經' in s:
            state = 'jing'; continue
        if s.startswith('*') and re.match(r"^\*'{0,3}彖曰", s):
            state = 'tuan'; continue
        if s.startswith('*') and re.match(r"^\*'{0,3}象曰", s):
            state = 'xiang'; continue
        if s.startswith('*') and re.match(r"^\*'{0,3}文言", s):
            state = 'wenyan'; continue
        if s.startswith('*') and not s.startswith('**') and not s.startswith('*#'):
            state = ''; continue
        if state == 'jing':
            if s.startswith('**'):
                x = clean(s[2:])
                if x and not ci:
                    ci = x
            elif s.startswith('*#'):
                x = clean(s[2:])
                if x:
                    yao.append(x)
            elif s.startswith('***'):
                x = clean(s[3:])
                if x and ci:
                    ci = ci + x
        elif state == 'xiang':
            if s.startswith('**'):
                x = clean(s[2:])
                if x and not xiang:
                    xiang = x
            elif s.startswith('*#'):
                x = clean(s[2:])
                if x:
                    xiao.append(x)
    return ci, yao, xiang, xiao


def split_yao(x):
    m = re.match(r'^([初上][九六]|[九六][二三四五]|用[九六])[：:](.*)$', x)
    if m:
        return m.group(1), m.group(2)
    m = re.match(r'^(.{2,3}?)[：:](.*)$', x)
    if m:
        return m.group(1), m.group(2)
    return '', x


out, problems = {}, []
for short, full in SHORT2FULL.items():
    p = '/tmp/raw/%s.txt' % short
    if not os.path.exists(p):
        problems.append((short, 'nofile')); continue
    ci, yao, xiang, xiao = parse(open(p).read())
    if not ci or len(yao) < 6 or not xiang or len(xiao) < 6:
        problems.append((short, len(yao), len(xiao), bool(ci), bool(xiang))); continue
    ys = []
    for y in yao[:6]:
        k, v = split_yao(y)
        ys.append([k, v])
    yong = None
    if len(yao) > 6 and len(xiao) > 6:
        k, v = split_yao(yao[6])
        yong = [k, v, xiao[6]]
    out[full] = {'ci': ci, 'xiang': xiang, 'yao': ys, 'xiao': xiao[:6], 'yong': yong}

print('parsed', len(out), 'problems', problems)

# 一次性繁转简：所有字段按行拼接
rows = []
for full, d in out.items():
    rows.append(d['ci']); rows.append(d['xiang'])
    for k, v in d['yao']:
        rows.append(k + '\u0001' + v)
    for x in d['xiao']:
        rows.append(x)
    if d['yong']:
        rows.append(d['yong'][0] + '\u0001' + d['yong'][1]); rows.append(d['yong'][2])

blob = '\n'.join(rows).replace('乾', '\u0002')
res = subprocess.run(['opencc', '-c', 't2s'], input=blob, capture_output=True, text=True)
conv = [x.replace('\u0002', '乾') for x in res.stdout.split('\n')]
assert len(conv) == len(rows), (len(conv), len(rows))

it = iter(conv)
for full, d in out.items():
    d['ci'] = next(it); d['xiang'] = next(it)
    ny = []
    for k, v in d['yao']:
        a, b = next(it).split('\u0001')
        ny.append([a, b])
    d['yao'] = ny
    d['xiao'] = [next(it) for _ in range(6)]
    if d['yong']:
        a, b = next(it).split('\u0001'); c = next(it)
        d['yong'] = [a, b, c]

for full, d in out.items():
    d['ci'] = re.sub(r'^.{%d}[：:]' % (1 if len(full) <= 4 else 2), '', d['ci'], count=1) if re.match(r'^.{%d}[：:]' % (1 if len(full) <= 4 else 2), d['ci']) else d['ci']
    # 更稳妥：只用已知短名去掉前缀
    sn = {'乾为天': '乾', '坤为地': '坤'}.get(full, full[2:])
    if d['ci'].startswith(sn + '：'):
        d['ci'] = d['ci'][len(sn) + 1:]

json.dump(out, open('/var/minis/workspace/divination/_yijing.json', 'w'), ensure_ascii=False, indent=1)
print('saved')
