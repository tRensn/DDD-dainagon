import { BackendApi, createRankingStore } from '/src/backend/api.js';
import { goToHome } from '../app-init.js';

const configEnv = window.DAINAGON_CONFIG ?? {};
const backendApi = new BackendApi({
  rankingStore: createRankingStore(configEnv),
});

export class RankingScene extends Phaser.Scene {
  constructor() {
    super({ key: 'RankingScene' });
  }

  create() {
    this.cameras.main.setBackgroundColor('#FFEAF4');

    const centerX = this.scale.width / 2;

    this.add
      .text(centerX, 90, 'ランキング', {
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
    panel.fillRoundedRect(170, 145, 460, 315, 16);
    panel.lineStyle(4, 0xf6a7c8, 1);
    panel.strokeRoundedRect(170, 145, 460, 315, 16);

    const status = this.add
      .text(centerX, 285, 'ランキングよみこみ中...', {
        fontSize: '22px',
        color: '#7f6bae',
        fontFamily: "'Nunito', sans-serif",
        fontStyle: 'bold',
        stroke: '#ffffff',
        strokeThickness: 4,
      })
      .setOrigin(0.5);

    this.createBackButton(centerX, 515);
    this.renderRanking(status);
  }

  async renderRanking(status) {
    try {
      const ranking = await backendApi.getRanking();

      if (ranking.length === 0) {
        status.setText('まだランキングがありません');
        return;
      }

      status.destroy();

      ranking.slice(0, 5).forEach((entry, index) => {
        const y = 185 + index * 50;
        const color = index === 0 ? '#e85d75' : '#7f6bae';

        this.add.text(220, y, `${index + 1}位`, {
          fontSize: '24px',
          color,
          fontFamily: "'Nunito', sans-serif",
          fontStyle: 'bold',
          stroke: '#ffffff',
          strokeThickness: 4,
        });

        this.add.text(315, y, entry.playerName, {
          fontSize: '24px',
          color: '#7f6bae',
          fontFamily: "'Nunito', sans-serif",
          stroke: '#ffffff',
          strokeThickness: 4,
        });

        this.add
          .text(580, y, String(entry.score), {
            fontSize: '24px',
            color,
            fontFamily: "'Nunito', sans-serif",
            fontStyle: 'bold',
            stroke: '#ffffff',
            strokeThickness: 4,
          })
          .setOrigin(1, 0);
      });
    } catch (error) {
      console.error('Failed to load ranking:', error);
      status.setText('ランキングをよみこめませんでした');
    }
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
