const KEY_ACTIONS = {
  ArrowLeft: 'left', KeyA: 'left',
  ArrowRight: 'right', KeyD: 'right',
  ArrowUp: 'jump', KeyW: 'jump', Space: 'jump',
  KeyE: 'interact',
};
const ACTIONS = new Set(['left', 'right', 'jump', 'interact']);
const editable = target => target?.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(target?.tagName || '');

/** Independent pointer/key sources keep simultaneous touch controls working. */
export class GameInput {
  constructor({ target = globalThis.window, controls = globalThis.document,
    onInteract = () => {}, onPause = () => {}, onBlur = () => {} } = {}) {
    this.target = target;
    this.controls = controls;
    this.onInteract = onInteract;
    this.onPause = onPause;
    this.onBlur = onBlur;
    this.sources = new Map();
    this.jumpPressed = false;
    this.paused = false;
    this.attached = false;
    this.handlers = {
      keydown: event => this.keyDown(event),
      keyup: event => this.release(`key:${event.code}`),
      blur: () => { this.clear(); this.onBlur(); },
      pointerdown: event => this.pointerDown(event),
      pointerup: event => this.release(`pointer:${event.pointerId}`),
      pointercancel: event => this.release(`pointer:${event.pointerId}`),
      lostpointercapture: event => this.release(`pointer:${event.pointerId}`),
    };
  }

  attach() {
    if (this.attached) return;
    this.attached = true;
    for (const name of ['keydown', 'keyup', 'blur', 'pointerup', 'pointercancel']) {
      this.target?.addEventListener(name, this.handlers[name]);
    }
    for (const name of ['pointerdown', 'lostpointercapture']) {
      this.controls?.addEventListener(name, this.handlers[name]);
    }
  }

  detach() {
    if (!this.attached) return;
    for (const name of ['keydown', 'keyup', 'blur', 'pointerup', 'pointercancel']) {
      this.target?.removeEventListener(name, this.handlers[name]);
    }
    for (const name of ['pointerdown', 'lostpointercapture']) {
      this.controls?.removeEventListener(name, this.handlers[name]);
    }
    this.attached = false;
    this.clear();
  }

  has(action) {
    return [...this.sources.values()].includes(action);
  }

  press(source, action) {
    if (this.paused || this.sources.has(source)) return;
    const wasHeld = this.has(action);
    this.sources.set(source, action);
    if (action === 'jump' && !wasHeld) this.jumpPressed = true;
    if (action === 'interact' && !wasHeld) this.onInteract();
  }

  release(source) {
    this.sources.delete(source);
  }

  keyDown(event) {
    if (this.paused) return;
    if (event.code === 'Escape') {
      event.preventDefault();
      if (!event.repeat) this.onPause();
      return;
    }
    if (editable(event.target) || /^(BUTTON|A)$/.test(event.target?.tagName || '')) return;
    const action = KEY_ACTIONS[event.code];
    if (!action) return;
    event.preventDefault();
    if (!event.repeat) this.press(`key:${event.code}`, action);
  }

  pointerDown(event) {
    const button = event.target?.closest?.('[data-control]');
    const action = button?.dataset.control;
    if (!ACTIONS.has(action) || (event.button !== undefined && event.button !== 0)) return;
    event.preventDefault();
    // Pointer capture routes release back to the control after a finger slides away.
    try { button.setPointerCapture?.(event.pointerId); } catch { /* Pointer already released. */ }
    this.press(`pointer:${event.pointerId}`, action);
  }

  sample() {
    const input = {
      axis: Number(this.has('right')) - Number(this.has('left')),
      jumpPressed: this.jumpPressed,
      jumpHeld: this.has('jump'),
    };
    this.jumpPressed = false;
    return input;
  }

  clear() {
    this.sources.clear();
    this.jumpPressed = false;
  }

  setPaused(paused) {
    this.paused = Boolean(paused);
    this.clear();
  }
}

export { GameInput as Input };
