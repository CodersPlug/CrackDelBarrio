// ================================================================
//  Crack del Barrio — Armá tu jugador argentino
//  Duolingo-style avatar creator for ~6yo kids
// ================================================================

const GW = 1024;
const GH = 576;
const VERSION = '1.0';
const SAVE_KEY = 'crackDelBarrio_v1';

// ── Palette ──────────────────────────────────────────────────
const SKIN_TONES = [0xffe0bd, 0xffcd94, 0xd4a574, 0xc68642, 0x8d5524, 0x4a2912];
const KIT_COLORS = [
  { name: 'Albiceleste', body: 0x75aadb, stripe: 0xffffff, shorts: 0x1a1a2e, socks: 0x75aadb },
  { name: 'Away dark',   body: 0x1a1a2e, stripe: 0x75aadb, shorts: 0x75aadb, socks: 0x1a1a2e },
  { name: 'Violeta',     body: 0x6b3fa0, stripe: 0xffffff, shorts: 0x2d1b69, socks: 0x6b3fa0 },
  { name: 'Rojo fuego',  body: 0xcc2200, stripe: 0xffffff, shorts: 0x111111, socks: 0xcc2200 },
  { name: 'Verde campo', body: 0x1a7a3c, stripe: 0xffffff, shorts: 0x111111, socks: 0x1a7a3c },
];
const BOOT_COLORS = [0xffd700, 0xff4400, 0x00aaff, 0xffffff, 0x111111, 0xff69b4];
const HAIR_STYLES = ['corto','rizado','largo','pelado','mohawk','colita'];
const HAIR_COLORS = [0x1a0a00, 0x3d1c02, 0x8b5e3c, 0xffd700, 0xff6600, 0xffffff];
const NUMBERS = Array.from({length: 99}, (_, i) => i + 1);
const NAMES = [
  'MESSI','MAC ALLISTER','DE PAUL','MARTÍNEZ','LAUTARO',
  'DYBALA','DI MARÍA','PAREDES','MOLINA','ACUÑA',
  'ROMERO','OTAMENDI','ALMADA','THIAGO','ENZO',
];
const ACCESSORIES = ['ninguno','vincha','cinta cap.','anteojos','guantes'];

// ── Default state ────────────────────────────────────────────
const DEFAULT = {
  skin: 0, kit: 0, boots: 0,
  hair: 0, hairColor: 0,
  number: 10, nameIdx: 0,
  accessory: 0,
};

// ── SFX ──────────────────────────────────────────────────────
const SFX = (() => {
  let ctx = null;
  const get = () => {
    if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
    return ctx;
  };
  const tone = (freq, fe, type, dur, vol) => {
    try {
      const c = get(), o = c.createOscillator(), g = c.createGain();
      o.connect(g); g.connect(c.destination);
      o.type = type || 'sine';
      o.frequency.setValueAtTime(freq, c.currentTime);
      if (fe) o.frequency.exponentialRampToValueAtTime(fe, c.currentTime + dur);
      g.gain.setValueAtTime(vol || 0.18, c.currentTime);
      g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + dur);
      o.start(c.currentTime); o.stop(c.currentTime + dur + 0.01);
    } catch(_) {}
  };
  return {
    pick:  () => tone(600, 800, 'sine', 0.08, 0.15),
    prev:  () => tone(500, 400, 'sine', 0.07, 0.12),
    save:  () => { tone(523,523,'sine',0.1,0.22); setTimeout(()=>tone(659,659,'sine',0.1,0.22),100); setTimeout(()=>tone(784,784,'sine',0.16,0.26),200); },
  };
})();

// ── Save / Load ───────────────────────────────────────────────
function loadState() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return { ...DEFAULT };
    return { ...DEFAULT, ...JSON.parse(raw) };
  } catch(_) { return { ...DEFAULT }; }
}
function saveState(s) {
  try { localStorage.setItem(SAVE_KEY, JSON.stringify(s)); } catch(_) {}
}

