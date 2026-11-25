/**
 * 首版试点：只开放永定门一个可交互建筑。
 * 其他中轴线建筑先以图鉴徽章的形式占位，后续再逐个补内容。
 */
export const POIS = [
  {
    id: 'yongdingmen',
    order: 1,
    no: '01',
    seal: '永',
    name: '永定门',
    en: 'Yongdingmen Gate',
    kicker: '北京中轴线 · 南端起点',
    accent: '#b34834',
    cover: './assets/covers/yongdingmen.jpg',
    coverPosition: 'center 56%',
    hitbox: { x: 340, y: 2230, width: 330, height: 230 },
    aura: { x: 480, y: 2380, rx: 135, ry: 24 },
    bubble: { x: 480, y: 2205 },
    tags: ['南端起点', '外城最大城门', '2004 年复建'],
    lead:
      '永定门是北京中轴线的南端起点，寓意“永远安定”。始建于明嘉靖三十二年（1553 年），是老北京外城七门中规模最大的城门。',
    body:
      '原城楼于 1957 年拆除，2004 年按清代形制原址复建。它补齐了 7.8 公里中轴线的南端端点，向北串联正阳门、天安门、故宫等轴线建筑，体现居中规整的都城规划思想。',
    detail: {
      type: 'timeline',
      title: '城门年表',
      items: [
        { year: '1553', label: '明嘉靖年间始建' },
        { year: '1957', label: '原城楼拆除' },
        { year: '2004', label: '按清代形制复建' },
      ],
    },
    quiz: {
      question: '永定门在哪一年按清代形制原址复建？',
      options: ['1553 年', '1957 年', '2004 年'],
      answer: 2,
      hint: '看看上面的“城门年表”，最后一行就是答案。',
      correct: '答对了。2004 年，永定门按清代形制原址复建。',
      wrong: '再翻翻上面的城门年表：永定门是在 2004 年复建的。',
      badgeLabel: '永定门徽章',
    },
  },
];
