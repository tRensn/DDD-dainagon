import { goToGame, goToGravityGame } from '../app-init.js';

export class ModeSelectScene extends Phaser.Scene {
  constructor() {
    super({ key: 'ModeSelectScene' });
  }

  create() {
    this._timeLimitOn = false;

    // 背景を半透明に（ログインと同じ演出）
    this.add.rectangle(400, 300, 800, 600, 0x000000, 0.52)
      .setInteractive(); // クリックを背面のホーム画面に貫通させない

    const CX = 400, CY = 300, CW = 470, CH = 355, CR = 20;

    // カード本体
    const g = this.add.graphics();
    g.fillStyle(0xFFF5F8, 0.98);
    g.fillRoundedRect(CX - CW/2, CY - CH/2, CW, CH, CR);
    g.lineStyle(5, 0xF6A7C8, 1);
    g.strokeRoundedRect(CX - CW/2, CY - CH/2, CW, CH, CR);
    g.lineStyle(2, 0xFFFFFF, 0.85);
    g.strokeRoundedRect(CX - CW/2 + 5, CY - CH/2 + 5, CW - 10, CH - 10, CR - 3);

    // タイトル
    this.add.text(CX, CY - CH/2 + 38, 'モードをえらんでね', {
      fontSize: '23px',
      color: '#C05A80',
      fontFamily: 'sans-serif',
      fontStyle: '700',
      stroke: '#FFFFFF',
      strokeThickness: 5,
    }).setOrigin(0.5).setShadow(2, 2, '#F6A7C8', 3, false, true);

    // 閉じるボタン
    const closeX = CX + CW/2 - 24, closeY = CY - CH/2 + 24;
    const closeBtn = this.add.text(closeX, closeY, '✕', {
      fontSize: '17px', color: '#C07898', fontFamily: 'sans-serif', fontStyle: '700',
      backgroundColor: '#FFE8F0', padding: { x: 7, y: 4 },
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    closeBtn.on('pointerdown', () => this.scene.stop());
    closeBtn.on('pointerover', () => closeBtn.setColor('#E05070'));
    closeBtn.on('pointerout',  () => closeBtn.setColor('#C07898'));

    // ─── ？ボタン（遊び方） ───
    this._howToPanel = null;
    const htBtn = this.add.text(CX - CW/2 + 24, CY - CH/2 + 24, '？', {
      fontSize: '17px', color: '#C07898', fontFamily: 'sans-serif', fontStyle: '700',
      backgroundColor: '#FFE8F0', padding: { x: 7, y: 4 },
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    htBtn.on('pointerdown', () => this._showHowTo());
    htBtn.on('pointerover', () => htBtn.setColor('#E05070'));
    htBtn.on('pointerout',  () => htBtn.setColor('#C07898'));

    // ─── 時間制限トグル（カード左上エリア） ───
    const TLX = CX - CW/2 + 22;
    const TLY = CY - CH/2 + 92;
    const TW = 44, TH = 22, TR = 11;

    this.add.text(TLX, TLY, '時間制限', {
      fontSize: '13px', color: '#9A6080', fontFamily: 'sans-serif', fontStyle: '700',
      stroke: '#FFFFFF', strokeThickness: 3,
    }).setOrigin(0, 0.5);

    const trackG = this.add.graphics();
    const knobG  = this.add.graphics();
    const statusTxt = this.add.text(TLX + 82 + TW, TLY, 'OFF', {
      fontSize: '13px', color: '#B090A8', fontFamily: 'sans-serif', fontStyle: '700',
    }).setOrigin(0, 0.5);

    const drawToggle = () => {
      const on = this._timeLimitOn;
      trackG.clear();
      trackG.fillStyle(on ? 0xF6A7C8 : 0xCCBBCC, 1);
      trackG.fillRoundedRect(TLX + 76, TLY - TH/2, TW, TH, TR);
      knobG.clear();
      const kx = TLX + 76 + (on ? TW - TH/2 : TH/2);
      knobG.fillStyle(0xFFFFFF, 1);
      knobG.fillCircle(kx, TLY, TH/2 - 2);
      knobG.lineStyle(1.5, on ? 0xE890B8 : 0xBBAAAA, 1);
      knobG.strokeCircle(kx, TLY, TH/2 - 2);
      statusTxt.setText(on ? 'ON' : 'OFF');
      statusTxt.setColor(on ? '#C05A80' : '#B090A8');
    };
    drawToggle();

    this.add.zone(TLX + 76 + TW/2, TLY, TW + 48, TH + 10)
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', () => { this._timeLimitOn = !this._timeLimitOn; drawToggle(); });

    // 2つのモードカード
    this._modeCard(
      CX - 110, CY + 45,
      'ノーマルモード',
      'グリッドに積み上げて\n3つそろえて消そう！',
      [0xF8AFC9, 0xA9E8D1, 0xF6F0DE, 0xC78AA0],
      0xFFFDF7, 0xF6A7C8, '#7F6BAE',
      () => goToGame(this._timeLimitOn)
    );

    this._modeCard(
      CX + 110, CY + 45,
      'ころころモード',
      '物理演算でころころ！\nアイスが転がる新感覚',
      [0xA9E8D1, 0xF8AFC9, 0xC78AA0, 0xF6F0DE],
      0xF0F8FF, 0xA9DDF7, '#5BA7D1',
      () => goToGravityGame(this._timeLimitOn)
    );
  }

  _modeCard(cx, cy, title, desc, iconColors, fillHex, strokeHex, textColor, onClick) {
    const W = 190, H = 205, R = 14;
    const g = this.add.graphics();

    const draw = alpha => {
      g.clear();
      g.fillStyle(fillHex, alpha);
      g.fillRoundedRect(cx - W/2, cy - H/2, W, H, R);
      g.lineStyle(3.5, strokeHex, 1);
      g.strokeRoundedRect(cx - W/2, cy - H/2, W, H, R);
    };
    draw(1);

    // アイコン: アイスを模した小さい円を並べる
    const iconCY = cy - H/2 + 50;
    const positions = [
      { x: cx - 22, y: iconCY - 4 },
      { x: cx,      y: iconCY - 12 },
      { x: cx + 22, y: iconCY - 4 },
      { x: cx,      y: iconCY + 10 },
    ];
    const ig = this.add.graphics();
    positions.forEach(({ x, y }, i) => {
      ig.fillStyle(iconColors[i], 1);
      ig.fillCircle(x, y, 13);
      ig.lineStyle(2, Phaser.Display.Color.ValueToColor(iconColors[i]).darken(25).color, 0.8);
      ig.strokeCircle(x, y, 13);
      // ハイライト
      ig.fillStyle(0xFFFFFF, 0.45);
      ig.fillEllipse(x - 4, y - 5, 8, 4);
    });

    // タイトル
    this.add.text(cx, cy - H/2 + 100, title, {
      fontSize: '18px',
      color: textColor,
      fontFamily: 'sans-serif',
      fontStyle: '700',
      stroke: '#FFFFFF',
      strokeThickness: 4,
    }).setOrigin(0.5);

    // 説明文
    this.add.text(cx, cy + 42, desc, {
      fontSize: '12px',
      color: '#6B5A7A',
      fontFamily: 'sans-serif',
      align: 'center',
      lineSpacing: 5,
    }).setOrigin(0.5);

    // ヒットゾーン
    const zone = this.add.zone(cx, cy, W, H).setInteractive({ useHandCursor: true });
    zone.on('pointerdown', onClick);
    zone.on('pointerover', () => draw(0.72));
    zone.on('pointerout',  () => draw(1));
  }

  _showHowTo() {
    if (this._howToPanel) return;
    const CX = 400, CY = 300, CW = 470, CH = 355;
    const PX = CX - CW/2 + 10, PY = CY - CH/2 + 10;
    const PW = CW - 20, PH = CH - 20;

    const c = this.add.container(0, 0);
    this._howToPanel = c;

    const bg = this.add.graphics();
    bg.fillStyle(0xFFF5F8, 0.98);
    bg.fillRoundedRect(PX, PY, PW, PH, 14);
    bg.lineStyle(4, 0xF6A7C8, 1);
    bg.strokeRoundedRect(PX, PY, PW, PH, 14);
    c.add(bg);

    c.add(this.add.text(CX, PY + 34, 'あそびかた', {
      fontSize: '22px', color: '#E85D75', fontFamily: 'sans-serif', fontStyle: '700',
      stroke: '#FFFFFF', strokeThickness: 5,
    }).setOrigin(0.5));

    c.add(this.add.text(PX + 20, PY + 68,
      '← → でアイスを動かそう\nスペースキー（DROPボタン）で落とせるよ\n同じアイスを3つ以上そろえると消えるよ\nアイスは時間がたつと、とけちゃうよ\nフィーバータイムにたくさん消してスコアを稼ごう！',
      {
        fontSize: '14px', color: '#7F6BAE', fontFamily: 'sans-serif',
        lineSpacing: 10, stroke: '#FFFFFF', strokeThickness: 3,
      }
    ));

    const closeBtn = this.add.text(PX + PW - 20, PY + 20, '✕', {
      fontSize: '17px', color: '#C07898', fontFamily: 'sans-serif', fontStyle: '700',
      backgroundColor: '#FFE8F0', padding: { x: 7, y: 4 },
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    closeBtn.on('pointerdown', () => { c.destroy(true); this._howToPanel = null; });
    closeBtn.on('pointerover', () => closeBtn.setColor('#E05070'));
    closeBtn.on('pointerout',  () => closeBtn.setColor('#C07898'));
    c.add(closeBtn);
  }
}