// ================================================================
//  DRAW PLAYER (pure Phaser Graphics — all procedural)
//  Draws onto a Phaser.GameObjects.Graphics at (cx, cy) = chest center
// ================================================================
function drawPlayer(g, cx, cy, s) {
  const skin   = SKIN_TONES[s.skin];
  const kit    = KIT_COLORS[s.kit];
  const boots  = BOOT_COLORS[s.boots];
  const hairC  = HAIR_COLORS[s.hairColor];

  // ── shadow ────────────────────────────────────────────────
  g.fillStyle(0x000000, 0.18);
  g.fillEllipse(cx, cy + 165, 110, 22);

  // ── legs ─────────────────────────────────────────────────
  // left leg
  g.fillStyle(kit.shorts);
  g.fillRect(cx - 28, cy + 80, 26, 42);
  g.fillStyle(kit.socks);
  g.fillRect(cx - 28, cy + 120, 26, 36);
  g.fillStyle(boots);
  g.fillRoundedRect(cx - 34, cy + 152, 34, 14, 5);

  // right leg
  g.fillStyle(kit.shorts);
  g.fillRect(cx + 2, cy + 80, 26, 42);
  g.fillStyle(kit.socks);
  g.fillRect(cx + 2, cy + 120, 26, 36);
  g.fillStyle(boots);
  g.fillRoundedRect(cx, cy + 152, 34, 14, 5);

  // ── shorts ────────────────────────────────────────────────
  g.fillStyle(kit.shorts);
  g.fillRoundedRect(cx - 30, cy + 72, 60, 20, 6);

  // ── kit body + stripes ────────────────────────────────────
  g.fillStyle(kit.body);
  g.fillRoundedRect(cx - 36, cy, 72, 80, 10);
  // vertical stripe(s)
  g.fillStyle(kit.stripe, 0.7);
  g.fillRect(cx - 10, cy, 20, 80);

  // number on back (shown as front for creator)
  const numStr = String(s.number);
  // (drawn via text in scene)

  // ── arms ──────────────────────────────────────────────────
  g.fillStyle(kit.body);
  g.fillRoundedRect(cx - 56, cy + 4, 22, 56, 8);
  g.fillRoundedRect(cx + 34, cy + 4, 22, 56, 8);
  g.fillStyle(skin);
  g.fillRoundedRect(cx - 54, cy + 54, 18, 22, 7);
  g.fillRoundedRect(cx + 36, cy + 54, 18, 22, 7);

  // ── neck + head ───────────────────────────────────────────
  g.fillStyle(skin);
  g.fillRect(cx - 8, cy - 12, 16, 14);
  g.fillCircle(cx, cy - 46, 36);

  // ── face ─────────────────────────────────────────────────
  // ears
  g.fillStyle(skin);
  g.fillCircle(cx - 34, cy - 48, 8);
  g.fillCircle(cx + 34, cy - 48, 8);
  // eyes white
  g.fillStyle(0xffffff);
  g.fillCircle(cx - 13, cy - 50, 7);
  g.fillCircle(cx + 13, cy - 50, 7);
  // pupils
  g.fillStyle(0x222222);
  g.fillCircle(cx - 12, cy - 49, 4);
  g.fillCircle(cx + 12, cy - 49, 4);
  // eye shine
  g.fillStyle(0xffffff);
  g.fillCircle(cx - 10, cy - 51, 2);
  g.fillCircle(cx + 14, cy - 51, 2);
  // smile
  g.lineStyle(3, 0x333333, 1);
  g.beginPath();
  g.arc(cx, cy - 38, 12, 0.2, Math.PI - 0.2, false);
  g.strokePath();
  // cheek blush
  g.fillStyle(0xffb3b3, 0.5);
  g.fillCircle(cx - 22, cy - 42, 6);
  g.fillCircle(cx + 22, cy - 42, 6);

  // ── hair ─────────────────────────────────────────────────
  drawHair(g, cx, cy, s.hair, hairC);

  // ── accessory ─────────────────────────────────────────────
  drawAccessory(g, cx, cy, s.accessory, hairC, skin);
}

