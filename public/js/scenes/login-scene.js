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

  preload() {}

  create() {
    if (appState.playerSession?.accessToken) {
      goToHome();
      return;
    }

    // 背景オーバーレイ（クリック吸収）
    this.add.rectangle(400, 300, 800, 600, 0x000000, 0.45).setInteractive();

    const CX = 400, CY = 310, CW = 370, CH = 355, CR = 18;
    const cardLeft  = CX - CW / 2;
    const cardTop   = CY - CH / 2;
    const cardRight = CX + CW / 2;

    const g = this.add.graphics();

    // 背景装飾（より鮮やかなパステル円）
    g.fillStyle(0xFFB8D4, 0.70); g.fillCircle(CX - 158, CY - 142, 56);
    g.fillStyle(0xA8EDD8, 0.65); g.fillCircle(CX + 164, CY + 128, 46);
    g.fillStyle(0xFFE566, 0.60); g.fillCircle(CX + 150, CY - 150, 36);
    g.fillStyle(0xB8CCFF, 0.65); g.fillCircle(CX - 150, CY + 142, 42);

    // カード外側グロー
    g.fillStyle(0xF6A7C8, 0.18);
    g.fillRoundedRect(cardLeft - 8, cardTop - 8, CW + 16, CH + 16, CR + 4);

    // カード本体
    g.fillStyle(0xFFFDF7, 0.97);
    g.fillRoundedRect(cardLeft, cardTop, CW, CH, CR);

    // 上部カラーバンド（ピンク）
    g.fillStyle(0xFFCCE4, 0.80);
    g.fillRoundedRect(cardLeft + 2, cardTop + 2, CW - 4, 68,
      { tl: CR - 2, tr: CR - 2, bl: 0, br: 0 });


    // 枠線
    g.lineStyle(5, 0xF6A7C8, 1);
    g.strokeRoundedRect(cardLeft, cardTop, CW, CH, CR);
    g.lineStyle(2, 0xFFFFFF, 0.9);
    g.strokeRoundedRect(cardLeft + 4, cardTop + 4, CW - 8, CH - 8, CR - 3);

    // 装飾ドット（上部バンド内）
    g.fillStyle(0xF6A7C8, 0.9); g.fillCircle(cardLeft + 22, cardTop + 36, 7);
    g.fillStyle(0xA9DDF7, 0.9); g.fillCircle(cardLeft + 36, cardTop + 36, 5);
    g.fillStyle(0xFFE566, 1.0); g.fillCircle(cardLeft + 48, cardTop + 36, 4);
    g.fillStyle(0xA8EDD8, 0.9); g.fillCircle(cardRight - 22, cardTop + 36, 7);
    g.fillStyle(0xF6A7C8, 0.9); g.fillCircle(cardRight - 36, cardTop + 36, 5);
    g.fillStyle(0xB8CCFF, 1.0); g.fillCircle(cardRight - 48, cardTop + 36, 4);

    // フィールドラベル
    const labelStyle = {
      fontSize: '18px', color: '#C05A80',
      fontFamily: "'Nunito', sans-serif", fontStyle: 'bold',
      stroke: '#ffffff', strokeThickness: 3,
    };
    this.add.text(cardLeft + 28, cardTop + 82, 'プレイヤー名', labelStyle);
    this.add.text(cardLeft + 28, cardTop + 192, 'パスワード', labelStyle);

    // フォーム DOM
    this.formDom = this.add.dom(400, 300, this._createFormElement());

    // 閉じるボタン（カード外側・右上）
    this.add.text(cardRight + 4, cardTop - 4, '✕', {
      fontSize: '18px',
      color: '#ffffff',
      fontFamily: 'sans-serif',
      fontStyle: '700',
      backgroundColor: '#E07098',
      padding: { x: 9, y: 6 },
    }).setOrigin(0, 1)
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', () => this.scene.stop());

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
          height: 9% !important;
          -webkit-appearance: none !important;
          appearance: none !important;
          background: rgba(255, 248, 252, 0.98) !important;
          border: 2.5px solid #D87AAE !important;
          outline: none !important;
          box-shadow: 0 2px 8px rgba(216, 122, 174, 0.18), inset 0 1px 3px rgba(0,0,0,0.06) !important;
          border-radius: 12px !important;
          font-size: 21px;
          color: #3d2b4e;
          font-family: 'Nunito', sans-serif;
          padding: 0 14px !important;
          box-sizing: border-box !important;
        }
        .login-input:focus {
          border: 2.5px solid #e85d75 !important;
          box-shadow: 0 3px 10px rgba(232, 93, 117, 0.25), inset 0 1px 3px rgba(0,0,0,0.06) !important;
          background: #fff !important;
          outline: none !important;
        }
        .login-btn {
          position: absolute;
          height: 10%;
          border: none;
          border-radius: 22px;
          cursor: pointer;
          font-size: 17px;
          font-family: 'Nunito', sans-serif;
          font-weight: bold;
          color: #ffffff;
          text-indent: 0;
          overflow: visible;
          box-shadow: 0 3px 8px rgba(0,0,0,0.15);
        }
        #loginBtn {
          background: linear-gradient(135deg, #F6A7C8, #E85D90);
        }
        #loginBtn:hover  { background: linear-gradient(135deg, #F8BFDA, #F06FA0); }
        #loginBtn:active { background: linear-gradient(135deg, #E090B8, #D04878); }
        #registerBtn {
          background: linear-gradient(135deg, #B8A9F0, #8B70D8);
        }
        #registerBtn:hover  { background: linear-gradient(135deg, #C8BAFA, #9B80E8); }
        #registerBtn:active { background: linear-gradient(135deg, #A898D8, #7B60C0); }
        .login-btn:disabled { cursor: wait; opacity: 0.5; }
        #loginStatus {
          position: absolute;
          top: 83%;
          left: 22%;
          width: 56%;
          margin: 0;
          padding: 5px 10px;
          text-align: center;
          font-size: 14px;
          font-weight: bold;
          font-family: 'Nunito', sans-serif;
          color: #e05c7a;
          background: rgba(255, 255, 255, 0.92);
          border-radius: 8px;
          box-shadow: 0 1px 6px rgba(200, 100, 130, 0.25);
          display: none;
        }
      </style>

      <input id="loginUsername" class="login-input"
        style="top: 42%; left: 33%; width: 38%;"
        type="text" maxlength="24" autocomplete="username" placeholder="プレイヤー名を入力" />

      <input id="loginPassword" class="login-input"
        style="top: 57%; left: 33%; width: 38%;"
        type="password" autocomplete="current-password" minlength="6"
        placeholder="パスワード（6文字以上）" />

      <button id="loginBtn" class="login-btn"
        style="top: 69%; left: 30%; width: 18%;">ログイン</button>

      <button id="registerBtn" class="login-btn"
        style="top: 69%; left: 52%; width: 18%;">新規登録</button>

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
    const password   = document.getElementById('loginPassword')?.value ?? '';
    const statusEl   = document.getElementById('loginStatus');

    if (!playerName || !password) {
      return;
    }

    if (password.length < 6) {
      setDomStatus(statusEl, 'パスワードは6文字以上で入力してください。', true);
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
      if (el) el.disabled = isBusy;
    });
  }
}

// ===== Utility Functions =====

function setDomStatus(el, message, isError) {
  if (!el) return;
  el.textContent = message;
  el.style.color   = isError ? '#e05c7a' : '#7b5ea7';
  el.style.display = message ? 'block' : 'none';
}

function toFriendlyError(error) {
  const message = error instanceof Error ? error.message : String(error);

  if (
    message.includes('Player name is already registered') ||
    message.includes('User already registered') ||
    message.includes('user_already_exists') ||
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
  if (message.includes('at least 6 characters') || message.includes('password must be')) {
    return 'パスワードは6文字以上で入力してください。';
  }
  return message;
}
