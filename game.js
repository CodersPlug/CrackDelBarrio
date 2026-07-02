// ================================================================
//  Crack del Barrio — Armá tu jugador argentino  v2.0
//  5 jugadores reales, foto de referencia + avatar guardado por jugador
// ================================================================

const GW = 1024;
const GH = 576;
const VERSION = '2.4';
const SAVE_PREFIX = 'crackDelBarrio_v2_';
const LAST_PLAYER_KEY = 'crackDelBarrio_v2_lastPlayer';

// Real photos bundled locally (assets/players/) so the game works fully offline.
// Source: Wikimedia Commons, CC-licensed. See assets/players/CREDITS.txt for attribution.
const PLAYERS = [
  { key: 'messi',   name: 'MESSI',         number: 10, photo: 'assets/players/messi.jpg' },
  { key: 'dibu',    name: 'DIBU MARTÍNEZ', number: 23, photo: 'assets/players/dibu.jpg' },
  { key: 'paredes', name: 'PAREDES',       number: 5,  photo: 'assets/players/paredes.jpg' },
  { key: 'depaul',  name: 'DE PAUL',       number: 7,  photo: 'assets/players/depaul.jpg' },
  { key: 'lautaro', name: 'LAUTARO',       number: 22, photo: 'assets/players/lautaro.jpg' },
];

const SKIN_TONES  = [0xffe0bd, 0xffcd94, 0xd4a574, 0xc68642, 0x8d5524, 0x4a2912];
const KIT_COLORS  = [
  { name: 'Albiceleste', body: 0x75aadb, stripe: 0xffffff, shorts: 0x1a1a2e, socks: 0x75aadb },
  { name: 'Away azul',   body: 0x1a1a2e, stripe: 0x75aadb, shorts: 0x75aadb, socks: 0x1a1a2e },
  { name: 'Violeta',     body: 0x6b3fa0, stripe: 0xffffff, shorts: 0x2d1b69, socks: 0x6b3fa0 },
  { name: 'Rojo fuego',  body: 0xcc2200, stripe: 0xffffff, shorts: 0x111111, socks: 0xcc2200 },
  { name: 'Verde',       body: 0x1a7a3c, stripe: 0xffffff, shorts: 0x111111, socks: 0x1a7a3c },
];
const BOOT_COLORS = [0xffd700, 0xff4400, 0x00aaff, 0xffffff, 0x111111, 0xff69b4];
const HAIR_STYLES = ['Corto','Rizado','Largo','Pelado','Mohawk','Colita'];
const HAIR_COLORS = [0x1a0a00, 0x3d1c02, 0x8b5e3c, 0xffd700, 0xff6600, 0xffffff];
const ACCESSORIES = ['Ninguno','Vincha','Cap. Armband','Anteojos','Guantes'];
const ACC_ICONS   = ['—','🎽','🎖️','🕶️','🧤'];

const SFX = (() => {
  let ctx = null;
  const get = () => { if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)(); return ctx; };
  const tone = (f, fe, type, dur, vol) => {
    try {
      const c=get(), o=c.createOscillator(), g=c.createGain();
      o.connect(g); g.connect(c.destination);
      o.type = type||'sine';
      o.frequency.setValueAtTime(f, c.currentTime);
      if (fe) o.frequency.exponentialRampToValueAtTime(fe, c.currentTime+dur);
      g.gain.setValueAtTime(vol||0.18, c.currentTime);
      g.gain.exponentialRampToValueAtTime(0.001, c.currentTime+dur);
      o.start(c.currentTime); o.stop(c.currentTime+dur+0.01);
    } catch(_) {}
  };
  return {
    pick: () => tone(600, 800, 'sine', 0.08, 0.15),
    prev: () => tone(500, 400, 'sine', 0.07, 0.12),
  };
})();

// ── Per-player save/load ────────────────────────────────────────
function keyFor(playerKey) { return SAVE_PREFIX + playerKey; }

