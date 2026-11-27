import { ATLAS_BADGES } from '../data/atlas.js?v=1.6.0';
import { formatSavedAt } from '../core/progress.js?v=1.6.0';

/**
 * 页面 UI：开始页、HUD、气泡、散页卡、答题、图鉴、设置、Toast。
 * 这个文件只负责显示与焦点管理，游戏状态由 main.js 维护。
 */
export class UI {
  constructor(callbacks = {}) {
    this.callbacks = callbacks;
    this.totalBadges = ATLAS_BADGES.length;
    const byId = (id) => {
      const element = document.getElementById(id);
      if (!element) throw new Error(`缺少页面元素：#${id}`);
      return element;
    };

    this.el = {
      stage: byId('stage'),
      startScreen: byId('startScreen'),
      startBtn: byId('startBtn'),
      startLabel: byId('startLabel'),
      startHelp: byId('startHelp'),
      axisFill: byId('axisFill'),
      axisPin: byId('axisPin'),
      axisPercent: byId('axisPercent'),

      settingsBtn: byId('settingsBtn'),
      saveBtn: byId('saveBtn'),
      atlasBtn: byId('atlasBtn'),
      atlasCount: byId('atlasCount'),
      bubble: byId('poiBubble'),
      bubbleText: byId('bubbleText'),

      saveLayer: byId('saveLayer'),
      saveCard: byId('saveLayer').querySelector('.save-card'),
      saveClose: byId('saveClose'),
      saveDone: byId('saveDone'),
      saveGrid: byId('saveGrid'),
      saveCurrentMeta: byId('saveCurrentMeta'),
      saveCurrentTime: byId('saveCurrentTime'),

      confirmLayer: byId('confirmLayer'),
      confirmCard: byId('confirmLayer').querySelector('.confirm-card'),
      confirmTitle: byId('confirmTitle'),
      confirmBody: byId('confirmBody'),
      confirmCancel: byId('confirmCancel'),
      confirmOk: byId('confirmOk'),

      joystick: byId('joystick'),
      toast: byId('toast'),

      sheetLayer: byId('sheetLayer'),
      poiSheet: byId('poiSheet'),
      sheetClose: byId('sheetClose'),
      sheetDone: byId('sheetDone'),
      sheetDoneLabel: byId('sheetDone').querySelector('span'),
      sheetCover: byId('sheetCover'),
      sheetNo: byId('sheetNo'),
      sheetKicker: byId('sheetKicker'),
      sheetTitle: byId('sheetTitle'),
      sheetEn: byId('sheetEn'),
      sheetStamp: byId('sheetStamp'),
      sheetIntro: byId('sheetIntro'),
      sheetTags: byId('sheetTags'),
      sheetDetail: byId('sheetDetail'),
      sheetGame: byId('sheetGame'),
      sheetBody: byId('sheetBody'),
      quizBlock: byId('quizBlock'),
      quizState: byId('quizState'),
      quizQuestion: byId('quizQuestion'),
      quizOptions: byId('quizOptions'),
      quizFeedback: byId('quizFeedback'),
      badgeReward: byId('badgeReward'),
      rewardSeal: byId('rewardSeal'),
      rewardName: byId('rewardName'),

      atlasLayer: byId('atlasLayer'),
      atlasCard: byId('atlasLayer').querySelector('.atlas-card'),
      atlasClose: byId('atlasClose'),
      atlasProgress: byId('atlasProgress'),
      atlasGrid: byId('atlasGrid'),

      settingsLayer: byId('settingsLayer'),
      settingsCard: byId('settingsLayer').querySelector('.settings-card'),
      settingsClose: byId('settingsClose'),
      settingsDone: byId('settingsDone'),
      settingsReset: byId('settingsReset'),
      reduceMotionToggle: byId('reduceMotionToggle'),
      largeTextToggle: byId('largeTextToggle'),
      lastSaved: byId('lastSaved'),
    };

    this.poiOpen = false;
    this.atlasOpen = false;
    this.settingsOpen = false;
    this.saveOpen = false;
    this.confirmOpen = false;
    this.activePoi = null;
    this.lastProgress = -1;
    this.toastTimer = null;
    this.sheetHideTimer = null;
    this.sheetFocusTimer = null;
    this.layerHideTimer = null;
    this.savedFocus = null;
    this.poiGuardUntil = 0;
    this.lastBadgeCount = -1;

    this.bindEvents();
  }

