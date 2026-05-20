import { appState, setPlayerSession } from '../state/app-state.js';
import { goToGame } from '../app-init.js';
import { BackendApi, createRankingStore } from '/src/backend/api.js';

const configEnv = window.DAINAGON_CONFIG ?? {};
const backendApi = new BackendApi({
  rankingStore: createRankingStore(configEnv),
});

export class HomeScene extends Phaser.Scene {
  constructor() {
    super({ key: 'HomeScene' });
  }

  async create() {
    this.cameras.main.setBackgroundColor('#0f172a');

    this._createHeader();

    this.add
      .text(400, 300, 'ゲームを開始', {
        fontSize: '36px',
        color: '#f8fafc',
        fontFamily: 'sans-serif',
        fontStyle: '700',
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', () => goToGame());

    await this.displayRanking();
  }

  _createHeader() {
    if (appState.playerSession) {
      this.add.text(16, 16, appState.playerSession.playerName, {
        fontSize: '16px',
        color: '#a7f3d0',
        fontFamily: 'sans-serif',
        fontStyle: '700',
      });

      this.add
        .text(728, 40, 'ログアウト', {
          fontSize: '16px',
          color: '#ffffff',
          fontFamily: 'sans-serif',
          fontStyle: '700',
          backgroundColor: '#64748b',
          padding: { x: 14, y: 8 },
        })
        .setOrigin(0.5)
        .setInteractive({ useHandCursor: true })
        .on('pointerdown', () => this._logout());
    } else {
      this.add
        .text(72, 40, 'ログイン', {
          fontSize: '18px',
          color: '#ffffff',
          fontFamily: 'sans-serif',
          fontStyle: '700',
          backgroundColor: '#3b82f6',
          padding: { x: 16, y: 10 },
        })
        .setOrigin(0.5)
        .setInteractive({ useHandCursor: true })
        .on('pointerdown', () => {
          this.scene.launch('LoginScene');
        });
    }
  }

  _logout() {
    localStorage.removeItem('dainagon-player');
    setPlayerSession(null);
    this.scene.restart();
  }

  async displayRanking() {
    try {
      const ranking = await backendApi.getRanking();

      const y = 450;
      this.add
        .text(400, y, 'ランキング', {
          fontSize: '20px',
          color: '#cbd5e1',
          fontFamily: 'sans-serif',
        })
        .setOrigin(0.5);

      ranking.slice(0, 3).forEach((entry, index) => {
        this.add.text(
          400,
          y + 30 + index * 25,
          `${index + 1}位: ${entry.playerName} - ${entry.score}`,
          {
            fontSize: '16px',
            color: '#f8fafc',
            fontFamily: 'monospace',
          },
        );
      });
    } catch (error) {
      console.error('Failed to load ranking:', error);
    }
  }
}
