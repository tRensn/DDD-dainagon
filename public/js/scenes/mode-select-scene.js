import { goToGame, goToGravityGame } from '../app-init.js';

export class ModeSelectScene extends Phaser.Scene {
  constructor() {
    super({ key: 'ModeSelectScene' });
  }

  create() {
    // 背景を半透明に（ログインと同じ演出）
    this.add.rectangle(400, 300, 800, 600, 0x000000, 0.52)
      .setInteractive(); // クリックを背面のホーム画面に貫通させない

    const CX = 400, CY = 300, CW = 470, CH = 320, CR = 20;

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

    // 2つのモードカード
    this._modeCard(
      CX - 110, CY + 22,
      'ノーマルモード',
      'グリッドに積み上げて\n3つそろえて消そう！',
      [0xF8AFC9, 0xA9E8D1, 0xF6F0DE, 0xC78AA0],
      0xFFFDF7, 0xF6A7C8, '#7F6BAE',
      () => goToGame()
    );

    this._modeCard(
      CX + 110, CY + 22,
      'ころころモード',
      '物理演算でころころ！\nアイスが転がる新感覚',
      [0xA9E8D1, 0xF8AFC9, 0xC78AA0, 0xF6F0DE],
      0xF0F8FF, 0xA9DDF7, '#5BA7D1',
      () => goToGravityGame()
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
}