  bindEvents() {
    const { el } = this;

    el.startBtn.addEventListener('click', () => {
      if (!el.startBtn.disabled) this.callbacks.onStart?.();
    });

    el.settingsBtn.addEventListener('click', () => this.callbacks.onSettingsOpen?.());
    el.saveBtn.addEventListener('click', () => this.callbacks.onSaveOpen?.());
    el.atlasBtn.addEventListener('click', () => this.callbacks.onAtlasOpen?.());
    el.bubble.addEventListener('click', () => this.callbacks.onBubbleClick?.());

    el.saveClose.addEventListener('click', () => this.closeSaveSlots());
    el.saveDone.addEventListener('click', () => this.closeSaveSlots());
    el.saveLayer.querySelector('[data-close-save]')?.addEventListener('click', () => this.closeSaveSlots());
    el.saveGrid.addEventListener('click', (event) => {
      const button = event.target.closest('button[data-action]');
      if (!button) return;
      const index = Number(button.dataset.slot);
      if (!Number.isInteger(index)) return;
      if (button.dataset.action === 'save') this.callbacks.onSaveSlot?.(index);
      if (button.dataset.action === 'load') this.callbacks.onLoadSlot?.(index);
    });

    el.confirmCancel.addEventListener('click', () => this.closeConfirm(false));
    el.confirmOk.addEventListener('click', () => this.closeConfirm(true));
    el.confirmLayer.querySelector('[data-close-confirm]')?.addEventListener('click', () => this.closeConfirm(false));

    el.sheetClose.addEventListener('click', () => {
      if (this.canDismissPoi()) this.closePoi();
    });
    el.sheetDone.addEventListener('click', () => {
      if (this.canDismissPoi()) this.closePoi();
    });
    el.sheetLayer.querySelector('[data-close-sheet]')?.addEventListener('click', () => {
      if (this.canDismissPoi()) this.closePoi();
    });

    el.atlasClose.addEventListener('click', () => this.closeAtlas());
    el.atlasLayer.querySelector('[data-close-atlas]')?.addEventListener('click', () => this.closeAtlas());

    el.settingsClose.addEventListener('click', () => this.closeSettings());
    el.settingsDone.addEventListener('click', () => this.closeSettings());
    el.settingsLayer.querySelector('[data-close-settings]')?.addEventListener('click', () => this.closeSettings());
    el.settingsReset.addEventListener('click', () => {
      this.callbacks.onReset?.();
      this.closeSettings();
    });

    el.reduceMotionToggle.addEventListener('change', () => {
      this.callbacks.onToggleSetting?.('reduceMotion', el.reduceMotionToggle.checked);
    });
    el.largeTextToggle.addEventListener('change', () => {
      this.callbacks.onToggleSetting?.('largeText', el.largeTextToggle.checked);
    });

    document.addEventListener('keydown', (event) => {
      if (event.key !== 'Escape') return;
      if (this.confirmOpen) {
        event.preventDefault();
        this.closeConfirm(false);
      } else if (this.poiOpen) {
        event.preventDefault();
        this.closePoi();
      } else if (this.atlasOpen) {
        event.preventDefault();
        this.closeAtlas();
      } else if (this.settingsOpen) {
        event.preventDefault();
        this.closeSettings();
      } else if (this.saveOpen) {
        event.preventDefault();
        this.closeSaveSlots();
      }
    });

    el.sheetLayer.addEventListener('keydown', (event) => this.trapFocus(event, el.poiSheet));
    el.atlasLayer.addEventListener('keydown', (event) => this.trapFocus(event, el.atlasCard));
    el.settingsLayer.addEventListener('keydown', (event) => this.trapFocus(event, el.settingsCard));
    el.saveLayer.addEventListener('keydown', (event) => this.trapFocus(event, el.saveCard));
    el.confirmLayer.addEventListener('keydown', (event) => this.trapFocus(event, el.confirmCard));
  }

