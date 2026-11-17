/* ===== 奇门遁甲（时家奇门·转盘·拆补定局） ===== */
(function (global) {
  'use strict';

  var GAN = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'];
  var ZHI = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];
  var GAN_WX = { 甲: '木', 乙: '木', 丙: '火', 丁: '火', 戊: '土', 己: '土', 庚: '金', 辛: '金', 壬: '水', 癸: '水' };

  // 洛书九宫
  var GONG = {
    1: { name: '坎一宫', dir: '正北', wx: '水', tri: '坎', xiang: '水' },
    2: { name: '坤二宫', dir: '西南', wx: '土', tri: '坤', xiang: '地' },
    3: { name: '震三宫', dir: '正东', wx: '木', tri: '震', xiang: '雷' },
    4: { name: '巽四宫', dir: '东南', wx: '木', tri: '巽', xiang: '风' },
    5: { name: '中五宫', dir: '中央', wx: '土', tri: '—', xiang: '土' },
    6: { name: '乾六宫', dir: '西北', wx: '金', tri: '乾', xiang: '天' },
    7: { name: '兑七宫', dir: '正西', wx: '金', tri: '兑', xiang: '泽' },
    8: { name: '艮八宫', dir: '东北', wx: '土', tri: '艮', xiang: '山' },
    9: { name: '离九宫', dir: '正南', wx: '火', tri: '离', xiang: '火' }
  };

  // 环形顺序（后天八卦）：坎1 艮8 震3 巽4 离9 坤2 兑7 乾6
  var RING = [1, 8, 3, 4, 9, 2, 7, 6];
  var RING_STAR = ['天蓬', '天任', '天冲', '天辅', '天英', '天芮', '天柱', '天心'];
  var RING_MEN = ['休门', '生门', '伤门', '杜门', '景门', '死门', '惊门', '开门'];
  var RING_SHEN = ['值符', '腾蛇', '太阴', '六合', '白虎', '玄武', '九地', '九天'];

  var STAR_INFO = {
    '天蓬': { wx: '水', luck: '大凶', desc: '水贼之星，主盗贼、水厄、阴谋。落宫宜静不宜动，得旺则智谋深沉，休囚则盗失。' },
    '天芮': { wx: '土', luck: '大凶', desc: '病符之星，主疾病、师徒、结党。占病必见，占学可为师。' },
    '天冲': { wx: '木', luck: '小吉', desc: '武士之星，主勇动、急速、争战。宜速行、宜出击，不宜久拖。' },
    '天辅': { wx: '木', luck: '大吉', desc: '文昌之星，主文化、教育、贵人。宜考试、文书、求学、见贵。' },
    '天禽': { wx: '土', luck: '大吉', desc: '中正之星，寄坤二宫。主中央、领导、诚信。百事皆宜，最为中正。' },
    '天心': { wx: '金', luck: '大吉', desc: '医药之星，主医疗、谋略、长官。宜求医、谋大事、见尊长。' },
    '天柱': { wx: '金', luck: '小凶', desc: '破坏之星，主口舌、毁折、惊恐。宜守不宜攻，防口舌是非。' },
    '天任': { wx: '土', luck: '小吉', desc: '稳重之星，主田土、蓄积、勤劳。宜置业、宜守成，不宜急进。' },
    '天英': { wx: '火', luck: '小凶', desc: '虚华之星，主文明、血光、浮躁。宜文书宴乐，忌争讼、忌急躁。' }
  };

  var MEN_INFO = {
    '休门': { wx: '水', luck: '吉', desc: '休养之门，主休息、婚姻、求见。宜调养、和解、见贵，不宜争斗。' },
    '生门': { wx: '土', luck: '大吉', desc: '生发之门，主生机、财利、房产。求财、开业、置业最宜，百事皆吉。' },
    '伤门': { wx: '木', luck: '凶', desc: '伤害之门，主争斗、损伤、追捕。宜捕猎、竞技，忌婚嫁、远行。' },
    '杜门': { wx: '木', luck: '中平', desc: '闭塞之门，主隐蔽、阻塞、技术。宜躲藏、保密、修炼，忌求财出行。' },
    '景门': { wx: '火', luck: '小吉', desc: '景象之门，主文书、信息、宣传。宜考试、上书、宴饮，忌妄动。' },
    '死门': { wx: '土', luck: '大凶', desc: '死亡之门，主丧葬、刑戮、终止。宜吊丧、行刑、收敛，余事皆忌。' },
    '惊门': { wx: '金', luck: '凶', desc: '惊恐之门，主惊恐、官讼、口舌。宜捕盗、诉讼，忌出行、婚嫁。' },
    '开门': { wx: '金', luck: '大吉', desc: '开通之门，主开创、官事、出行。宜开业、求官、远行、见贵。' }
  };

  var SHEN_INFO = {
    '值符': { luck: '大吉', desc: '诸神之首，主贵人、天乙之助。所临之宫百事皆宜，得长辈、上级之助。' },
    '腾蛇': { luck: '凶', desc: '虚诈之神，主惊恐、怪异、缠绕。事多虚惊，防人心不实、防怪事缠身。' },
    '太阴': { luck: '吉', desc: '荫护之神，主暗助、隐私、谋略。宜暗中行事、宜谋不宜明争。' },
    '六合': { luck: '吉', desc: '和合之神，主婚姻、合作、中介。宜谈婚论嫁、合伙、交易，多得中间人。' },
    '白虎': { luck: '大凶', desc: '凶煞之神，主凶伤、疾病、道路、威猛。宜武不宜文，防血光、防争斗。' },
    '玄武': { luck: '凶', desc: '盗贼之神，主盗窃、欺瞒、暧昧。防失窃、防受骗、防私情。' },
    '九地': { luck: '吉', desc: '坚牢之神，主田土、稳固、藏伏。宜守成、宜蓄藏、宜低调。' },
    '九天': { luck: '吉', desc: '威悍之神，主远行、高升、张扬。宜远行、宜求名、宜大张旗鼓。' }
  };

  var JU_TABLE = {
    冬至: [1, 7, 4], 小寒: [2, 8, 5], 大寒: [3, 9, 6], 立春: [8, 5, 2], 雨水: [9, 6, 3], 惊蛰: [1, 7, 4],
    春分: [3, 9, 6], 清明: [4, 1, 7], 谷雨: [5, 2, 8], 立夏: [4, 1, 7], 小满: [5, 2, 8], 芒种: [6, 3, 9],
    夏至: [9, 3, 6], 小暑: [8, 2, 5], 大暑: [7, 1, 4], 立秋: [2, 5, 8], 处暑: [1, 4, 7], 白露: [9, 3, 6],
    秋分: [7, 1, 4], 寒露: [6, 9, 3], 霜降: [5, 8, 2], 立冬: [6, 9, 3], 小雪: [5, 8, 2], 大雪: [4, 7, 1]
  };
  var YANG_TERMS = ['冬至', '小寒', '大寒', '立春', '雨水', '惊蛰', '春分', '清明', '谷雨', '立夏', '小满', '芒种'];

  // 十干克应（天盘干 + 地盘干）
  var GE = {
    '戊丙': ['青龙返首', '大吉。谋事有成，求财得财，谒贵得见，百事顺遂。'],
    '丙戊': ['飞鸟跌穴', '大吉。事速成，动则有得，宜进取。'],
    '乙丙': ['奇仪顺遂', '吉。谋事多吉，有贵人暗中相助。'],
    '丙乙': ['日月并行', '吉。公事私事皆宜，求名求利两得。'],
    '乙丁': ['奇仪相佐', '吉。文书、考试、契约之事大成。'],
    '丁乙': ['玉女奇生', '吉。贵人接引，谋事遂心，宜求人。'],
    '戊乙': ['青龙合灵', '吉。得人相助，谋事可成。'],
    '乙戊': ['利阴害阳', '半吉。暗事可为，明事难成，宜私下运作。'],
    '戊丁': ['青龙耀明', '吉。谒贵求名、升迁有份。'],
    '丁戊': ['青龙转光', '吉。官人升迁，常人亦得威昌。'],
    '丙丁': ['月奇朱雀', '吉。文书、信息、宣传之事大利。'],
    '丁丙': ['星随月转', '吉。贵人越级提拔，谋事有人提携。'],
    '丙庚': ['荧入太白', '凶。宜退不宜进，防暗中被夺，事多退败。'],
    '庚丙': ['太白入荧', '半吉。主进取、宜主动出击，但防盗贼、防人夺。'],
    '庚庚': ['太白同宫', '大凶。兄弟阋墙、官事横祸，切忌合伙共谋。'],
    '辛乙': ['白虎猖狂', '凶。破家伤身，词讼不休，宜避。'],
    '乙辛': ['青龙逃走', '凶。人亡财破，所谋皆空，防人离去。'],
    '癸丁': ['螣蛇夭矫', '凶。文书官司缠身，事多虚惊。'],
    '丁癸': ['朱雀投江', '凶。音信沉溺、文书遗失，所求无回音。'],
    '壬辛': ['腾蛇相缠', '凶。纵有吉事亦生波折，缠绕不清。'],
    '辛壬': ['凶蛇入狱', '凶。争端、牢狱、两男争女之象。'],
    '庚癸': ['大格', '凶。车破马伤、行人即至、谋事不成，忌远行。'],
    '庚壬': ['小格', '凶。远行迷失道路，事多阻滞。'],
    '庚己': ['刑格', '凶。官司被刑罚，防牢狱之灾。'],
    '庚丁': ['亭亭之格', '凶。私匿之事、暧昧官司，宜自守。'],
    '庚乙': ['太白蓬星', '退吉进凶。宜退守，进则受阻。'],
    '癸癸': ['天网四张', '凶。行人失伴，病讼皆伤，凡事难脱。'],
    '壬壬': ['天狱自刑', '凶。求谋破财，自寻烦恼。'],
    '己己': ['地户逢鬼', '凶。病人必危，百事不遂。'],
    '己庚': ['刑格返名', '凶。词讼先动者不利，宜后发。'],
    '己辛': ['游魂入墓', '凶。事散人亡，防坟茔阴私。'],
    '辛己': ['入狱自刑', '凶。奴仆背主、下属反复，防内患。'],
    '辛庚': ['白虎出力', '凶。刀刃相交，争斗伤人。'],
    '壬庚': ['太白擒蛇', '平。刑狱公平，是非曲直得明。'],
    '壬癸': ['幼女奸淫', '凶。家丑外扬，防私情败露。'],
    '癸壬': ['复见螣蛇', '凶。嫁娶重婚、反复纠缠。'],
    '癸辛': ['网盖天牢', '凶。讼狱难伸，事陷其中。'],
    '乙庚': ['日奇被刑', '凶。争讼财产、夫妻反目。'],
    '乙壬': ['日奇入地', '凶。尊卑悖乱，上下失序。'],
    '乙癸': ['华盖逢星', '吉。贵人禄位，常人平安。'],
    '丙辛': ['日月相会', '吉。谋事可成，宜谈判、宜会面。'],
    '丁庚': ['文书阻隔', '凶。文书不通、消息中断。'],
    '丁辛': ['朱雀入狱', '凶。文书出错、口舌入官。'],
    '丁壬': ['五神互合', '吉。暗中得助，合谋有成。'],
    '丁己': ['火入勾陈', '凶。事多迟滞，防牵连。'],
    '辛癸': ['天牢华盖', '凶。日月失明，误入歧途。'],
    '己丙': ['火悖地户', '凶。恩中成怨，反受其害。'],
    '壬乙': ['小蛇得势', '吉。退中有进，柔中取胜。'],
    '壬丁': ['干合蛇刑', '凶。文书牵连，宜静守。'],
    '壬己': ['反吟蛇刑', '凶。事有反复，官讼必败。'],
    '癸丙': ['华盖悖师', '凶。贵贱不分，上下乖离。'],
    '癸乙': ['华盖蓬星', '吉。贵人得禄，常人平安。'],
    '癸戊': ['天乙会合', '吉。吉事则吉，凶事则凶，看门之吉凶。'],
    '戊辛': ['青龙折足', '凶。破财、足疾，谋事半途而废。'],
    '辛戊': ['困龙被伤', '凶。受制于人，事不由己。'],
    '戊壬': ['青龙入天牢', '凶。事陷不拔，防牢狱。'],
    '戊癸': ['青龙华盖', '平。吉事吉、凶事凶。'],
    '戊己': ['贵人入狱', '凶。贵人反成拖累，公私皆不利。'],
    '己癸': ['地刑玄武', '凶。防盗窃、防诈欺。'],
    '己壬': ['地网兜天', '凶。事多羁绊，难以脱身。'],
    '丙己': ['火入勾陈', '凶。事多纠缠，恩中生怨。'],
    '丙癸': ['华盖悖师', '凶。上下不和，谋事受制。'],
    '丙壬': ['火水未济', '凶。事未成，阴阳不交。'],
    '辛丙': ['干合悖师', '平。事有合而难成。'],
    '辛丁': ['狱神得奇', '平。经商求财可多得，余事平平。'],
    '辛甲': ['困龙被伤', '凶。'],
    '己乙': ['墓神不明', '凶。事多暗昧，宜守。'],
    '乙己': ['日奇入墓', '凶。事陷暗昧，求谋不遂。']
  };

  // 用神速查
  var YONGSHEN = {
    '求财生意': { kind: '门', key: '生门', why: '生门主财利、生机' },
    '事业官职': { kind: '门', key: '开门', why: '开门主官事、开创' },
    '婚姻感情': { kind: '神', key: '六合', why: '六合主婚姻、和合' },
    '考试学业': { kind: '星', key: '天辅', why: '天辅为文昌之星' },
    '健康疾病': { kind: '星', key: '天芮', why: '天芮为病符之星' },
    '官司诉讼': { kind: '门', key: '惊门', why: '惊门主官讼、口舌' },
    '出行搬迁': { kind: '门', key: '开门', why: '开门主出行、道路' },
    '失物寻人': { kind: '门', key: '杜门', why: '杜门主隐蔽、藏匿' },
    '文书合同': { kind: '门', key: '景门', why: '景门主文书、信息' },
    '一般问事': { kind: '神', key: '值符', why: '值符为诸神之首，主大体' },
    '田土房产': { kind: '门', key: '生门', why: '生门主田土、房产' }
  };

  function ringPos(gong) { var i = RING.indexOf(gong); return i < 0 ? 5 : i; }

  function jiaZiIndex(gz) {
    for (var i = 0; i < 60; i++) {
      if (GAN[i % 10] + ZHI[i % 12] === gz) return i;
    }
    return 0;
  }

  function compute(ctx) {
    // ctx: { dayGZ, timeGZ, prevJieQi, jieQiTime }
    var dIdx = jiaZiIndex(ctx.dayGZ);
    var tIdx = jiaZiIndex(ctx.timeGZ);

    // ---- 1. 定局 ----
    var jie = ctx.prevJieQi;
    var yang = YANG_TERMS.indexOf(jie) >= 0;
    // 符头：向前找最近的甲/己日
    var fuIdx = dIdx - (dIdx % 5);
    var fuZhi = fuIdx % 12;
    var yuan, yuanIdx;
    if ([0, 6, 3, 9].indexOf(fuZhi) >= 0) { yuan = '上元'; yuanIdx = 0; }
    else if ([2, 8, 5, 11].indexOf(fuZhi) >= 0) { yuan = '中元'; yuanIdx = 1; }
    else { yuan = '下元'; yuanIdx = 2; }
    var ju = JU_TABLE[jie][yuanIdx];
    var dun = yang ? '阳遁' : '阴遁';

    // ---- 2. 地盘三奇六仪 ----
    var seq = ['戊', '己', '庚', '辛', '壬', '癸', '丁', '丙', '乙'];
    var diPan = {};
    for (var i = 0; i < 9; i++) {
      var g = ((ju - 1 + (yang ? i : -i)) % 9 + 9) % 9 + 1;
      diPan[g] = seq[i];
    }

    // ---- 3. 旬首、值符、值使 ----
    var xun = Math.floor(tIdx / 10); // 0甲子 1甲戌 2甲申 3甲午 4甲辰 5甲寅
    var XUN_YI = ['戊', '己', '庚', '辛', '壬', '癸'];
    var XUN_NAME = ['甲子', '甲戌', '甲申', '甲午', '甲辰', '甲寅'];
    var xunYi = XUN_YI[xun];
    var xunName = XUN_NAME[xun];

    var A = null;
    for (var k in diPan) if (diPan[k] === xunYi) A = parseInt(k, 10);
    var Aeff = A === 5 ? 2 : A;              // 中五寄坤二
    var fuStar = A === 5 ? '天禽' : RING_STAR[ringPos(A)];
    var fuMen = A === 5 ? '死门' : RING_MEN[ringPos(A)];

    // 时干（甲则用旬首仪）
    var shiGan = ctx.timeGZ.charAt(0);
    var useGan = shiGan === '甲' ? xunYi : shiGan;
    var T = null;
    for (var k2 in diPan) if (diPan[k2] === useGan) T = parseInt(k2, 10);
    var Tcell = T, Teff = T === 5 ? 2 : T;

    // ---- 4. 天盘九星 + 天盘干（整体旋转）----
    var delta = (ringPos(Teff) - ringPos(Aeff) + 8) % 8;
    var tianStar = {}, tianGan = {};
    for (var p = 0; p < 8; p++) {
      var srcG = RING[p];
      var dstG = RING[(p + delta) % 8];
      tianStar[dstG] = RING_STAR[p];
      tianGan[dstG] = diPan[srcG];
    }
    if (A === 5) {
      // 旬首落中五宫：天禽为值符、死门为值使，携中宫之干寄坤二同飞
      tianGan[Teff] = diPan[5] + (tianGan[Teff] ? '／' + tianGan[Teff] : '');
      tianStar[Teff] = '天禽／' + tianStar[Teff];
    }

    // ---- 5. 值使门落宫 & 八门 ----
    var n = tIdx % 10;
    var menGong = ((Aeff - 1 + (yang ? n : -n)) % 9 + 9) % 9 + 1;
    menGong = menGong === 5 ? 2 : menGong;
    var dMen = (ringPos(menGong) - ringPos(Aeff) + 8) % 8;
    var tianMen = {};
    for (var q = 0; q < 8; q++) {
      tianMen[RING[(q + dMen) % 8]] = RING_MEN[q];
    }
    if (A === 5) tianMen[menGong] = '死门';

    // ---- 6. 八神 ----
    var shen = {};
    var startShen = ringPos(Teff);
    for (var s = 0; s < 8; s++) {
      var gp = RING[((startShen + (yang ? s : -s)) % 8 + 8) % 8];
      shen[gp] = RING_SHEN[s];
    }

    // ---- 7. 格局 ----
    var cells = [];
    for (var c = 1; c <= 9; c++) {
      var tg = tianGan[c] || '', dg = diPan[c] || '';
      var ge = null;
      if (tg && dg && c !== 5) {
        var hit = GE[tg + dg];
        if (hit) ge = { name: hit[0], text: hit[1], named: true };
        else {
          var rel = relWXStr(GAN_WX[tg], GAN_WX[dg]);
          ge = { name: tg + '加' + dg, text: '无专名格局：天盘' + tg + '干加地盘' + dg + '干，' + rel + '。', named: false };
        }
      }
      cells.push({
        gong: c, name: GONG[c].name, dir: GONG[c].dir, wx: GONG[c].wx,
        diGan: dg, tianGan: tg, star: tianStar[c] || '',
        men: tianMen[c] || '', shen: shen[c] || '', ge: ge
      });
    }

    // ---- 8. 旬空、驿马 ----
    var xunStartZhi = (xun * 10) % 12;
    var kong = ZHI[(xunStartZhi + 10) % 12] + ZHI[(xunStartZhi + 11) % 12];
    var shiZhi = ctx.timeGZ.charAt(1);
    var MA = { 申: '寅', 子: '寅', 辰: '寅', 寅: '申', 午: '申', 戌: '申', 巳: '亥', 酉: '亥', 丑: '亥', 亥: '巳', 卯: '巳', 未: '巳' };
    var ma = MA[shiZhi];

    return {
      ju: ju, dun: dun, jieqi: jie, yuan: yuan, fuTou: GAN[fuIdx % 10] + ZHI[fuIdx % 12],
      xun: xunName, xunYi: xunYi, fuStar: fuStar, fuMen: fuMen,
      fuGong: A, shiGan: shiGan, useGan: useGan, shiGong: Tcell, delta: delta,
      cells: cells, kong: kong, ma: ma,
      dayGZ: ctx.dayGZ, timeGZ: ctx.timeGZ, monthGZ: ctx.monthGZ, yearGZ: ctx.yearGZ
    };
  }

  function relWXStr(a, b) {
    if (a === b) return '同气比和';
    var SHENG = { 木: '火', 火: '土', 土: '金', 金: '水', 水: '木' };
    var KE = { 木: '土', 土: '水', 水: '火', 火: '金', 金: '木' };
    if (SHENG[a] === b) return '天盘生地盘，事有生机';
    if (KE[a] === b) return '天盘克地盘，主客相争，事在掌控';
    if (SHENG[b] === a) return '地盘生天盘，得力有助';
    if (KE[b] === a) return '地盘克天盘，受制';
    return '';
  }

  // 用神落宫
  function yongshen(pan, topic) {
    var y = YONGSHEN[topic] || YONGSHEN['一般问事'];
    var cell = null;
    pan.cells.forEach(function (c) {
      if (y.kind === '门' && c.men === y.key) cell = c;
      if (y.kind === '星' && (c.star === y.key)) cell = c;
      if (y.kind === '神' && c.shen === y.key) cell = c;
    });
    return { def: y, cell: cell };
  }

  global.QiMen = {
    compute: compute, GONG: GONG, STAR_INFO: STAR_INFO, MEN_INFO: MEN_INFO, SHEN_INFO: SHEN_INFO,
    GE: GE, YONGSHEN: YONGSHEN, yongshen: yongshen, JU_TABLE: JU_TABLE, RING: RING,
    GAN_WX: GAN_WX
  };
})(window);