function loadPlayerState(playerKey, defaultNumber) {
  const base = { skin:0, kit:0, boots:0, hair:0, hairColor:0, accessory:0, number: defaultNumber };
  try {
    const r = localStorage.getItem(keyFor(playerKey));
    return r ? { ...base, ...JSON.parse(r) } : base;
  } catch(_) { return base; }
}
function savePlayerState(playerKey, s) {
  try { localStorage.setItem(keyFor(playerKey), JSON.stringify(s)); } catch(_) {}
}
function loadLastPlayerIdx() {
  try {
    const r = localStorage.getItem(LAST_PLAYER_KEY);
    const i = r ? parseInt(r, 10) : 0;
    return (i >= 0 && i < PLAYERS.length) ? i : 0;
  } catch(_) { return 0; }
}
function saveLastPlayerIdx(i) { try { localStorage.setItem(LAST_PLAYER_KEY, String(i)); } catch(_) {} }

// ── Draw player (Safari-safe: no fillPath/quadraticCurveTo) ─────
function drawPlayer(g, cx, cy, s) {
  const skin  = SKIN_TONES[s.skin];
  const kit   = KIT_COLORS[s.kit];
  const boots = BOOT_COLORS[s.boots];
  const hairC = HAIR_COLORS[s.hairColor];

  g.fillStyle(0x000000, 0.18); g.fillEllipse(cx, cy+165, 110, 22);

  g.fillStyle(kit.shorts); g.fillRect(cx-28, cy+80, 26, 42);
  g.fillStyle(kit.socks);  g.fillRect(cx-28, cy+120, 26, 36);
  g.fillStyle(boots);      g.fillRoundedRect(cx-34, cy+152, 34, 14, 5);

  g.fillStyle(kit.shorts); g.fillRect(cx+2, cy+80, 26, 42);
  g.fillStyle(kit.socks);  g.fillRect(cx+2, cy+120, 26, 36);
  g.fillStyle(boots);      g.fillRoundedRect(cx, cy+152, 34, 14, 5);

  g.fillStyle(kit.shorts); g.fillRoundedRect(cx-30, cy+72, 60, 20, 6);

  g.fillStyle(kit.body);   g.fillRoundedRect(cx-36, cy, 72, 80, 10);
  g.fillStyle(kit.stripe, 0.7); g.fillRect(cx-10, cy, 20, 80);

  g.fillStyle(kit.body);   g.fillRoundedRect(cx-56, cy+4, 22, 56, 8);
  g.fillStyle(kit.body);   g.fillRoundedRect(cx+34, cy+4, 22, 56, 8);
  g.fillStyle(skin);       g.fillRoundedRect(cx-54, cy+54, 18, 22, 7);
  g.fillStyle(skin);       g.fillRoundedRect(cx+36, cy+54, 18, 22, 7);

  g.fillStyle(skin); g.fillRect(cx-8, cy-12, 16, 14);
  g.fillStyle(skin); g.fillCircle(cx, cy-46, 36);

  g.fillStyle(skin); g.fillCircle(cx-34, cy-48, 8);
  g.fillStyle(skin); g.fillCircle(cx+34, cy-48, 8);

  g.fillStyle(0xffffff); g.fillCircle(cx-13, cy-50, 7); g.fillCircle(cx+13, cy-50, 7);
  g.fillStyle(0x222222); g.fillCircle(cx-12, cy-49, 4); g.fillCircle(cx+12, cy-49, 4);
  g.fillStyle(0xffffff); g.fillCircle(cx-10, cy-51, 2); g.fillCircle(cx+14, cy-51, 2);

  g.fillStyle(0x333333);
  g.fillRect(cx-10, cy-37, 3, 4);
  g.fillRect(cx+7,  cy-37, 3, 4);
  g.fillRect(cx-7,  cy-35, 14, 3);

  g.fillStyle(0xffb3b3, 0.5);
  g.fillCircle(cx-22, cy-42, 6); g.fillCircle(cx+22, cy-42, 6);

  if (s.hair === 0) {
    g.fillStyle(hairC);
    g.fillRoundedRect(cx-34, cy-82, 68, 22, { tl:14, tr:14, bl:0, br:0 });
    g.fillRect(cx-34, cy-64, 8, 10); g.fillRect(cx+26, cy-64, 8, 10);
  } else if (s.hair === 1) {
    g.fillStyle(hairC);
    for (let i=-3; i<=3; i++) g.fillCircle(cx+i*10, cy-80+Math.abs(i)*3, 12);
  } else if (s.hair === 2) {
    g.fillStyle(hairC);
    g.fillRoundedRect(cx-34, cy-82, 68, 22, { tl:14, tr:14, bl:0, br:0 });
    g.fillRoundedRect(cx-38, cy-66, 14, 64, 6);
    g.fillRoundedRect(cx+24, cy-66, 14, 64, 6);
  } else if (s.hair === 4) {
    g.fillStyle(hairC);
    g.fillRoundedRect(cx-8, cy-100, 16, 42, 5);
  } else if (s.hair === 5) {
    g.fillStyle(hairC);
    g.fillRoundedRect(cx-34, cy-82, 68, 22, { tl:14, tr:14, bl:0, br:0 });
    g.fillCircle(cx+42, cy-74, 10);
  }

  if (s.accessory === 1) {
    g.fillStyle(0xffffff); g.fillRoundedRect(cx-36, cy-68, 72, 11, 5);
  } else if (s.accessory === 2) {
    g.fillStyle(0xffd700); g.fillRoundedRect(cx+30, cy+28, 26, 10, 4);
  } else if (s.accessory === 3) {
    g.fillStyle(0x333333);
    g.fillRoundedRect(cx-24, cy-58, 20, 16, 4);
    g.fillRoundedRect(cx+4,  cy-58, 20, 16, 4);
    g.fillRect(cx-4, cy-52, 8, 4);
    g.fillRect(cx-40, cy-52, 16, 4);
    g.fillRect(cx+24, cy-52, 16, 4);
    g.fillStyle(0x88ccff, 0.35);
    g.fillRoundedRect(cx-24, cy-58, 20, 16, 4);
    g.fillRoundedRect(cx+4,  cy-58, 20, 16, 4);
  } else if (s.accessory === 4) {
    g.fillStyle(0xffffff);
    g.fillRoundedRect(cx-56, cy+54, 20, 24, 8);
    g.fillRoundedRect(cx+36, cy+54, 20, 24, 8);
  }
}