  setLoading(progress) {
    this.el.startBtn.disabled = true;
    this.el.startLabel.textContent = `正在展开地图 · ${Math.round(progress * 100)}%`;
  }

  ready(hasSave) {
    this.el.startBtn.disabled = false;
    this.el.startLabel.textContent = hasSave ? '继续寻迹' : '开始寻迹';
  }

  fail(message) {
    this.el.startBtn.disabled = true;
    this.el.startLabel.textContent = '加载未完成';
    this.el.startHelp.textContent = message;
    console.error('[中轴寻迹]', message);
  }

  hideStart() {
    const { startScreen, joystick } = this.el;
    startScreen.classList.add('is-leaving');
    startScreen.setAttribute('aria-hidden', 'true');
    window.setTimeout(() => {
      startScreen.hidden = true;
      joystick.focus({ preventScroll: true });
    }, 560);
  }

  setLoopProgress(count, total = this.totalBadges) {
    const safeTotal = Math.max(1, total);
    const safeCount = Math.min(safeTotal, Math.max(0, count));
    const percent = (safeCount / safeTotal) * 100;
    this.el.axisFill.style.width = `${percent}%`;
    this.el.axisPin.style.left = `${percent}%`;
    this.el.axisPercent.textContent = `${safeCount} / ${safeTotal}`;
    this.el.axisPercent.setAttribute('title', `已完成 ${safeCount} 个游玩闭环`);
  }

  setBadgeCount(count) {
    const safe = Math.min(this.totalBadges, Math.max(0, count));
    this.el.atlasCount.textContent = String(safe);
    this.el.atlasCount.classList.toggle('is-zero', safe === 0);
    this.el.atlasBtn.classList.toggle('has-new', safe > 0);
    this.setLoopProgress(safe, this.totalBadges);

    if (this.lastBadgeCount >= 0 && safe > this.lastBadgeCount) {
      this.el.atlasBtn.classList.remove('is-bump');
      void this.el.atlasBtn.offsetWidth;
      this.el.atlasBtn.classList.add('is-bump');
    }
    this.lastBadgeCount = safe;
  }

  setSavedAt(iso) {
    this.el.lastSaved.textContent = formatSavedAt(iso);
    this.el.saveBtn.title = `上次存档：${formatSavedAt(iso)}`;
  }

  flashSave() {
    this.el.saveBtn.classList.remove('is-saved');
    void this.el.saveBtn.offsetWidth;
    this.el.saveBtn.classList.add('is-saved');
    window.setTimeout(() => this.el.saveBtn.classList.remove('is-saved'), 900);
  }

  showBubble(poi, point) {
    if (!poi || !point) {
      this.hideBubble();
      return;
    }
    const { bubble, bubbleText, stage } = this.el;
    bubble.hidden = false;
    bubbleText.textContent = `${poi.name} · 轻触了解`;
    const width = stage.clientWidth || window.innerWidth;
    const height = stage.clientHeight || window.innerHeight;
    const margin = 72;
    const x = Math.min(width - margin, Math.max(margin, point.x));
    const y = Math.min(height - 150, Math.max(100, point.y));
    bubble.style.left = `${x}px`;
    bubble.style.top = `${y}px`;
  }

  hideBubble() {
    this.el.bubble.hidden = true;
  }

