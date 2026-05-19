import { BackendApi, createRankingStore } from '/src/backend/api.js';
import { appState } from '../state/app-state.js';
import { goToGame, goToHome, goToLogin } from '../app-init.js';

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
    this.renderRanking(rankingStatus);
    this.setupUI();
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
      .on('pointerdown', () => {
        goToGame();
      });

    this.add
      .text(centerX + 120, 560, 'ホーム', {
        fontSize: '24px',
        color: '#f8fafc',
        fontFamily: 'sans-serif',
        fontStyle: '700',
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', () => {
        goToHome();
      });
  }

  setupUI() {
    const saveButton = document.querySelector('#save-score-button');
    const logoutButton = document.querySelector('#logout-button');
    const scoreInput = document.querySelector('#score-input');

    if (scoreInput) {
      scoreInput.value = this.score;
    }

    if (saveButton) {
      saveButton.addEventListener('click', async () => {
        await this.saveCurrentScore(scoreInput);
      });
    }

    if (logoutButton) {
      logoutButton.addEventListener('click', () => {
        this.logout();
      });
    }
  }

  async saveCurrentScore(scoreInput) {
    if (!appState.playerSession) {
      setStatus(
        document.querySelector('#score-status'),
        'プレイヤー登録またはログインしてください。',
        true,
      );
      return;
    }

    const score = Number(scoreInput.value);

    setBusy(true);
    setStatus(document.querySelector('#score-status'), 'スコアを登録しています...');

    try {
      await backendApi.saveScore(appState.playerSession.playerName, score, {
        accessToken: appState.playerSession.accessToken,
        gameId: `manual-${Date.now()}`,
      });
      setStatus(document.querySelector('#score-status'), 'ランキングに登録しました。');
      await this.refreshRanking();
    } catch (error) {
      setStatus(document.querySelector('#score-status'), toFriendlyError(error), true);
    } finally {
      setBusy(false);
    }
  }

  logout() {
    localStorage.removeItem('dainagon-player');
    appState.playerSession = null;
    document.querySelector('#auth-panel').classList.remove('hidden');
    document.querySelector('#player-panel').classList.add('hidden');
    goToLogin();
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

  async refreshRanking() {
    setStatus(document.querySelector('#ranking-status'), '読み込み中...');

    try {
      const ranking = await backendApi.getRanking();
      document.querySelector('#ranking-list').replaceChildren(
        ...ranking.map((entry) => {
          const item = document.createElement('li');
          item.textContent = `${entry.playerName}: ${formatRankingScore(entry.score)}`;
          return item;
        }),
      );
      setStatus(
        document.querySelector('#ranking-status'),
        ranking.length === 0 ? 'まだ登録がありません。' : '',
      );
    } catch (error) {
      setStatus(document.querySelector('#ranking-status'), toFriendlyError(error), true);
    }
  }
}

// ===== Utility Functions =====

function setBusy(isBusy) {
  for (const button of document.querySelectorAll('button')) {
    button.disabled = isBusy;
  }
}

function setStatus(element, message, isError = false) {
  if (!element) return;
  element.textContent = message;
  element.classList.toggle('error', isError);
}

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
    return 'このプレイヤー名はすでに登録されています。別の名前を使ってください。';
  }

  if (message.includes('Invalid login credentials')) {
    return 'プレイヤー名またはパスワードが違います。';
  }

  if (message.includes('email confirmation')) {
    return 'Supabase Auth のメール確認をオフにしてください。';
  }

  if (message.includes('over_email_send_rate_limit')) {
    return 'Supabase Auth のメール確認がオンの可能性があります。confirm email をオフにして、少し待ってから再登録してください。';
  }

  return message;
}
