// ================================================================
//  Mi Avatar — v3.0
//  Creador de avatar estilo Duolingo. Guarda en codersplug_kid_avatar
//  (compartido con todos los juegos CodersPlug en el mismo origin).
// ================================================================

const GW = 1024;
const GH = 576;
const VERSION = '3.0';
const GAME_ID = 'miAvatar';
const PLAY_STORAGE_KEY = 'phaserlab_daily_plays';
const MAX_PLAYS_PER_DAY = 5;

const DailyPlays = {
  today() { return new Date().toISOString().slice(0, 10); },
  load() {
    const empty = { date: this.today(), count: 0, versions: {} };
    try {
      const raw = localStorage.getItem(PLAY_STORAGE_KEY);
      if (!raw) return empty;
      const data = JSON.parse(raw);
      if (!data.versions) data.versions = {};
      let dirty = false;
      if (data.date !== this.today()) { data.date = this.today(); data.count = 0; dirty = true; }
      // Migrate old crackDelBarrio version key
      if (data.versions[GAME_ID] !== VERSION && data.versions.crackDelBarrio) {
        delete data.versions.crackDelBarrio;
      }
      if (data.versions[GAME_ID] !== VERSION) { data.count = 0; data.versions[GAME_ID] = VERSION; dirty = true; }
      if (dirty) this.persist(data);
      return data;
    } catch (_) { return empty; }
  },
  persist(data) {
    if (!data.versions) data.versions = {};
    data.versions[GAME_ID] = VERSION;
    localStorage.setItem(PLAY_STORAGE_KEY, JSON.stringify(data));
  },
  remaining() { return Math.max(0, MAX_PLAYS_PER_DAY - this.load().count); },
  canPlay() { return this.remaining() > 0; },
  record() { const d = this.load(); d.count++; this.persist(d); },
  reset() { localStorage.removeItem(PLAY_STORAGE_KEY); },
};

const SFX = (() => {
  let ctx = null;
  const get = () => { if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)(); return ctx; };
  const tone = (f, fe, type, dur, vol) => {
    try {
      const c = get(), o = c.createOscillator(), g = c.createGain();
      o.connect(g); g.connect(c.destination);
      o.type = type || 'sine';
      o.frequency.setValueAtTime(f, c.currentTime);
      if (fe) o.frequency.exponentialRampToValueAtTime(fe, c.currentTime + dur);
      g.gain.setValueAtTime(vol || 0.16, c.currentTime);
      g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + dur);
      o.start(c.currentTime); o.stop(c.currentTime + dur + 0.01);
    } catch (_) {}
  };
  return {
    pick: () => tone(620, 880, 'sine', 0.07, 0.14),
    tab:  () => tone(440, 560, 'triangle', 0.06, 0.12),
  };
})();

const TABS = [
  { id: 'skin',      icon: '🖐️' },
  { id: 'hair',      icon: '💇' },
  { id: 'hairColor', icon: '🎨' },
  { id: 'eyes',      icon: '👀' },
  { id: 'mouth',     icon: '😊' },
  { id: 'top',       icon: '👕' },
  { id: 'accessory', icon: '🎀' },
];

// ── Daily limit ──────────────────────────────────────────────
class DailyLimitScene extends Phaser.Scene {
  constructor() { super('DailyLimitScene'); }
  create() {
    this.add.rectangle(GW / 2, GH / 2, GW, GH, 0x5b4fc7);
    this.add.rectangle(GW / 2, GH / 2, GW, GH, 0x000000, 0.25);
    const moon = this.add.text(GW / 2, GH / 2 - 100, '🌙', { fontSize: '96px' })
      .setOrigin(0.5).setInteractive();
    this.add.text(GW / 2, GH / 2 + 10, '¡Hasta mañana!', {
      fontSize: '44px', fontFamily: 'Arial Black', color: '#ffd700',
      stroke: '#3a2f8a', strokeThickness: 6,
    }).setOrigin(0.5);
    this.add.text(GW / 2, GH / 2 + 80, '😴', { fontSize: '48px' }).setOrigin(0.5);
    let hold = null;
    moon.on('pointerdown', () => {
      hold = this.time.delayedCall(3000, () => { DailyPlays.reset(); this.scene.start('BootScene'); });
    });
    const cancel = () => { if (hold) { hold.remove(); hold = null; } };
    moon.on('pointerup', cancel); moon.on('pointerout', cancel);
    this.add.text(8, GH - 6, 'v' + VERSION, {
      fontSize: '13px', fontFamily: 'monospace', color: '#ffffff44',
    }).setOrigin(0, 1);
  }
}

class BootScene extends Phaser.Scene {
  constructor() { super('BootScene'); }
  create() {
    if (!DailyPlays.canPlay()) { this.scene.start('DailyLimitScene'); return; }
    DailyPlays.record();
    this.scene.start('CreatorScene');
  }
}

