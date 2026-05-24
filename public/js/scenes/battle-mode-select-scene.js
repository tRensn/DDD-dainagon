import { goToBattleRoom } from '../app-init.js';

export class BattleModeSelectScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BattleModeSelectScene' });
  }

  create() {
    this.add.rectangle(400, 300, 800, 600, 0x000000, 0.52).setInteractive();

    const CX = 400, CY = 300, CW = 510, CH = 340, CR = 20;

    const g = this.add.graphics();
    g.fillStyle(0xFFF5F8, 0.98);
    g.fillRoundedRect(CX - CW/2, CY - CH/2, CW, CH, CR);
    g.lineStyle(5, 0xF6A7C8, 1);
    g.strokeRoundedRect(CX - CW/2, CY - CH/2, CW, CH, CR);
    g.lineStyle(2, 0xFFFFFF, 0.85);
    g.strokeRoundedRect(CX - CW/2 + 5, CY - CH/2 + 5, CW - 10, CH - 10, CR - 3);

    this.add.text(CX, CY - CH/2 + 38, '対戦モードをえらんでね', {
      fontSize: '23px', color: '#C05A80', fontFamily: 'sans-serif', fontStyle: '700',
      stroke: '#FFFFFF', strokeThickness: 5,
    }).setOrigin(0.5).setShadow(2, 2, '#F6A7C8', 3, false, true);

    this.add.text(CX, CY - CH/2 + 68, '⏱ 60秒 時間制限固定', {
      fontSize: '14px', color: '#9A6080', fontFamily: 'sans-serif', fontStyle: '700',
      stroke: '#FFFFFF', strokeThickness: 3,
    }).setOrigin(0.5);

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

    this._modeCard(
      CX - 120, CY + 42,
      'ノーマルモード',
      'グリッドに積み上げて\n3つそろえて消そう！',
      [0xF8AFC9, 0xA9E8D1, 0xF6F0DE, 0xC78AA0],
      0xFFFDF7, 0xF6A7C8, '#7F6BAE',
      () => goToBattleRoom(this, 'normal')
    );

    this._modeCard(
      CX + 120, CY + 42,
      'ころころモード',
      '物理演算でころころ！\nアイスが転がる新感覚',
      [0xA9E8D1, 0xF8AFC9, 0xC78AA0, 0xF6F0DE],
      0xF0F8FF, 0xA9DDF7, '#5BA7D1',
      () => goToBattleRoom(this, 'gravity')
    );
  }

  _modeCard(cx, cy, title, desc, iconColors, fillHex, strokeHex, textColor, onClick) {
    const W = 200, H = 205, R = 14;
    const g = this.add.graphics();

    const draw = alpha => {
      g.clear();
      g.fillStyle(fillHex, alpha);
      g.fillRoundedRect(cx - W/2, cy - H/2, W, H, R);
      g.lineStyle(3.5, strokeHex, 1);
      g.strokeRoundedRect(cx - W/2, cy - H/2, W, H, R);
    };
    draw(1);

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
      ig.fillStyle(0xFFFFFF, 0.45);
      ig.fillEllipse(x - 4, y - 5, 8, 4);
    });

    this.add.text(cx, cy - H/2 + 100, title, {
      fontSize: '17px', color: textColor, fontFamily: 'sans-serif', fontStyle: '700',
      stroke: '#FFFFFF', strokeThickness: 4,
    }).setOrigin(0.5);

    this.add.text(cx, cy + 42, desc, {
      fontSize: '12px', color: '#6B5A7A', fontFamily: 'sans-serif',
      align: 'center', lineSpacing: 5,
    }).setOrigin(0.5);

    const zone = this.add.zone(cx, cy, W, H).setInteractive({ useHandCursor: true });
    zone.on('pointerdown', onClick);
    zone.on('pointerover', () => draw(0.72));
    zone.on('pointerout',  () => draw(1));
  }

  _showHowTo() {
    if (this._howToPanel) return;
    const CX = 400, CY = 300, CW = 510, CH = 340;
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

    c.add(this.add.text(CX, PY + 34, 'あそびかた（対戦）', {
      fontSize: '22px', color: '#E85D75', fontFamily: 'sans-serif', fontStyle: '700',
      stroke: '#FFFFFF', strokeThickness: 5,
    }).setOrigin(0.5));

    c.add(this.add.text(PX + 20, PY + 68,
      '← → でアイスを動かそう\nスペースキー（DROPボタン）で落とせるよ\n同じアイスを3つ以上そろえると消えるよ\n60秒で対戦相手より多くスコアを稼いだほうが勝ち！\nフィーバータイムでスコアを一気に稼ごう！',
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
