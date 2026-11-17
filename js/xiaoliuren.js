/* ===== 小六壬 ===== */
(function (global) {
  'use strict';
  var STATES = [
    { name: '大安', wx: '木', luck: '吉', pos: '东方', desc: '大安事事昌，求财在坤方，失物去不远，宅舍保安康。', detail: '身不动、事不动，安稳平静、守成之象。主事情稳定、按部就班，可成但进展慢。问病无大碍，问行人未归，问失物在近处（家中、原位附近）。宜静守，不宜急进。' },
    { name: '留连', wx: '土', luck: '凶', pos: '四方', desc: '留连事难成，求谋日未明，官事凡宜缓，去者未回程。', detail: '纠缠拖延、事久不决之象。主事情反复、拖泥带水、被人缠住。问病缠绵难愈，问行人滞留未归，问失物难寻。宜耐心、宜托人，不宜强求。' },
    { name: '速喜', wx: '火', luck: '吉', pos: '南方', desc: '速喜在南方，求财喜事双，行人有音信，病者无忧伤。', detail: '快速有成、喜讯将至之象。主事情进展快、消息来得急，成事在近日。问病速愈，问行人即回，问失物速得。宜把握时机，速战速决。' },
    { name: '赤口', wx: '金', luck: '凶', pos: '西方', desc: '赤口主口舌，官非切要防，失物急去寻，行人有惊慌。', detail: '口舌是非、争执惊扰之象。主因言语起争端、易有官非诉讼、易与人冲突。问病防急症，问行人路上有惊，问失物被人取走。宜少言、宜避争、宜守口。' },
    { name: '小吉', wx: '水', luck: '小吉', pos: '北方', desc: '小吉最吉昌，路上好商量，阴人来报喜，失物在坤方。', detail: '小有和合、顺势而成之象。主事情有转机、得人相助，多由他人（尤女性、下属）促成。问病渐愈，问行人将至，问失物在低处近水处。宜求人、宜商量。' },
    { name: '空亡', wx: '土', luck: '大凶', pos: '中央', desc: '空亡事不祥，阴人多乖张，求财无利益，行人有灾殃。', detail: '落空、劳而无功之象。主事情虚耗、所谋不实、计划落空，或对方心不实。问病防凶险，问行人未归且需防意外，问失物难寻。宜止、宜重新筹划，不宜投入。' }
  ];

  function compute(month, day, hourZhiIndex) {
    var a = ((month - 1) % 6 + 6) % 6;          // 月份（农历）
    var b = (a + (day - 1)) % 6;                 // 日期
    var c = (b + hourZhiIndex) % 6;              // 时支（子=0）
    return {
      monthPos: a, dayPos: b, hourPos: c,
      monthState: STATES[a], dayState: STATES[b], hourState: STATES[c],
      final: STATES[c],
      path: STATES[a].name + ' → ' + STATES[b].name + ' → ' + STATES[c].name
    };
  }

  global.XiaoLiuRen = { compute: compute, STATES: STATES };
})(window);