function drawHair(g, cx, cy, style, color) {
  g.fillStyle(color);
  if (style === 0) { // corto
    g.fillRoundedRect(cx - 34, cy - 82, 68, 22, { tl:14, tr:14, bl:0, br:0 });
    g.fillRect(cx - 34, cy - 64, 8, 10);
    g.fillRect(cx + 26, cy - 64, 8, 10);
  } else if (style === 1) { // rizado
    for (let i = -3; i <= 3; i++) {
      g.fillCircle(cx + i * 10, cy - 80 + Math.abs(i) * 3, 12);
    }
  } else if (style === 2) { // largo
    g.fillRoundedRect(cx - 34, cy - 82, 68, 22, { tl:14, tr:14, bl:0, br:0 });
    g.fillRoundedRect(cx - 36, cy - 64, 14, 60, 6);
    g.fillRoundedRect(cx + 22, cy - 64, 14, 60, 6);
  } else if (style === 3) { // pelado
    g.fillStyle(0x000000, 0); // nothing
  } else if (style === 4) { // mohawk
    g.fillRoundedRect(cx - 8, cy - 100, 16, 40, 5);
  } else if (style === 5) { // colita
    g.fillRoundedRect(cx - 34, cy - 82, 68, 22, { tl:14, tr:14, bl:0, br:0 });
    g.fillCircle(cx + 38, cy - 72, 10);
    g.fillRect(cx + 30, cy - 76, 12, 20);
  }
}

function drawAccessory(g, cx, cy, acc, hairC, skin) {
  if (acc === 0) return; // ninguno
  if (acc === 1) { // vincha
    g.fillStyle(0xffffff);
    g.fillRoundedRect(cx - 36, cy - 70, 72, 12, 6);
  } else if (acc === 2) { // cinta capitán
    g.fillStyle(0xffd700);
    g.fillRoundedRect(cx + 30, cy + 28, 26, 10, 4);
    g.lineStyle(2, 0xcc9900, 1);
    g.strokeRoundedRect(cx + 30, cy + 28, 26, 10, 4);
  } else if (acc === 3) { // anteojos
    g.lineStyle(3, 0x333333, 1);
    g.strokeCircle(cx - 13, cy - 50, 9);
    g.strokeCircle(cx + 13, cy - 50, 9);
    g.beginPath(); g.moveTo(cx - 4, cy - 50); g.lineTo(cx + 4, cy - 50); g.strokePath();
    g.beginPath(); g.moveTo(cx - 34, cy - 50); g.lineTo(cx - 22, cy - 50); g.strokePath();
    g.beginPath(); g.moveTo(cx + 22, cy - 50); g.lineTo(cx + 34, cy - 50); g.strokePath();
  } else if (acc === 4) { // guantes
    g.fillStyle(0xffffff);
    g.fillRoundedRect(cx - 56, cy + 54, 20, 24, 8);
    g.fillRoundedRect(cx + 36, cy + 54, 20, 24, 8);
  }
}

// ================================================================
//  CREATOR SCENE
// ================================================================
class CreatorScene extends Phaser.Scene {
  constructor() { super('CreatorScene'); }

  create() {
    this.state = loadState();
    this._dirty = false;

    this._buildBackground();
    this._buildPlayerGraphics();
    this._buildHUD();
    this._buildCategoryTabs();
    this._buildPanel();
    this._redraw();
  }

  // ── Background ─────────────────────────────────────────────
  _buildBackground() {
    // pitch green
    this.add.rectangle(GW / 2, GH / 2, GW, GH, 0x1a7a3c);
    // centre circle
    this.add.circle(GW / 2, GH / 2, 120, 0x157030);
    this.add.circle(GW / 2, GH / 2, 120, 0x000000, 0).setStrokeStyle(3, 0x2a9a50, 0.6);
    // halfway line
    this.add.line(0, 0, GW / 2, 0, GW / 2, GH, 0x2a9a50, 0.5);
    // grass stripes (decorative)
    for (let i = 0; i < 8; i++) {
      const x = i * GW / 8;
      this.add.rectangle(x + GW / 16, GH / 2, GW / 8 - 1, GH, i % 2 === 0 ? 0x1a7a3c : 0x157030);
    }
    // title top
    const title = this.add.text(GW / 2, 28, '⚽  Crack del Barrio', {
      fontSize: '28px', fontFamily: 'Arial Black, sans-serif',
      color: '#ffffff', stroke: '#000000', strokeThickness: 5,
    }).setOrigin(0.5);
    // version
    this.add.text(8, GH - 6, 'v' + VERSION, {
      fontSize: '12px', fontFamily: 'monospace', color: '#ffffff55',
    }).setOrigin(0, 1);
  }

