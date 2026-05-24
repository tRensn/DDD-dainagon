import { goToHome, goToBattleGame } from '../app-init.js';

export class BattleResultScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BattleResultScene' });
  }

  init(data) {
    this.roomCode        = data?.roomCode;
    this.role            = data?.role ?? 'host';
    this.myName          = data?.myName ?? 'あなた';
    this.opponentName    = data?.opponentName ?? '相手';
    this.myScore         = data?.myScore ?? 0;
    this.mode            = data?.mode ?? 'normal';
    this.store           = data?.store ?? null;
    this._rematchPending = false;
    this._battleConfig   = {
      roomCode: data?.roomCode,
      role:     data?.role ?? 'host',
      myName:   data?.myName ?? 'あなた',
      opponentName: data?.opponentName ?? '相手',
      mode:     data?.mode ?? 'normal',
    };
  }

  create() {
    this.cameras.main.setBackgroundColor('#FFF5DC');

    const g = this.add.graphics();
    g.fillStyle(0xFFEAF4, 1); g.fillRect(0, 0, 800, 600);
    g.fillStyle(0xE8F8F5, 1); g.fillCircle(100, 100, 90); g.fillCircle(700, 480, 120);
    g.fillStyle(0xFFF7C8, 1); g.fillCircle(630, 100, 75);
    g.fillStyle(0xDDEBFF, 1); g.fillCircle(90, 490, 110);

    this.add.text(400, 52, '⚔ 対戦結果', {
      fontSize: '42px', color: '#E85D75', fontFamily: 'sans-serif', fontStyle: '700',
      stroke: '#FFFFFF', strokeThickness: 8,
    }).setOrigin(0.5).setShadow(2, 3, '#F6A7C8', 3, true, true);

    // 自分のスコア
    this._drawScoreCard(200, 200, this.myName, this.myScore, 0xF6A7C8, '#C05A80', true);

    // 相手スコア（ポーリングで取得）
    this.oppScoreLabel = this._drawScoreCard(600, 200, this.opponentName, null, 0xA9DDF7, '#5BA7D1', false);

    this.resultText = this.add.text(400, 370, '結果を集計しています...', {
      fontSize: '22px', color: '#7F6BAE', fontFamily: 'sans-serif', fontStyle: '700',
      stroke: '#FFFFFF', strokeThickness: 5, align: 'center',
    }).setOrigin(0.5).setShadow(2, 2, '#F6A7C8', 2, true, true);

    this._makeBtn(400, 470, 'もう一度対戦', () => this._requestRematch(), 0xF6A7C8, '#C05A80');

    this._makeBtn(400, 530, 'ホームに戻る', () => goToHome(), 0xCCBBCC, '#9A8CC2', true);

    // 相手の結果をポーリング（最大15秒待機）
    this._pollOpponent();
  }

  _drawScoreCard(cx, cy, name, score, strokeHex, textColor, isMe) {
    const W = 270, H = 140, R = 16;
    const g = this.add.graphics();
    g.fillStyle(0xFFFDF7, 0.94);
    g.fillRoundedRect(cx - W/2, cy - H/2, W, H, R);
    g.lineStyle(5, strokeHex, 1);
    g.strokeRoundedRect(cx - W/2, cy - H/2, W, H, R);
    g.lineStyle(2, 0xFFFFFF, 0.9);
    g.strokeRoundedRect(cx - W/2 + 4, cy - H/2 + 4, W - 8, H - 8, R - 3);

    if (isMe) {
      this.add.text(cx, cy - H/2 + 22, 'あなた', {
        fontSize: '14px', color: '#9A6080', fontFamily: 'sans-serif', fontStyle: '700',
        stroke: '#FFFFFF', strokeThickness: 3,
      }).setOrigin(0.5);
    }

    this.add.text(cx, isMe ? cy - H/2 + 42 : cy - H/2 + 26, name, {
      fontSize: '18px', color: textColor, fontFamily: 'sans-serif', fontStyle: '700',
      stroke: '#FFFFFF', strokeThickness: 4,
    }).setOrigin(0.5);

    const scoreText = this.add.text(cx, cy + 20, score !== null ? String(score) : '...', {
      fontSize: '52px', color: textColor, fontFamily: 'sans-serif', fontStyle: '700',
      stroke: '#FFFFFF', strokeThickness: 7,
    }).setOrigin(0.5).setShadow(2, 2, '#F6A7C8', 2, false, true);

    this.add.text(cx, cy + H/2 - 14, 'pts', {
      fontSize: '16px', color: '#9A8CC2', fontFamily: 'sans-serif',
    }).setOrigin(0.5);

    return scoreText;
  }

  async _pollOpponent() {
    if (!this.store || !this.roomCode) {
      this._showResult(this.myScore, 0);
      return;
    }

    const maxWait = 90000;
    const interval = 2000;
    let elapsed = 0;
    let lastOppScore = 0;

    const poll = async () => {
      const room = await this.store.get(this.roomCode).catch(() => null);
      const oppFinished = this.role === 'host' ? room?.guest_finished : room?.host_finished;
      const oppScore    = this.role === 'host' ? (room?.guest_score ?? 0) : (room?.host_score ?? 0);
      lastOppScore = oppScore;

      if (this.oppScoreLabel?.active) this.oppScoreLabel.setText(String(oppScore));

      if (oppFinished) {
        this._showResult(this.myScore, oppScore);
        return;
      }

      elapsed += interval;
      if (elapsed >= maxWait) {
        this._showResult(this.myScore, lastOppScore);
        return;
      }

      this.time.delayedCall(interval, poll);
    };

    this.time.delayedCall(interval, poll);
  }

  _showResult(myScore, oppScore) {
    if (!this.resultText?.active) return;

    if (myScore > oppScore) {
      this.resultText.setText('🎉 あなたの勝ち！').setColor('#E85D75');
      this._showFireworks();
    } else if (myScore < oppScore) {
      this.resultText.setText('😢 負け... またチャレンジ！').setColor('#5BA7D1');
    } else {
      this.resultText.setText('🤝 引き分け！').setColor('#7F6BAE');
    }
  }

  _showFireworks() {
    for (let i = 0; i < 8; i++) {
      this.time.delayedCall(i * 180, () => {
        const x = Phaser.Math.Between(100, 700);
        const y = Phaser.Math.Between(80, 300);
        const colors = [0xF6A7C8, 0xA9DDF7, 0xFFE68A, 0xA9E8D1];
        const g = this.add.graphics();
        for (let j = 0; j < 8; j++) {
          const angle = (j / 8) * Math.PI * 2;
          const r = Phaser.Math.Between(18, 32);
          g.fillStyle(colors[j % colors.length], 1);
          g.fillCircle(x + Math.cos(angle) * r, y + Math.sin(angle) * r, 5);
        }
        this.tweens.add({ targets: g, alpha: 0, scale: 1.6, duration: 700,
          ease: 'Cubic.easeOut', onComplete: () => g.destroy() });
      });
    }
  }

  _requestRematch() {
    if (this._rematchPending) return;
    this._rematchPending = true;

    if (!this.store || !this.roomCode) { goToHome(); return; }

    if (this.resultText?.active) {
      this.resultText.setText('相手の応答を待っています...').setColor('#7F6BAE');
    }

    const { roomCode, role, myName, opponentName, mode } = this._battleConfig;
    this.store.setRematch(roomCode, role).catch(() => {});

    const maxWait = 10000;
    const interval = 2000;
    let elapsed = 0;

    const checkRematch = () => {
      if (!this.sys.isActive()) return;
      this.store.get(roomCode).then(room => {
        if (!room || !this.sys.isActive()) return;

        if (role === 'host') {
          if (room.guest_rematch) {
            this.store.resetForRematch(roomCode).catch(() => {}).finally(() => {
              if (this.sys.isActive()) goToBattleGame(this, { roomCode, role: 'host', myName, opponentName, mode });
            });
            return;
          }
        } else {
          // guest: ホストがリセットした = guest_rematch と host_finished が両方 false になる
          if (!room.guest_rematch && !room.host_finished && !room.guest_finished) {
            goToBattleGame(this, {
              roomCode, role: 'guest', myName,
              opponentName: room.host_name ?? opponentName,
              mode: room.mode ?? mode,
            });
            return;
          }
        }

        elapsed += interval;
        if (elapsed >= maxWait) {
          if (this.resultText?.active) this.resultText.setText('相手が応答しませんでした').setColor('#B090A8');
          setTimeout(() => goToHome(), 3000);
          return;
        }
        setTimeout(checkRematch, interval);
      }).catch(() => {
        elapsed += interval;
        if (elapsed >= maxWait) {
          if (this.resultText?.active) this.resultText.setText('相手が応答しませんでした').setColor('#B090A8');
          setTimeout(() => goToHome(), 3000);
        } else {
          setTimeout(checkRematch, interval);
        }
      });
    };

    setTimeout(checkRematch, interval);
  }

  _makeBtn(cx, cy, label, onClick, strokeHex = 0xF6A7C8, textColor = '#7F6BAE', small = false) {
    const W = small ? 160 : 230, H = small ? 40 : 52, R = 12;
    const bg = this.add.graphics();
    const draw = alpha => {
      bg.clear();
      bg.fillStyle(0xFFFDF7, alpha);
      bg.fillRoundedRect(cx - W/2, cy - H/2, W, H, R);
      bg.lineStyle(4, strokeHex, 1);
      bg.strokeRoundedRect(cx - W/2, cy - H/2, W, H, R);
    };
    draw(1);
    const txt = this.add.text(cx, cy, label, {
      fontSize: small ? '16px' : '20px', color: textColor,
      fontFamily: 'sans-serif', fontStyle: '700',
      stroke: '#FFFFFF', strokeThickness: 4,
    }).setOrigin(0.5);
    const zone = this.add.zone(cx, cy, W, H).setInteractive({ useHandCursor: true });
    zone.on('pointerdown', onClick);
    zone.on('pointerover', () => { draw(0.72); txt.setScale(1.04); });
    zone.on('pointerout',  () => { draw(1);    txt.setScale(1);    });
  }
}
