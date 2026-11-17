/* ===== 梅花易数 ===== */
(function (global) {
  'use strict';
  var H = global.HexUtil;

  function numToTri(n) { // n: 1..8 或 0
    var r = n % 8; if (r === 0) r = 8;
    return H.NUM_TRI[r];
  }

  // 由 上卦/下卦/动爻 组装完整卦象
  function build(upper, lower, dong) {
    var lines = [];
    var lo = H.TRI_BITS[lower], up = H.TRI_BITS[upper];
    for (var i = 0; i < 3; i++) lines.push((lo >> (2 - i)) & 1);
    for (var j = 0; j < 3; j++) lines.push((up >> (2 - j)) & 1);

    var hu = [lines[1], lines[2], lines[3], lines[2], lines[3], lines[4]];
    var huGua = H.fromLines(hu);

    var bianLines = lines.slice();
    bianLines[dong - 1] = bianLines[dong - 1] ? 0 : 1;
    var bian = H.fromLines(bianLines);

    // 体用：动爻在下卦 → 下为用、上为体
    var yongInLower = dong <= 3;
    var ti = yongInLower ? upper : lower;
    var yong = yongInLower ? lower : upper;

    return {
      upper: upper, lower: lower, dong: dong,
      name: H.guaName(upper, lower), lines: lines,
      hu: huGua, bian: bian, bianLines: bianLines,
      ti: ti, yong: yong, yongIsLower: yongInLower
    };
  }

  function judge(g) {
    var t = H.TRI_INFO[g.ti], y = H.TRI_INFO[g.yong];
    var r = H.relWX(t.wx, y.wx);
    var out = { rel: r, level: '', head: '', detail: [] };

    var map = {
      '生': ['小凶', '体生用', '用（事、客、对方）受我之生，我付出、我耗力，事情虽能成，但费力耗财，成事而不得实利。宜量力而行。'],
      '被生': ['大吉', '用生体', '用（事、客、对方）来生我，事来就我、外助自来。不劳而获之象，所求易得，且多有贵人。'],
      '克': ['小吉', '体克用', '体克用，我制事、我主动。事情在掌控之中，然须费力争取，属"我强彼弱"之象，可成。'],
      '被克': ['凶', '用克体', '用克体，事来克我，阻力大、外压重。所求多阻，勉强求之必受伤。宜退守、避锋。'],
      '比和': ['吉', '体用比和', '体用比和，同气相求，事顺而易成，得人和之利，凡事和合。']
    };
    var m = map[r] || ['平', r, ''];
    out.level = m[0]; out.head = m[1]; out.detail.push(m[2]);

    out.detail.push('体卦为' + g.ti + '（' + t.xiang + '，' + t.wx + '），主自己、主事的本体；用卦为' + g.yong + '（' + y.xiang + '，' + y.wx + '），主所问之事、对方、外部条件。');

    // 互卦（过程）
    out.detail.push('互卦「' + g.hu.name + '」，为事情发展过程、内情。' + (H.GUA[g.hu.name] ? H.GUA[g.hu.name][1] : ''));

    // 变卦（结果）
    var bt = H.TRI_INFO[g.bian.upper], bl = H.TRI_INFO[g.bian.lower];
    var bianTi = g.yongIsLower ? (g.dong <= 3 ? bt : bl) : (g.dong <= 3 ? bl : bt);
    var yr = H.relWX(H.TRI_INFO[g.ti].wx, bianTi.wx);
    var bianMap = { '被生': '变卦生体，结局得助，愈后愈好', '生': '变卦受体之生，结局我耗力，成而费力', '被克': '变卦克体，结局受制，后难', '克': '变卦为体所克，终能掌控', '比和': '变卦与体比和，结局平顺' };
    out.detail.push('变卦「' + g.bian.name + '」，为事情最终结果。' + (bianMap[yr] || '') + '。' + (H.GUA[g.bian.name] ? H.GUA[g.bian.name][1] : ''));

    out.detail.push('断法次第：先看体用生克定吉凶，次看互卦察过程内情，再看变卦定结局；三者俱吉则大吉，一体受生而互变皆克，则先吉后凶。');
    return out;
  }

  // 时间起卦（用农历 + 时支）
  function byTime(lunar) {
    var yearZhiNum = ((lunar.getYearZhiIndex() % 12) + 1); // 子=1 ... 亥=12
    var month = Math.abs(lunar.getMonth());
    var day = lunar.getDay();
    var hourZhiNum = (lunar.getTimeZhiIndex() % 12) + 1;
    var s1 = yearZhiNum + month + day;
    var s2 = s1 + hourZhiNum;
    var upper = numToTri(s1), lower = numToTri(s2);
    var dong = s2 % 6; if (dong === 0) dong = 6;
    var g = build(upper, lower, dong);
    g.formula = '年支' + yearZhiNum + ' + 农历' + month + '月 + ' + day + '日 = ' + s1 + ' → 上卦 ' + upper +
      '；再加时支' + hourZhiNum + ' = ' + s2 + ' → 下卦 ' + lower + '；' + s2 + ' ÷ 6 余 ' + (s2 % 6 === 0 ? 0 : s2 % 6) + ' → 动爻第' + dong + '爻';
    return g;
  }

  // 数字起卦
  function byNumbers(a, b) {
    a = Math.abs(parseInt(a, 10) || 0); b = Math.abs(parseInt(b, 10) || 0);
    var upper = numToTri(a), lower = numToTri(b);
    var s = a + b, dong = s % 6; if (dong === 0) dong = 6;
    var g = build(upper, lower, dong);
    g.formula = '数 ' + a + ' ÷ 8 余 ' + (a % 8 === 0 ? 0 : a % 8) + ' → 上卦 ' + upper + '；数 ' + b + ' ÷ 8 余 ' + (b % 8 === 0 ? 0 : b % 8) + ' → 下卦 ' + lower + '；(' + a + '+' + b + ') ÷ 6 → 动爻第' + dong + '爻';
    return g;
  }

  // 单字/双字起卦（字数 + 笔画）
  function byChars(str) {
    str = (str || '').trim();
    if (!str) return null;
    var n = str.length;
    if (n === 1) return byNumbers(n, str.charCodeAt(0));
    var half = Math.floor(n / 2);
    var a = 0, b = 0;
    for (var i = 0; i < half; i++) a += str.charCodeAt(i);
    for (var j = half; j < n; j++) b += str.charCodeAt(j);
    return byNumbers(a, b);
  }

  global.MeiHua = { build: build, judge: judge, byTime: byTime, byNumbers: byNumbers, byChars: byChars, numToTri: numToTri };
})(window);