  // ── Player graphics object ──────────────────────────────────
  _buildPlayerGraphics() {
    // player area: left 40% of canvas
    this.playerX = 220;
    this.playerY = GH / 2 + 30;
    this.playerG = this.add.graphics();
    this.numberText = this.add.text(this.playerX, this.playerY + 30, '10', {
      fontSize: '22px', fontFamily: 'Arial Black, sans-serif',
      color: '#ffffff', stroke: '#000000', strokeThickness: 4,
    }).setOrigin(0.5).setDepth(10);
    this.nameText = this.add.text(this.playerX, this.playerY + 120, 'MESSI', {
      fontSize: '16px', fontFamily: 'Arial Black, sans-serif',
      color: '#ffd700', stroke: '#000000', strokeThickness: 4,
    }).setOrigin(0.5).setDepth(10);
  }

  // ── HUD: save button ────────────────────────────────────────
  _buildHUD() {
    const saveBtn = this.add.rectangle(GW - 80, 28, 130, 40, 0xffd700, 1)
      .setStrokeStyle(2, 0x000000, 0.4)
      .setInteractive({ useHandCursor: true });
    this.add.text(GW - 80, 28, '💾 Guardar', {
      fontSize: '18px', fontFamily: 'Arial Black, sans-serif', color: '#1a1a1a',
    }).setOrigin(0.5).setDepth(5);
    saveBtn.on('pointerdown', () => {
      saveState(this.state);
      SFX.save();
      this._showSavedFeedback();
    });
    this.tweens.add({ targets: saveBtn, scaleX: 1.04, duration: 700, yoyo: true, repeat: -1 });
  }

  _showSavedFeedback() {
    const t = this.add.text(GW / 2, GH / 2, '¡Guardado! ⭐', {
      fontSize: '38px', fontFamily: 'Arial Black, sans-serif',
      color: '#ffd700', stroke: '#000000', strokeThickness: 6,
    }).setOrigin(0.5).setAlpha(0).setDepth(100);
    this.tweens.add({
      targets: t, alpha: 1, y: GH / 2 - 30, duration: 350,
      yoyo: true, hold: 600,
      onComplete: () => t.destroy(),
    });
  }

  // ── Category tabs ───────────────────────────────────────────
  _buildCategoryTabs() {
    // Categories shown as icon tabs on the right panel top
    this.CATS = [
      { id: 'skin',      icon: '🎨', label: 'Piel' },
      { id: 'kit',       icon: '👕', label: 'Camiseta' },
      { id: 'number',    icon: '#️⃣',  label: 'Número' },
      { id: 'name',      icon: '✍️',  label: 'Nombre' },
      { id: 'hair',      icon: '💇',  label: 'Cabello' },
      { id: 'hairColor', icon: '🖌️',  label: 'Color' },
      { id: 'boots',     icon: '👟',  label: 'Botines' },
      { id: 'accessory', icon: '⭐',  label: 'Extra' },
    ];
    this.activeCat = 'kit';
    this.tabObjs = [];

    const panelX = 430;
    const tabY = 68;
    const tabW = 72;
    const tabH = 54;
    const cols = 4;

    this.CATS.forEach((cat, i) => {
      const col = i % cols;
      const row = Math.floor(i / cols);
      const x = panelX + col * (tabW + 6) + tabW / 2;
      const y = tabY + row * (tabH + 6) + tabH / 2;

      const bg = this.add.rectangle(x, y, tabW, tabH, 0x000000, 0.35)
        .setStrokeStyle(2, 0xffffff, 0.3)
        .setInteractive({ useHandCursor: true });

      const icon = this.add.text(x, y - 8, cat.icon, { fontSize: '22px' }).setOrigin(0.5).setDepth(2);
      const lbl  = this.add.text(x, y + 14, cat.label, {
        fontSize: '11px', fontFamily: 'Arial, sans-serif', color: '#ffffff',
      }).setOrigin(0.5).setDepth(2);

      bg.on('pointerdown', () => {
        this.activeCat = cat.id;
        this._refreshTabs();
        this._buildPanel();
        SFX.pick();
      });

      this.tabObjs.push({ bg, icon, lbl, cat });
    });

    this._refreshTabs();
  }

  _refreshTabs() {
    this.tabObjs.forEach(({ bg, cat }) => {
      const active = cat.id === this.activeCat;
      bg.setFillStyle(active ? 0xffd700 : 0x000000, active ? 0.9 : 0.35);
      bg.setStrokeStyle(2, active ? 0xffd700 : 0xffffff, active ? 1 : 0.3);
    });
  }

