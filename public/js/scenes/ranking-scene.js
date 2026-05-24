import { BackendApi, createRankingStore, DEFAULT_GRAVITY_RANKING_TABLE, DEFAULT_TIMED_RANKING_TABLE, DEFAULT_GRAVITY_TIMED_RANKING_TABLE } from '/src/backend/api.js';
import { goToHome } from '../app-init.js';

const configEnv = window.DAINAGON_CONFIG ?? {};
const rankingApis = {
  normal: {
    untimed: new BackendApi({ rankingStore: createRankingStore(configEnv) }),
    timed: new BackendApi({
      rankingStore: createRankingStore(configEnv, {
        table: configEnv.SUPABASE_TIMED_RANKING_TABLE || DEFAULT_TIMED_RANKING_TABLE,
      }),
    }),
  },
  gravity: {
    untimed: new BackendApi({
      rankingStore: createRankingStore(configEnv, {
        table: configEnv.SUPABASE_GRAVITY_RANKING_TABLE || DEFAULT_GRAVITY_RANKING_TABLE,
      }),
    }),
    timed: new BackendApi({
      rankingStore: createRankingStore(configEnv, {
        table: configEnv.SUPABASE_GRAVITY_TIMED_RANKING_TABLE || DEFAULT_GRAVITY_TIMED_RANKING_TABLE,
      }),
    }),
  },
};

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

const RANKING_ROW_Y = [218, 268, 318, 368, 418];
const RANK_MARK_X = 220;

export class RankingScene extends Phaser.Scene {
  constructor() {
    super({ key: 'RankingScene' });
  }

  create() {
    this.cameras.main.setBackgroundColor('#FFEAF4');
    this.selectedMode = 'normal';
    this.selectedTime = 'untimed';
    this.rankingObjects = [];
    this.filterButtons = [];

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

    this.createFilterButtons(centerX);

    const panel = this.add.graphics();
    panel.fillStyle(0xfffdf7, 0.92);
    panel.fillRoundedRect(170, 195, 460, 265, 16);
    panel.lineStyle(4, 0xf6a7c8, 1);
    panel.strokeRoundedRect(170, 195, 460, 265, 16);

    this.statusText = this.add
      .text(centerX, 328, 'ランキングよみこみ中...', {
        fontSize: '22px',
        color: '#7f6bae',
        fontFamily: "'Nunito', sans-serif",
        fontStyle: 'bold',
        stroke: '#ffffff',
        strokeThickness: 4,
      })
      .setOrigin(0.5);

    this.createBackButton(centerX, 515);
    this.renderRanking();
  }

  createFilterButtons(centerX) {
    this.createFilterButton(centerX - 105, 137, 190, 'ノーマル', 'mode', 'normal');
    this.createFilterButton(centerX + 105, 137, 190, 'ころころ', 'mode', 'gravity');
    this.createFilterButton(centerX - 105, 170, 190, '時間なし', 'time', 'untimed');
    this.createFilterButton(centerX + 105, 170, 190, '時間あり', 'time', 'timed');
    this.updateFilterButtons();
  }

  createFilterButton(x, y, width, label, type, value) {
    const height = 28;
    const graphics = this.add.graphics();
    const text = this.add
      .text(x, y, label, {
        fontSize: '17px',
        color: '#7f6bae',
        fontFamily: "'Nunito', sans-serif",
        fontStyle: 'bold',
        stroke: '#ffffff',
        strokeThickness: 3,
      })
      .setOrigin(0.5);
    const hitArea = this.add.zone(x, y, width, height).setInteractive({ useHandCursor: true });

    hitArea.on('pointerdown', () => {
      if (type === 'mode') {
        this.selectedMode = value;
      } else {
        this.selectedTime = value;
      }
      this.updateFilterButtons();
      this.renderRanking();
    });

    const button = { graphics, text, hitArea, x, y, width, height, type, value };
    this.filterButtons.push(button);
    return button;
  }

  updateFilterButtons() {
    this.filterButtons.forEach((button) => {
      const selected = button.type === 'mode'
        ? this.selectedMode === button.value
        : this.selectedTime === button.value;
      button.graphics.clear();
      button.graphics.fillStyle(selected ? 0xf6a7c8 : 0xfffdf7, selected ? 1 : 0.92);
      button.graphics.fillRoundedRect(button.x - button.width / 2, button.y - button.height / 2, button.width, button.height, 10);
      button.graphics.lineStyle(3, selected ? 0xe85d75 : 0xa9ddf7, 1);
      button.graphics.strokeRoundedRect(button.x - button.width / 2, button.y - button.height / 2, button.width, button.height, 10);
      button.text.setColor(selected ? '#2b2440' : '#7f6bae');
    });
  }

  clearRankingObjects() {
    this.rankingObjects.forEach((object) => object.destroy());
    this.rankingObjects = [];
  }

  addRankingObject(object) {
    this.rankingObjects.push(object);
    return object;
  }

  async renderRanking() {
    this.clearRankingObjects();
    this.statusText.setText('ランキングよみこみ中...');
    this.statusText.setVisible(true);

    try {
      const api = rankingApis[this.selectedMode][this.selectedTime];
      const ranking = await api.getRanking();

      if (ranking.length === 0) {
        this.statusText.setText('まだランキングがありません');
        return;
      }

      this.statusText.setVisible(false);

      ranking.slice(0, 5).forEach((entry, index) => {
        const y = RANKING_ROW_Y[index];
        const color = index === 0 ? '#e85d75' : '#7f6bae';
        const crown = TOP_THREE_CROWNS[index];
        const nameSize = crown?.nameSize ?? 24;

        this.createRankMark(RANK_MARK_X, y + 21, index);

        if (!crown) {
          this.addRankingObject(this.add
            .text(RANK_MARK_X, y + 17, `${index + 1}位`, {
              fontSize: `${Math.max(22, nameSize - 3)}px`,
              color,
              fontFamily: "'Nunito', sans-serif",
              fontStyle: 'bold',
              stroke: '#ffffff',
              strokeThickness: 4,
            })
            .setOrigin(0.5));
        }

        this.addRankingObject(this.add.text(335, y, entry.playerName, {
          fontSize: `${nameSize}px`,
          color: '#7f6bae',
          fontFamily: "'Nunito', sans-serif",
          fontStyle: crown ? 'bold' : '',
          stroke: '#ffffff',
          strokeThickness: 4,
        }));

        this.addRankingObject(this.add
          .text(580, y, String(entry.score), {
            fontSize: `${Math.max(24, nameSize - 3)}px`,
            color,
            fontFamily: "'Nunito', sans-serif",
            fontStyle: 'bold',
            stroke: '#ffffff',
            strokeThickness: 4,
          })
          .setOrigin(1, 0));
      });
    } catch (error) {
      console.error('Failed to load ranking:', error);
      this.statusText.setText('ランキングをよみこめませんでした');
      this.statusText.setVisible(true);
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
    const graphics = this.addRankingObject(this.add.graphics());

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

    this.addRankingObject(this.add
      .text(x, y - 3 * size, String(index + 1), {
        fontSize: `${24 * size}px`,
        color: crown.text,
        fontFamily: "'Nunito', sans-serif",
        fontStyle: 'bold',
        stroke: crown.textStroke,
        strokeThickness: 2.5 * size,
      })
      .setOrigin(0.5));
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
