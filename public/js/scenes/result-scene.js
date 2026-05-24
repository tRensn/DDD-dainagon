import { BackendApi, createRankingStore, DEFAULT_GRAVITY_RANKING_TABLE, DEFAULT_TIMED_RANKING_TABLE, DEFAULT_GRAVITY_TIMED_RANKING_TABLE } from '/src/backend/api.js';
import { appState } from '../state/app-state.js';
import { goToGame, goToGravityGame, goToHome } from '../app-init.js';

const configEnv = window.DAINAGON_CONFIG ?? {};
const normalBackendApi = new BackendApi({
  rankingStore: createRankingStore(configEnv),
});
const gravityBackendApi = new BackendApi({
  rankingStore: createRankingStore(configEnv, {
    table: configEnv.SUPABASE_GRAVITY_RANKING_TABLE || DEFAULT_GRAVITY_RANKING_TABLE,
  }),
});
const normalTimedBackendApi = new BackendApi({
  rankingStore: createRankingStore(configEnv, {
    table: configEnv.SUPABASE_TIMED_RANKING_TABLE || DEFAULT_TIMED_RANKING_TABLE,
  }),
});
const gravityTimedBackendApi = new BackendApi({
  rankingStore: createRankingStore(configEnv, {
    table: configEnv.SUPABASE_GRAVITY_TIMED_RANKING_TABLE || DEFAULT_GRAVITY_TIMED_RANKING_TABLE,
  }),
});

// スコアに応じてアイスのスクープ数を決める閾値
const SCOOP_THRESHOLDS = [5, 20, 50, 100];

// 左パネル設定
const LEFT_CX = 185;

// 右パネル設定
const PANEL = { x: 368, y: 40, w: 414, h: 468, r: 12 };
const PANEL_CX = PANEL.x + PANEL.w / 2;

export class ResultScene extends Phaser.Scene {
  constructor() {
    super({ key: 'ResultScene' });
  }

  preload() {
    if (!this.textures.exists('result-cone'))
      this.load.image('result-cone',       '/assets/images/コーン.png');
    if (!this.textures.exists('result-mint'))
      this.load.image('result-mint',       '/assets/images/チョコミント.png');
    if (!this.textures.exists('result-cookie'))
      this.load.image('result-cookie',     '/assets/images/クッキーアンドクリーム.png');
    if (!this.textures.exists('result-strawberry'))
      this.load.image('result-strawberry', '/assets/images/ストロベリー.png');
    if (!this.textures.exists('result-azuki'))
      this.load.image('result-azuki',      '/assets/images/あずき.png');
  }

  init(data) {
    this.score        = Number.isFinite(data?.score) ? data.score : 0;
    this.maxChain     = data?.maxChain     ?? 0;
    this.erasedCounts = data?.erasedCounts ?? [0, 0, 0, 0];
    // erasedCounts インデックス: 0=あずき, 1=クッキー, 2=ストロベリー, 3=チョコミント
    this.totalErased  = this.erasedCounts.reduce((a, b) => a + b, 0);
    this.mode         = data?.mode ?? 'normal';
    this.timeLimitOn  = data?.timeLimitOn  ?? false;
    this.timeUp       = data?.timeUp       ?? false;
  }

  create() {
    const isGravity = this.mode === 'gravity';
    this._untimedApi = isGravity ? gravityBackendApi      : normalBackendApi;
    this._timedApi   = isGravity ? gravityTimedBackendApi : normalTimedBackendApi;
    this._api        = this.timeLimitOn ? this._timedApi : this._untimedApi;

    // 背景: クリーム色
    this.cameras.main.setBackgroundColor('#FFF5DC');

    // 画像の白・黒背景を透過処理
    ['result-cone', 'result-mint', 'result-cookie', 'result-strawberry', 'result-azuki']
      .forEach(key => this._removeBackground(key));

    this._drawLeftPanel();
    this._drawRightPanel();
    this._drawButtons();
  }