  // ── Option panel (changes per category) ────────────────────
  _buildPanel() {
    if (this.panelContainer) this.panelContainer.destroy(true);
    this.panelContainer = this.add.container(0, 0);

    const panelX = 430;
    const panelY = 210;
    const panelW = GW - panelX - 20;
    const panelH = GH - panelY - 20;

    const bg = this.add.rectangle(
      panelX + panelW / 2, panelY + panelH / 2,
      panelW, panelH, 0x000000, 0.45
    ).setStrokeStyle(2, 0xffffff, 0.2);
    this.panelContainer.add(bg);

    const cat = this.activeCat;

    if (cat === 'skin') {
      this._buildSwatchPanel(panelX + 24, panelY + 20, SKIN_TONES, 'skin', 56, 56);
    } else if (cat === 'kit') {
      this._buildKitPanel(panelX + 20, panelY + 16, panelW - 40);
    } else if (cat === 'number') {
      this._buildNumberPanel(panelX + 20, panelY + 16, panelW - 40);
    } else if (cat === 'name') {
      this._buildNamePanel(panelX + 20, panelY + 16, panelW - 40);
    } else if (cat === 'hair') {
      this._buildHairStylePanel(panelX + 20, panelY + 16, panelW - 40);
    } else if (cat === 'hairColor') {
      this._buildSwatchPanel(panelX + 24, panelY + 20, HAIR_COLORS, 'hairColor', 56, 56);
    } else if (cat === 'boots') {
      this._buildSwatchPanel(panelX + 24, panelY + 20, BOOT_COLORS, 'boots', 56, 56);
    } else if (cat === 'accessory') {
      this._buildAccessoryPanel(panelX + 20, panelY + 16, panelW - 40);
    }
  }

  _buildSwatchPanel(x0, y0, colors, stateKey, w, h) {
    const perRow = 4;
    colors.forEach((color, i) => {
      const col = i % perRow;
      const row = Math.floor(i / perRow);
      const x = x0 + col * (w + 12) + w / 2;
      const y = y0 + row * (h + 12) + h / 2;
      const sel = this.state[stateKey] === i;
      const sw = this.add.rectangle(x, y, w, h, color)
        .setStrokeStyle(sel ? 5 : 2, sel ? 0xffd700 : 0xffffff, sel ? 1 : 0.4)
        .setInteractive({ useHandCursor: true });
      if (sel) {
        this.add.text(x, y, '✓', {
          fontSize: '24px', color: '#ffffff', stroke: '#000000', strokeThickness: 4,
        }).setOrigin(0.5).setDepth(5);
      }
      sw.on('pointerdown', () => {
        this.state[stateKey] = i;
        SFX.pick();
        this._buildPanel();
        this._redraw();
      });
      this.panelContainer.add(sw);
    });
  }

  _buildKitPanel(x0, y0, w) {
    KIT_COLORS.forEach((kit, i) => {
      const y = y0 + i * 52 + 20;
      const sel = this.state.kit === i;
      const row = this.add.rectangle(x0 + w / 2, y, w, 44, sel ? 0xffd700 : 0xffffff, sel ? 0.25 : 0.08)
        .setStrokeStyle(sel ? 3 : 1, sel ? 0xffd700 : 0xffffff, sel ? 1 : 0.3)
        .setInteractive({ useHandCursor: true });
      // colour swatch
      this.add.rectangle(x0 + 24, y, 30, 30, kit.body).setStrokeStyle(2, 0xffffff, 0.5);
      this.add.rectangle(x0 + 60, y, 30, 30, kit.stripe).setStrokeStyle(2, 0xaaaaaa, 0.4);
      this.add.text(x0 + 90, y, kit.name, {
        fontSize: '16px', fontFamily: 'Arial, sans-serif', color: sel ? '#ffd700' : '#ffffff',
      }).setOrigin(0, 0.5);
      if (sel) this.add.text(x0 + w - 10, y, '✓', {
        fontSize: '22px', color: '#ffd700', stroke: '#000000', strokeThickness: 3,
      }).setOrigin(1, 0.5);
      row.on('pointerdown', () => {
        this.state.kit = i; SFX.pick(); this._buildPanel(); this._redraw();
      });
      this.panelContainer.add(row);
    });
  }