// ================================================================
//  CREATOR SCENE
// ================================================================
class CreatorScene extends Phaser.Scene {
  constructor() { super('CreatorScene'); }

  preload() {
    const loadingText = this.add.text(GW/2, GH/2, 'Cargando fotos...', {
      fontSize: '22px', fontFamily: 'Arial, sans-serif', color: '#ffffff',
    }).setOrigin(0.5);
    PLAYERS.forEach(p => this.load.image(p.key, p.photo));
    this.load.on('loaderror', (file) => console.warn('No se pudo cargar la foto de', file.key));
    this.load.once('complete', () => loadingText.destroy());
  }

  create() {
    this.playerIdx = loadLastPlayerIdx();
    this.state = loadPlayerState(PLAYERS[this.playerIdx].key, PLAYERS[this.playerIdx].number);

    this._buildBackground();
    this._buildPlayerArea();
    this._buildPlayerCarousel();
    this._buildHUD();
    this._buildTabs();
    this._panelItems = [];
    this._buildPanel();
    this._redraw();
  }

  // ── Background ──────────────────────────────────────────────
  _buildBackground() {
    for (let i = 0; i < 8; i++) {
      this.add.rectangle(i*GW/8 + GW/16, GH/2, GW/8-1, GH,
        i%2===0 ? 0x1a7a3c : 0x157030);
    }
    this.add.text(GW/2, 28, '⚽  Crack del Barrio', {
      fontSize: '26px', fontFamily: 'Arial Black, sans-serif',
      color: '#ffffff', stroke: '#000000', strokeThickness: 5,
    }).setOrigin(0.5);
    this.add.text(8, GH-6, 'v'+VERSION, {
      fontSize: '12px', fontFamily: 'monospace', color: '#ffffff55',
    }).setOrigin(0, 1);
  }