  // 画像の外周ピクセル色を自動検出し、その色をフラッドフィルで透過する
  // グリーンバック・白・黒など背景色に関わらず動作する
  _removeBackground(key, tolerance = 60) {
    const texture = this.textures.get(key);
    if (!texture || texture.key === '__MISSING') return;

    const img = texture.getSourceImage();
    const w = img.naturalWidth  || img.width;
    const h = img.naturalHeight || img.height;
    if (!w || !h) return;

    const canvas = document.createElement('canvas');
    canvas.width  = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    ctx.drawImage(img, 0, 0);

    const imageData = ctx.getImageData(0, 0, w, h);
    const data = imageData.data;

    // 四隅のピクセルから背景色を決定（最も多数決）
    const corners = [0, w - 1, (h - 1) * w, (h - 1) * w + w - 1];
    const samples = corners.map(pos => {
      const i = pos * 4;
      return [data[i], data[i + 1], data[i + 2]];
    });
    // 四隅の平均色を背景色とする
    const bgR = Math.round(samples.reduce((s, c) => s + c[0], 0) / 4);
    const bgG = Math.round(samples.reduce((s, c) => s + c[1], 0) / 4);
    const bgB = Math.round(samples.reduce((s, c) => s + c[2], 0) / 4);

    // 背景色との色距離が tolerance 以内なら背景とみなす
    const isBg = (pos) => {
      const i = pos * 4;
      const dr = data[i] - bgR, dg = data[i + 1] - bgG, db = data[i + 2] - bgB;
      return Math.sqrt(dr * dr + dg * dg + db * db) < tolerance;
    };

    // 四隅からフラッドフィルで背景を透過
    const visited = new Uint8Array(w * h);
    const stack   = [...corners];

    while (stack.length) {
      const pos = stack.pop();
      if (pos < 0 || pos >= w * h || visited[pos]) continue;
      visited[pos] = 1;
      if (!isBg(pos)) continue;

      data[pos * 4 + 3] = 0; // 透過

      const x = pos % w, y = Math.floor(pos / w);
      if (x > 0)     stack.push(pos - 1);
      if (x < w - 1) stack.push(pos + 1);
      if (y > 0)     stack.push(pos - w);
      if (y < h - 1) stack.push(pos + w);
    }

    ctx.putImageData(imageData, 0, 0);
    this.textures.remove(key);
    this.textures.addCanvas(key, canvas);
  }

  // ===== 左パネル: アイスの塔 =====

  _drawLeftPanel() {
    const scoopCount = this._getScoopCount();

    const levelLabels = ['もう少し！', 'ナイス！', 'グッド！', 'スーパー！', 'パーフェクト！'];
    this.add.text(LEFT_CX, 28, 'アイスの塔', {
      fontSize: '20px', color: '#8B5E3C', fontFamily: 'sans-serif', fontStyle: '700',
    }).setOrigin(0.5, 0);

    this.add.text(LEFT_CX, 54, levelLabels[scoopCount], {
      fontSize: '15px', color: '#C07830', fontFamily: 'sans-serif', fontStyle: '700',
    }).setOrigin(0.5, 0);

    // コーン（フェードイン）
    const cone = this.add.image(LEFT_CX, 560, 'result-cone')
      .setDisplaySize(560, 280)
      .setAlpha(0);
    this.tweens.add({ targets: cone, alpha: 1, duration: 300, ease: 'Power2' });

    // スクープ定義（後に描くほど手前に来る）
    const scoops = [
      { key: 'result-mint',       y: 437 },
      { key: 'result-cookie',     y: 343 },
      { key: 'result-strawberry', y: 253 },
      { key: 'result-azuki',      y: 167 },
    ];

    // スクープを上から落下 + バウンスアニメーション
    for (let i = 0; i < scoopCount; i++) {
      const finalY  = scoops[i].y;
      const scoop   = this.add.image(LEFT_CX, finalY - 120, scoops[i].key)
        .setDisplaySize(370, 210)
        .setAlpha(0);

      this.tweens.add({
        targets:  scoop,
        y:        finalY,
        alpha:    1,
        duration: 480,
        delay:    450 + i * 420,
        ease:     'Bounce.Out',
      });
    }

  }

  _getScoopCount() {
    for (let i = SCOOP_THRESHOLDS.length - 1; i >= 0; i--) {
      if (this.score >= SCOOP_THRESHOLDS[i]) return i + 1;
    }
    return 0;
  }

  // ===== 右パネル: 結果詳細 =====