  _buildNumberPanel(x0, y0, w) {
    // Large number display + ◀ ▶ arrows
    const cx = x0 + w / 2;
    const num = this.state.number;
    const numT = this.add.text(cx, y0 + 60, String(num), {
      fontSize: '80px', fontFamily: 'Arial Black, sans-serif',
      color: '#ffd700', stroke: '#000000', strokeThickness: 8,
    }).setOrigin(0.5).setDepth(5);
    this.panelContainer.add(numT);

    const prev = this.add.circle(cx - 80, y0 + 60, 34, 0xffffff, 0.2)
      .setStrokeStyle(2, 0xffffff, 0.5).setInteractive({ useHandCursor: true });
    this.add.text(cx - 80, y0 + 60, '◀', { fontSize: '26px', color: '#ffffff' }).setOrigin(0.5).setDepth(5);
    const next = this.add.circle(cx + 80, y0 + 60, 34, 0xffffff, 0.2)
      .setStrokeStyle(2, 0xffffff, 0.5).setInteractive({ useHandCursor: true });
    this.add.text(cx + 80, y0 + 60, '▶', { fontSize: '26px', color: '#ffffff' }).setOrigin(0.5).setDepth(5);
    this.panelContainer.add([prev, next]);

    const hint = this.add.text(cx, y0 + 130, 'Elegí tu número', {
      fontSize: '15px', fontFamily: 'Arial, sans-serif', color: '#ffffff88',
    }).setOrigin(0.5);
    this.panelContainer.add(hint);

    // quick-pick: 1,7,9,10,11
    const favNums = [1, 7, 9, 10, 11];
    favNums.forEach((n, i) => {
      const bx = cx - 100 + i * 50;
      const by = y0 + 170;
      const b = this.add.circle(bx, by, 20, n === num ? 0xffd700 : 0xffffff, n === num ? 0.9 : 0.15)
        .setStrokeStyle(2, 0xffffff, 0.4).setInteractive({ useHandCursor: true });
      this.add.text(bx, by, String(n), {
        fontSize: '16px', fontFamily: 'Arial Black', color: n === num ? '#1a1a1a' : '#ffffff',
      }).setOrigin(0.5).setDepth(5);
      b.on('pointerdown', () => {
        this.state.number = n; SFX.pick(); this._buildPanel(); this._redraw();
      });
      this.panelContainer.add(b);
    });

    prev.on('pointerdown', () => {
      this.state.number = this.state.number > 1 ? this.state.number - 1 : 99;
      SFX.prev(); this._buildPanel(); this._redraw();
    });
    next.on('pointerdown', () => {
      this.state.number = this.state.number < 99 ? this.state.number + 1 : 1;
      SFX.pick(); this._buildPanel(); this._redraw();
    });
  }

  _buildNamePanel(x0, y0, w) {
    const cx = x0 + w / 2;
    // current name big
    const curName = NAMES[this.state.nameIdx];
    this.add.text(cx, y0 + 30, curName, {
      fontSize: '28px', fontFamily: 'Arial Black, sans-serif',
      color: '#ffd700', stroke: '#000000', strokeThickness: 5,
    }).setOrigin(0.5).setDepth(5);

    // scrollable name list
    const visCount = 6;
    const startIdx = Math.max(0, Math.min(this.state.nameIdx - 2, NAMES.length - visCount));
    for (let i = 0; i < visCount; i++) {
      const idx = startIdx + i;
      if (idx >= NAMES.length) break;
      const y = y0 + 80 + i * 40;
      const sel = idx === this.state.nameIdx;
      const row = this.add.rectangle(cx, y, w - 20, 34, sel ? 0xffd700 : 0xffffff, sel ? 0.25 : 0.08)
        .setStrokeStyle(sel ? 3 : 1, sel ? 0xffd700 : 0xffffff, sel ? 1 : 0.2)
        .setInteractive({ useHandCursor: true });
      this.add.text(cx, y, NAMES[idx], {
        fontSize: '16px', fontFamily: 'Arial, sans-serif', color: sel ? '#ffd700' : '#ffffff',
      }).setOrigin(0.5).setDepth(5);
      row.on('pointerdown', () => {
        this.state.nameIdx = idx; SFX.pick(); this._buildPanel(); this._redraw();
      });
      this.panelContainer.add(row);
    }
  }