// ── Creator (Duolingo-style) ─────────────────────────────────
class CreatorScene extends Phaser.Scene {
  constructor() { super('CreatorScene'); }

  create() {
    this.state = KidAvatar.load();
    this.tab = 'skin';
    this._panelItems = [];

    // Soft purple Duolingo-ish backdrop
    this.add.rectangle(GW / 2, GH / 2, GW, GH, 0x5b4fc7);
    this.add.rectangle(GW / 2, GH * 0.35, GW, GH * 0.5, 0x7b6fd8, 0.45);

    this.add.text(GW / 2, 28, '✨ Mi Avatar', {
      fontSize: '34px', fontFamily: 'Arial Black, sans-serif',
      color: '#ffd700', stroke: '#3a2f8a', strokeThickness: 6,
    }).setOrigin(0.5);

    // Left: big preview card
    this.add.rectangle(280, GH / 2 + 10, 420, 460, 0xffffff, 0.18)
      .setStrokeStyle(3, 0xffffff, 0.35);
    this.avatarG = this.add.graphics().setDepth(5);

    // Right: tools card
    this.add.rectangle(740, GH / 2 + 10, 460, 460, 0xffffff, 0.12)
      .setStrokeStyle(3, 0xffffff, 0.28);

    this._tabItems = [];
    this._buildPanel();
    this._redraw();

    // Save check indicator
    this.saveMark = this.add.text(GW - 24, 28, '', {
      fontSize: '28px', color: '#44dd66',
    }).setOrigin(1, 0.5).setDepth(40).setAlpha(0);

    // Version + parent reset
    const vl = this.add.text(8, GH - 6, 'v' + VERSION, {
      fontSize: '13px', fontFamily: 'monospace', color: '#ffffff55',
    }).setOrigin(0, 1).setInteractive();
    let hold = null;
    vl.on('pointerdown', () => {
      hold = this.time.delayedCall(3000, () => { DailyPlays.reset(); this.scene.start('BootScene'); });
    });
    const cancel = () => { if (hold) { hold.remove(); hold = null; } };
    vl.on('pointerup', cancel); vl.on('pointerout', cancel);

    // Remaining plays (tiny)
    const rem = DailyPlays.remaining();
    this.add.text(GW - 12, GH - 6, '⭐'.repeat(rem) + '☆'.repeat(MAX_PLAYS_PER_DAY - rem), {
      fontSize: '14px',
    }).setOrigin(1, 1);
  }

  _clearPanel() {
    this._panelItems.forEach(o => { if (o && o.destroy) o.destroy(); });
    this._panelItems = [];
  }

  _p(obj) { this._panelItems.push(obj); return obj; }

  _buildPanel() {
    this._clearPanel();
    // Rebuild tabs highlight by clearing and redrawing tabs area — simple: destroy old tab circles by rebuilding scene section
    // Tabs are recreated each time; clear previous tab objects by tracking? For simplicity redraw whole right header:
    // Actually tabs aren't in _panelItems. Recreate tabs by destroying children is hard.
    // Just rebuild panel options; tabs: destroy and rebuild via a group.
    // Easiest fix: on tab change, restart create partially — instead destroy all tab nodes stored.
    if (this._tabItems) this._tabItems.forEach(o => o.destroy());
    this._tabItems = [];
    const x0 = 530, y = 78, gap = 58;
    TABS.forEach((t, i) => {
      const x = x0 + i * gap;
      const sel = this.tab === t.id;
      const bg = this.add.circle(x, y, 24, sel ? 0xffd700 : 0xffffff, sel ? 1 : 0.2)
        .setStrokeStyle(2, sel ? 0xb8860b : 0xffffff, sel ? 1 : 0.35)
        .setInteractive({ useHandCursor: true }).setDepth(6);
      const ic = this.add.text(x, y, t.icon, { fontSize: '22px' }).setOrigin(0.5).setDepth(7);
      this._tabItems.push(bg, ic);
      bg.on('pointerdown', () => {
        SFX.tab();
        this.tab = t.id;
        this._buildPanel();
      });
    });

    const px = 540, py = 130, pw = 400;
    if (this.tab === 'skin') this._swatches(px, py, pw, KidAvatar.SKIN, this.state.skin, (i) => { this.state.skin = i; });
    else if (this.tab === 'hair') this._hairStyles(px, py, pw);
    else if (this.tab === 'hairColor') this._swatches(px, py, pw, KidAvatar.HAIR_COLORS, this.state.hairColor, (i) => { this.state.hairColor = i; });
    else if (this.tab === 'eyes') this._choiceRow(px, py, pw, KidAvatar.EYE_COUNT, this.state.eyes, ['👀', '＾＾', '⬤'], (i) => { this.state.eyes = i; });
    else if (this.tab === 'mouth') this._choiceRow(px, py, pw, KidAvatar.MOUTH_COUNT, this.state.mouth, ['◡', 'O', 'ω'], (i) => { this.state.mouth = i; });
    else if (this.tab === 'top') this._topSwatches(px, py, pw);
    else if (this.tab === 'accessory') this._choiceRow(px, py, pw, KidAvatar.ACC_COUNT, this.state.accessory, ['—', '🎀', '👓', '👑'], (i) => { this.state.accessory = i; });
  }

