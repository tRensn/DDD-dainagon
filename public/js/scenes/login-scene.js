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

  preload() {
    this.load.image('loginBg', '/assets/images/15325093517047612450.jpeg');
  }

  create() {
    if (appState.playerSession?.accessToken) {
      goToHome();
      return;
    }

    // 半透明の薄暗いオーバーレイ（キャンバス全面）→ ホーム画面が透けて見える
    // setInteractive() でクリックを吸収しホーム画面への貫通を防ぐ
    this.add.rectangle(400, 300, 800, 600, 0x000000, 0.55).setInteractive();

    // 背景画像を縮小して中央に表示
    this.add.image(400, 300, 'loginBg').setDisplaySize(480, 360);

    // フォームオーバーレイを Phaser DOM として配置（サイズ・位置は変更なし）
    this.formDom = this.add.dom(400, 300, this._createFormElement());

    // 閉じるボタン（画像右上）
    this.add
      .text(636, 122, '✕', {
        fontSize: '20px',
        color: '#ffffff',
        fontFamily: 'sans-serif',
        fontStyle: '700',
        backgroundColor: '#475569',
        padding: { x: 8, y: 5 },
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', () => this.scene.restart());

    this._setupEvents();

    if (appState.playerSession?.accessToken) {
      goToHome();
    }
  }

  _createFormElement() {
    const div = document.createElement('div');
    div.style.cssText = 'width:800px; height:600px; position:relative;';
    div.innerHTML = `
      <style>
        .login-input {
          position: absolute !important;
          left: 36% !important;
          width: 26% !important;
          height: 7% !important;
          -webkit-appearance: none !important;
          appearance: none !important;
          background: transparent !important;
          border: none !important;
          outline: none !important;
          box-shadow: none !important;
          -webkit-box-shadow: none !important;
          border-radius: 0 !important;
          font-size: 15px;
          color: #3d2b4e;
          font-family: 'Nunito', sans-serif;
          padding: 0 8px !important;
          box-sizing: border-box !important;
        }
        .login-input:focus,
        .login-input:active,
        .login-input:hover {
          background: transparent !important;
          border: none !important;
          outline: none !important;
          box-shadow: none !important;
        }
        .login-btn {
          position: absolute;
          height: 10%;
          background: transparent;
          border: none;
          cursor: pointer;
          text-indent: -9999px;
          overflow: hidden;
        }
        .login-btn:disabled {
          cursor: wait;
          opacity: 0.5;
        }
        #loginStatus {
          position: absolute;
          top: 80%;
          left: 37%;
          width: 30%;
          margin: 0;
          text-align: center;
          font-size: 13px;
          font-family: 'Nunito', sans-serif;
          color: #e05c7a;
        }
      </style>

      <input id="loginUsername" class="login-input" style="top: 32%;"
        type="text" maxlength="24" autocomplete="username" />

      <input id="loginPassword" class="login-input" style="top: 48.5%;"
        type="password" autocomplete="current-password" minlength="6" />

      <button id="loginBtn" class="login-btn"
        style="top: 60.5%; left: 29%; width: 20%;">ログイン</button>

      <button id="registerBtn" class="login-btn"
        style="top: 60.5%; left: 51%; width: 20%;">新規登録</button>

      <p id="loginStatus"></p>
    `;
    return div;
  }

  _setupEvents() {
    document
      .getElementById('loginBtn')
      ?.addEventListener('click', () => this._authenticate('login'));
    document
      .getElementById('registerBtn')
      ?.addEventListener('click', () => this._authenticate('register'));
  }

  async _authenticate(mode) {
    const playerName = document.getElementById('loginUsername')?.value ?? '';
    const password = document.getElementById('loginPassword')?.value ?? '';
    const statusEl = document.getElementById('loginStatus');

    if (!playerName || !password) {
      return;
    }

    this._setBusy(true);
    setDomStatus(statusEl, mode === 'login' ? 'ログインしています...' : '登録しています...', false);

    try {
      const session =
        mode === 'login'
          ? await backendApi.signInUser(playerName, password)
          : await backendApi.registerUser(playerName, password);

      setPlayerSession(session);
      document.getElementById('loginPassword').value = '';
      setDomStatus(statusEl, '', false);
      goToHome();
    } catch (error) {
      setDomStatus(statusEl, toFriendlyError(error), true);
    } finally {
      this._setBusy(false);
    }
  }

  _setBusy(isBusy) {
    ['loginBtn', 'registerBtn'].forEach((id) => {
      const el = document.getElementById(id);
      if (el) {
        el.disabled = isBusy;
      }
    });
  }
}

// ===== Utility Functions =====

function setDomStatus(el, message, isError) {
  if (!el) {
    return;
  }
  el.textContent = message;
  el.style.color = isError ? '#e05c7a' : '#7b5ea7';
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
