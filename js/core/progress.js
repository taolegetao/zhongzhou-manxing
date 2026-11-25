const SESSION_KEY = 'zhongzhou-xunji-save-v2';
const SLOTS_KEY = 'zhongzhou-xunji-slots-v1';
export const SLOT_COUNT = 4;

/**
 * 自动存档：保存“当前游玩会话”，用于刷新后继续。
 * 手动存档使用 4 个独立存档位，见 loadSlots/saveSlot。
 */
export function loadProgress() {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    return normalizeSnapshot(JSON.parse(raw));
  } catch {
    return null;
  }
}

export function saveProgress({ badges, player, settings }) {
  const savedAt = new Date().toISOString();
  try {
    localStorage.setItem(
      SESSION_KEY,
      JSON.stringify(makeSnapshot({ badges, player, settings, savedAt })),
    );
    return savedAt;
  } catch {
    return null;
  }
}

export function loadSlots() {
  const slots = Array.from({ length: SLOT_COUNT }, () => null);
  try {
    const raw = localStorage.getItem(SLOTS_KEY);
    if (!raw) return slots;
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return slots;
    for (let index = 0; index < SLOT_COUNT; index += 1) {
      slots[index] = normalizeSnapshot(parsed[index]);
    }
  } catch {
    // 损坏的存档直接当作空位
  }
  return slots;
}

export function saveSlot(index, { badges, player, settings }) {
  if (!Number.isInteger(index) || index < 0 || index >= SLOT_COUNT) {
    return { slots: loadSlots(), ok: false };
  }

  const slots = loadSlots();
  const savedAt = new Date().toISOString();
  slots[index] = makeSnapshot({ badges, player, settings, savedAt });

  try {
    localStorage.setItem(SLOTS_KEY, JSON.stringify(slots));
    return { slots, ok: true };
  } catch {
    return { slots: loadSlots(), ok: false };
  }
}

export function clearProgress() {
  try {
    localStorage.removeItem(SESSION_KEY);
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

function makeSnapshot({ badges, player, settings, savedAt }) {
  return {
    version: 3,
    badges: Array.from(badges ?? []),
    player: { x: Math.round(player.x), y: Math.round(player.y) },
    settings: {
      reduceMotion: Boolean(settings?.reduceMotion),
      largeText: Boolean(settings?.largeText),
    },
    savedAt,
  };
}

function normalizeSnapshot(data) {
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
}
