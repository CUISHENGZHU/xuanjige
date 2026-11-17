/* ===== 六爻纳甲 ===== */
(function (global) {
  'use strict';
  var H = global.HexUtil;

  var LIUSHEN = ['青龙', '朱雀', '勾陈', '螣蛇', '白虎', '玄武'];
  var LIUSHEN_START = { 甲: 0, 乙: 0, 丙: 1, 丁: 1, 戊: 2, 己: 3, 庚: 4, 辛: 4, 壬: 5, 癸: 5 };

  var YONGSHEN_MAP = {
    '求财生意': '妻财', '事业官职': '官鬼', '考试学业': '父母', '婚姻感情': '妻财',
    '健康疾病': '官鬼', '失物寻人': '妻财', '官司诉讼': '官鬼', '文书合同': '父母',
    '子女晚辈': '子孙', '出行搬迁': '世爻', '一般问事': '世爻'
  };

  function zhiOf(gz) { return gz.charAt(1); }
  function ganOf(gz) { return gz.charAt(0); }

  // 背数：3背=老阳(阳动)，2背=少阴(静)，1背=少阳(静)，0背(三字)=老阴(阴动)
  function throwToYao(bei) {
    if (bei === 3) return { yang: 1, moving: true, label: '老阳 ○' };
    if (bei === 0) return { yang: 0, moving: true, label: '老阴 ×' };
    if (bei === 1) return { yang: 1, moving: false, label: '少阳 —' };
    return { yang: 0, moving: false, label: '少阴 - -' };
  }

  function build(throws, ctx) {
    // throws: 长度6，从初爻到上爻的「背数」0..3
    var lines = [], movings = [];
    for (var i = 0; i < 6; i++) {
      var y = throwToYao(throws[i]);
      lines.push(y.yang);
      if (y.moving) movings.push(i + 1);
    }
    var ben = H.fromLines(lines);
    var benPan = H.najia(ben.name);

    var bianLines = lines.slice();
    movings.forEach(function (p) { bianLines[p - 1] = bianLines[p - 1] ? 0 : 1; });
    var bian = H.fromLines(bianLines);
    var bianPan = H.najia(bian.name);

    var lsStart = LIUSHEN_START[ganOf(ctx.dayGZ)] || 0;
    var kong = ctx.dayKong || ''; // 如 "辰巳"

    var yao = [];
    for (var k = 0; k < 6; k++) {
      var o = benPan.yao[k];
      yao.push({
        pos: k + 1, yang: lines[k], moving: movings.indexOf(k + 1) >= 0,
        label: throwToYao(throws[k]).label,
        gan: o.gan, zhi: o.zhi, wx: o.wx, liuqin: o.liuqin,
        liuShen: LIUSHEN[(lsStart + k) % 6],
        shi: o.shi, ying: o.ying,
        kong: kong.length === 2 && (kong.charAt(0) === o.zhi || kong.charAt(1) === o.zhi),
        bian: Object.assign({}, bianPan.yao[k], { liuqin: H.liuqin(benPan.wx, bianPan.yao[k].wx) })
      });
    }

    var pan = {
      throws: throws, lines: lines, movings: movings, yao: yao,
      ben: benPan, bian: bianPan,
      bianName: bian.name, benName: ben.name,
      hasBian: movings.length > 0,
      dayGZ: ctx.dayGZ, monthGZ: ctx.monthGZ, yearGZ: ctx.yearGZ,
      monthZhi: zhiOf(ctx.monthGZ), dayZhi: zhiOf(ctx.dayGZ),
      kong: kong
    };
    pan.tips = tips(pan, ctx);
    return pan;
  }

  // 单爻与日辰月建的关系
  function relTo(wx, zhiWx) { return H.relWX(wx, zhiWx); }

  function tips(pan, ctx) {
    var out = [];
    var want = YONGSHEN_MAP[ctx.topic] || '世爻';
    var target;
    if (want === '世爻') target = pan.yao[pan.ben.shi - 1];
    else {
      var cand = pan.yao.filter(function (y) { return y.liuqin === want; });
      target = cand.length ? cand[0] : null;
    }
    var shi = pan.yao[pan.ben.shi - 1];
    var ying = pan.yao[pan.ben.ying - 1];

    out.push({ k: '用神', v: want + (target ? '（' + target.pos + '爻 ' + target.gan + target.zhi + target.wx + '）' : '（不上卦，需查伏神）') });

    if (target) {
      var byDay = H.relWX(target.wx, H.ZHI_WX[pan.dayZhi]);
      var byMonth = H.relWX(target.wx, H.ZHI_WX[pan.monthZhi]);
      var txt = '日辰' + pan.dayZhi + '（' + H.ZHI_WX[pan.dayZhi] + '）对用神：' + byDay +
        '；月建' + pan.monthZhi + '（' + H.ZHI_WX[pan.monthZhi] + '）对用神：' + byMonth;
      out.push({ k: '用神旺衰', v: txt });
      if (byDay === '被生' || byDay === '比和') out.push({ k: '吉象', v: '用神得日辰生扶，主事有底气、近在眼前，迟则日辰转出。' });
      if (byDay === '被克') out.push({ k: '凶象', v: '用神受日辰克制，事多阻隔，主客观条件不利，宜缓图。' });
      if (target.kong) out.push({ k: '旬空', v: '用神落空亡。空则虚而不实：或事尚未动、或人不实心、或只是空想。出空（过旬）之后可见分晓。' });
      if (target.moving) out.push({ k: '发动', v: '用神发动，事必有变、必有人主动。动而化吉则事成，化凶则事败，须看变爻。' });
      if (target.liuShen === '白虎') out.push({ k: '六神', v: '用神临白虎，主凶险、伤病、急迫之事，宜防意外。' });
      if (target.liuShen === '青龙') out.push({ k: '六神', v: '用神临青龙，主喜庆、财禄、贵人，属吉神。' });
      if (target.liuShen === '玄武') out.push({ k: '六神', v: '用神临玄武，主暗昧、欺瞒、盗窃、私情，须防不实。' });
      if (target.liuShen === '螣蛇') out.push({ k: '六神', v: '用神临螣蛇，主虚惊、纠缠、怪事，多忧疑。' });
      if (target.liuShen === '朱雀') out.push({ k: '六神', v: '用神临朱雀，主口舌是非、文书信息。' });
      if (target.liuShen === '勾陈') out.push({ k: '六神', v: '用神临勾陈，主田土房产、牵连迟滞。' });
    }

    // 世应
    var sr = H.relWX(shi.wx, ying.wx);
    var srMap = { '生': '世生应：我主动付出，事在己方推动，恐耗力。', '被生': '应生世：对方来就我，得外力之助，吉。', '克': '世克应：我可掌控局面，但须费力。', '被克': '应克世：对方压制我方，事不由己，凶多吉少。', '比和': '世应比和：双方同心，事易成。' };
    out.push({ k: '世应', v: '世爻' + shi.gan + shi.zhi + '(' + shi.liuqin + ') 对 应爻' + ying.gan + ying.zhi + '(' + ying.liuqin + ')：' + (srMap[sr] || '') });

    if (pan.movings.length) {
      var mv = pan.movings.map(function (p) {
        var y = pan.yao[p - 1];
        return p + '爻' + y.liuqin + '(' + y.zhi + ')动化' + y.bian.liuqin + '(' + y.bian.zhi + ')';
      }).join('、');
      out.push({ k: '动爻', v: mv + '。动则有变，事之枢机在动爻。' });
      var hui = pan.movings.filter(function (p) {
        var y = pan.yao[p - 1];
        return y.bian.liuqin === (target ? target.liuqin : '世爻');
      });
      if (hui.length) out.push({ k: '回头', v: '有动爻化出与用神同类之爻，事有反复回头之象（进退不定）。' });
    } else {
      out.push({ k: '静卦', v: '六爻安静，事无大变，以本卦卦辞、象意为主断，宜守。' });
    }

    var bianR = null;
    if (pan.hasBian) bianR = '变卦「' + pan.bianName + '」为事之后段、结果。' + (H.GUA[pan.bianName] ? H.GUA[pan.bianName][1] : '');
    if (bianR) out.push({ k: '变卦', v: bianR });

    out.push({ k: '总纲', v: '断卦先定用神，次看用神旺衰与生克，再看动爻与变卦定去向。用神得生得旺、动而化吉则事成；用神受克落空、动而化凶则事败。' });
    return out;
  }

  global.LiuYao = { build: build, throwToYao: throwToYao, YONGSHEN_MAP: YONGSHEN_MAP, LIUSHEN: LIUSHEN };
})(window);
