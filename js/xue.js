/* ===== 六十四卦 · 教学页面逻辑 ===== */
(function () {
  'use strict';
  var D = window.GuaData, H = window.HexUtil, Y = window.YiDuan;
  var SEQ = D.SEQ, XUE = D.XUE, GUA = H.GUA;
  var GLYPH0 = 0x4DC0;

  /* ---------- 基础工具 ---------- */
  function gsym(name) {
    var i = SEQ.indexOf(name);
    return String.fromCodePoint(GLYPH0 + (i < 0 ? 0 : i));
  }
  function bits(name) { return H.toLines(name).slice(); }
  function nameOf(b) { return H.fromLines(b).name; }
  function flip(b) { return b.map(function (x) { return x ? 0 : 1; }); }
  function rev(b) { return b.slice().reverse(); }
  function huBits(b) { return [b[1], b[2], b[3], b[2], b[3], b[4]]; }
  function short(name) { return /为/.test(name) ? name.charAt(0) : name.slice(2); }
  function esplit(name) {
    var b = bits(name), f = H.fromLines(b);
    return { up: f.upper, lo: f.lower };
  }
  function triInfo(t) {
    for (var i = 0; i < D.JING.length; i++) if (D.JING[i].tri === t) return D.JING[i];
    return null;
  }
  function ci(name) { return (GUA[name] || ['', ''])[0]; }
  function el(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) {
    return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c];
  }); }



  // 最长公共子串长度（用于判断两段话是否重复）
  function lcsLen(a, b) {
    if (!a || !b) return 0;
    var best = 0, prev = new Array(b.length + 1).fill(0);
    for (var i = 1; i <= a.length; i++) {
      var cur = new Array(b.length + 1).fill(0);
      for (var j = 1; j <= b.length; j++) {
        if (a.charAt(i - 1) === b.charAt(j - 1)) {
          cur[j] = prev[j - 1] + 1;
          if (cur[j] > best) best = cur[j];
        }
      }
      prev = cur;
    }
    return best;
  }

  // 画卦（用线条，避免字体缺字）
  function drawMini(b, cls) {
    var h = '<div class="hx ' + (cls || '') + '">';
    for (var i = 5; i >= 0; i--) {
      h += '<span class="ln ' + (b[i] ? 'y' : 'n') + '"><i></i>' + (b[i] ? '' : '<i></i>') + '</span>';
    }
    return h + '</div>';
  }
  function drawTri(tri, cls) {
    var j = triInfo(tri);
    var h = '<div class="hx tri ' + (cls || '') + '">';
    for (var i = 2; i >= 0; i--) {
      h += '<span class="ln ' + (j.bits[i] ? 'y' : 'n') + '"><i></i>' + (j.bits[i] ? '' : '<i></i>') + '</span>';
    }
    return h + '</div>';
  }

  // 画卦：初爻在下
  function drawHex(b, cls, moving) {
    var h = '<div class="hex ' + (cls || '') + '">';
    for (var i = 5; i >= 0; i--) {
      var mv = moving && moving.indexOf(i + 1) >= 0;
      h += '<div class="yao ' + (b[i] ? 'yang' : 'yin') + (mv ? ' mv' : '') + '"><i></i>' + (b[i] ? '' : '<i></i>') + '</div>';
    }
    return h + '</div>';
  }

  /* ---------- 状态 ---------- */
  var KEY = 'xuanji_xue_v1';
  var S = { learned: {}, right: 0, wrong: 0, errs: {}, quizMode: 'sym2name', quizCur: null };
  try {
    var raw = localStorage.getItem(KEY);
    if (raw) { var o = JSON.parse(raw); if (o && o.learned) S = Object.assign(S, o); }
  } catch (e) {}
  function save() {
    try { localStorage.setItem(KEY, JSON.stringify({ learned: S.learned, right: S.right, wrong: S.wrong, errs: S.errs })); } catch (e) {}
  }
  function learnedCount() { return Object.keys(S.learned).length; }

  /* ---------- 视图：总览 ---------- */
  function viewIndex() {
    var done = learnedCount();
    var h = '<div class="xbar">' +
      '<div class="prog"><div class="prog-t">已记住 <b>' + done + '</b> / 64</div>' +
      '<div class="prog-bar"><i style="width:' + Math.round(done / 64 * 100) + '%"></i></div></div>' +
      '<input id="q" class="xsearch" placeholder="搜卦名，如 屯 / 谦 / 既济">' +
      '<button class="rand" id="rand">随手一卦</button>' +
      '</div>' +
      '<p class="hint">点开任意一卦：卦辞、大象、曾仕强义理、高岛易断、六爻位、互卦错卦综卦变卦，一次看全。</p>' +
      '<div class="grid64" id="grid64"></div>';
    return h;
  }

  function renderGrid() {
    var q = (document.getElementById('q') || {}).value || '';
    q = q.trim();
    var box = document.getElementById('grid64');
    if (!box) return;
    var html = '';
    SEQ.forEach(function (n, i) {
      if (q && n.indexOf(q) < 0) return;
      var on = S.learned[n] ? ' on' : '';
      html += '<a class="g64' + on + '" href="#/g/' + encodeURIComponent(n) + '">' +
        drawMini(bits(n), 'sm') +
        '<span class="no">' + (i + 1) + '</span>' +
        '<span class="nm">' + el(n) + '</span></a>';
    });
    box.innerHTML = html || '<p class="hint">没找到。试试单字，如「屯」。</p>';
  }

  /* ---------- 视图：对照表 ---------- */
  function viewTable() {
    var TR = H.TRI_ORDER;
    var h = '<h3 class="xh">八卦符号速记</h3><div class="jing">';
    D.JING.forEach(function (j, i) {
      var order = [3, 2, 1].map(function (k) { return j.bits[k]; }); // 上到下

      h += '<div class="jcard"><div class="jsym">' + drawTri(j.tri, 'md') + '</div>' +
        '<div class="jname">' + j.tri + '　<span>' + j.xiang + '</span></div>' +
        '<div class="jjue">' + j.jue + '</div>' +
        '<div class="jmeta">' + j.de + ' · ' + j.wu + ' · ' + j.ren + '</div></div>';
    });
    h += '</div>';

    h += '<h3 class="xh">上下卦组合表　<small>行 = 上卦，列 = 下卦</small></h3><div class="tbl-wrap"><table class="x8x8"><tr><th></th>';
    TR.forEach(function (t) { h += '<th>' + t + '</th>'; });
    h += '</tr>';
    TR.forEach(function (up) {
      h += '<tr><th>' + up + '</th>';
      TR.forEach(function (lo) {
        var nm = H.GRID[up][TR.indexOf(lo)];
        h += '<td><a href="#/g/' + encodeURIComponent(nm) + '"><span class="n">' + short(nm) + '</span></a></td>';
      });
      h += '</tr>';
    });
    h += '</table></div>';

    // 八宫次序（京房）
    var pal = H.buildPalaces();
    var gens = ['本宫', '一世', '二世', '三世', '四世', '五世', '游魂', '归魂'];
    h += '<h3 class="xh">分宫卦象次序（八宫）　<small>记「某宫八卦」，一串八个</small></h3><div class="palaces">';
    TR.forEach(function (p) {
      var arr = gens.map(function (g) {
        for (var k in pal) if (pal[k].palace === p && pal[k].gen === g) return k;
        return null;
      }).filter(Boolean);
      h += '<div class="pc"><div class="pc-t">' + p + '宫</div><div class="pc-l">' +
        arr.map(function (n) { return '<a href="#/g/' + encodeURIComponent(n) + '">' + short(n) + '</a>'; }).join(' · ') +
        '</div></div>';
    });
    h += '</div>';
    return h;
  }

  /* ---------- 视图：卦序歌 ---------- */
  var RANGES = [[0, 12], [12, 22], [22, 30], [30, 38], [38, 51], [51, 61], [61, 64]];
  function viewSong() {
    var h = '<p class="hint">朱熹《上下经卦名次序歌》。背下这七句，六十四卦的次序就锁死了；点每句下面的小卦可以直接跳进去。</p>';
    D.XUGE.forEach(function (line, i) {
      h += '<div class="songline"><div class="sl">' + line + '</div><div class="chips">';
      var r = RANGES[i];
      for (var k = r[0]; k < r[1]; k++) {
        h += '<a class="chip" href="#/g/' + encodeURIComponent(SEQ[k]) + '">' + short(SEQ[k]) + '</a>';
      }
      h += '</div></div>';
    });
    h += '<h3 class="xh">三条背卦捷径</h3><div class="tips">' +
      '<p><b>一、先认八个基本卦。</b>乾三连、坤六断、震仰盂、艮覆碗、离中虚、坎中满、兑上缺、巽下断。八张图认熟了，六十四卦就只是两张图叠起来。</p>' +
      '<p><b>二、卦名读法是「上卦象 + 下卦象 + 卦名」。</b>比如「水雷屯」＝上面是水、下面是雷。八个纯卦例外，读作「乾为天」。</p>' +
      '<p><b>三、抓住三组对称。</b>乾坤、泰否、既济未济是首尾；剥复、损盈、遁壮是消长；错卦（六爻全反）成对记，一次记两个。</p>' +
      '</div>';
    return h;
  }

  /* ---------- 视图：自测 ---------- */
  function viewQuiz() {
    var h = '<div class="seg qmode">' +
      '<button data-m="sym2name"' + (S.quizMode === 'sym2name' ? ' class="on"' : '') + '>看卦符猜名</button>' +
      '<button data-m="name2sym"' + (S.quizMode === 'name2sym' ? ' class="on"' : '') + '>看卦名猜符</button>' +
      '<button data-m="ci2name"' + (S.quizMode === 'ci2name' ? ' class="on"' : '') + '>看卦辞猜卦</button>' +
      '</div>' +
      '<div class="qstat">对 <b>' + S.right + '</b> · 错 <b>' + S.wrong + '</b> · 连胜 <b id="qstreak">0</b></div>' +
      '<div class="qcard" id="qcard"></div>';
    return h;
  }

  var streak = 0;
  function pickTarget() {
    var pool = SEQ.slice();
    // 未记住、错得多的优先
    pool.sort(function (a, b) {
      var sa = (S.learned[a] ? -2 : 0) + (S.errs[a] || 0) * 2 + Math.random() * 3;
      var sb = (S.learned[b] ? -2 : 0) + (S.errs[b] || 0) * 2 + Math.random() * 3;
      return sb - sa;
    });
    return pool[0];
  }
  function renderQuiz() {
    var box = document.getElementById('qcard');
    if (!box) return;
    var ans = S.quizCur || (S.quizCur = pickTarget());
    var mode = S.quizMode;
    var opts = [ans];
    while (opts.length < 4) {
      var c = SEQ[Math.floor(Math.random() * 64)];
      if (opts.indexOf(c) < 0) opts.push(c);
    }
    opts.sort(function () { return Math.random() - 0.5; });

    var qHtml = '';
    if (mode === 'sym2name') {
      qHtml = '<div class="qq">' + drawMini(bits(ans), 'xl') + '</div>' +
        '<div class="qask">这是哪一卦？</div>';
    } else if (mode === 'name2sym') {
      qHtml = '<div class="qq"><div class="qname">' + el(ans) + '</div>' +
        '<div class="qask">选出它的卦象</div></div>';
    } else {
      qHtml = '<div class="qq"><div class="qci">' + el(ci(ans)) + '</div>' +
        '<div class="qask">这是哪一卦的卦辞？</div></div>';
    }
    var bh = '<div class="qopts">';
    opts.forEach(function (o, i) {
      var lbl = mode === 'name2sym' ? drawMini(bits(o), 'md') : el(o);
      bh += '<button class="qopt" data-n="' + encodeURIComponent(o) + '">' + lbl + '</button>';
    });
    bh += '</div>';
    box.innerHTML = qHtml + bh;
    Array.prototype.forEach.call(box.querySelectorAll('.qopt'), function (btn) {
      btn.onclick = function () { answer(decodeURIComponent(btn.getAttribute('data-n')), ans, box); };
    });
  }
  function answer(pick, ans, box) {
    var ok = pick === ans;
    if (ok) { S.right++; streak++; } else { S.wrong++; streak = 0; S.errs[ans] = (S.errs[ans] || 0) + 1; }
    save();
    Array.prototype.forEach.call(box.querySelectorAll('.qopt'), function (b) {
      var n = decodeURIComponent(b.getAttribute('data-n'));
      b.disabled = true;
      if (n === ans) b.classList.add('yes');
      else if (n === pick) b.classList.add('no');
    });
    var t = document.getElementById('qstreak'); if (t) t.textContent = streak;
    var stat = document.querySelector('.qstat');
    if (stat) stat.innerHTML = '对 <b>' + S.right + '</b> · 错 <b>' + S.wrong + '</b> · 连胜 <b>' + streak + '</b>';
    var tip = document.createElement('div');
    tip.className = 'qres ' + (ok ? 'ok' : 'bad');
    tip.innerHTML = (ok ? '✓ 对了　' : '✗ 是「' + ans + '」　') +
      '<a href="#/g/' + encodeURIComponent(ans) + '">看详解</a>' +
      ' <button class="qnext">下一题 →</button>';
    box.appendChild(tip);
    tip.querySelector('.qnext').onclick = function () { S.quizCur = null; renderQuiz(); };
  }

  /* ---------- 视图：卦详情 ---------- */
  function viewDetail(name) {
    var x = XUE[name] || ['', '', '', '', ''];
    var b = bits(name);
    var t = esplit(name);
    var up = triInfo(t.up), lo = triInfo(t.lo);
    var gi = SEQ.indexOf(name);
    var g = GUA[name] || ['', ''];
    var zeng = Y.ZENG[name] || ['', ''];
    var taka = Y.TAKA[name] || ['', '', ''];
    var xiao = Y.XIAOXI[name];
    var prev = SEQ[(gi + 63) % 64], next = SEQ[(gi + 1) % 64];

    var h = '<div class="dhead">' +
      '<div class="bigsym">' + drawMini(b, 'xl') + '</div>' +
      '<div class="dmeta"><div class="dn">' + el(name) + '</div>' +
      '<div class="dno">第 ' + (gi + 1) + ' 卦 · ' + (gi < 30 ? '上经' : '下经') + (xiao ? ' · ' + xiao : '') + '</div>' +
      '<div class="dtri">上 ' + t.up + '（' + up.xiang + '·' + up.de + '）　下 ' + t.lo + '（' + lo.xiang + '·' + lo.de + '）</div>' +
      '</div></div>';

    h += '<div class="dcard"><h4>一句话记它</h4><p class="ji">' + el(x[3]) + '</p></div>';

    h += '<div class="dcard"><h4>卦辞</h4><p class="src">' + el(g[0]) + '</p><p>' + el(x[2]) + '</p></div>';
    h += '<div class="dcard"><h4>大象传</h4><p class="src">' + el(x[0]) + '</p><p>' + el(x[1]) + '</p></div>';

    h += '<div class="dcard zeng"><h4>曾仕强 · 义理</h4>' +
      '<p class="kw">「' + el(zeng[0]) + '」</p><p>' + el(zeng[1]) + '</p>' +
      (lcsLen(x[4], zeng[1]) >= 6 ? '' : '<p class="pt"><span>点拨</span>' + el(x[4]) + '</p>') + '</div>';

    h += '<div class="dcard taka"><h4>高岛易断</h4>' +
      '<p><span class="lab">气运</span>' + el(taka[0]) + '</p>' +
      '<p><span class="lab">占事</span>' + el(taka[1]) + '</p>' +
      '<p><span class="lab">要爻</span>' + el(taka[2]) + '</p></div>';

    // 六爻位
    h += '<div class="dcard"><h4>六爻 · 位与应</h4><p class="hint">初爻在下。点任一爻，看它变出的卦。</p><div class="yaorows">';
    var TONEC = { '吉': 'ji', '偏吉': 'pj', '平': 'ping', '偏凶': 'px', '凶': 'xiong' };
    for (var i = 6; i >= 1; i--) {
      var y = Y.yaoWei(b, i);
      var yang = b[i - 1];
      var label = i === 1 ? '初' + (yang ? '九' : '六')
        : i === 6 ? '上' + (yang ? '九' : '六')
        : (yang ? '九' : '六') + ['', '二', '三', '四', '五'][i - 1];
      var bianName = nameOf(b.map(function (v, k) { return k === i - 1 ? (v ? 0 : 1) : v; }));
      h += '<a class="yrow" href="#/g/' + encodeURIComponent(bianName) + '">' +
        '<span class="ylab">' + label + '</span>' +
        '<span class="myao' + (yang ? '' : ' yin') + '"></span>' +
        '<span class="ytone ' + (TONEC[y.tone] || 'ping') + '">' + y.tone + '</span>' +
        '<span class="ytext">' + el(y.text) + '</span>' +
        '<span class="ybian">变 → ' + short(bianName) + '</span></a>';
    }
    h += '</div></div>';

    // 卦变关系
    var cuo = flip(b), zong = rev(b), hu = huBits(b);
    var rel = [
      ['错卦', cuo, '六爻全反，看反面'], ['综卦', zong, '整卦倒过来，换位看'],
      ['互卦', hu, '取二三四、三四五爻，看内在']
    ];
    h += '<div class="dcard"><h4>卦变关系</h4><div class="rels">';
    rel.forEach(function (r) {
      var nm = nameOf(r[1]);
      h += '<a class="rel" href="#/g/' + encodeURIComponent(nm) + '"><span class="rt">' + r[0] + '</span>' +
        drawMini(r[1], 'sm') + '<span class="rn">' + el(nm) + '</span>' +
        '<span class="rd">' + r[2] + '</span></a>';
    });
    h += '</div><div class="hint">变卦（六爻各自一动）：';
    for (var k = 1; k <= 6; k++) {
      var bn = nameOf(b.map(function (v, j) { return j === k - 1 ? (v ? 0 : 1) : v; }));
      h += '<a class="bchip" href="#/g/' + encodeURIComponent(bn) + '">' + ['初', '二', '三', '四', '五', '上'][k - 1] + '动→' + short(bn) + '</a>';
    }
    h += '</div></div>';

    // 记与操作
    var on = S.learned[name] ? ' on' : '';
    h += '<div class="dact">' +
      '<button class="mk' + on + '" id="mk">' + (S.learned[name] ? '✓ 已记住' : '标记为已记住') + '</button>' +
      '<a class="navbtn" href="#/g/' + encodeURIComponent(prev) + '">← ' + short(prev) + '</a>' +
      '<a class="navbtn" href="#/g/' + encodeURIComponent(next) + '">' + short(next) + ' →</a>' +
      '</div>';

    return h;
  }

  /* ---------- 路由 ---------- */
  var tabs = [
    ['index', '六十四卦'], ['table', '对照表'], ['song', '卦序歌'], ['quiz', '自测']
  ];
  function renderTabs(active) {
    var box = document.getElementById('xtabs');
    box.innerHTML = tabs.map(function (t) {
      return '<button data-v="' + t[0] + '"' + (t[0] === active ? ' class="on"' : '') + '>' + t[1] + '</button>';
    }).join('');
    Array.prototype.forEach.call(box.querySelectorAll('button'), function (btn) {
      btn.onclick = function () { location.hash = '#/t/' + btn.getAttribute('data-v'); };
    });
  }
  function route() {
    var hash = decodeURIComponent(location.hash || '#/t/index');
    var view = document.getElementById('view');
    if (hash.indexOf('#/g/') === 0) {
      var nm = hash.slice(4);
      if (SEQ.indexOf(nm) < 0) nm = SEQ[0];
      renderTabs('index');
      view.innerHTML = viewDetail(nm);
      window.scrollTo(0, 0);
      var mk = document.getElementById('mk');
      if (mk) mk.onclick = function () {
        if (S.learned[nm]) delete S.learned[nm]; else S.learned[nm] = 1;
        save(); route();
      };
      return;
    }
    var t = 'index';
    if (hash.indexOf('#/t/') === 0) t = hash.slice(4) || 'index';
    renderTabs(t);
    if (t === 'index') { view.innerHTML = viewIndex(); renderGrid();
      var q = document.getElementById('q');
      q.oninput = renderGrid;
      document.getElementById('rand').onclick = function () {
        location.hash = '#/g/' + encodeURIComponent(SEQ[Math.floor(Math.random() * 64)]);
      };
    }
    else if (t === 'table') view.innerHTML = viewTable();
    else if (t === 'song') view.innerHTML = viewSong();
    else { view.innerHTML = viewQuiz(); renderQuiz(); tryBindQuiz(); }
    window.scrollTo(0, 0);
  }
  function tryBindQuiz() {
    var box = document.querySelector('.qmode');
    if (!box) return;
    Array.prototype.forEach.call(box.querySelectorAll('button'), function (btn) {
      btn.onclick = function () {
        S.quizMode = btn.getAttribute('data-m');
        Array.prototype.forEach.call(box.querySelectorAll('button'), function (b) { b.classList.remove('on'); });
        btn.classList.add('on');
        S.quizCur = null; renderQuiz();
      };
    });
  }
  window.addEventListener('hashchange', route);
  document.addEventListener('DOMContentLoaded', route);
})();