  // ── Player avatar (left side) ────────────────────────────────
  _buildPlayerArea() {
    this.playerX = 190;
    this.playerY = GH/2 + 34;

    this.add.rectangle(this.playerX, GH/2, 340, GH-10, 0x000000, 0.22)
      .setStrokeStyle(2, 0xffffff, 0.1);

    this.playerG = this.add.graphics();

    this.numberText = this.add.text(this.playerX, this.playerY-52, '10', {
      fontSize: '20px', fontFamily: 'Arial Black, sans-serif',
      color: '#ffffff', stroke: '#000000', strokeThickness: 4,
    }).setOrigin(0.5).setDepth(10);

    const hitZone = this.add.rectangle(this.playerX, this.playerY, 140, 280, 0xffffff, 0)
      .setInteractive({ useHandCursor: true });
    hitZone.on('pointerdown', () => this._celebrate());
  }

  // ── Player carousel: pinned at the top of the left column, ──
  // ── always visible so the reference photo never disappears. ──
  _buildPlayerCarousel() {
    const T = 54, gap = 10;
    const totalW = PLAYERS.length*T + (PLAYERS.length-1)*gap;
    const x0 = this.playerX - totalW/2;
    const y = 46;

    this.carouselObjs = [];
    PLAYERS.forEach((p, i) => {
      const cx = x0 + i*(T+gap) + T/2;
      const has = this.textures.exists(p.key);

      const glow = this.add.rectangle(cx, y, T+10, T+10, 0xffd700, 0.3).setDepth(3);

      let img;
      if (has) img = this.add.image(cx, y, p.key).setDisplaySize(T-6, T-6).setDepth(4);
      else {
        img = this.add.rectangle(cx, y, T-6, T-6, 0x333333).setDepth(4);
        this.add.text(cx, y, '⚽', { fontSize:'20px' }).setOrigin(0.5).setDepth(5);
      }

      const border = this.add.rectangle(cx, y, T, T)
        .setStrokeStyle(3, 0xffffff, 0.5).setDepth(5);

      const hit = this.add.rectangle(cx, y, T, T, 0xffffff, 0)
        .setInteractive({ useHandCursor: true });
      hit.on('pointerdown', () => { this._switchPlayer(i); SFX.pick(); });

      this.carouselObjs.push({ glow, border, idx: i });
    });

    this._refreshCarousel();
  }

  _refreshCarousel() {
    this.carouselObjs.forEach(({ glow, border, idx }) => {
      const sel = idx === this.playerIdx;
      glow.setVisible(sel);
      border.setStrokeStyle(sel?4:3, sel?0xffd700:0xffffff, sel?1:0.5);
    });
  }

  // ── Auto-save indicator (no button needed — every change saves) ──
  _buildHUD() {
    this.saveIndicator = this.add.text(GW-30, 28, '✓', {
      fontSize: '26px', fontFamily: 'Arial Black, sans-serif',
      color: '#44dd44', stroke: '#000000', strokeThickness: 4,
    }).setOrigin(0.5).setDepth(5).setAlpha(0);
  }

  _autoSave() {
    savePlayerState(PLAYERS[this.playerIdx].key, this.state);
    if (!this.saveIndicator) return;
    this.tweens.killTweensOf(this.saveIndicator);
    this.saveIndicator.setScale(1.5).setAlpha(1);
    this.tweens.add({ targets: this.saveIndicator, scale: 1, duration: 200, ease: 'Back.out' });
    this.tweens.add({ targets: this.saveIndicator, alpha: 0, delay: 600, duration: 400 });
  }

