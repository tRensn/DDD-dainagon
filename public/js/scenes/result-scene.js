import { BackendApi, createRankingStore } from '/src/backend/api.js';
import { appState } from '../state/app-state.js';
import { goToGame, goToHome } from '../app-init.js';

const configEnv = window.DAINAGON_CONFIG ?? {};
const backendApi = new BackendApi({
  rankingStore: createRankingStore(configEnv),
});

export class ResultScene extends Phaser.Scene {
  constructor() {
    super({ key: 'ResultScene' });
  }

  init(data) {
    this.score = Number.isFinite(data?.score) ? data.score : 0;
  }

  create() {
    const { width, height } = this.scale;
    const centerX = width / 2;
    const halfHeight = height / 2;

    this.add.rectangle(centerX, halfHeight / 2, width, halfHeight, 0x0f172a);
    this.add.rectangle(centerX, halfHeight + halfHeight / 2, width, halfHeight, 0x1e293b);
    this.add.line(centerX, halfHeight, 48, 0, width - 48, 0, 0x94a3b8, 0.4);

    this.add
      .text(centerX, 72, 'GAME RESULT', {
        fontSize: '24px',
        color: '#a7f3d0',
        fontFamily: 'sans-serif',
        fontStyle: '700',
      })
      .setOrigin(0.5);

    this.add
      .text(centerX, 146, 'スコア', {
        fontSize: '28px',
        color: '#f8fafc',
        fontFamily: 'sans-serif',
      })
      .setOrigin(0.5);

    this.add
      .text(centerX, 218, formatRankingScore(this.score), {
        fontSize: '72px',
        color: '#facc15',
        fontFamily: 'sans-serif',
        fontStyle: '700',
      })
      .setOrigin(0.5);

    // スコア登録ステータス（キャンバス内）
    this.saveStatusText = this.add
      .text(centerX, 285, '', {
        fontSize: '16px',
        color: '#a7f3d0',
        fontFamily: 'sans-serif',
      })
      .setOrigin(0.5);

    this.add
      .text(centerX, halfHeight + 42, 'ランキング', {
        fontSize: '28px',
        color: '#f8fafc',
        fontFamily: 'sans-serif',
      })
      .setOrigin(0.5);

    const rankingStatus = this.add
      .text(centerX, halfHeight + 112, '読み込み中...', {
        fontSize: '20px',
        color: '#cbd5e1',
        fontFamily: 'sans-serif',
      })
      .setOrigin(0.5);

    this.createNavigationButtons(centerX);
    this.autoSaveAndRenderRanking(rankingStatus);
  }

  createNavigationButtons(centerX) {
    this.add
      .text(centerX - 120, 560, 'リスタート', {
        fontSize: '24px',
        color: '#a7f3d0',
        fontFamily: 'sans-serif',
        fontStyle: '700',
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', () => goToGame());

    this.add
      .text(centerX + 120, 560, 'ホーム', {
        fontSize: '24px',
        color: '#f8fafc',
        fontFamily: 'sans-serif',
        fontStyle: '700',
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', () => goToHome());
  }

  async autoSaveAndRenderRanking(rankingStatus) {
    if (appState.playerSession) {
      this.saveStatusText.setText('スコアを登録しています...');
      try {
        await backendApi.saveScore(appState.playerSession.playerName, this.score, {
          accessToken: appState.playerSession.accessToken,
          gameId: `game-${Date.now()}`,
        });
        this.saveStatusText.setText('ランキングに登録しました！');
      } catch (error) {
        this.saveStatusText.setText(toFriendlyError(error));
        this.saveStatusText.setColor('#fecaca');
      }
    }

    await this.renderRanking(rankingStatus);
  }

  async renderRanking(rankingStatus) {
    try {
      const ranking = await backendApi.getRanking();

      if (ranking.length === 0) {
        rankingStatus.setText('まだランキングがありません');
        return;
      }

      rankingStatus.destroy();

      const rankingTop = this.scale.height / 2 + 92;
      const rankX = 168;
      const nameX = 250;
      const scoreX = 632;

      ranking.slice(0, 5).forEach((entry, index) => {
        const y = rankingTop + index * 38;

        this.add
          .text(rankX, y, String(index + 1).padStart(2, '0'), {
            fontSize: '22px',
            color: index === 0 ? '#facc15' : '#cbd5e1',
            fontFamily: 'monospace',
            fontStyle: '700',
          })
          .setOrigin(0.5);

        this.add.text(nameX, y, entry.playerName, {
          fontSize: '22px',
          color: '#f8fafc',
          fontFamily: 'sans-serif',
        });

        this.add
          .text(scoreX, y, formatRankingScore(entry.score), {
            fontSize: '22px',
            color: '#f8fafc',
            fontFamily: 'monospace',
            fontStyle: '700',
          })
          .setOrigin(1, 0);
      });
    } catch (error) {
      rankingStatus.setText(toFriendlyError(error));
      rankingStatus.setColor('#fecaca');
    }
  }
}

// ===== Utility Functions =====

function formatRankingScore(score) {
  if (typeof score === 'number' && Number.isFinite(score)) {
    return String(score);
  }
  const normalizedScore = Number(score);
  return Number.isFinite(normalizedScore) ? String(normalizedScore) : '0';
}

function toFriendlyError(error) {
  const message = error instanceof Error ? error.message : String(error);

  if (
    message.includes('Player name is already registered') ||
    message.includes('duplicate key') ||
    message.includes('23505')
  ) {
    return 'このプレイヤー名はすでに登録されています。';
  }
  if (message.includes('Invalid login credentials')) {
    return 'プレイヤー名またはパスワードが違います。';
  }
  if (message.includes('email confirmation')) {
    return 'Supabase Auth のメール確認をオフにしてください。';
  }
  if (message.includes('over_email_send_rate_limit')) {
    return '少し待ってから再登録してください。';
  }
  return message;
}
