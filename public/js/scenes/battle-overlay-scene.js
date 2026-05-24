import { createBattleStore } from '../state/battle-store.js';
import { goToBattleResult } from '../app-init.js';

export class BattleOverlayScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BattleOverlayScene' });
  }

  init(data) {
    this.battleConfig = data?.battleConfig ?? {};
    this.store        = createBattleStore();
    this._pollTimer   = null;
    this._finished    = false;
  }

  create() {
    const { myName, opponentName, roomCode, role, mode } = this.battleConfig;
    const gameKey = mode === 'gravity' ? 'GravityGameScene' : 'GameScene';
    this._gameKey = gameKey;

    // ─── 相手スコアパネル（タイマーパネルの下）───
    const px = 14, py = 272, pw = 210, ph = 62;
    const panel = this.add.graphics();
    panel.fillStyle(0xFFFDF7, 0.88);
    panel.fillRoundedRect(px, py, pw, ph, 12);
    panel.lineStyle(4, 0xE85D75, 0.8);
    panel.strokeRoundedRect(px, py, pw, ph, 12);
    panel.lineStyle(2, 0xFFFFFF, 0.9);
    panel.strokeRoundedRect(px + 3, py + 3, pw - 6, ph - 6, 10);

    this.add.text(px + 10, py + 9, '⚔ 相手のスコア', {
      fontSize: '12px', fill: '#E85D75', fontFamily: 'sans-serif', fontStyle: '700',
      stroke: '#FFFFFF', strokeThickness: 2,
    });

    this.add.text(px + 10, py + 28, opponentName ?? '相手', {
      fontSize: '13px', fill: '#7F6BAE', fontFamily: 'sans-serif', fontStyle: '700',
      stroke: '#FFFFFF', strokeThickness: 2,
    });

    this.oppScoreText = this.add.text(px + pw - 10, py + ph / 2 + 4, '0', {
      fontSize: '28px', fill: '#E85D75', fontFamily: 'sans-serif', fontStyle: '700',
      stroke: '#FFFFFF', strokeThickness: 5,
    }).setOrigin(1, 0.5).setShadow(1, 1, '#F6A7C8', 2, false, true);

    // ゲームシーンの battle-end イベントを購読
    this.time.delayedCall(200, () => {
      const gameScene = this.scene.get(gameKey);
      if (gameScene) {
        gameScene.events.on('battle-end', (finalScore) => {
          this._handleEnd(finalScore);
        });
      }
    });

    // 2秒ごとに相手スコアをポーリング
    if (this.store) {
      this._pollTimer = this.time.addEvent({
        delay: 2000, repeat: -1,
        callback: async () => {
          if (this._finished) return;
          const gameScene = this.scene.get(gameKey);
          const myScore = gameScene?.score ?? 0;

          // 自分のスコアをDBに更新
          await this.store.updateScore(roomCode, role, myScore).catch(() => {});

          // 相手のスコアを取得
          const room = await this.store.get(roomCode).catch(() => null);
          if (room) {
            const oppScore = role === 'host' ? (room.guest_score ?? 0) : (room.host_score ?? 0);
            if (this.oppScoreText?.active) this.oppScoreText.setText(String(oppScore));
          }
        },
      });
    }
  }

  async _handleEnd(finalScore) {
    if (this._finished) return;
    this._finished = true;

    if (this._pollTimer) { this._pollTimer.remove(); this._pollTimer = null; }

    const { roomCode, role, myName, opponentName, mode } = this.battleConfig;

    // 最終スコアを確定してフィニッシュフラグを立てる
    if (this.store) {
      await this.store.setFinished(roomCode, role, finalScore).catch(() => {});
    }

    // BattleResultScene へ遷移
    goToBattleResult(this, {
      roomCode, role, myName, opponentName, myScore: finalScore, mode,
      store: this.store,
    });
  }

  shutdown() {
    if (this._pollTimer) { this._pollTimer.remove(); this._pollTimer = null; }
  }
}
