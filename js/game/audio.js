/* Original, locally synthesized score. No samples, downloads, or autoplay. */
const STORAGE_KEY = 'gundul-warrior-audio-v1';
const DEFAULTS = Object.freeze({ muted: false, volume: .35 });
const clamp = value => Math.max(0, Math.min(1, value));
const frequency = midi => 440 * 2 ** ((midi - 69) / 12);

// Three original 8-bar motifs: bright woodland march, spacious crystal waltz,
// and a resolute castle ostinato. Each number is a MIDI note; 0 is a rest.
const THEMES = {
  forest: {
    bpm: 108, wave: 'square', bass: [48, 48, 53, 53, 45, 45, 55, 55],
    melody: [72, 0, 76, 79, 76, 72, 74, 0, 77, 0, 81, 79, 77, 76, 74, 0,
      72, 76, 79, 84, 83, 79, 76, 0, 74, 77, 79, 71, 74, 0, 72, 0],
    harmony: [60, 64, 67, 64, 65, 69, 72, 69, 57, 60, 64, 60, 59, 62, 67, 62],
  },
  cave: {
    bpm: 84, wave: 'triangle', bass: [45, 45, 41, 41, 48, 48, 43, 40],
    melody: [81, 0, 76, 0, 79, 76, 72, 0, 77, 0, 72, 0, 76, 72, 69, 0,
      79, 0, 76, 0, 72, 74, 76, 0, 74, 0, 71, 0, 68, 71, 69, 0],
    harmony: [57, 60, 64, 60, 53, 57, 60, 57, 60, 64, 67, 64, 55, 59, 64, 59],
  },
  castle: {
    bpm: 124, wave: 'square', bass: [50, 50, 46, 46, 43, 43, 45, 45],
    melody: [74, 74, 0, 77, 81, 0, 79, 77, 74, 0, 77, 82, 81, 77, 0, 74,
      79, 79, 0, 82, 86, 82, 81, 79, 81, 0, 76, 73, 76, 0, 74, 0],
    harmony: [62, 65, 69, 65, 58, 62, 65, 62, 55, 58, 62, 58, 57, 61, 64, 61],
  },
};

function normalize(settings, fallback = DEFAULTS) {
  return {
    muted: typeof settings?.muted === 'boolean' ? settings.muted : fallback.muted,
    volume: typeof settings?.volume === 'number' && Number.isFinite(settings.volume) ? clamp(settings.volume) : fallback.volume,
  };
}
function readSettings() {
  try { return normalize(JSON.parse(globalThis.localStorage?.getItem(STORAGE_KEY) || 'null')); }
  catch { return { ...DEFAULTS }; }
}

export class GameAudio {
  constructor(settings) {
    this.settings = normalize(settings, readSettings());
    this.theme = 'forest';
    this.paused = false;
    this.context = null;
    this.master = null;
    this.music = null;
    this.timer = null;
    this.step = 0;
    this.nextNote = 0;
    this.voices = new Set();
    this.destroyed = false;
    this.unsupported = false;
  }

  /** Call from a user gesture. Unsupported or blocked Web Audio is a silent no-op. */
  async start() {
    if (this.destroyed || this.unsupported) return false;
    try {
      if (!this.context) {
        const AudioContext = globalThis.AudioContext || globalThis.webkitAudioContext;
        if (!AudioContext) { this.unsupported = true; return false; }
        this.context = new AudioContext();
        this.master = this.context.createGain();
        this.music = this.context.createGain();
        this.master.gain.value = this.settings.muted ? 0 : this.settings.volume * .5;
        this.music.gain.value = this.paused ? 0 : 1;
        this.music.connect(this.master);
        // Gentle headroom prevents combined voices from clipping.
        const compressor = this.context.createDynamicsCompressor();
        compressor.threshold.value = -12;
        compressor.knee.value = 12;
        compressor.ratio.value = 5;
        this.master.connect(compressor);
        compressor.connect(this.context.destination);
      }
      if (this.context.state === 'suspended') await this.context.resume();
      if (this.destroyed || this.context.state !== 'running') return false;
      if (!this.timer) {
        this.nextNote = this.context.currentTime + .04;
        this.timer = globalThis.setInterval(() => this.schedule(), 80);
        this.schedule();
      }
      return true;
    } catch { return false; }
  }

  setSettings(settings = {}) {
    this.settings = normalize(settings, this.settings);
    try { globalThis.localStorage?.setItem(STORAGE_KEY, JSON.stringify(this.settings)); }
    catch { /* Audio preferences must never interfere with game saves. */ }
    if (this.context && this.master) {
      try {
        const now = this.context.currentTime;
        this.master.gain.cancelScheduledValues(now);
        this.master.gain.setTargetAtTime(this.settings.muted ? 0 : this.settings.volume * .5, now, .025);
      } catch { /* Context may have been closed by the browser. */ }
    }
    return { ...this.settings };
  }

  setPaused(paused) {
    this.paused = Boolean(paused);
    if (!this.context) return;
    try {
      const now = this.context.currentTime;
      this.music.gain.cancelScheduledValues(now);
      this.music.gain.setTargetAtTime(this.paused ? 0 : 1, now, .025);
      this.clearMusic();
      this.nextNote = now + .05;
    } catch { /* Nonessential audio stays fail-safe. */ }
  }

