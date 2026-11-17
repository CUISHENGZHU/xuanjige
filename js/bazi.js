/* ===== 四柱八字（排盘 + 五行/十神粗断） ===== */
(function (global) {
  'use strict';
  var GAN = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'];
  var ZHI = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];
  var GAN_WX = { 甲: '木', 乙: '木', 丙: '火', 丁: '火', 戊: '土', 己: '土', 庚: '金', 辛: '金', 壬: '水', 癸: '水' };
  var GAN_YY = { 甲: 1, 乙: -1, 丙: 1, 丁: -1, 戊: 1, 己: -1, 庚: 1, 辛: -1, 壬: 1, 癸: -1 };
  var ZHI_WX = { 子: '水', 丑: '土', 寅: '木', 卯: '木', 辰: '土', 巳: '火', 午: '火', 未: '土', 申: '金', 酉: '金', 戌: '土', 亥: '水' };
  var CANG = {
    子: ['癸'], 丑: ['己', '癸', '辛'], 寅: ['甲', '丙', '戊'], 卯: ['乙'], 辰: ['戊', '乙', '癸'],
    巳: ['丙', '庚', '戊'], 午: ['丁', '己'], 未: ['己', '丁', '乙'], 申: ['庚', '壬', '戊'],
    酉: ['辛'], 戌: ['戊', '辛', '丁'], 亥: ['壬', '甲']
  };
  var SHENG = { 木: '火', 火: '土', 土: '金', 金: '水', 水: '木' };
  var KE = { 木: '土', 土: '水', 水: '火', 火: '金', 金: '木' };

  function shiShen(dayGan, other) {
    if (!other) return '';
    var a = GAN_WX[dayGan], b = GAN_WX[other];
    var same = GAN_YY[dayGan] === GAN_YY[other];
    if (a === b) return same ? '比肩' : '劫财';
    if (SHENG[a] === b) return same ? '食神' : '伤官';
    if (KE[a] === b) return same ? '偏财' : '正财';
    if (KE[b] === a) return same ? '七杀' : '正官';
    if (SHENG[b] === a) return same ? '偏印' : '正印';
    return '';
  }

  function compute(lu, gender) {
    var ec = lu.getEightChar();
    var pillars = [
      { name: '年', gz: ec.getYear(), gan: ec.getYearGan(), zhi: ec.getYearZhi(), nayin: ec.getYearNaYin() },
      { name: '月', gz: ec.getMonth(), gan: ec.getMonthGan(), zhi: ec.getMonthZhi(), nayin: ec.getMonthNaYin() },
      { name: '日', gz: ec.getDay(), gan: ec.getDayGan(), zhi: ec.getDayZhi(), nayin: ec.getDayNaYin() },
      { name: '时', gz: ec.getTime(), gan: ec.getTimeGan(), zhi: ec.getTimeZhi(), nayin: ec.getTimeNaYin() }
    ];
    var dayGan = ec.getDayGan();

    var count = { 木: 0, 火: 0, 土: 0, 金: 0, 水: 0 };
    pillars.forEach(function (p, i) {
      p.ganShiShen = i === 2 ? '日主' : shiShen(dayGan, p.gan);
      p.ganWX = GAN_WX[p.gan];
      p.zhiWX = ZHI_WX[p.zhi];
      p.cang = CANG[p.zhi].map(function (g) { return { gan: g, wx: GAN_WX[g], ss: shiShen(dayGan, g) }; });
      count[GAN_WX[p.gan]] += 1;
      count[ZHI_WX[p.zhi]] += 1.2;
    });

    // 日主强弱：生扶（同类 + 生我）vs 克泄耗
    var me = GAN_WX[dayGan];
    var support = 0, drain = 0;
    pillars.forEach(function (p, i) {
      var w = i === 1 ? 1.6 : 1; // 月令加权
      [p.ganWX, p.zhiWX].forEach(function (wx) {
        if (wx === me || SHENG[wx] === me) support += w;
        else drain += w;
      });
    });
    var total = support + drain;
    var ratio = support / total;
    var level = ratio > 0.62 ? '身强' : ratio > 0.52 ? '偏强' : ratio > 0.42 ? '中和' : ratio > 0.32 ? '偏弱' : '身弱';

    var xi;
    if (level === '身强' || level === '偏强') xi = '喜「克泄耗」：财（我克）、官杀（克我）、食伤（我生）为用，忌比劫、印星再生扶。';
    else if (level === '身弱' || level === '偏弱') xi = '喜「生扶」：印星（生我）、比劫（同我）为用，忌财官食伤再耗。';
    else xi = '身量中和，五行流通为要，喜忌看岁运调候，不宜偏执一端。';

    var missing = Object.keys(count).filter(function (k) { return count[k] === 0; });

    var yun = null;
    try {
      var y = ec.getYun(gender === '男' ? 1 : 0);
      var dy = y.getDaYun();
      yun = { start: y.getStartYear() + '年' + y.getStartMonth() + '个月' + y.getStartDay() + '天起运', list: [] };
      for (var i = 1; i < Math.min(dy.length, 9); i++) {
        yun.list.push({ gz: dy[i].getGanZhi(), age: dy[i].getStartAge() + '-' + dy[i].getEndAge(), year: dy[i].getStartYear() });
      }
    } catch (e) { yun = null; }

    return {
      pillars: pillars, dayGan: dayGan, dayWX: me, count: count,
      support: support.toFixed(1), drain: drain.toFixed(1), level: level, xi: xi,
      missing: missing, yun: yun, gender: gender,
      shengXiao: lu.getYearShengXiao(), lunarText: lu.toString()
    };
  }

  global.BaZi = { compute: compute, shiShen: shiShen, CANG: CANG, GAN_WX: GAN_WX, ZHI_WX: ZHI_WX };
})(window);
