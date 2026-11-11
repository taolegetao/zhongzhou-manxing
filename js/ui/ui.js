/**
 * 页面 UI：开始页、发现进度、靠近提示、建筑介绍卡、帮助卡。
 * 这个文件只管“显示什么”，不负责游戏状态，方便以后换皮。
 */
export class UI {
  /**
   * @param {{
   *   totalPois?: number,
   *   onStart?: () => void,
   *   onPoiClose?: () => void,
   *   onHelpOpen?: () => void,
   *   onHelpClose?: () => void,
   *   onReset?: () => void,
   * }} callbacks
   */
  constructor(callbacks = {}) {
    this.callbacks = callbacks;
    this.totalPois = callbacks.totalPois ?? 2;
    const byId = (id) => {
      const element = document.getElementById(id);
      if (!element) throw new Error(`缺少页面元素：#${id}`);
      return element;
    };

    this.el = {
      startScreen: byId('startScreen'),
      startBtn: byId('startBtn'),
      startLabel: byId('startLabel'),
      startHelp: byId('startHelp'),
      helpBtn: byId('helpBtn'),
      foundChip: byId('foundChip'),
      foundCount: byId('foundCount'),
      foundTotal: byId('foundTotal'),
      axisFill: byId('axisFill'),
      axisPin: byId('axisPin'),
      axisPercent: byId('axisPercent'),
      nearHint: byId('nearHint'),
      nearText: byId('nearText'),
      joystick: byId('joystick'),
      resetBtn: byId('resetBtn'),
      toast: byId('toast'),
      sheetLayer: byId('sheetLayer'),
      poiSheet: byId('poiSheet'),
      sheetClose: byId('sheetClose'),
      sheetDone: byId('sheetDone'),
      sheetCover: byId('sheetCover'),
      sheetNo: byId('sheetNo'),
      sheetKicker: byId('sheetKicker'),
      sheetTitle: byId('sheetTitle'),
      sheetEn: byId('sheetEn'),
      sheetStamp: byId('sheetStamp'),
      sheetIntro: byId('sheetIntro'),
      sheetTags: byId('sheetTags'),
      sheetDetail: byId('sheetDetail'),
      sheetBody: byId('sheetBody'),
      helpLayer: byId('helpLayer'),
      helpClose: byId('helpClose'),
      helpDone: byId('helpDone'),
    };

    this.poiOpen = false;
    this.helpOpen = false;
    this.activePoi = null;
    this.lastFound = -1;
    this.lastProgress = -1;
    this.nearId = null;
    this.toastTimer = null;
    this.sheetHideTimer = null;
    this.sheetFocusTimer = null;
    this.savedFocus = null;
    this.poiGuardUntil = 0;

    this.bindEvents();
  }

  bindEvents() {
    const { el } = this;

    el.startBtn.addEventListener('click', () => {
      if (!el.startBtn.disabled) this.callbacks.onStart?.();
    });

    el.helpBtn.addEventListener('click', () => this.callbacks.onHelpOpen?.());
    el.resetBtn.addEventListener('click', () => this.callbacks.onReset?.());

    el.sheetClose.addEventListener('click', () => {
      if (this.canDismissPoi()) this.closePoi();
    });
    el.sheetDone.addEventListener('click', () => {
      if (this.canDismissPoi()) this.closePoi();
    });
    el.sheetLayer.querySelector('[data-close-sheet]')?.addEventListener('click', () => {
      if (this.canDismissPoi()) this.closePoi();
    });

    el.helpClose.addEventListener('click', () => this.closeHelp());
    el.helpDone.addEventListener('click', () => this.closeHelp());
    el.helpLayer.querySelector('[data-close-help]')?.addEventListener('click', () => this.closeHelp());

    document.addEventListener('keydown', (event) => {
      if (event.key !== 'Escape') return;
      if (this.poiOpen) {
        event.preventDefault();
        this.closePoi();
      } else if (this.helpOpen) {
        event.preventDefault();
        this.closeHelp();
      }
    });

    el.sheetLayer.addEventListener('keydown', (event) => this.trapFocus(event, el.poiSheet));
    el.helpLayer.addEventListener('keydown', (event) => this.trapFocus(event, el.helpLayer));
  }