  _drawRightPanel() {
    const g = this.add.graphics();

    // パネル背景・枠
    g.fillStyle(0xFFFBF0, 1);
    g.fillRoundedRect(PANEL.x, PANEL.y, PANEL.w, PANEL.h, PANEL.r);
    g.lineStyle(2, 0xC8965A, 1);
    g.strokeRoundedRect(PANEL.x, PANEL.y, PANEL.w, PANEL.h, PANEL.r);

    let y = PANEL.y + 18;

    // タイトル
    this.add.text(PANEL_CX, y, 'GAME RESULT', {
      fontSize: '19px', color: '#8B5E3C', fontFamily: 'sans-serif', fontStyle: '700',
    }).setOrigin(0.5, 0);
    y += 28;

    // スコア（大）
    this.add.text(PANEL_CX, y, formatScore(this.score), {
      fontSize: '54px', color: '#C05A00', fontFamily: 'monospace', fontStyle: '700',
    }).setOrigin(0.5, 0);
    y += 62;

    // 登録ステータス
    this.saveStatusText = this.add.text(PANEL_CX, y, '', {
      fontSize: '12px', color: '#22A060', fontFamily: 'sans-serif',
    }).setOrigin(0.5, 0);
    y += 18;

    this._sep(g, y + 4); y += 14;

    // ===== 詳細結果 =====
    this.add.text(PANEL_CX, y, '詳細結果', {
      fontSize: '14px', color: '#8B5E3C', fontFamily: 'sans-serif', fontStyle: '700',
    }).setOrigin(0.5, 0);
    y += 22;

    const stats = [
      ['最大連鎖数',         `${this.maxChain} 連鎖`],
      ['消去数（合計）',     `${this.totalErased} 個`],
      ['　チョコミント',     `${this.erasedCounts[3]} 個`],
      ['　クッキー&クリーム',`${this.erasedCounts[1]} 個`],
      ['　ストロベリー',     `${this.erasedCounts[2]} 個`],
      ['　大納言あずき',     `${this.erasedCounts[0]} 個`],
    ];

    const lx = PANEL.x + 18;
    const rx = PANEL.x + PANEL.w - 18;

    stats.forEach(([label, value], i) => {
      const color = i >= 2 ? '#8B7A60' : '#5C4A2A';
      this.add.text(lx, y, label, {
        fontSize: '13px', color, fontFamily: 'sans-serif',
      });
      this.add.text(rx, y, value, {
        fontSize: '13px', color, fontFamily: 'monospace', fontStyle: '700',
      }).setOrigin(1, 0);
      y += 21;
    });

    y += 4;
    this._sep(g, y + 4); y += 14;

    // ===== ランキング =====
    this.add.text(PANEL_CX, y, 'ランキング', {
      fontSize: '14px', color: '#8B5E3C', fontFamily: 'sans-serif', fontStyle: '700',
    }).setOrigin(0.5, 0);
    y += 18;

    // 左列: 通常、右列: 時間制限  中央に区切り線
    const midX = PANEL.x + PANEL.w / 2;
    const lCX  = (PANEL.x + 14 + midX - 4) / 2;
    const rCX  = (midX + 4 + PANEL.x + PANEL.w - 14) / 2;

    this.add.text(lCX, y, '通常', {
      fontSize: '12px', color: '#8B6040', fontFamily: 'sans-serif', fontStyle: '700',
    }).setOrigin(0.5, 0);
    this.add.text(rCX, y, '時間制限（60秒）', {
      fontSize: '12px', color: '#C05A80', fontFamily: 'sans-serif', fontStyle: '700',
    }).setOrigin(0.5, 0);
    y += 16;

    // 縦区切り線
    const rankingG = this.add.graphics();
    rankingG.lineStyle(1, 0xC8965A, 0.5);
    rankingG.beginPath();
    rankingG.moveTo(midX, y);
    rankingG.lineTo(midX, y + 100);
    rankingG.strokePath();

    this._rankingStartY = y;
    this._rankingMidX   = midX;

    const phL = this.add.text(lCX, y + 30, '読み込み中...', {
      fontSize: '11px', color: '#A0907A', fontFamily: 'sans-serif',
    }).setOrigin(0.5, 0);
    const phR = this.add.text(rCX, y + 30, '読み込み中...', {
      fontSize: '11px', color: '#A0907A', fontFamily: 'sans-serif',
    }).setOrigin(0.5, 0);

    this.autoSaveAndRenderRanking(phL, phR);
  }

  _sep(g, y) {
    g.lineStyle(1, 0xC8965A, 0.4);
    g.beginPath();
    g.moveTo(PANEL.x + 14, y);
    g.lineTo(PANEL.x + PANEL.w - 14, y);
    g.strokePath();
  }

