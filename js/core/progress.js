const STORAGE_KEY = 'zhongzhou-xunji-save-v2';

/**
 * 存档只保存“玩家进度”，不保存临时 UI 状态。
 * 结构：
 * { version, badges: string[], player: {x,y}, settings: {...}, savedAt: ISO }
 */
export function loadProgress() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw);
    if (!data || !Array.isArray(data.badges)) return null;

    const x = Number(data.player?.x);
    const y = Number(data.player?.y);

    return {
      version: data.version || 1,
      badges: data.badges.filter((id) => typeof id === 'string'),
      player: Number.isFinite(x) && Number.isFinite(y) ? { x, y } : null,
      settings: {
        reduceMotion: Boolean(data.settings?.reduceMotion),
        largeText: Boolean(data.settings?.largeText),
      },
      savedAt: typeof data.savedAt === 'string' ? data.savedAt : null,
    };
  } catch {
    return null;
  }
}

export function saveProgress({ badges, player, settings }) {
  const savedAt = new Date().toISOString();
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        version: 2,
        badges: Array.from(badges),
        player: { x: Math.round(player.x), y: Math.round(player.y) },
        settings: {
          reduceMotion: Boolean(settings.reduceMotion),
          largeText: Boolean(settings.largeText),
        },
        savedAt,
      }),
    );
    return savedAt;
  } catch {
    return null;
  }
}

export function clearProgress() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // 忽略隐私模式下的存储失败
  }
}

export function formatSavedAt(iso) {
  if (!iso) return '尚未存档';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '尚未存档';
  return new Intl.DateTimeFormat('zh-CN', {
    month: 'numeric',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}
