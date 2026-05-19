/**
 * ホーム画面（チームメイト1の担当）
 *
 * 機能:
 * - プレイヤー情報表示
 * - ゲーム開始ボタン
 * - ランキング表示（オプション）
 *
 * 状態管理:
 * - appState.playerSession から playerName を読み込み
 * - ゲーム開始時に goToGame() で遷移
 */

import { appState } from '../state/app-state.js';
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
    // プレイヤー情報を表示
    const playerName = appState.playerSession?.playerName ?? 'Player';
    
    this.add
      .text(400, 100, `${playerName} でプレイ中`, {
        fontSize: '28px',
        color: '#a7f3d0',
        fontFamily: 'sans-serif',
      })
      .setOrigin(0.5);

    // ゲーム開始ボタン
    this.add
      .text(400, 300, 'ゲームを開始', {
        fontSize: '32px',
        color: '#f8fafc',
        fontFamily: 'sans-serif',
      })
      .setOrigin(0.5)
      .setInteractive()
      .on('pointerdown', () => goToGame());

    // ランキング表示（オプション）
    await this.displayRanking();
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
        this.add.text(400, y + 30 + index * 25, `${index + 1}位: ${entry.playerName} - ${entry.score}`, {
          fontSize: '16px',
          color: '#f8fafc',
          fontFamily: 'monospace',
        });
      });
    } catch (error) {
      console.error('Failed to load ranking:', error);
    }
  }
}