  _drawButtons() {
    const by = PANEL.y + PANEL.h + 26;
    const bx = PANEL.x;
    const bw = PANEL.w;

    this.add.text(bx + bw * 0.3, by, 'リスタート', {
      fontSize: '20px', color: '#ffffff', fontFamily: 'sans-serif', fontStyle: '700',
      backgroundColor: '#C05A00', padding: { x: 18, y: 9 },
    }).setOrigin(0.5).setInteractive({ useHandCursor: true })
      .on('pointerdown', () => this.mode === 'gravity' ? goToGravityGame(this.timeLimitOn) : goToGame(this.timeLimitOn));

    this.add.text(bx + bw * 0.75, by, 'ホーム', {
      fontSize: '20px', color: '#ffffff', fontFamily: 'sans-serif', fontStyle: '700',
      backgroundColor: '#8B5E3C', padding: { x: 18, y: 9 },
    }).setOrigin(0.5).setInteractive({ useHandCursor: true })
      .on('pointerdown', () => goToHome());
  }

  // ===== スコア登録 & ランキング表示 =====

  async autoSaveAndRenderRanking(phL, phR) {
    // 時間制限ONでゲームオーバー（時間切れ以外）の場合はランキング登録しない
    const canSave = !this.timeLimitOn || this.timeUp;
    if (appState.playerSession) {
      if (!canSave) {
        this.saveStatusText.setText('時間切れ以外の終了のため登録されません');
        this.saveStatusText.setColor('#B090A8');
      } else {
        this.saveStatusText.setText('スコアを登録しています...');
        try {
          await this._api.saveScore(appState.playerSession.playerName, this.score, {
            accessToken: appState.playerSession.accessToken,
            gameId: `game-${Date.now()}`,
          });
          this.saveStatusText.setText('ランキングに登録しました！');
        } catch (error) {
          this.saveStatusText.setText(toFriendlyError(error));
          this.saveStatusText.setColor('#fecaca');
        }
      }
    }
    await Promise.all([
      this._renderRankingColumn(this._untimedApi, phL, 'left'),
      this._renderRankingColumn(this._timedApi,   phR, 'right'),
    ]);
  }

  async _renderRankingColumn(api, placeholder, side) {
    const midX = this._rankingMidX;
    const isLeft = side === 'left';
    const colL = isLeft ? PANEL.x + 14       : midX + 4;
    const colR = isLeft ? midX - 4            : PANEL.x + PANEL.w - 14;
    const colW = colR - colL;
    const nameX = colL + 18;
    const scoreX = colR;
    const rankX  = colL + 2;

    try {
      const ranking = await api.getRanking();
      placeholder.destroy();

      if (ranking.length === 0) {
        this.add.text(colL + colW / 2, this._rankingStartY + 30, 'まだ記録なし', {
          fontSize: '11px', color: '#A0907A', fontFamily: 'sans-serif',
        }).setOrigin(0.5, 0);
        return;
      }

      let y = this._rankingStartY;
      ranking.slice(0, 5).forEach((entry, i) => {
        const color = i === 0 ? '#C05A00' : '#5C4A2A';
        this.add.text(rankX, y, `${i + 1}.`, {
          fontSize: '11px', color, fontFamily: 'monospace', fontStyle: '700',
        });
        const maxNameW = colW - 44;
        const name = entry.playerName.length > 6 ? entry.playerName.slice(0, 6) + '…' : entry.playerName;
        this.add.text(nameX, y, name, {
          fontSize: '11px', color: '#5C4A2A', fontFamily: 'sans-serif',
        });
        this.add.text(scoreX, y, formatScore(entry.score), {
          fontSize: '11px', color, fontFamily: 'monospace', fontStyle: '700',
        }).setOrigin(1, 0);
        y += 18;
      });
    } catch (error) {
      placeholder.setText('エラー');
      placeholder.setColor('#fecaca');
    }
  }
}

// ===== Utility =====

function formatScore(score) {
  const n = Number.isFinite(Number(score)) ? Number(score) : 0;
  return String(n);
}

function toFriendlyError(error) {
  const message = error instanceof Error ? error.message : String(error);
  if (message.includes('Player name is already registered') || message.includes('duplicate key') || message.includes('23505'))
    return 'このプレイヤー名はすでに登録されています。';
  if (message.includes('Invalid login credentials'))
    return 'プレイヤー名またはパスワードが違います。';
  if (message.includes('email confirmation'))
    return 'Supabase Auth のメール確認をオフにしてください。';
  if (message.includes('over_email_send_rate_limit'))
    return '少し待ってから再登録してください。';
  return message;
}
