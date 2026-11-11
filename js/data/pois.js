/**
 * 两处可交互遗产点的全部内容与坐标。
 *
 * hitbox：手指可点击的世界坐标矩形（x, y, width, height）。
 * aura：靠近时在地面上出现的提示光环中心与半径。
 * cover：介绍卡头图，可直接替换为同尺寸图片。
 *
 * 新增建筑时复制一项，改 id / 文案 / 坐标即可；
 * 其它系统会自动读取并生成点击、提示和发现计数。
 */
export const POIS = [
  {
    id: 'yongdingmen',
    order: 1,
    no: '01',
    seal: '南',
    name: '永定门',
    en: 'Yongdingmen Gate',
    kicker: '北京中轴线 · 南端起点',
    accent: '#b34834',
    cover: './assets/covers/yongdingmen.jpg',
    coverPosition: 'center 52%',
    hitbox: { x: 398, y: 1126, width: 354, height: 202 },
    aura: { x: 560, y: 1251, rx: 148, ry: 26 },
    tags: ['南端起点', '外城最大城门', '2004 年复建'],
    lead:
      '永定门是北京中轴线的南端起点，寓意“永远安定”。始建于明嘉靖三十二年（1553 年），是老北京外城七门中规模最大的城门。',
    body:
      '原城楼于 1957 年拆除，2004 年按清代形制原址复建。它补齐了 7.8 公里中轴线的南端端点，向北串联正阳门、天安门、紫禁城等轴线建筑，体现居中规整的都城规划思想。',
    detail: {
      type: 'timeline',
      title: '城门年表',
      items: [
        { year: '1553', label: '明嘉靖年间始建' },
        { year: '1957', label: '原城楼拆除' },
        { year: '2004', label: '按清代形制复建' },
      ],
    },
  },
  {
    id: 'zijincheng',
    order: 2,
    no: '02',
    seal: '中',
    name: '紫禁城',
    en: 'The Forbidden City',
    kicker: '北京中轴线 · 宫城核心',
    accent: '#a84431',
    cover: './assets/covers/zijincheng.jpg',
    coverPosition: 'center 50%',
    hitbox: { x: 424, y: 527, width: 244, height: 187 },
    aura: { x: 542, y: 650, rx: 112, ry: 30 },
    tags: ['中轴核心', '明永乐建成', '前朝后寝'],
    lead:
      '紫禁城是北京中轴线的核心，明清两代皇家宫殿，建成于明永乐十八年（1420 年）。占地约 72 万平方米，以中轴线严格对称布局。',
    body:
      '中轴线上依次排布午门、太和门、三大殿、乾清门、后三宫、御花园与神武门；两侧建筑对称分布，遵循“前朝后寝、左祖右社”的古制。它是世界现存规模最大、保存最完整的古代木构宫殿群，集中体现“以中为尊、中正和谐”的礼制思想。',
    detail: {
      type: 'route',
      title: '中轴序列',
      items: ['午门', '太和门', '三大殿', '乾清门', '后三宫', '神武门'],
    },
  },
];
