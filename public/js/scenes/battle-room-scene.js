import { appState } from '../state/app-state.js';
import { goToHome, goToBattleGame } from '../app-init.js';
import { createBattleStore, genRoomCode } from '../state/battle-store.js';

export class BattleRoomScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BattleRoomScene' });
  }

  init(data) {
    this.gameMode = data?.mode ?? 'normal';
    this.store    = createBattleStore();
    this._poll    = null;
    this._content = [];
  }

  create() {
    const g = this.add.graphics();
    g.fillStyle(0xFFEAF4, 1); g.fillRect(0, 0, 800, 600);
    g.fillStyle(0xE8F8F5, 1); g.fillCircle(110, 105, 95);  g.fillCircle(705, 470, 130);
    g.fillStyle(0xFFF7C8, 1); g.fillCircle(635, 105, 80);
    g.fillStyle(0xDDEBFF, 1); g.fillCircle(95, 500, 115);

    this.cameras.main.setBackgroundColor('#FFEAF4');

    this.add.text(400, 58, '⚔ 対戦部屋', {
      fontSize: '40px', color: '#E85D75', fontFamily: 'sans-serif', fontStyle: '700',
      stroke: '#FFFFFF', strokeThickness: 7,
    }).setOrigin(0.5).setShadow(2, 3, '#F6A7C8', 3, true, true);

    const modeName = this.gameMode === 'gravity' ? 'ころころモード' : 'ノーマルモード';
    this.add.text(400, 106, `${modeName}　⏱ 60秒`, {
      fontSize: '17px', color: '#7F6BAE', fontFamily: 'sans-serif', fontStyle: '700',
      stroke: '#FFFFFF', strokeThickness: 3,
    }).setOrigin(0.5);

    const playerName = appState.playerSession?.playerName ?? 'ゲスト';
    this._playerName = playerName;
    this.add.text(400, 140, `プレイヤー: ${playerName}`, {
      fontSize: '15px', color: '#9A6080', fontFamily: 'sans-serif',
      stroke: '#FFFFFF', strokeThickness: 3,
    }).setOrigin(0.5);

    this.statusText = this.add.text(400, 490, '', {
      fontSize: '16px', color: '#7F6BAE', fontFamily: 'sans-serif',
      align: 'center', stroke: '#FFFFFF', strokeThickness: 3,
    }).setOrigin(0.5);

    if (!this.store) {
      this.statusText.setText('Supabaseが設定されていないため\n対戦機能を使用できません').setColor('#E85D75');
      this._makeBtn(400, 510, 'ホームに戻る', () => goToHome(), 0xCCBBCC, '#9A8CC2', true, 0xFCEEFF);
      return;
    }

    this._makeBtn(400, 540, 'ホームに戻る', () => goToHome(), 0xCCBBCC, '#9A8CC2', true, 0xFCEEFF);
    this._showMainButtons();
  }

  // ─── ボタンヘルパー ───

  _makeBtn(cx, cy, label, onClick, strokeHex = 0xF6A7C8, textColor = '#7F6BAE', small = false, fillHex = 0xFFFDF7) {
    const W = small ? 160 : 210, H = small ? 44 : 58, R = 14;
    const bg = this.add.graphics();
    const draw = alpha => {
      bg.clear();
      bg.fillStyle(fillHex, alpha);
      bg.fillRoundedRect(cx - W/2, cy - H/2, W, H, R);
      bg.lineStyle(4, strokeHex, 1);
      bg.strokeRoundedRect(cx - W/2, cy - H/2, W, H, R);
      bg.lineStyle(2, 0xFFFFFF, 0.9);
      bg.strokeRoundedRect(cx - W/2 + 3, cy - H/2 + 3, W - 6, H - 6, R - 3);
    };
    draw(1);
    const txt = this.add.text(cx, cy, label, {
      fontSize: small ? '16px' : '22px', color: textColor,
      fontFamily: 'sans-serif', fontStyle: '700',
      stroke: '#FFFFFF', strokeThickness: 4,
    }).setOrigin(0.5);
    const zone = this.add.zone(cx, cy, W, H).setInteractive({ useHandCursor: true });
    zone.on('pointerdown', onClick);
    zone.on('pointerover', () => { draw(0.72); txt.setScale(1.04); });
    zone.on('pointerout',  () => { draw(1);    txt.setScale(1);    });
    return { bg, txt, zone };
  }

  // ─── コンテンツ管理 ───

  _track(obj) { this._content.push(obj); return obj; }

  _clearContent() {
    if (this._poll) { this._poll.remove(); this._poll = null; }
    this._content.forEach(o => { try { o.destroy(); } catch(_) {} });
    this._content = [];
    this.statusText.setText('').setColor('#7F6BAE');
  }

  _showMainButtons() {
    this._clearContent();
    const pn = this._playerName;
    const c = this._makeBtn(270, 250, '部屋を作る', () => this._showCreate(pn), 0xF6A7C8, '#C05A80');
    const j = this._makeBtn(530, 250, '部屋に入る', () => this._showJoin(pn),   0xA9DDF7, '#5BA7D1');
    this._content.push(c.bg, c.txt, c.zone, j.bg, j.txt, j.zone);
  }

  // ─── 部屋を作る ───

  async _showCreate(hostName) {
    this._clearContent();
    const roomCode = genRoomCode();

    this.statusText.setText('部屋を作成しています...');
    try {
      await this.store.create(roomCode, this.gameMode, hostName);
    } catch (e) {
      this.statusText.setText(`エラー: ${e.message}`).setColor('#E85D75');
      return;
    }

    this._track(this.add.text(400, 210, '部屋コード', {
      fontSize: '18px', color: '#9A6080', fontFamily: 'sans-serif', fontStyle: '700',
      stroke: '#FFFFFF', strokeThickness: 3,
    }).setOrigin(0.5));

    this._track(this.add.text(400, 282, roomCode, {
      fontSize: '72px', color: '#E85D75', fontFamily: 'monospace', fontStyle: '700',
      stroke: '#FFFFFF', strokeThickness: 9,
      backgroundColor: '#FFF0F4', padding: { x: 22, y: 8 },
    }).setOrigin(0.5));

    this._track(this.add.text(400, 352, 'このコードを対戦相手に教えてね！', {
      fontSize: '15px', color: '#7F6BAE', fontFamily: 'sans-serif',
      stroke: '#FFFFFF', strokeThickness: 3,
    }).setOrigin(0.5));

    const cancelBtn = this._makeBtn(400, 395, 'キャンセル', () => {
      this._showMainButtons();
    }, 0xCCBBCC, '#9A8CC2', true);
    this._content.push(cancelBtn.bg, cancelBtn.txt, cancelBtn.zone);

    let transitioning = false;
    let dots = 0;
    this.statusText.setText('相手が入室するのを待っています...');

    this._poll = this.time.addEvent({
      delay: 2000, repeat: -1,
      callback: () => {
        if (transitioning) return;
        dots = (dots + 1) % 4;
        this.statusText.setText('相手が入室するのを待っています' + '．'.repeat(dots));
        this.store.get(roomCode).then(room => {
          if (!room || transitioning) return;
          if (room.guest_name) {
            transitioning = true;
            if (this._poll) { this._poll.remove(); this._poll = null; }
            this.statusText.setText(`${room.guest_name} が入室！ゲームを開始します...`);
            const config = {
              roomCode, mode: this.gameMode, role: 'host',
              myName: hostName, opponentName: room.guest_name,
            };
            this.store.setPlaying(roomCode).catch(() => {}).finally(() => {
              setTimeout(() => goToBattleGame(this, config), 1200);
            });
          }
        }).catch(() => {});
      },
    });
  }

  // ─── 部屋に入る ───

  _showJoin(guestName) {
    this._clearContent();

    this._track(this.add.text(400, 220, '部屋コードを入力してね', {
      fontSize: '18px', color: '#9A6080', fontFamily: 'sans-serif', fontStyle: '700',
      stroke: '#FFFFFF', strokeThickness: 3,
    }).setOrigin(0.5));

    const wrapper = document.createElement('div');
    wrapper.style.cssText = [
      'background:rgba(255,253,247,0.95)',
      'border:4px solid #F6A7C8',
      'border-radius:16px',
      'padding:8px 16px',
      'box-shadow:inset 0 0 0 2px rgba(255,255,255,0.9),0 2px 8px rgba(246,167,200,0.3)',
      'box-sizing:border-box',
    ].join(';');

    const inp = document.createElement('input');
    inp.type = 'text';
    inp.maxLength = 4;
    inp.placeholder = 'XXXX';
    inp.autocomplete = 'off';
    inp.style.cssText = [
      'display:block',
      'width:160px',
      'font-size:28px',
      'text-align:center',
      'letter-spacing:12px',
      'padding:4px 0 4px 12px', // padding-left = letter-spacing でXX|XXの中心を揃える
      'border:none',
      'outline:none',
      'background:transparent',
      'color:#3d2b4e',
      'font-family:monospace',
      'font-weight:bold',
      'text-transform:uppercase',
      'pointer-events:auto',
      'box-sizing:border-box',
    ].join(';');
    inp.addEventListener('focus', () => {
      wrapper.style.borderColor = '#e85d75';
      wrapper.style.boxShadow = 'inset 0 0 0 2px rgba(255,255,255,0.9),0 3px 10px rgba(232,93,117,0.25)';
    });
    inp.addEventListener('blur', () => {
      wrapper.style.borderColor = '#F6A7C8';
      wrapper.style.boxShadow = 'inset 0 0 0 2px rgba(255,255,255,0.9),0 2px 8px rgba(246,167,200,0.3)';
    });
    wrapper.appendChild(inp);
    this._track(this.add.dom(400, 308, wrapper));
    const inputEl = inp;

    const confirmBtn = this._makeBtn(400, 385, '入 室', async () => {
      const code = inputEl.value.toUpperCase().trim();
      if (code.length !== 4) {
        this.statusText.setText('4文字のコードを入力してください');
        return;
      }
      confirmBtn.zone.disableInteractive();
      this.statusText.setText('部屋を探しています...');
      try {
        const room = await this.store.join(code, guestName);
        this.statusText.setText(`入室しました！ホストの合図を待っています...`);

        let transitioning = false;
        let dots = 0;
        this._poll = this.time.addEvent({
          delay: 1500, repeat: -1,
          callback: () => {
            if (transitioning) return;
            dots = (dots + 1) % 4;
            this.statusText.setText('ホストの合図を待っています' + '．'.repeat(dots));
            this.store.get(code).then(r => {
              if (!r || transitioning) return;
              if (r.status === 'playing') {
                transitioning = true;
                if (this._poll) { this._poll.remove(); this._poll = null; }
                this.statusText.setText('ゲーム開始！');
                setTimeout(() => goToBattleGame(this, {
                  roomCode: code, mode: r.mode ?? this.gameMode, role: 'guest',
                  myName: guestName, opponentName: r.host_name,
                }), 600);
              }
            }).catch(() => {});
          },
        });
      } catch (e) {
        this.statusText.setText(`エラー: ${e.message}`).setColor('#E85D75');
        confirmBtn.zone.setInteractive({ useHandCursor: true });
      }
    }, 0xF6A7C8, '#C05A80');
    this._content.push(confirmBtn.bg, confirmBtn.txt, confirmBtn.zone);

    const cancelBtn = this._makeBtn(400, 470, 'キャンセル', () => {
      this._showMainButtons();
    }, 0xCCBBCC, '#9A8CC2', true);
    this._content.push(cancelBtn.bg, cancelBtn.txt, cancelBtn.zone);
  }

  shutdown() {
    if (this._poll) { this._poll.remove(); this._poll = null; }
  }
}
