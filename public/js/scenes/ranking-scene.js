import { BackendApi, createRankingStore } from '/src/backend/api.js';
import { goToHome } from '../app-init.js';

const configEnv = window.DAINAGON_CONFIG ?? {};
const backendApi = new BackendApi({
  rankingStore: createRankingStore(configEnv),
});

const TOP_THREE_CROWNS = [
  {
    fill: 0xd8bd33,
    stroke: 0xb99b20,
    gem: 0xf3df6a,
    text: '#ffffff',
    textStroke: '#8a6a00',
    scale: 1.28,
    nameSize: 31,
  },
  {
    fill: 0xa3aaab,
    stroke: 0x838b8d,
    gem: 0xdce2e3,
    text: '#ffffff',
    textStroke: '#606769',
    scale: 1.08,
    nameSize: 27,
  },
  {
    fill: 0xb58238,
    stroke: 0x8f6527,
    gem: 0xd0a257,
    text: '#ffffff',
    textStroke: '#6f4a1f',
    scale: 0.94,
    nameSize: 25,
  },
];

const RANKING_ROW_Y = [176, 238, 294, 352, 402];
const RANK_MARK_X = 220;

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
        const y = RANKING_ROW_Y[index];
        const color = index === 0 ? '#e85d75' : '#7f6bae';
        const crown = TOP_THREE_CROWNS[index];
        const nameSize = crown?.nameSize ?? 24;

        this.createRankMark(RANK_MARK_X, y + 21, index);

        if (!crown) {
          this.add
            .text(RANK_MARK_X, y + 17, `${index + 1}位`, {
              fontSize: `${Math.max(22, nameSize - 3)}px`,
              color,
              fontFamily: "'Nunito', sans-serif",
              fontStyle: 'bold',
              stroke: '#ffffff',
              strokeThickness: 4,
            })
            .setOrigin(0.5);
        }

        this.add.text(335, y, entry.playerName, {
          fontSize: `${nameSize}px`,
          color: '#7f6bae',
          fontFamily: "'Nunito', sans-serif",
          fontStyle: crown ? 'bold' : '',
          stroke: '#ffffff',
          strokeThickness: 4,
        });

        this.add
          .text(580, y, String(entry.score), {
            fontSize: `${Math.max(24, nameSize - 3)}px`,
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

  createRankMark(x, y, index) {
    const crown = TOP_THREE_CROWNS[index];

    if (!crown) {
      return;
    }

    const size = crown.scale;
    const halfWidth = 24 * size;
    const baseTop = y + 2 * size;
    const baseHeight = 10 * size;
    const sideTop = y - 21 * size;
    const centerTop = y - 27 * size;
    const middleTop = y - 13 * size;
    const tipRadius = 4.5 * size;
    const graphics = this.add.graphics();

    graphics.fillStyle(crown.fill, 1);
    graphics.fillTriangle(
      x - halfWidth,
      baseTop,
      x - halfWidth + 4 * size,
      sideTop,
      x - 10 * size,
      baseTop,
    );
    graphics.fillTriangle(x - 14 * size, baseTop, x, centerTop, x + 14 * size, baseTop);
    graphics.fillTriangle(
      x + 10 * size,
      baseTop,
      x + halfWidth - 4 * size,
      sideTop,
      x + halfWidth,
      baseTop,
    );
    graphics.fillRoundedRect(
      x - halfWidth,
      baseTop - 3 * size,
      halfWidth * 2,
      baseHeight,
      2 * size,
    );
    graphics.fillRoundedRect(
      x - halfWidth + 2 * size,
      baseTop + baseHeight - 1 * size,
      halfWidth * 2 - 4 * size,
      4 * size,
      1 * size,
    );

    graphics.lineStyle(2.5 * size, crown.stroke, 1);
    graphics.strokeTriangle(
      x - halfWidth,
      baseTop,
      x - halfWidth + 4 * size,
      sideTop,
      x - 10 * size,
      baseTop,
    );
    graphics.strokeTriangle(x - 14 * size, baseTop, x, centerTop, x + 14 * size, baseTop);
    graphics.strokeTriangle(
      x + 10 * size,
      baseTop,
      x + halfWidth - 4 * size,
      sideTop,
      x + halfWidth,
      baseTop,
    );
    graphics.strokeRoundedRect(
      x - halfWidth,
      baseTop - 3 * size,
      halfWidth * 2,
      baseHeight,
      2 * size,
    );
    graphics.strokeRoundedRect(
      x - halfWidth + 2 * size,
      baseTop + baseHeight - 1 * size,
      halfWidth * 2 - 4 * size,
      4 * size,
      1 * size,
    );

    graphics.fillStyle(crown.gem, 1);
    graphics.fillCircle(x - halfWidth + 4 * size, sideTop, tipRadius);
    graphics.fillCircle(x, centerTop, tipRadius);
    graphics.fillCircle(x + halfWidth - 4 * size, sideTop, tipRadius);

    this.add
      .text(x, y - 3 * size, String(index + 1), {
        fontSize: `${24 * size}px`,
        color: crown.text,
        fontFamily: "'Nunito', sans-serif",
        fontStyle: 'bold',
        stroke: crown.textStroke,
        strokeThickness: 2.5 * size,
      })
      .setOrigin(0.5);
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
