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
  }
}

const gameConfig = {
  type: Phaser.AUTO,
  parent: 'game-root',
  width: 800,
  height: 600,
  backgroundColor: '#0f172a',
  scene: [MainScene],
};

new Phaser.Game(gameConfig);

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
    setStatus(elements.scoreStatus, 'プレイヤー登録してください。', true);
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
        item.textContent = `${entry.playerName}: ${entry.score}`;
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
    return 'Supabase Auth のメール確認がオンの可能性があります。Confirm email をオフにして、少し待ってから再登録してください。';
  }

  return message;
}