  // ── Category tabs (2 rows × 4) ──────────────────────────────
  _buildTabs() {
    this.CATS = [
      { id: 'skin',      icon: '🎨', label: 'Piel' },
      { id: 'kit',       icon: '👕', label: 'Camiseta' },
      { id: 'number',    icon: '🔢', label: 'Número' },
      { id: 'hair',      icon: '💇', label: 'Cabello' },
      { id: 'hairColor', icon: '🎭', label: 'Color' },
      { id: 'boots',     icon: '👟', label: 'Botines' },
      { id: 'accessory', icon: '⭐', label: 'Extra' },
    ];
    this.activeCat = 'kit';
    this.tabObjs = [];

    const TAB_X0 = 370;
    const TAB_Y0 = 55;
    const TW = 78, TH = 58, GAP = 5;

    this.CATS.forEach((cat, i) => {
      const col = i % 4, row = Math.floor(i / 4);
      const x = TAB_X0 + col*(TW+GAP) + TW/2;
      const y = TAB_Y0 + row*(TH+GAP) + TH/2;

      const bg = this.add.rectangle(x, y, TW, TH, 0x000000, 0.4)
        .setStrokeStyle(2, 0xffffff, 0.3).setInteractive({ useHandCursor: true });
      const ic = this.add.text(x, y-9, cat.icon, { fontSize: '20px' }).setOrigin(0.5).setDepth(2);
      const lb = this.add.text(x, y+13, cat.label, {
        fontSize: '11px', fontFamily: 'Arial, sans-serif', color: '#ffffff',
      }).setOrigin(0.5).setDepth(2);

      bg.on('pointerdown', () => {
        this.activeCat = cat.id;
        this._refreshTabs();
        this._buildPanel();
        SFX.pick();
      });
      this.tabObjs.push({ bg, ic, lb, cat });
    });
    this._refreshTabs();
  }

  _refreshTabs() {
    this.tabObjs.forEach(({ bg, cat }) => {
      const a = cat.id === this.activeCat;
      bg.setFillStyle(a ? 0xffd700 : 0x000000, a ? 0.9 : 0.4);
      bg.setStrokeStyle(2, a ? 0xffd700 : 0xffffff, a ? 1 : 0.3);
    });
  }

  // ── Panel — strictly manages its own objects ────────────────
  _clearPanel() {
    this._panelItems.forEach(o => { if (o && o.destroy) o.destroy(); });
    this._panelItems = [];
  }

  _p(obj) { this._panelItems.push(obj); return obj; }

  _buildPanel() {
    this._clearPanel();

    const PX = 370, PY = 190;
    const PW = GW - PX - 14, PH = GH - PY - 14;

    this._p(this.add.rectangle(PX+PW/2, PY+PH/2, PW, PH, 0x000000, 0.5)
      .setStrokeStyle(2, 0xffffff, 0.15));

    const cat = this.activeCat;
    if      (cat === 'skin')      this._buildSwatches(PX+16, PY+14, SKIN_TONES, 'skin');
    else if (cat === 'kit')       this._buildKitPanel(PX+14, PY+14, PW-28);
    else if (cat === 'number')    this._buildNumberPanel(PX+14, PY+14, PW-28);
    else if (cat === 'hair')      this._buildHairPanel(PX+14, PY+14, PW-28);
    else if (cat === 'hairColor') this._buildSwatches(PX+16, PY+14, HAIR_COLORS, 'hairColor');
    else if (cat === 'boots')     this._buildSwatches(PX+16, PY+14, BOOT_COLORS, 'boots');
    else if (cat === 'accessory') this._buildAccPanel(PX+14, PY+14, PW-28);
  }

  _switchPlayer(idx) {
    if (idx === this.playerIdx) return;
    savePlayerState(PLAYERS[this.playerIdx].key, this.state);
    this.playerIdx = idx;
    saveLastPlayerIdx(idx);
    this.state = loadPlayerState(PLAYERS[idx].key, PLAYERS[idx].number);
    this._refreshCarousel();
    this._redraw();
  }