  setLoading(progress) {
    this.el.startBtn.disabled = true;
    this.el.startLabel.textContent = `正在展开地图 · ${Math.round(progress * 100)}%`;
  }

  ready() {
    this.el.startBtn.disabled = false;
    this.el.startLabel.textContent = '开始漫游';
  }

  fail(message) {
    this.el.startBtn.disabled = true;
    this.el.startLabel.textContent = '加载未完成';
    this.el.startHelp.textContent = message;
    console.error('[中轴漫行]', message);
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

  setProgress(value) {
    const percent = Math.min(100, Math.max(0, value));
    this.el.axisFill.style.width = `${percent}%`;
    this.el.axisPin.style.left = `${percent}%`;
    const rounded = Math.round(percent);
    if (rounded !== this.lastProgress) {
      this.el.axisPercent.textContent = `中轴 ${rounded}%`;
      this.lastProgress = rounded;
    }
  }

  setNear(poi) {
    const id = poi?.id ?? null;
    if (id === this.nearId) return;
    this.nearId = id;

    if (!poi) {
      this.el.nearHint.hidden = true;
      return;
    }

    this.el.nearText.textContent = `轻触「${poi.name}」· 阅读中轴故事`;
    this.el.nearHint.hidden = false;
  }

  setFound(foundIds) {
    const count = foundIds.size;
    this.el.foundCount.textContent = String(count);
    this.el.foundTotal.textContent = `/ ${this.totalPois}`;
    this.el.foundChip.classList.toggle('is-complete', count >= this.totalPois);
    this.el.foundChip.title =
      count >= this.totalPois ? '中轴遗产点已全部收录' : `已发现 ${count} / ${this.totalPois} 处中轴遗产点`;

    if (count !== this.lastFound && this.lastFound >= 0) {
      this.el.foundChip.classList.remove('is-bump');
      void this.el.foundChip.offsetWidth;
      this.el.foundChip.classList.add('is-bump');
    }
    this.lastFound = count;
  }

  /**
   * @param {object} poi
   */
  openPoi(poi) {
    if (this.poiOpen) return;

    const { el } = this;
    this.activePoi = poi;
    this.poiOpen = true;
    this.poiGuardUntil = performance.now() + 420;
    this.savedFocus = document.activeElement;

    el.sheetNo.textContent = `${poi.no} / ${String(this.totalPois).padStart(2, '0')}`;
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

    el.sheetLayer.hidden = false;
    el.sheetLayer.setAttribute('aria-hidden', 'false');
    window.clearTimeout(this.sheetHideTimer);
    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => {
        el.sheetLayer.classList.add('is-open');
      });
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
        if (index < detail.items.length - 1) {
          flow.append(document.createElement('i'));
        }
      });
      sheetDetail.append(flow);
    }
  }

  canDismissPoi() {
    // 触屏在 pointerup 后会补发一次 click。介绍卡恰好在手指下方出现时，
    // 这次 click 会误触背景关闭，所以给刚打开的卡片一个很短的防误触窗口。
    return performance.now() >= this.poiGuardUntil;
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

  openHelp() {
    if (this.helpOpen) return;
    const { helpLayer, helpDone } = this.el;
    this.helpOpen = true;
    this.savedFocus = document.activeElement;
    helpLayer.hidden = false;
    helpLayer.setAttribute('aria-hidden', 'false');
    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => helpLayer.classList.add('is-open'));
    });
    window.setTimeout(() => helpDone.focus({ preventScroll: true }), 300);
  }

  closeHelp() {
    if (!this.helpOpen) return;
    this.helpOpen = false;
    const { helpLayer } = this.el;
    helpLayer.classList.remove('is-open');
    helpLayer.setAttribute('aria-hidden', 'true');
    window.setTimeout(() => {
      helpLayer.hidden = true;
    }, 340);
    this.callbacks.onHelpClose?.();
    this.restoreFocus();
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