  /**
   * @param {object} poi
   * @param {boolean} earned
   */
  openPoi(poi, earned) {
    if (this.poiOpen) return;

    const { el } = this;
    this.activePoi = poi;
    this.poiOpen = true;
    this.poiGuardUntil = performance.now() + 420;
    this.savedFocus = document.activeElement;

    el.sheetNo.textContent = `${poi.no} / ${String(this.totalBadges).padStart(2, '0')}`;
    el.sheetKicker.textContent = poi.kicker;
    el.sheetTitle.textContent = poi.name;
    el.sheetEn.textContent = poi.en;
    el.sheetIntro.textContent = poi.lead;
    el.sheetBody.textContent = poi.body;
    el.sheetStamp.textContent = poi.seal;
    el.sheetCover.style.backgroundImage = `url("${poi.cover}")`;
    el.sheetCover.style.backgroundPosition = poi.coverPosition || 'center';
    el.sheetBody.scrollTop = 0;

    el.sheetTags.replaceChildren();
    for (const tag of poi.tags ?? []) {
      const chip = document.createElement('span');
      chip.className = 'tag';
      chip.textContent = tag;
      el.sheetTags.append(chip);
    }

    this.renderDetail(poi.detail);
    this.renderGame(poi);
    this.renderQuiz(poi, earned);

    el.sheetLayer.hidden = false;
    el.sheetLayer.setAttribute('aria-hidden', 'false');
    window.clearTimeout(this.sheetHideTimer);
    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => el.sheetLayer.classList.add('is-open'));
    });

    window.clearTimeout(this.sheetFocusTimer);
    this.sheetFocusTimer = window.setTimeout(() => {
      el.sheetClose.focus({ preventScroll: true });
    }, 400);
  }

  renderDetail(detail) {
    const { sheetDetail } = this.el;
    sheetDetail.replaceChildren();
    if (!detail) return;

    const title = document.createElement('p');
    title.className = 'detail-title';
    title.textContent = detail.title;
    sheetDetail.append(title);

    if (detail.type === 'timeline') {
      const timeline = document.createElement('div');
      timeline.className = 'timeline';
      for (const item of detail.items) {
        const node = document.createElement('div');
        node.className = 'timeline-item';
        const year = document.createElement('strong');
        year.textContent = item.year;
        const label = document.createElement('span');
        label.textContent = item.label;
        node.append(year, label);
        timeline.append(node);
      }
      sheetDetail.append(timeline);
      return;
    }

    if (detail.type === 'route') {
      const flow = document.createElement('div');
      flow.className = 'route-flow';
      detail.items.forEach((item, index) => {
        const label = document.createElement('span');
        label.textContent = item;
        flow.append(label);
        if (index < detail.items.length - 1) flow.append(document.createElement('i'));
      });
      sheetDetail.append(flow);
    }
  }

  renderQuiz(poi, earned) {
    const { el } = this;
    const quiz = poi.quiz;
    el.quizBlock.classList.toggle('is-earned', earned);
    el.quizState.textContent = earned ? '已点亮' : '未完成';
    el.quizQuestion.textContent = quiz.question;
    el.quizFeedback.hidden = true;
    el.quizFeedback.className = 'quiz-feedback';
    el.badgeReward.hidden = !earned;
    el.rewardSeal.textContent = poi.seal;
    el.rewardName.textContent = quiz.badgeLabel;
    el.sheetDoneLabel.textContent = '继续漫游';

    el.quizOptions.replaceChildren();
    quiz.options.forEach((label, index) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'quiz-option';
      button.textContent = label;
      button.disabled = earned;
      if (earned && index === quiz.answer) button.classList.add('is-correct');
      button.addEventListener('click', () => {
        if (!this.poiOpen || this.el.quizBlock.classList.contains('is-earned')) return;
        this.callbacks.onQuizAnswer?.(index);
      });
      el.quizOptions.append(button);
    });

    if (earned) {
      el.quizFeedback.hidden = false;
      el.quizFeedback.className = 'quiz-feedback is-correct';
      el.quizFeedback.textContent = quiz.correct;
    }
  }

  showQuizResult(correct, selectedIndex, poi) {
    const { el } = this;
    const buttons = Array.from(el.quizOptions.querySelectorAll('button'));

    buttons.forEach((button, index) => {
      button.classList.remove('is-wrong', 'is-correct');
      if (correct) {
        button.disabled = true;
        if (index === poi.quiz.answer) button.classList.add('is-correct');
      } else if (index === selectedIndex) {
        button.classList.add('is-wrong');
        button.disabled = true;
      }
    });

    el.quizFeedback.hidden = false;
    el.quizFeedback.className = `quiz-feedback ${correct ? 'is-correct' : 'is-wrong'}`;
    el.quizFeedback.textContent = correct ? poi.quiz.correct : poi.quiz.wrong;

    if (correct) {
      el.quizBlock.classList.add('is-earned');
      el.quizState.textContent = '已点亮';
      el.badgeReward.hidden = false;
      el.sheetDoneLabel.textContent = '收下徽章 · 继续';
      window.requestAnimationFrame(() => {
        el.badgeReward.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      });
    }
  }

  canDismissPoi() {
    // 触屏在 pointerup 后会补发一次 click。介绍卡恰好在手指下方出现时，
    // 这次 click 会误触背景关闭，所以给刚打开的卡片一个很短的防误触窗口。
    return performance.now() >= this.poiGuardUntil;
  }


  renderGame(poi) {
    const box = this.el.sheetGame;
    if (!box) return;
    box.replaceChildren();
    const game = poi.minigame;
    if (!game) {
      box.hidden = true;
      return;
    }
    box.hidden = false;

    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'game-entry';

    const k = document.createElement('span');
    k.className = 'game-entry-kicker';
    k.textContent = '可以玩';

    const t = document.createElement('span');
    t.className = 'game-entry-title';
    t.textContent = game.label;

    const d = document.createElement('span');
    d.className = 'game-entry-desc';
    d.textContent = game.desc || '';

    btn.append(k, t, d);
    btn.addEventListener('click', () => this.openGame(game));
    box.append(btn);
  }

  openGame(game) {
    const layer = document.getElementById('gameLayer');
    const frame = document.getElementById('gameFrame');
    const title = document.getElementById('gameTitle');
    if (!layer || !frame) {
      window.open(game.href, '_blank', 'noopener');
      return;
    }
    if (!this.gameBound) {
      this.gameBound = true;
      const close = document.getElementById('gameClose');
      if (close) close.addEventListener('click', () => this.closeGame());
    }
    if (title) title.textContent = game.label;
    frame.src = game.href;
    layer.hidden = false;
    document.body.classList.add('game-open');
  }

  closeGame() {
    const layer = document.getElementById('gameLayer');
    const frame = document.getElementById('gameFrame');
    if (!layer || !frame) return;
    layer.hidden = true;
    frame.src = 'about:blank';
    document.body.classList.remove('game-open');
  }

  closePoi() {
    if (!this.poiOpen) return;
    const { el } = this;
    this.poiOpen = false;
    el.sheetLayer.classList.remove('is-open');
    el.sheetLayer.setAttribute('aria-hidden', 'true');
    window.clearTimeout(this.sheetFocusTimer);
    this.sheetHideTimer = window.setTimeout(() => {
      el.sheetLayer.hidden = true;
    }, 440);

    this.callbacks.onPoiClose?.();
    this.restoreFocus();
  }

  openAtlas(badges) {
    if (this.atlasOpen) return;
    const { el } = this;
    this.atlasOpen = true;
    this.savedFocus = document.activeElement;
    this.renderAtlas(badges);
    this.openSystemLayer(el.atlasLayer, el.atlasClose);
  }

  renderAtlas(badges) {
    const { el } = this;
    const unlockedCount = ATLAS_BADGES.filter((badge) => badges.has(badge.id)).length;
    el.atlasProgress.textContent = `已点亮 ${unlockedCount} / ${ATLAS_BADGES.length}`;
    el.atlasGrid.replaceChildren();

    for (const badge of ATLAS_BADGES) {
      const unlocked = badges.has(badge.id);
      const node = document.createElement('div');
      node.className = `atlas-badge ${unlocked ? 'is-unlocked' : 'is-locked'}`;
      node.setAttribute('role', 'img');
      node.setAttribute('aria-label', `${badge.name}，${unlocked ? '已点亮' : '未点亮'}`);

      const seal = document.createElement('span');
      seal.className = 'atlas-seal';
      seal.textContent = badge.seal;

      const name = document.createElement('strong');
      name.className = 'atlas-name';
      name.textContent = badge.name;

      const hint = document.createElement('span');
      hint.className = 'atlas-hint';
      hint.textContent = unlocked ? '已点亮' : badge.hint;

      node.append(seal, name, hint);
      el.atlasGrid.append(node);
    }
  }

  closeAtlas() {
    if (!this.atlasOpen) return;
    this.atlasOpen = false;
    this.closeSystemLayer(this.el.atlasLayer);
    this.callbacks.onAtlasClose?.();
    this.restoreFocus();
  }

  openSettings(settings) {
    if (this.settingsOpen) return;
    const { el } = this;
    this.settingsOpen = true;
    this.savedFocus = document.activeElement;
    el.reduceMotionToggle.checked = Boolean(settings.reduceMotion);
    el.largeTextToggle.checked = Boolean(settings.largeText);
    this.openSystemLayer(el.settingsLayer, el.settingsDone);
  }

  closeSettings() {
    if (!this.settingsOpen) return;
    this.settingsOpen = false;
    this.closeSystemLayer(this.el.settingsLayer);
    this.callbacks.onSettingsClose?.();
    this.restoreFocus();
  }

  openSaveSlots(slots, current) {
    if (this.saveOpen) return;
    const { el } = this;
    this.saveOpen = true;
    this.savedFocus = document.activeElement;
    this.currentSave = current;
    this.renderSaveSlots(slots, current);
    this.openSystemLayer(el.saveLayer, el.saveGrid.querySelector('.slot-save') || el.saveDone);
  }

  renderSaveSlots(slots, current = this.currentSave) {
    const { el } = this;
    const active = document.activeElement;
    const activeSlot = active?.dataset?.slot;
    const activeAction = active?.dataset?.action;
    const currentBadges = current?.badges?.size ?? 0;
    const currentTotal = this.totalBadges;
    const currentLocation = this.locationLabel(current?.player);
    el.saveCurrentMeta.textContent = `徽章 ${currentBadges} / ${currentTotal} · ${currentLocation}`;
    el.saveCurrentTime.textContent = current?.savedAt
      ? `自动保存于 ${formatSavedAt(current.savedAt)}`
      : '尚未自动保存';

    el.saveGrid.replaceChildren();

    slots.forEach((slot, index) => {
      const occupied = Boolean(slot?.savedAt);
      const node = document.createElement('div');
      node.className = `save-slot ${occupied ? 'is-occupied' : 'is-empty'}`;

      const head = document.createElement('div');
      head.className = 'save-slot-head';
      const label = document.createElement('strong');
      label.textContent = `存档 ${String(index + 1).padStart(2, '0')}`;
      const time = document.createElement('span');
      time.textContent = occupied ? formatSavedAt(slot.savedAt) : '空存档';
      head.append(label, time);

      const meta = document.createElement('p');
      meta.className = 'save-slot-meta';
      const count = occupied
        ? slot.badges.filter((id) => ATLAS_BADGES.some((badge) => badge.id === id)).length
        : 0;
      meta.textContent = occupied
        ? `徽章 ${count} / ${this.totalBadges} · ${this.locationLabel(slot.player)}`
        : '还没有保存过进度';

      const actions = document.createElement('div');
      actions.className = 'save-slot-actions';

      const saveButton = document.createElement('button');
      saveButton.type = 'button';
      saveButton.className = 'slot-save';
      saveButton.dataset.action = 'save';
      saveButton.dataset.slot = String(index);
      saveButton.textContent = occupied ? '覆盖保存' : '保存到此';

      const loadButton = document.createElement('button');
      loadButton.type = 'button';
      loadButton.className = 'slot-load';
      loadButton.dataset.action = 'load';
      loadButton.dataset.slot = String(index);
      loadButton.textContent = '读取';
      loadButton.disabled = !occupied;

      actions.append(saveButton, loadButton);
      node.append(head, meta, actions);
      el.saveGrid.append(node);
    });

    if (activeSlot !== undefined && activeAction) {
      el.saveGrid
        .querySelector(`[data-slot="${activeSlot}"][data-action="${activeAction}"]`)
        ?.focus({ preventScroll: true });
    }
  }

  locationLabel(player) {
    if (!player || !Number.isFinite(player.y)) return '位置未知';
    if (player.y >= 2150) return '永定门附近';
    if (player.y >= 2025) return player.x >= 580 ? '天坛附近' : '永定门附近';
    if (player.y >= 1800) return '正阳门附近';
    if (player.y >= 900) return '故宫附近';
    return '中轴途中';
  }

  closeSaveSlots() {
    if (!this.saveOpen) return;
    this.saveOpen = false;
    this.closeSystemLayer(this.el.saveLayer);
    this.callbacks.onSaveClose?.();
    this.restoreFocus();
  }

  /**
   * In-game confirmation. Avoids window.confirm, which some mobile
   * in-app browsers suppress silently.
   * @returns {Promise<boolean>}
   */
  confirm({ title = '确认操作', body = '', okText = '确认', cancelText = '取消' } = {}) {
    if (this.confirmOpen) return Promise.resolve(false);

    return new Promise((resolve) => {
      const { el } = this;
      this.confirmOpen = true;
      this.confirmResolve = resolve;
      this.confirmFocus = document.activeElement;
      el.confirmTitle.textContent = title;
      el.confirmBody.textContent = body;
      el.confirmOk.textContent = okText;
      el.confirmCancel.textContent = cancelText;
      el.confirmLayer.hidden = false;
      el.confirmLayer.setAttribute('aria-hidden', 'false');
      window.clearTimeout(this.confirmHideTimer);
      window.requestAnimationFrame(() => {
        window.requestAnimationFrame(() => el.confirmLayer.classList.add('is-open'));
      });
      window.setTimeout(() => el.confirmCancel.focus({ preventScroll: true }), 220);
    });
  }

  closeConfirm(result) {
    if (!this.confirmOpen) return;
    const { el } = this;
    this.confirmOpen = false;
    el.confirmLayer.classList.remove('is-open');
    el.confirmLayer.setAttribute('aria-hidden', 'true');
    this.confirmHideTimer = window.setTimeout(() => {
      el.confirmLayer.hidden = true;
    }, 300);

    if (this.confirmFocus instanceof HTMLElement && document.contains(this.confirmFocus)) {
      this.confirmFocus.focus({ preventScroll: true });
    }

    const resolve = this.confirmResolve;
    this.confirmResolve = null;
    resolve?.(result);
  }

  resetQuizView() {
    const { el } = this;
    this.activePoi = null;
    el.quizBlock.classList.remove('is-earned');
    el.quizState.textContent = '未完成';
    el.quizOptions.replaceChildren();
    el.quizFeedback.hidden = true;
    el.quizFeedback.className = 'quiz-feedback';
    el.badgeReward.hidden = true;
    el.sheetDoneLabel.textContent = '继续漫游';
  }

  openSystemLayer(layer, focusTarget) {
    layer.hidden = false;
    layer.setAttribute('aria-hidden', 'false');
    window.clearTimeout(this.layerHideTimer);
    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => layer.classList.add('is-open'));
    });
    window.setTimeout(() => focusTarget.focus({ preventScroll: true }), 320);
  }

  closeSystemLayer(layer) {
    layer.classList.remove('is-open');
    layer.setAttribute('aria-hidden', 'true');
    this.layerHideTimer = window.setTimeout(() => {
      layer.hidden = true;
    }, 360);
  }

  toast(message, duration = 2400) {
    const { toast } = this.el;
    toast.textContent = message;
    toast.classList.add('is-visible');
    window.clearTimeout(this.toastTimer);
    this.toastTimer = window.setTimeout(() => {
      toast.classList.remove('is-visible');
    }, duration);
  }

  restoreFocus() {
    const target = this.savedFocus;
    if (target instanceof HTMLElement && document.contains(target)) {
      target.focus({ preventScroll: true });
    } else {
      this.el.joystick.focus({ preventScroll: true });
    }
  }

  trapFocus(event, container) {
    if (event.key !== 'Tab') return;

    const focusable = Array.from(
      container.querySelectorAll(
        'button:not([disabled]), [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
      ),
    ).filter((element) => element.offsetParent !== null);

    if (focusable.length === 0) return;

    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    const active = document.activeElement;

    if (event.shiftKey && active === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && active === last) {
      event.preventDefault();
      first.focus();
    }
  }
}
