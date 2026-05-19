import { BackendApi, createRankingStore } from '/src/backend/api.js';
import { appState, setPlayerSession } from '../state/app-state.js';
import { goToHome } from '../app-init.js';

const configEnv = window.DAINAGON_CONFIG ?? {};
const backendApi = new BackendApi({
  rankingStore: createRankingStore(configEnv),
});

export class LoginScene extends Phaser.Scene {
  constructor() {
    super({ key: 'LoginScene' });
  }

  create() {
    document.body.classList.add('scene-login');

    this.add
      .text(400, 240, '🍦 DDD Dainagon', {
        fontSize: '42px',
        color: '#ff6b9d',
        fontFamily: 'Nunito, sans-serif',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);

    this.add
      .text(400, 306, 'プレイヤー登録後、スコアをランキングに保存できます', {
        fontSize: '20px',
        color: '#7de3c2',
        fontFamily: 'Nunito, sans-serif',
      })
      .setOrigin(0.5);

    this.createUI();
  }

  createUI() {
    const elements = {
      authPanel: document.querySelector('#auth-panel'),
      authForm: document.querySelector('#auth-form'),
      usernameInput: document.querySelector('#username-input'),
      passwordInput: document.querySelector('#password-input'),
      registerButton: document.querySelector('#register-button'),
      loginButton: document.querySelector('#login-button'),
      authStatus: document.querySelector('#auth-status'),
    };

    elements.authForm.addEventListener('submit', async (event) => {
      event.preventDefault();
      await this.authenticate('register', elements);
    });

    elements.loginButton.addEventListener('click', async () => {
      await this.authenticate('login', elements);
    });

    // ログイン済みの場合はホームへ
    if (appState.playerSession?.accessToken) {
      this.showPlayerPanel();
      goToHome();
    }
  }

  async authenticate(mode, elements) {
    const playerName = elements.usernameInput.value;
    const password = elements.passwordInput.value;
    const isRegister = mode === 'register';

    setBusy(true);
    setStatus(elements.authStatus, isRegister ? '登録しています...' : 'ログインしています...');

    try {
      const session = isRegister
        ? await backendApi.registerUser(playerName, password)
        : await backendApi.signInUser(playerName, password);

      setPlayerSession(session);
      elements.passwordInput.value = '';
      setStatus(elements.authStatus, '');

      this.showPlayerPanel();
      goToHome();
    } catch (error) {
      setStatus(elements.authStatus, toFriendlyError(error), true);
    } finally {
      setBusy(false);
    }
  }

  showPlayerPanel() {
    document.querySelector('#auth-panel').classList.add('hidden');
    document.querySelector('#player-panel').classList.remove('hidden');
    document.querySelector('#player-name').textContent =
      `${appState.playerSession.playerName} でプレイ中`;
  }
}

// ===== Utility Functions =====

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
    return 'Supabase Auth のメール確認がオンの可能性があります。confirm email をオフにして、少し待ってから再登録してください。';
  }

  return message;
}