  _swatches(x0, y0, w, colors, selected, onPick) {
    const cols = 3;
    const bw = (w - (cols - 1) * 14) / cols;
    const bh = 70;
    colors.forEach((col, i) => {
      const c = i % cols, r = Math.floor(i / cols);
      const x = x0 + c * (bw + 14) + bw / 2;
      const y = y0 + r * (bh + 14) + bh / 2;
      const sel = selected === i;
      const b = this._p(this.add.rectangle(x, y, bw, bh, col, 1)
        .setStrokeStyle(sel ? 5 : 2, sel ? 0xffd700 : 0xffffff, sel ? 1 : 0.4)
        .setInteractive({ useHandCursor: true }).setDepth(5));
      if (sel) this._p(this.add.text(x, y, '✓', {
        fontSize: '28px', color: '#ffffff', stroke: '#000000', strokeThickness: 4,
      }).setOrigin(0.5).setDepth(6));
      b.on('pointerdown', () => { SFX.pick(); onPick(i); this._afterChange(); });
    });
  }

  _hairStyles(x0, y0, w) {
    const labels = ['✂', '🌀', '〰️', '➰', '🎀', '━━━━'];
    this._choiceRow(x0, y0, w, KidAvatar.HAIR_COUNT, this.state.hair, labels, (i) => { this.state.hair = i; });
  }

  _topSwatches(x0, y0, w) {
    const cols = 3;
    const bw = (w - (cols - 1) * 14) / cols;
    const bh = 70;
    KidAvatar.TOPS.forEach((top, i) => {
      const c = i % cols, r = Math.floor(i / cols);
      const x = x0 + c * (bw + 14) + bw / 2;
      const y = y0 + r * (bh + 14) + bh / 2;
      const sel = this.state.top === i;
      const b = this._p(this.add.rectangle(x, y, bw, bh, top.body, 1)
        .setStrokeStyle(sel ? 5 : 2, sel ? 0xffd700 : 0xffffff, sel ? 1 : 0.4)
        .setInteractive({ useHandCursor: true }).setDepth(5));
      this._p(this.add.circle(x, y, 12, top.accent, 1).setDepth(6));
      if (sel) this._p(this.add.text(x, y, '✓', {
        fontSize: '26px', color: '#1a1a1a', stroke: '#ffffff', strokeThickness: 3,
      }).setOrigin(0.5).setDepth(7));
      b.on('pointerdown', () => { SFX.pick(); this.state.top = i; this._afterChange(); });
    });
  }

  _choiceRow(x0, y0, w, count, selected, icons, onPick) {
    const cols = Math.min(3, count);
    const bw = (w - (cols - 1) * 14) / cols;
    const bh = 78;
    for (let i = 0; i < count; i++) {
      const c = i % cols, r = Math.floor(i / cols);
      const x = x0 + c * (bw + 14) + bw / 2;
      const y = y0 + r * (bh + 14) + bh / 2;
      const sel = selected === i;
      const b = this._p(this.add.rectangle(x, y, bw, bh, sel ? 0xffd700 : 0xffffff, sel ? 0.35 : 0.12)
        .setStrokeStyle(sel ? 4 : 2, sel ? 0xffd700 : 0xffffff, sel ? 1 : 0.3)
        .setInteractive({ useHandCursor: true }).setDepth(5));
      this._p(this.add.text(x, y, icons[i] || String(i + 1), {
        fontSize: '28px', color: '#ffffff',
      }).setOrigin(0.5).setDepth(6));
      b.on('pointerdown', () => { SFX.pick(); onPick(i); this._afterChange(); });
    }
  }

  _afterChange() {
    this._buildPanel();
    this._redraw();
    KidAvatar.save(this.state);
    this.saveMark.setText('✓');
    this.saveMark.setAlpha(1);
    this.tweens.add({ targets: this.saveMark, alpha: 0, delay: 600, duration: 400 });
  }

  _redraw() {
    this.avatarG.clear();
    KidAvatar.drawFull(this.avatarG, 280, GH / 2 + 20, 1.35, this.state);
  }
}

new Phaser.Game({
  type: Phaser.AUTO,
  parent: 'game',
  backgroundColor: '#5b4fc7',
  scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH, width: GW, height: GH },
  scene: [BootScene, CreatorScene, DailyLimitScene],
  input: { activePointers: 1 },
});