  // colour swatches (skin / hair color / boots)
  _buildSwatches(x0, y0, colors, key) {
    const SW=60, GAP=10, PER_ROW=4;
    colors.forEach((c, i) => {
      const col=i%PER_ROW, row=Math.floor(i/PER_ROW);
      const x = x0 + col*(SW+GAP) + SW/2;
      const y = y0 + row*(SW+GAP) + SW/2;
      const sel = this.state[key] === i;
      const sw = this._p(this.add.rectangle(x, y, SW, SW, c)
        .setStrokeStyle(sel?5:2, sel?0xffd700:0xffffff, sel?1:0.4)
        .setInteractive({ useHandCursor: true }));
      if (sel) this._p(this.add.text(x, y, '✓', {
        fontSize:'22px', color:'#ffffff', stroke:'#000000', strokeThickness:4,
      }).setOrigin(0.5).setDepth(5));
      sw.on('pointerdown', () => {
        this.state[key]=i; SFX.pick(); this._buildPanel(); this._redraw();
      });
    });
  }

  _buildKitPanel(x0, y0, w) {
    KIT_COLORS.forEach((kit, i) => {
      const y = y0 + i*52 + 22;
      const sel = this.state.kit === i;
      this._p(this.add.rectangle(x0+w/2, y, w, 44,
        sel?0xffd700:0xffffff, sel?0.2:0.07)
        .setStrokeStyle(sel?3:1, sel?0xffd700:0xffffff, sel?1:0.25)
        .setInteractive({ useHandCursor: true }))
        .on('pointerdown', () => { this.state.kit=i; SFX.pick(); this._buildPanel(); this._redraw(); });
      this._p(this.add.rectangle(x0+20, y, 28, 28, kit.body).setStrokeStyle(1,0xffffff,0.4));
      this._p(this.add.rectangle(x0+54, y, 28, 28, kit.stripe).setStrokeStyle(1,0xaaaaaa,0.3));
      this._p(this.add.text(x0+80, y, kit.name, {
        fontSize:'15px', fontFamily:'Arial, sans-serif', color: sel?'#ffd700':'#ffffff',
      }).setOrigin(0, 0.5).setDepth(5));
      if (sel) this._p(this.add.text(x0+w-8, y, '✓', {
        fontSize:'20px', color:'#ffd700', stroke:'#000000', strokeThickness:3,
      }).setOrigin(1,0.5).setDepth(5));
    });
  }

  _buildNumberPanel(x0, y0, w) {
    const cx = x0 + w/2;
    const num = this.state.number;
    this._p(this.add.text(cx, y0+60, String(num), {
      fontSize:'78px', fontFamily:'Arial Black, sans-serif',
      color:'#ffd700', stroke:'#000000', strokeThickness:8,
    }).setOrigin(0.5).setDepth(5));

    const prev = this._p(this.add.circle(cx-90, y0+60, 32, 0xffffff, 0.18)
      .setStrokeStyle(2,0xffffff,0.5).setInteractive({ useHandCursor: true }));
    this._p(this.add.text(cx-90, y0+60, '◀', { fontSize:'24px', color:'#fff' }).setOrigin(0.5).setDepth(5));
    const nxt = this._p(this.add.circle(cx+90, y0+60, 32, 0xffffff, 0.18)
      .setStrokeStyle(2,0xffffff,0.5).setInteractive({ useHandCursor: true }));
    this._p(this.add.text(cx+90, y0+60, '▶', { fontSize:'24px', color:'#fff' }).setOrigin(0.5).setDepth(5));

    prev.on('pointerdown', () => { this.state.number = this.state.number>1 ? this.state.number-1 : 99; SFX.prev(); this._buildPanel(); this._redraw(); });
    nxt.on('pointerdown',  () => { this.state.number = this.state.number<99 ? this.state.number+1 : 1;  SFX.pick(); this._buildPanel(); this._redraw(); });

    const realNumber = PLAYERS[this.playerIdx].number;
    const quickPicks = Array.from(new Set([realNumber, 1, 7, 9, 10, 11])).slice(0, 5);
    quickPicks.forEach((n, i) => {
      const bx = cx-100+i*52, by = y0+148;
      const sel = n === num;
      const b = this._p(this.add.circle(bx, by, 22, sel?0xffd700:0xffffff, sel?0.9:0.15)
        .setStrokeStyle(2,0xffffff,0.4).setInteractive({ useHandCursor: true }));
      this._p(this.add.text(bx, by, String(n), {
        fontSize:'16px', fontFamily:'Arial Black', color: sel?'#1a1a1a':'#ffffff',
      }).setOrigin(0.5).setDepth(5));
      b.on('pointerdown', () => { this.state.number=n; SFX.pick(); this._buildPanel(); this._redraw(); });
    });
  }

