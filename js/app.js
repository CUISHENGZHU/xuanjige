/* ===== 应用逻辑 ===== */
(function () {
  'use strict';
  var GAN = '甲乙丙丁戊己庚辛壬癸';
  var ZHI = '子丑寅卯辰巳午未申酉戌亥';
  var $ = function (id) { return document.getElementById(id); };
  function pad(n) { return n < 10 ? '0' + n : '' + n; }

  var state = {
    mhMode: 'time',
    lyThrows: [1, 1, 1, 1, 1, 1],
    bzSex: '男'
  };

  /* ---------- 时间 ---------- */
  function setNow() {
    var d = new Date();
    $('when').value = d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()) + 'T' + pad(d.getHours()) + ':' + pad(d.getMinutes());
  }
  function readTime() {
    var v = $('when').value;
    if (!v) return new Date();
    var p = v.split('T'), dd = p[0].split('-'), tt = (p[1] || '00:00').split(':');
    return new Date(+dd[0], +dd[1] - 1, +dd[2], +tt[0], +tt[1], 0);
  }
  function solarOf(d) { return Solar.fromYmdHms(d.getFullYear(), d.getMonth() + 1, d.getDate(), d.getHours(), d.getMinutes(), 0); }
  function lunarOf(d) { return solarOf(d).getLunar(); }
  function dayGZ(lu) { return lu.getDayInGanZhiExact(); }
  function shiGZ(lu) {
    var zg = lu.getTimeZhi();
    var dg = dayGZ(lu).charAt(0);
    var gi = (GAN.indexOf(dg) % 5 * 2 + ZHI.indexOf(zg)) % 10;
    return GAN.charAt(gi) + zg;
  }
  function ctxOf(lu) {
    return {
      dayGZ: dayGZ(lu), timeGZ: shiGZ(lu),
      monthGZ: lu.getMonthInGanZhiExact(), yearGZ: lu.getYearInGanZhiByLiChun(),
      dayKong: lu.getDayXunKong()
    };
  }

  function updateTop() {
    var d = readTime(), lu = lunarOf(d);
    var jq = lu.getPrevJieQi();
    var gz = ctxOf(lu);
    $('lunarInfo').innerHTML = '农历 <b>' + lu.getYearInChinese() + '年 ' + lu.getMonthInChinese() + '月' + lu.getDayInChinese() + '</b>　' +
      gz.yearGZ + '年 ' + gz.monthGZ + '月 ' + gz.dayGZ + '日 ' + gz.timeGZ + '时　' +
      '节气 <b>' + jq.getName() + '</b>（日旬空 ' + gz.dayKong + '）';
  }

  /* ---------- 卦爻渲染 ---------- */
  function hexHTML(lines, movings, small) {
    var h = '<div class="hex' + (small ? ' small' : '') + '">';
    for (var i = 0; i < 6; i++) {
      var mv = movings && movings.indexOf(i + 1) >= 0;
      h += '<div class="yao ' + (lines[i] ? 'yang' : 'yin') + (mv ? ' mv' : '') + '">' +
        (lines[i] ? '<i></i>' : '<i></i><i></i>') +
        (mv ? '<span class="dot">●</span>' : '') + '</div>';
    }
    return h + '</div>';
  }
  function hexBox(cap, name, lines, movings, small) {
    var f = HexUtil.fromLines(lines);
    return '<div class="hexbox' + (small ? ' small' : '') + '">' +
      '<div class="cap">' + cap + '</div>' + hexHTML(lines, movings, small) +
      '<div class="nm">' + name + '</div>' +
      '<div class="fu">' + HexUtil.TRI_INFO[f.upper].sym + ' ' + HexUtil.TRI_INFO[f.lower].sym + '</div></div>';
  }
  function verdictHTML(level, sub) {
    var bad = level.indexOf('凶') >= 0;
    return '<div class="verdict' + (bad ? ' bad' : '') + '"><div class="lv">' + level + '</div>' +
      (sub ? '<div class="lvs">' + sub + '</div>' : '') + '</div>';
  }
  function tipsHTML(list) {
    return '<ul class="tips">' + list.map(function (t) {
      return '<li>' + (t.k ? '<span class="k">' + t.k + '</span>' : '') + '<span class="v">' + t.v + '</span></li>';
    }).join('') + '</ul>';
  }

  /* ---------- 梅花易数 ---------- */
  function renderMeihua() {
    var d = readTime(), lu = lunarOf(d), out = '';
    var g;
    if (state.mhMode === 'num') {
      g = MeiHua.byNumbers($('mhA').value, $('mhB').value);
    } else if (state.mhMode === 'char') {
      g = MeiHua.byChars($('mhStr').value);
      if (!g) { $('mhOut').innerHTML = '<div class="card note">请输入要占的文字。</div>'; return; }
    } else {
      g = MeiHua.byTime(lu);
    }
    var j = MeiHua.judge(g);
    var tInfo = HexUtil.TRI_INFO;

    out += '<div class="card">';
    out += verdictHTML(j.level, j.head);
    out += '<div class="hexrow">' +
      hexBox('本 卦', g.name, g.lines, [g.dong]) +
      hexBox('互 卦', g.hu.name, HexUtil.toLines(g.hu.name), null, true) +
      hexBox('变 卦', g.bian.name, g.bianLines, [g.dong]) +
      '</div>';
    out += '<div class="kv" style="justify-content:center;margin-top:12px">' +
      '<span>上卦 <b>' + g.upper + '</b>（' + tInfo[g.upper].xiang + '·' + tInfo[g.upper].wx + '）</span>' +
      '<span>下卦 <b>' + g.lower + '</b>（' + tInfo[g.lower].xiang + '·' + tInfo[g.lower].wx + '）</span>' +
      '<span>动爻 <b>第' + g.dong + '爻</b></span>' +
      '<span>体 <b>' + g.ti + '</b></span><span>用 <b>' + g.yong + '</b></span></div>';
    out += '<div class="note">' + g.formula + '</div>';
    out += '</div>';

    out += '<div class="grid2">';
    [['本卦', g.name], ['互卦', g.hu.name], ['变卦', g.bian.name]].forEach(function (p) {
      var gg = HexUtil.GUA[p[1]] || ['', ''];
      out += '<div class="card"><h3>' + p[0] + '　' + p[1] + '</h3>' +
        '<div class="guaci"><em>卦辞：</em>' + gg[0] + '</div>' +
        '<div class="guaci"><em>象意：</em>' + gg[1] + '</div></div>';
    });
    out += '</div>';

    out += '<div class="card"><h3>断卦详解</h3>' + tipsHTML(j.detail.map(function (t) { return { k: '', v: t }; })) + '</div>';
    out += '<div class="card"><h3>体用生克一览</h3>' +
      '<div class="kv"><span>体（' + g.ti + '·' + tInfo[g.ti].wx + '）对用（' + g.yong + '·' + tInfo[g.yong].wx + '）：<b>' + j.head + '</b></span></div>' +
      '<div class="note">体卦为己、为主、为静；用卦为事、为客、为动。体宜旺不宜衰，宜受生不宜受克。互卦看过程，变卦看结局。若互、变皆生体，纵用克体亦凶中带吉；若体旺而用衰，虽体克用亦费力成事。</div></div>';

    out += yiCardsHTML(g.name, g.lines, [g.dong]);
    $('mhOut').innerHTML = out;
  }

  /* ---------- 高岛易断 / 曾仕强 ---------- */
  function sanCaiLine(movings) {
    if (!movings || !movings.length) return '六爻皆静，天地人三才俱安，宜守常待时。';
    return movings.map(function (p) {
      var c = p <= 2 ? '地位（根基、基层、身体）' : p <= 4 ? '人位（人事、执行、己身）' : '天位（大势、上级、方向）';
      return '第' + p + '爻属' + c;
    }).join('；') + '。';
  }

  function yiCardsHTML(name, lines, movings) {
    var a = YiDuan.analyze(name, lines, movings || []);
    var h = '<div class="card"><h3>高岛易断</h3><ul class="tips">';
    h += '<li><span class="k">气运</span><span class="v">' + a.xiang + '</span></li>';
    h += '<li><span class="k">占事</span><span class="v">' + a.shi + '</span></li>';
    h += '<li><span class="k">要爻</span><span class="v">' + a.ji + '<br><span style="color:#9b8f79">（此卦关键之爻，可与下所列动爻参看）</span></span></li>';
    if (a.xiaoxi) h += '<li><span class="k">消息卦</span><span class="v">此卦为十二消息卦之「' + a.xiaoxi + '」，以阴阳消长言气运之进退。</span></li>';
    if (a.wei.length) {
      a.wei.forEach(function (w) {
        var cls = w.tone.indexOf('凶') >= 0 ? 'xiong' : w.tone.indexOf('吉') >= 0 ? 'ji' : 'ping';
        h += '<li><span class="k">' + w.title + '</span><span class="v"><b class="' + cls + '">' + w.tone + '</b>　' + w.text +
          '<br><span style="color:#9b8f79">' + w.tip + '</span></span></li>';
      });
    } else {
      h += '<li><span class="k">静卦</span><span class="v">六爻安静，以本卦卦辞与大象为断，观气运升降而不观其变。</span></li>';
    }
    h += '</ul><div class="note">高岛吞象（1832—1914）《高岛易断》以《周易》本经为准，逐卦逐爻为断，最重「当位、得中、相应」与所问之事是否相称；其法揲蓍取卦，今多以铜钱代之，与本器摇卦同源。此处按其体例整理，非原书原文。</div></div>';

    if (a.zeng) {
      h += '<div class="card"><h3>曾仕强 · 卦中智慧</h3>' +
        '<div class="verdict" style="padding:10px"><div class="lv" style="font-size:19px;letter-spacing:2px">' + a.zeng[0] + '</div></div>' +
        '<div class="guaci">' + a.zeng[1] + '</div>' +
        '<div class="note">曾仕强讲《易经》，重在「讲道理」而非「算命」：卦象提示的是一种处境与分寸，路怎么走仍在自己。他常提三才之道——初二为地、三四为人、五上为天。本卦' + sanCaiLine(movings) + '</div></div>';
    }
    return h;
  }

  /* ---------- 六爻 ---------- */
  var LY_LABELS = ['老阳 ○（三背）', '少阳 －（一背）', '少阴 --（两背）', '老阴 ×（三字）'];
  function renderLyManual() {
    var h = '';
    for (var i = 5; i >= 0; i--) {
      h += '<div class="row" style="gap:6px"><label style="min-width:44px">' + (i + 1) + '爻</label>' +
        '<div class="seg" data-pos="' + i + '">' +
        [1, 2, 3, 0].map(function (k) {
          return '<button data-bei="' + k + '"' + (state.lyThrows[i] === k ? ' class="on"' : '') + '>' +
            (k === 3 ? '三背' : k === 2 ? '两背' : k === 1 ? '一背' : '三字') + '</button>';
        }).join('') + '</div>' +
        '<span class="note" style="margin:0">' + LyForPreview(i) + '</span></div>';
    }
    $('lyManual').innerHTML = h;
    Array.prototype.forEach.call($('lyManual').querySelectorAll('.seg'), function (seg) {
      seg.addEventListener('click', function (e) {
        var b = e.target.closest('button');
        if (!b) return;
        var pos = +seg.getAttribute('data-pos');
        state.lyThrows[pos] = +b.getAttribute('data-bei');
        renderLyManual();
      });
    });
  }
  function LyForPreview(i) {
    var y = LiuYao.throwToYao(state.lyThrows[i]);
    return y.label;
  }

  function renderLiuYao() {
    var d = readTime(), lu = lunarOf(d);
    var ctx = ctxOf(lu);
    ctx.topic = $('lyTopic').value;
    var pan = LiuYao.build(state.lyThrows, ctx);
    var out = '';

    out += '<div class="card">';
    out += '<div class="hexrow">' +
      hexBox('本 卦', pan.benName, pan.lines, pan.movings) +
      (pan.hasBian ? hexBox('变 卦', pan.bianName, pan.bian.lines, null) : '') +
      '</div>';
    out += '<div class="kv" style="justify-content:center;margin-top:10px">' +
      '<span>宫 <b>' + pan.ben.palace + '宫</b>（' + pan.ben.wx + '）</span>' +
      '<span><b>' + pan.ben.gen + '</b>卦</span>' +
      '<span>世 <b>' + pan.ben.shi + '爻</b></span><span>应 <b>' + pan.ben.ying + '爻</b></span>' +
      '<span>旬空 <b>' + pan.kong + '</b></span></div>';
    out += '<div class="note">' + pan.yearGZ + '年 ' + pan.monthGZ + '月 ' + pan.dayGZ + '日（月建 ' + pan.monthZhi + '，日辰 ' + pan.dayZhi + '）　' + ctx.timeGZ + '时</div>';
    out += '</div>';

    // 装卦表
    out += '<div class="card"><h3>' + pan.benName + (pan.hasBian ? ' 之 ' + pan.bianName : '') + '</h3><table class="ly-table">';
    for (var i = 5; i >= 0; i--) {
      var y = pan.yao[i];
      out += '<tr class="' + (y.moving ? 'dong' : '') + '">' +
        '<td class="shen">' + y.liuShen + '</td>' +
        '<td class="liuqin">' + y.liuqin + '</td>' +
        '<td>' + y.gan + y.zhi + '<span style="color:#9b8f79">' + y.wx + '</span></td>' +
        '<td class="yao-col"><span class="myao ' + (y.yang ? '' : 'yin') + (y.moving ? ' mv' : '') + '"></span></td>' +
        '<td class="mark">' + (y.shi ? '世' : y.ying ? '应' : '') + (y.kong ? '<br><span style="color:#6c8fa8">空</span>' : '') + '</td>' +
        '<td class="bian">' + (y.moving ? '动 → ' + y.bian.liuqin + ' ' + y.bian.gan + y.bian.zhi + y.bian.wx : '') + '</td></tr>';
    }
    out += '</table>';
    var bg = HexUtil.GUA[pan.benName] || ['', ''];
    out += '<div class="guaci" style="margin-top:10px"><em>卦辞：</em>' + bg[0] + '</div>';
    out += '<div class="guaci"><em>象意：</em>' + bg[1] + '</div></div>';

    out += '<div class="card"><h3>断卦提示</h3>' + tipsHTML(pan.tips) + '</div>';
    out += yiCardsHTML(pan.benName, pan.lines, pan.movings);
    $('lyOut').innerHTML = out;
  }

  /* ---------- 奇门遁甲 ---------- */
  var QM_ORDER = [4, 9, 2, 3, 5, 7, 8, 1, 6];
  function luckOf(luck) {
    if (!luck) return '';
    if (luck.indexOf('凶') >= 0) return 'xiong';
    if (luck.indexOf('中') >= 0) return 'ping';
    return 'ji';
  }
  function luckClass(s) {
    var Q = QiMen;
    if (!s) return '';
    if (Q.MEN_INFO[s]) return luckOf(Q.MEN_INFO[s].luck);
    if (Q.STAR_INFO[s]) return luckOf(Q.STAR_INFO[s].luck);
    if (Q.SHEN_INFO[s]) return luckOf(Q.SHEN_INFO[s].luck);
    return '';
  }

  function renderQiMen() {
    var d = readTime(), lu = lunarOf(d);
    var ctx = ctxOf(lu);
    ctx.prevJieQi = lu.getPrevJieQi().getName();
    var pan = QiMen.compute(ctx);
    var topic = $('qmTopic').value;
    var ys = QiMen.yongshen(pan, topic);
    var hitGong = ys.cell ? ys.cell.gong : 0;
    var out = '';

    out += '<div class="card"><div class="qm-head">' +
      '<span>局：<b>' + pan.dun + pan.ju + '局</b></span>' +
      '<span>节气：<b>' + pan.jieqi + '</b> ' + pan.yuan + '（符头 ' + pan.fuTou + '）</span>' +
      '<span>四柱：<b>' + pan.yearGZ + ' ' + pan.monthGZ + ' ' + pan.dayGZ + ' ' + pan.timeGZ + '</b></span>' +
      '<span>旬首：<b>' + pan.xun + '</b>（' + pan.xunYi + '）</span>' +
      '<span>值符：<b>' + pan.fuStar + '</b></span>' +
      '<span>值使：<b>' + pan.fuMen + '</b></span>' +
      '<span>时干 <b>' + pan.shiGan + '</b> 落 ' + pan.shiGong + '宫</span>' +
      '<span>旬空：<b>' + pan.kong + '</b></span>' +
      '<span>驿马：<b>' + pan.ma + '</b></span></div>';

    out += '<div class="qm-grid">';
    QM_ORDER.forEach(function (g) {
      var c = null;
      pan.cells.forEach(function (x) { if (x.gong === g) c = x; });
      out += '<div class="qm-cell' + (g === 5 ? ' center' : '') + (g === hitGong ? ' hit' : '') + '">' +
        '<div class="qm-shen">' + (c.shen || '') + '</div>' +
        '<div class="qm-star">' + (c.star || '') + (c.tianGan ? '<span class="g">' + c.tianGan + '</span>' : '') + '</div>' +
        '<div class="qm-men ' + luckClass(c.men) + '">' + (c.men || '') + '</div>' +
        '<div class="qm-di">地 ' + c.diGan + '</div>' +
        '<div class="qm-ge">' + (c.ge ? c.ge.name : '') + '</div>' +
        '<div class="qm-gong">' + c.name.replace('宫', '') + '</div></div>';
    });
    out += '</div><div class="note">盘式：上南下北、左东右西。每格自上而下为「八神 — 天盘星／天盘干 — 八门 — 地盘干 — 格局」。</div></div>';

    // 用神
    out += '<div class="card"><h3>用神落宫</h3>';
    if (ys.cell) {
      out += '<div class="kv" style="margin-bottom:8px">' +
        '<span>' + topic + ' 取 <b>' + ys.def.key + '</b>（' + ys.def.why + '）</span>' +
        '<span>落 <b>' + ys.cell.name + '</b>（' + ys.cell.dir + '·' + ys.cell.wx + '）</span>' +
        '<span>临 <b>' + (ys.cell.men || '—') + '</b>、<b>' + (ys.cell.star || '—') + '</b>、<b>' + (ys.cell.shen || '—') + '</b></span></div>';
      out += '<ul class="tips">' +
        '<li><span class="k">八门</span><span class="v">' + (QiMen.MEN_INFO[ys.cell.men] ? QiMen.MEN_INFO[ys.cell.men].desc : '') + '</span></li>' +
        '<li><span class="k">九星</span><span class="v">' + (QiMen.STAR_INFO[(ys.cell.star || '').split('／')[0]] ? QiMen.STAR_INFO[(ys.cell.star || '').split('／')[0]].desc : '') + '</span></li>' +
        '<li><span class="k">八神</span><span class="v">' + (QiMen.SHEN_INFO[ys.cell.shen] ? QiMen.SHEN_INFO[ys.cell.shen].desc : '') + '</span></li>' +
        (ys.cell.ge ? '<li><span class="k">格局</span><span class="v"><b>' + ys.cell.ge.name + '</b>　' + ys.cell.ge.text + '</span></li>' : '') +
        '</ul>';
      out += '<div class="note">落宫方位 ' + ys.cell.dir + '，可据此择方、择时。用神落宫旺相、门吉星吉则事顺；落宫逢空、门凶格凶则事阻。</div>';
    } else {
      out += '<div class="note">用神未上盘（该门/星/神不在所布之宫），须查伏干或用另一用神参断。</div>';
    }
    out += '</div>';

    // 格局
    var named = pan.cells.filter(function (c) { return c.ge && c.ge.named; });
    out += '<div class="card"><h3>本局格局</h3><ul class="tips">' + named.map(function (c) {
      return '<li><span class="k">' + c.name.replace('宫', '') + '</span><span class="v"><b>' + c.ge.name + '</b>　' + c.ge.text + '</span></li>';
    }).join('') + '</ul>';
    out += '<div class="note">奇门格局取「天盘干＋地盘干」之克应，名为十干克应。吉格未必全吉，须与门、星、神合看：门吉格吉为上，格吉门凶则吉中有损。</div></div>';

    out += '<div class="card"><h3>读盘次序</h3><div class="note">' +
      '一、先看局与节气：知大势之阳遁（生发）或阴遁（收敛）。<br>' +
      '二、次看用神落宫：门主事之通塞，星主事之性质，神主事之隐显，干之格局主成败细节。<br>' +
      '三、看值符值使：值符为事之主导、值使为事之执行；二者所临之宫即事之关键。<br>' +
      '四、看时空：旬空主虚、驿马主动；日干为己、时干为事，日干落宫与用神落宫之生克定我与事之向背。' +
      '</div></div>';

    $('qmOut').innerHTML = out;
  }
  /* ---------- 四柱八字 ---------- */
  var WX_CLS = { 木: 'mu', 火: 'huo', 土: 'tu', 金: 'jin', 水: 'shui' };
  function renderBaZi() {
    var d = readTime(), lu = lunarOf(d);
    var b = BaZi.compute(lu, state.bzSex);
    var out = '';

    out += '<div class="card"><h3>四柱排盘　' + b.gender + '命</h3><table class="bz-table">';
    out += '<tr><th></th>' + b.pillars.map(function (p) { return '<th>' + p.name + '柱</th>'; }).join('') + '</tr>';
    out += '<tr><td class="ss">十神</td>' + b.pillars.map(function (p) { return '<td class="ss">' + p.ganShiShen + '</td>'; }).join('') + '</tr>';
    out += '<tr><td class="ss">天干</td>' + b.pillars.map(function (p) { return '<td class="gz">' + p.gan + '<small>' + p.ganWX + '</small></td>'; }).join('') + '</tr>';
    out += '<tr><td class="ss">地支</td>' + b.pillars.map(function (p) { return '<td class="gz">' + p.zhi + '<small>' + p.zhiWX + '</small></td>'; }).join('') + '</tr>';
    out += '<tr><td class="ss">藏干</td>' + b.pillars.map(function (p) {
      return '<td class="cang">' + p.cang.map(function (c) { return c.gan + '<span style="color:#6c8fa8">' + c.ss + '</span>'; }).join('<br>') + '</td>';
    }).join('') + '</tr>';
    out += '<tr><td class="ss">纳音</td>' + b.pillars.map(function (p) { return '<td class="cang">' + p.nayin + '</td>'; }).join('') + '</tr>';
    out += '</table><div class="note">' + lu.toString() + '　生肖 ' + b.shengXiao + '　' +
      '（以节气定月、立春换年）</div></div>';

    var max = 0.1;
    Object.keys(b.count).forEach(function (k) { if (b.count[k] > max) max = b.count[k]; });
    out += '<div class="card"><h3>五行分布</h3><div class="wx-bars">';
    ['木', '火', '土', '金', '水'].forEach(function (k) {
      var v = b.count[k];
      out += '<div class="wx-bar wx-' + WX_CLS[k] + '"><span class="n">' + k + '</span>' +
        '<span class="t"><span style="width:' + (v / max * 100).toFixed(1) + '%"></span></span>' +
        '<span class="v">' + v.toFixed(1) + '</span></div>';
    });
    out += '</div>';
    out += '<div class="note">计分法：天干各计 1，地支各计 1.2（含藏干之气）。' +
      (b.missing.length ? '五行缺 <b style="color:#c9a457">' + b.missing.join('、') + '</b>（缺不等于忌，须结合喜忌看）。' : '五行俱全。') + '</div></div>';

    out += '<div class="card"><h3>日主强弱与喜忌</h3>' +
      '<div class="kv" style="margin-bottom:8px"><span>日主 <b>' + b.dayGan + '（' + b.dayWX + '）</b></span>' +
      '<span>生扶 <b>' + b.support + '</b></span><span>克泄耗 <b>' + b.drain + '</b></span>' +
      '<span>判断 <b>' + b.level + '</b></span></div>' +
      '<div class="guaci">' + b.xi + '</div>' +
      '<div class="note">此为现代速算法（按月令加权计分），仅供入门参考。真正的格局用神须看月令司权、通根透干、调候与从化，非分数所能尽。</div></div>';

    if (b.yun) {
      out += '<div class="card"><h3>大运</h3><div class="note" style="margin:0 0 8px">' + b.yun.start + '</div><div class="dy-list">';
      b.yun.list.forEach(function (x) {
        out += '<div class="dy-item"><b>' + x.gz + '</b>' + x.age + '岁<br><span style="font-size:10px">' + x.year + '</span></div>';
      });
      out += '</div></div>';
    }
    $('bzOut').innerHTML = out;
  }

  /* ---------- 小六壬 ---------- */
  function initXlr() {
    var lu = lunarOf(readTime());
    $('xlM').value = Math.abs(lu.getMonth());
    $('xlD').value = lu.getDay();
    var sel = $('xlH');
    if (!sel.options.length) {
      var NAME = ['子时 23-01', '丑时 01-03', '寅时 03-05', '卯时 05-07', '辰时 07-09', '巳时 09-11',
        '午时 11-13', '未时 13-15', '申时 15-17', '酉时 17-19', '戌时 19-21', '亥时 21-23'];
      for (var i = 0; i < 12; i++) {
        var o = document.createElement('option');
        o.value = String(i); o.textContent = NAME[i];
        sel.appendChild(o);
      }
    }
    sel.value = String(ZHI.indexOf(lu.getTimeZhi()));
  }
  function renderXlr() {
    var m = parseInt($('xlM').value, 10) || 1;
    var day = parseInt($('xlD').value, 10) || 1;
    var h = parseInt($('xlH').value, 10) || 0;
    var r = XiaoLiuRen.compute(m, day, h);
    var out = '';
    out += '<div class="card">' +
      '<div class="xlr-path">' +
      '<div class="xlr-step"><div class="s">月起</div><div class="n">' + r.monthState.name + '</div><div class="s">' + m + '月</div></div>' +
      '<div class="xlr-step"><div class="s">日起</div><div class="n">' + r.dayState.name + '</div><div class="s">' + day + '日</div></div>' +
      '<div class="xlr-step final"><div class="s">时定</div><div class="n">' + r.final.name + '</div><div class="s">' + ZHI.charAt(h) + '时</div></div>' +
      '</div>';
    out += verdictHTML(r.final.luck, '五行属' + r.final.wx + '　方位 ' + r.final.pos);
    out += '<div class="guaci" style="text-align:center"><em>口诀：</em>' + r.final.desc + '</div>';
    out += '<div class="guaci" style="margin-top:10px">' + r.final.detail + '</div>';
    out += '</div>';
    out += '<div class="card"><h3>起课路径</h3><div class="note" style="margin:0">' +
      '从「大安」起数农历月（正月为大安，顺数六位一轮）；再从此位起数农历日（初一即此位）；再从此位起数时辰（子时即此位）。最终落宫即为所占之事。' +
      '<br>本例：' + r.path + '</div></div>';
    $('xlOut').innerHTML = out;
  }

  /* ---------- 初始化 ---------- */
  function switchTab(name) {
    Array.prototype.forEach.call(document.querySelectorAll('#tabs button'), function (b) {
      b.classList.toggle('on', b.getAttribute('data-tab') === name);
    });
    Array.prototype.forEach.call(document.querySelectorAll('.panel'), function (p) {
      p.classList.toggle('on', p.id === 'p-' + name);
    });
    if (name === 'meihua') renderMeihua();
    if (name === 'liuyao') renderLiuYao();
    if (name === 'qimen') renderQiMen();
    if (name === 'bazi') renderBaZi();
    if (name === 'xlr') { initXlr(); renderXlr(); }
  }

  function init() {
    setNow();
    updateTop();

    $('when').addEventListener('change', updateTop);
    $('nowBtn').addEventListener('click', function () { setNow(); updateTop(); switchTab(currentTab()); });

    $('tabs').addEventListener('click', function (e) {
      var b = e.target.closest('button');
      if (b) switchTab(b.getAttribute('data-tab'));
    });

    // 梅花
    $('mhMode').addEventListener('click', function (e) {
      var b = e.target.closest('button'); if (!b) return;
      state.mhMode = b.getAttribute('data-m');
      Array.prototype.forEach.call($('mhMode').children, function (x) { x.classList.toggle('on', x === b); });
      $('mhNumRow').classList.toggle('hidden', state.mhMode !== 'num');
      $('mhCharRow').classList.toggle('hidden', state.mhMode !== 'char');
      renderMeihua();
    });
    $('mhGo').addEventListener('click', renderMeihua);

    // 六爻
    renderLyManual();
    $('lyShake').addEventListener('click', function () {
      var t = [];
      for (var i = 0; i < 6; i++) {
        var n = 0;
        for (var j = 0; j < 3; j++) if (Math.random() < 0.5) n++;
        t.push(n);
      }
      state.lyThrows = t;
      renderLyManual();
      renderLiuYao();
    });
    $('lyClear').addEventListener('click', function () {
      state.lyThrows = [1, 1, 1, 1, 1, 1];
      renderLyManual();
    });
    $('lyGo').addEventListener('click', renderLiuYao);

    // 奇门
    $('qmGo').addEventListener('click', renderQiMen);
    $('qmTopic').addEventListener('change', renderQiMen);

    // 八字
    $('bzSex').addEventListener('click', function (e) {
      var b = e.target.closest('button'); if (!b) return;
      state.bzSex = b.getAttribute('data-s');
      Array.prototype.forEach.call($('bzSex').children, function (x) { x.classList.toggle('on', x === b); });
      renderBaZi();
    });
    $('bzGo').addEventListener('click', renderBaZi);

    // 小六壬
    initXlr();
    $('xlGo').addEventListener('click', renderXlr);

    renderMeihua();
  }

  function currentTab() {
    var on = document.querySelector('#tabs button.on');
    return on ? on.getAttribute('data-tab') : 'meihua';
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
