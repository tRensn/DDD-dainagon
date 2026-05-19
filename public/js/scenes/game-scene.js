/**
 * ゲーム画面（チームメイト2の担当）
 *
 * 機能:
 * - ゲームロジック実装
 * - スコア計算
 * - ゲーム終了処理
 *
 * 状態管理:
 * - appState.playerSession から accessToken を読み込み
 * - ゲーム終了時に setLastGameResult() と goToResult() で遷移
 */

import { appState, setLastGameResult } from '../state/app-state.js';
import { goToResult } from '../app-init.js';

export class GameScene extends Phaser.Scene {
  constructor() {
    super({ key: 'GameScene' });
    this.score = 0;
    this.isGameOver = false;
  }

  create() {
    this.add
      .text(400, 100, 'ゲーム中...', {
        fontSize: '32px',
        color: '#a7f3d0',
        fontFamily: 'sans-serif',
      })
      .setOrigin(0.5);

    this.add
      .text(400, 200, `スコア: ${this.score}`, {
        fontSize: '28px',
        color: '#f8fafc',
        fontFamily: 'sans-serif',
      })
      .setOrigin(0.5)
      .setName('scoreText');

    // テスト用：クリックでスコア加算
    this.add
      .rectangle(400, 400, 300, 100, 0x087f8c)
      .setInteractive()
      .on('pointerdown', () => {
        this.score += 100;
        this.children.getByName('scoreText').setText(`スコア: ${this.score}`);
      });

    this.add
      .text(400, 400, 'クリックでスコア +100', {
        fontSize: '20px',
        color: '#f8fafc',
        fontFamily: 'sans-serif',
      })
      .setOrigin(0.5);

    // テスト用：ゲーム終了ボタン
    this.add
      .text(400, 500, 'ゲーム終了', {
        fontSize: '24px',
        color: '#facc15',
        fontFamily: 'sans-serif',
      })
      .setOrigin(0.5)
      .setInteractive()
      .on('pointerdown', () => this.finishGame());

    // 実装例：一定時間後に自動終了
    // this.time.delayedCall(30000, () => this.finishGame());
  }

  finishGame() {
    if (this.isGameOver) return;
    this.isGameOver = true;

    // ゲーム結果を共有状態に保存
    setLastGameResult({
      score: this.score,
      gameId: `game-${Date.now()}`,
      // その他ゲームデータ...
    });

    // リザルト画面へ遷移
    goToResult(this.score);
  }
}