  _buildHairPanel(x0, y0, w) {
    const PER_ROW = 3;
    const bw = (w - (PER_ROW-1)*10) / PER_ROW;
    const bh = 66;
    HAIR_STYLES.forEach((lbl, i) => {
      const col=i%PER_ROW, row=Math.floor(i/PER_ROW);
      const x = x0 + col*(bw+10) + bw/2;
      const y = y0 + row*(bh+10) + bh/2;
      const sel = this.state.hair === i;
      this._p(this.add.rectangle(x, y, bw, bh, sel?0xffd700:0xffffff, sel?0.25:0.1)
        .setStrokeStyle(sel?3:1, sel?0xffd700:0xffffff, sel?1:0.3)
        .setInteractive({ useHandCursor: true }))
        .on('pointerdown', () => { this.state.hair=i; SFX.pick(); this._buildPanel(); this._redraw(); });
      this._p(this.add.text(x, y, lbl, {
        fontSize:'15px', fontFamily:'Arial Black, sans-serif',
        color: sel?'#1a1a1a':'#ffffff',
      }).setOrigin(0.5).setDepth(5));
    });
  }

  _buildAccPanel(x0, y0, w) {
    ACCESSORIES.forEach((acc, i) => {
      const y = y0 + i*52 + 22;
      const sel = this.state.accessory === i;
      this._p(this.add.rectangle(x0+w/2, y, w, 44,
        sel?0xffd700:0xffffff, sel?0.22:0.07)
        .setStrokeStyle(sel?3:1, sel?0xffd700:0xffffff, sel?1:0.25)
        .setInteractive({ useHandCursor: true }))
        .on('pointerdown', () => { this.state.accessory=i; SFX.pick(); this._buildPanel(); this._redraw(); });
      this._p(this.add.text(x0+26, y, ACC_ICONS[i], { fontSize:'20px' }).setOrigin(0.5).setDepth(5));
      this._p(this.add.text(x0+58, y, acc, {
        fontSize:'16px', fontFamily:'Arial, sans-serif', color: sel?'#1a1a1a':'#ffffff',
      }).setOrigin(0,0.5).setDepth(5));
      if (sel) this._p(this.add.text(x0+w-10, y, '✓', {
        fontSize:'20px', color:'#1a1a1a', stroke:'#ffffff', strokeThickness:2,
      }).setOrigin(1,0.5).setDepth(5));
    });
  }

  // ── Redraw player ───────────────────────────────────────────
  _redraw() {
    this.playerG.clear();
    drawPlayer(this.playerG, this.playerX, this.playerY - 80, this.state);
    this.numberText.setText(String(this.state.number));
    this.tweens.add({
      targets: this.numberText,
      scaleX: 1.18, scaleY: 1.18, duration: 110, yoyo: true,
    });
    this._autoSave();
  }

  _celebrate() {
    for (let i = 0; i < 8; i++) {
      const angle = (i/8)*Math.PI*2;
      const col = [0xffd700,0x75aadb,0xffffff,0xff6eb4][i%4];
      const dot = this.add.circle(this.playerX, this.playerY-80, 7, col);
      this.tweens.add({ targets:dot,
        x: this.playerX+Math.cos(angle)*80,
        y: this.playerY-80+Math.sin(angle)*80,
        alpha:0, duration:500, onComplete:()=>dot.destroy() });
    }
    this.tweens.add({ targets:this.playerG, scaleX:1.12, scaleY:1.12, duration:120, yoyo:true });
  }
}

// ── Boot ─────────────────────────────────────────────────────
new Phaser.Game({
  type: Phaser.AUTO,
  parent: 'game',
  backgroundColor: '#1a7a3c',
  scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH, width: GW, height: GH },
  scene: [CreatorScene],
  input: { activePointers: 1 },
});