  /** Accepts forest/cave/castle, menu/home, victory, or the zero-based level index. */
  setTheme(theme) {
    const aliases = { 0: 'forest', 1: 'cave', 2: 'castle', menu: 'forest', home: 'forest', victory: 'forest' };
    const next = THEMES[theme] ? theme : aliases[theme] || 'forest';
    if (next === this.theme) return;
    this.theme = next;
    this.step = 0;
    this.clearMusic();
    if (this.context) this.nextNote = this.context.currentTime + .04;
  }

  clearMusic() {
    for (const voice of this.voices) {
      if (voice.music) {
        try { voice.osc.stop(); } catch { /* Already ended. */ }
        this.voices.delete(voice);
      }
    }
  }

  schedule() {
    if (!this.context || this.context.state !== 'running' || this.destroyed) return;
    const now = this.context.currentTime;
    if (this.paused || this.settings.muted || this.settings.volume === 0) {
      this.nextNote = now + .05;
      return;
    }
    if (this.nextNote < now) this.nextNote = now + .025;
    const motif = THEMES[this.theme];
    const beat = 60 / motif.bpm / 2;
    try {
      while (this.nextNote < now + .2) {
        const step = this.step % motif.melody.length;
        const time = this.nextNote;
        const note = motif.melody[step];
        if (note) this.tone(note, time, beat * .68, motif.wave, .105, true);
        if (step % 2 === 0) this.tone(motif.bass[Math.floor(step / 4)], time, beat * 1.45, 'triangle', .16, true);
        if (step % 2 === 1) this.tone(motif.harmony[Math.floor(step / 2)], time, beat * .4, 'square', .027, true);
        // A pitched click supplies the quiet rhythmic pulse without random samples.
        if (step % 4 === 0) this.tone(36, time, .055, 'triangle', .14, true, 24);
        this.step++;
        this.nextNote += beat;
      }
    } catch { /* Devices can revoke or suspend an audio context at any time. */ }
  }

  tone(note, time, duration = .12, type = 'square', volume = .12, music = false, endNote) {
    if (!this.context || this.destroyed || this.voices.size > 80) return;
    const osc = this.context.createOscillator();
    const envelope = this.context.createGain();
    const voice = { osc, music };
    osc.type = type;
    osc.frequency.setValueAtTime(frequency(note), time);
    if (endNote !== undefined) osc.frequency.exponentialRampToValueAtTime(frequency(endNote), time + duration);
    envelope.gain.setValueAtTime(0, time);
    envelope.gain.linearRampToValueAtTime(volume, time + .006);
    envelope.gain.setValueAtTime(volume * .7, time + Math.max(.007, duration * .45));
    envelope.gain.exponentialRampToValueAtTime(.0001, time + duration);
    osc.connect(envelope);
    envelope.connect(music ? this.music : this.master);
    this.voices.add(voice);
    osc.onended = () => { osc.disconnect(); envelope.disconnect(); this.voices.delete(voice); };
    osc.start(time);
    osc.stop(time + duration + .025);
  }

  /** SFX: jump, coin, checkpoint, machine, key, victory; aliases cover common events. */
  play(name) {
    if (!this.context || this.context.state !== 'running' || this.destroyed || this.settings.muted) return;
    const aliases = { correct: 'machine', success: 'machine', solve: 'machine', collect: 'coin', win: 'victory', click: 'menu', wrong: 'error' };
    name = aliases[name] || name;
    const now = this.context.currentTime + .005;
    const notes = (sequence, spacing = .085, duration = .14, type = 'square', volume = .15) => {
      sequence.forEach((note, index) => this.tone(note, now + index * spacing, duration, type, volume));
    };
    try {
      switch (name) {
        case 'jump': this.tone(53, now, .15, 'square', .105, false, 77); break;
        case 'coin': notes([88, 95], .055, .1, 'square', .11); break;
        case 'checkpoint': notes([67, 72, 76, 79], .075, .2, 'triangle', .24); break;
        case 'machine': notes([60, 67, 72, 76, 79], .055, .22, 'square', .12); break;
        case 'key': notes([79, 83, 86, 91, 95], .09, .26, 'triangle', .24); break;
        case 'victory':
          notes([72, 76, 79, 84, 0, 83, 86, 84].filter(Boolean), .13, .3, 'square', .12);
          [48, 55, 60].forEach((note, index) => this.tone(note, now + index * .26, .4, 'triangle', .17));
          break;
        case 'menu': notes([76, 79], .035, .07, 'square', .06); break;
        case 'error': notes([52, 49], .1, .13, 'triangle', .16); break;
        case 'fall': this.tone(65, now, .26, 'triangle', .15, false, 41); break;
        default: break;
      }
    } catch { /* Sound effects never block play or answer submission. */ }
  }

  destroy() {
    if (this.destroyed) return;
    this.destroyed = true;
    if (this.timer) globalThis.clearInterval(this.timer);
    this.timer = null;
    for (const { osc } of this.voices) { try { osc.stop(); } catch { /* Already ended. */ } }
    this.voices.clear();
    try { this.context?.close()?.catch(() => {}); } catch { /* Already closed. */ }
    this.context = null;
    this.master = null;
    this.music = null;
  }
}