  _buildHairStylePanel(x0, y0, w) {
    const labels = ['Corto','Rizado','Largo','Pelado','Mohawk','Colita'];
    const perRow = 3;
    labels.forEach((lbl, i) => {
      const col = i % perRow;
      const row = Math.floor(i / perRow);
      const bw = (w - 20) / perRow - 8;
      const bh = 64;
      const x = x0 + col * (bw + 10) + bw / 2;
      const y = y0 + row * (bh + 10) + bh / 2;
      const sel = this.state.hair === i;
      const bg = this.add.rectangle(x, y, bw, bh, sel ? 0xffd700 : 0xffffff, sel ? 0.3 : 0.1)
        .setStrokeStyle(sel ? 3 : 1, sel ? 0xffd700 : 0xffffff, sel ? 1 : 0.3)
        .setInteractive({ useHandCursor: true });
      this.add.text(x, y, lbl, {
        fontSize: '14px', fontFamily: 'Arial Black, sans-serif',
        color: sel ? '#ffd700' : '#ffffff',
      }).setOrigin(0.5).setDepth(5);
      bg.on('pointerdown', () => {
        this.state.hair = i; SFX.pick(); this._buildPanel(); this._redraw();
      });
      this.panelContainer.add(bg);
    });
  }

  _buildAccessoryPanel(x0, y0, w) {
    ACCESSORIES.forEach((acc, i) => {
      const y = y0 + i * 52 + 20;
      const sel = this.state.accessory === i;
      const row = this.add.rectangle(x0 + w / 2, y, w, 44, sel ? 0xffd700 : 0xffffff, sel ? 0.25 : 0.08)
        .setStrokeStyle(sel ? 3 : 1, sel ? 0xffd700 : 0xffffff, sel ? 1 : 0.3)
        .setInteractive({ useHandCursor: true });
      const icons = ['—','🎽','🎖️','🕶️','🧤'];
      this.add.text(x0 + 30, y, icons[i], { fontSize: '22px' }).setOrigin(0.5).setDepth(5);
      this.add.text(x0 + 70, y, acc.charAt(0).toUpperCase() + acc.slice(1), {
        fontSize: '18px', fontFamily: 'Arial, sans-serif', color: sel ? '#ffd700' : '#ffffff',
      }).setOrigin(0, 0.5).setDepth(5);
      if (sel) this.add.text(x0 + w - 10, y, '✓', {
        fontSize: '22px', color: '#ffd700', stroke: '#000000', strokeThickness: 3,
      }).setOrigin(1, 0.5).setDepth(5);
      row.on('pointerdown', () => {
        this.state.accessory = i; SFX.pick(); this._buildPanel(); this._redraw();
      });
      this.panelContainer.add(row);
    });
  }

  // ── Redraw player ───────────────────────────────────────────
  _redraw() {
    this.playerG.clear();
    drawPlayer(this.playerG, this.playerX, this.playerY - 80, this.state);
    this.numberText.setText(String(this.state.number));
    this.nameText.setText(NAMES[this.state.nameIdx]);
    this._bounceName();
  }

  _bounceName() {
    this.tweens.add({
      targets: [this.numberText, this.nameText],
      scaleX: 1.18, scaleY: 1.18, duration: 110, yoyo: true,
    });
  }

  // ── Celebrate animation (tap player) ───────────────────────
  _celebrate() {
    const sparks = [];
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2;
      const col = [0xffd700, 0x75aadb, 0xffffff, 0xff6eb4][i % 4];
      const dot = this.add.circle(this.playerX, this.playerY - 80, 7, col);
      this.tweens.add({
        targets: dot,
        x: this.playerX + Math.cos(angle) * 80,
        y: this.playerY - 80 + Math.sin(angle) * 80,
        alpha: 0, duration: 500,
        onComplete: () => dot.destroy(),
      });
      sparks.push(dot);
    }
    this.tweens.add({ targets: this.playerG, scaleX: 1.12, scaleY: 1.12, duration: 120, yoyo: true });
  }
}

// ================================================================
//  BOOT
// ================================================================
new Phaser.Game({
  type: Phaser.AUTO,
  parent: 'game',
  backgroundColor: '#1a7a3c',
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: GW,
    height: GH,
  },
  scene: [CreatorScene],
  input: { activePointers: 1 },
});
