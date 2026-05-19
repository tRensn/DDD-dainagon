import { BackendApi, createRankingStore } from '/src/backend/api.js';

const PLAYER_STORAGE_KEY = 'dainagon-player';
const LEGACY_SESSION_STORAGE_KEY = 'dainagon-player-session';
const configEnv = window.DAINAGON_CONFIG ?? {};
const backendApi = new BackendApi({
  rankingStore: createRankingStore(configEnv),
});

let player = loadPlayer();

class MainScene extends Phaser.Scene {
  constructor() {
    super({ key: 'MainScene' });
  }

  create() {
    this.add
      .text(400, 240, 'DDD Dainagon', {
        fontSize: '42px',
        color: '#f8fafc',
        fontFamily: 'sans-serif',
      })
      .setOrigin(0.5);

    this.add
      .text(400, 306, 'プレイヤー登録後、スコアをランキングに保存できます', {
        fontSize: '20px',
        color: '#a7f3d0',
        fontFamily: 'sans-serif',
      })
      .setOrigin(0.5);

    this.add
      .text(400, 360, 'スコア登録後にゲーム結果画面を表示します', {
        fontSize: '18px',
        color: '#cbd5e1',
        fontFamily: 'sans-serif',
      })
      .setOrigin(0.5);
  }
}

class ResultScene extends Phaser.Scene {
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

    this.renderRanking(rankingStatus);
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

const gameConfig = {
  type: Phaser.AUTO,
  parent: 'game-root',
  width: 800,
  height: 600,
  backgroundColor: '#0f172a',
  scene: [MainScene, ResultScene],
};

const game = new Phaser.Game(gameConfig);

const elements = {
  authPanel: document.querySelector('#auth-panel'),
  playerPanel: document.querySelector('#player-panel'),
  authForm: document.querySelector('#auth-form'),
  usernameInput: document.querySelector('#username-input'),
  passwordInput: document.querySelector('#password-input'),
  registerButton: document.querySelector('#register-button'),
  loginButton: document.querySelector('#login-button'),
  authStatus: document.querySelector('#auth-status'),
  playerName: document.querySelector('#player-name'),
  scoreInput: document.querySelector('#score-input'),
  saveScoreButton: document.querySelector('#save-score-button'),
  logoutButton: document.querySelector('#logout-button'),
  scoreStatus: document.querySelector('#score-status'),
  rankingList: document.querySelector('#ranking-list'),
  rankingStatus: document.querySelector('#ranking-status'),
};

elements.authForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  await authenticate('register');
});

elements.loginButton.addEventListener('click', async () => {
  await authenticate('login');
});

elements.saveScoreButton.addEventListener('click', async () => {
  await saveCurrentScore();
});

elements.logoutButton.addEventListener('click', () => {
  player = null;
  localStorage.removeItem(PLAYER_STORAGE_KEY);
  localStorage.removeItem(LEGACY_SESSION_STORAGE_KEY);
  renderPlayer();
});

renderPlayer();
await refreshRanking();

async function authenticate(mode) {
  const playerName = elements.usernameInput.value;
  const password = elements.passwordInput.value;
  const isRegister = mode === 'register';

  setBusy(true);
  setStatus(elements.authStatus, isRegister ? '登録しています...' : 'ログインしています...');

  try {
    player = isRegister
      ? await backendApi.registerUser(playerName, password)
      : await backendApi.signInUser(playerName, password);
    localStorage.setItem(PLAYER_STORAGE_KEY, JSON.stringify(player));
    elements.passwordInput.value = '';
    setStatus(elements.authStatus, '');
    renderPlayer();
  } catch (error) {
    setStatus(elements.authStatus, toFriendlyError(error), true);
  } finally {
    setBusy(false);
  }
}

async function saveCurrentScore() {
  if (!player) {
    setStatus(elements.scoreStatus, 'プレイヤー登録またはログインしてください。', true);
    return;
  }

  const score = Number(elements.scoreInput.value);

  setBusy(true);
  setStatus(elements.scoreStatus, 'スコアを登録しています...');

  try {
    await backendApi.saveScore(player.playerName, score, {
      accessToken: player.accessToken,
      gameId: `manual-${Date.now()}`,
    });
    setStatus(elements.scoreStatus, 'ランキングに登録しました。');
    await refreshRanking();
    game.scene.start('ResultScene', { score });
  } catch (error) {
    setStatus(elements.scoreStatus, toFriendlyError(error), true);
  } finally {
    setBusy(false);
  }
}

async function refreshRanking() {
  setStatus(elements.rankingStatus, '読み込み中...');

  try {
    const ranking = await backendApi.getRanking();
    elements.rankingList.replaceChildren(
      ...ranking.map((entry) => {
        const item = document.createElement('li');
        item.textContent = `${entry.playerName}: ${formatRankingScore(entry.score)}`;
        return item;
      }),
    );
    setStatus(elements.rankingStatus, ranking.length === 0 ? 'まだ登録がありません。' : '');
  } catch (error) {
    setStatus(elements.rankingStatus, toFriendlyError(error), true);
  }
}

function renderPlayer() {
  const hasPlayer = Boolean(player?.playerName && player?.accessToken);

  elements.authPanel.classList.toggle('hidden', hasPlayer);
  elements.playerPanel.classList.toggle('hidden', !hasPlayer);
  elements.playerName.textContent = hasPlayer ? `${player.playerName} でプレイ中` : '';
}

function loadPlayer() {
  try {
    const savedPlayer =
      JSON.parse(localStorage.getItem(PLAYER_STORAGE_KEY)) ??
      JSON.parse(localStorage.getItem(LEGACY_SESSION_STORAGE_KEY));

    if (!savedPlayer?.playerName) {
      return null;
    }

    if (!savedPlayer.accessToken) {
      localStorage.removeItem(PLAYER_STORAGE_KEY);
      localStorage.removeItem(LEGACY_SESSION_STORAGE_KEY);
      return null;
    }

    const migratedPlayer = {
      playerName: savedPlayer.playerName,
      accessToken: savedPlayer.accessToken,
      refreshToken: savedPlayer.refreshToken,
      expiresAt: savedPlayer.expiresAt,
    };

    if (migratedPlayer.expiresAt && migratedPlayer.expiresAt <= Math.floor(Date.now() / 1000)) {
      localStorage.removeItem(PLAYER_STORAGE_KEY);
      localStorage.removeItem(LEGACY_SESSION_STORAGE_KEY);
      return null;
    }

    localStorage.setItem(PLAYER_STORAGE_KEY, JSON.stringify(migratedPlayer));

    return migratedPlayer;
  } catch {
    localStorage.removeItem(PLAYER_STORAGE_KEY);
    return null;
  }
}

function setBusy(isBusy) {
  for (const button of document.querySelectorAll('button')) {
    button.disabled = isBusy;
  }
}

function formatRankingScore(score) {
  if (typeof score === 'number' && Number.isFinite(score)) {
    return String(score);
  }

  const normalizedScore = Number(score);
  return Number.isFinite(normalizedScore) ? String(normalizedScore) : '0';
}

function setStatus(element, message, isError = false) {
  element.textContent = message;
  element.classList.toggle('error', isError);
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
