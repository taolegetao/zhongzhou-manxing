/**
 * 图鉴徽章：当前只点亮永定门，其余作为中轴线建筑的收藏位。
 * 后续每完成一处建筑的小游戏，就把对应 id 加入进度。
 */
export const ATLAS_BADGES = [
  { id: 'yongdingmen', name: '永定门', seal: '永', hint: '南端起点' },
  { id: 'tiantan', name: '天坛', seal: '天', hint: '祭天圣地' },
  { id: 'zhengyangmen', name: '正阳门', seal: '正', hint: '京师正门' },
  { id: 'gugong', name: '故宫', seal: '宫', hint: '宫城核心' },
  { id: 'jingshan', name: '景山', seal: '景', hint: '中轴制高点' },
  { id: 'zhonggulou', name: '钟鼓楼', seal: '钟', hint: '北端报时' },
];
