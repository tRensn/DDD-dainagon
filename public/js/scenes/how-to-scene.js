import { goToHome } from '../app-init.js';

export class HowToScene extends Phaser.Scene {
  constructor() {
    super({ key: 'HowToScene' });
  }

  create() {
    this.cameras.main.setBackgroundColor('#FFEAF4');

    const centerX = this.scale.width / 2;

    this.add
      .text(centerX, 90, 'あそびかた', {
        fontSize: '46px',
        color: '#e85d75',
        fontFamily: "'Nunito', sans-serif",
        fontStyle: 'bold',
        stroke: '#ffffff',
        strokeThickness: 8,
      })
      .setOrigin(0.5);

    const panel = this.add.graphics();
    panel.fillStyle(0xfffdf7, 0.92);
    panel.fillRoundedRect(140, 150, 520, 300, 16);
    panel.lineStyle(4, 0xf6a7c8, 1);
    panel.strokeRoundedRect(140, 150, 520, 300, 16);

    this.add.text(
      185,
      190,
      '・← → でアイスを動かそう\n・スペースキーで下に落とせるよ\n\t\t\t\t\t\t同じアイスを3つ以上そろえると消えるよ\n・アイスは時間がたつと、とけちゃうよ\n・とける前にたくさん消して\n  ハイスコアをめざそう！',
      {
        fontSize: '22px',
        color: '#7f6bae',
        fontFamily: "'Nunito', sans-serif",
        lineSpacing: 12,
        stroke: '#ffffff',
        strokeThickness: 4,
      },
    );

    this.createBackButton(centerX, 515);
  }

  createBackButton(x, y) {
    this.add
      .text(x, y, 'ホームへ', {
        fontSize: '26px',
        color: '#ffffff',
        fontFamily: "'Nunito', sans-serif",
        fontStyle: 'bold',
        backgroundColor: '#e85d75',
        padding: { x: 24, y: 12 },
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', () => goToHome());
  }
}
