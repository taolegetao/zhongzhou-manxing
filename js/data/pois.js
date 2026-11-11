/**
 * 两处可交互遗产点的全部内容与坐标。
 *
 * hitbox：手指可点击的世界坐标矩形（x, y, width, height）。
 * aura：靠近时在地面上出现的提示光环中心与半径。
 * cover：介绍卡头图，可直接替换为同尺寸图片。
 *
 * 新增建筑时复制一项，改 id / 文案 / 坐标即可；
 * 发现计数和头图预加载会自动按数组读取，不需要改 UI。
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
    coverPosition: 'center 56%',
    hitbox: { x: 340, y: 2230, width: 330, height: 230 },
    aura: { x: 480, y: 2380, rx: 135, ry: 24 },
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
    id: 'tiantan',
    order: 2,
    no: '02',
    seal: '天',
    name: '天坛',
    en: 'Temple of Heaven',
    kicker: '北京中轴线 · 祭天圣地',
    accent: '#2f6172',
    cover: './assets/covers/tiantan.jpg',
    coverPosition: 'center 52%',
    hitbox: { x: 590, y: 2025, width: 150, height: 195 },
    aura: { x: 660, y: 2160, rx: 75, ry: 20 },
    tags: ['世界文化遗产', '明永乐始建', '祭天祈谷'],
    lead:
      '天坛位于北京中轴线东侧，是明清两代皇帝祭天、祈谷的场所，始建于明永乐十八年（1420 年），初名“天地坛”。',
    body:
      '明嘉靖九年（1530 年）改称天坛，专用于祭天与祈谷。坛域原占地约 273 公顷，分内、外两坛；内坛以圜丘、祈谷坛为核心，祈年殿、皇穹宇、斋宫、神乐署等建筑沿轴线展开。1998 年列入《世界遗产名录》，是北京中轴线遗产构成要素之一，以“天圆地方”的布局表达古人对天人关系的理解。',
    detail: {
      type: 'timeline',
      title: '天坛年表',
      items: [
        { year: '1420', label: '始建，初名天地坛' },
        { year: '1530', label: '改称天坛，专事祭天' },
        { year: '1998', label: '列入世界遗产名录' },
      ],
    },
  },
];
