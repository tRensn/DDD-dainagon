# アーキテクチャ・ガイド

## ファイル構成

```
public/js/
  ├── game-app.js              ← メインエントリ、シーン登録のみ
  ├── scenes/
  │   ├── login-scene.js       ← ログイン・登録画面（既存 game-app に統合）
  │   ├── home-scene.js        ← ホーム画面（チームメイト1）
  │   ├── game-scene.js        ← ゲーム画面（チームメイト2）
  │   └── result-scene.js      ← リザルト画面
  ├── ui/
  │   └── login-panel.js       ← ログインUIコンポーネント（再利用可）
  └── state/
      └── app-state.js         ← グローバル状態管理（全画面で共有）

src/backend/
  └── api.js                   ← バックエンド API（既存）

src/shared/
  ├── constants.js             ← ゲーム定数（既存）
  └── models.js                ← データ型定義
```

## シーン間データ遷移（競合なし）

```
ログイン画面 → app-state に playerSession 保存
    ↓
ホーム画面 ← app-state から playerSession 読み込み
    ↓
ゲーム画面（player 情報を使ってプレイ）
    ↓
リザルト画面 ← ゲーム画面で設定した {score, gameId}
    ↓
ランキング表示・登録（app-state.playerSession.accessToken 使用）
```

## コンフリクト回避の原則

### ✅ 各自が触るファイル

- `LoginScene` の実装 → `scenes/login-scene.js` のみ
- `HomeScene` の実装 → `scenes/home-scene.js` のみ
- `GameScene` の実装 → `scenes/game-scene.js` のみ
- `ResultScene` の実装 → `scenes/result-scene.js` のみ

### ⚠️ 共有ファイルは事前合意

- `public/js/game-app.js` ← シーン登録、遷移ロジックのみ（メインの人が管理）
- `src/shared/models.js` ← 全員で参照、型定義は中央管理
- `src/constants.js` ← 定数追加は PR で相談
- `public/js/state/app-state.js` ← 状態形状を契約で定義

### 🔒 アンタッチ推奨

- `src/backend/api.js`
- `test/**/*`

## 状態管理パターン

### app-state.js（単一の真実ソース）

```js
export const appState = {
  // ユーザー認証
  playerSession: null, // {playerName, accessToken, ...}

  // 現在のゲーム結果
  lastGameResult: null, // {score, gameId, matches, ...}

  // UI 状態
  isLoading: false,
};

export function setPlayerSession(session) {
  appState.playerSession = session;
}

export function setLastGameResult(result) {
  appState.lastGameResult = result;
}
```

各シーンは `appState` から読み込む、書き込みは関数経由。

## 画面遷移の実装

### game-app.js（シーン管理の中核）

```js
const game = new Phaser.Game({
  type: Phaser.AUTO,
  scene: [LoginScene, HomeScene, GameScene, ResultScene],
  // ...
});

// 遷移ヘルパー
export function goToHome() {
  game.scene.stop('LoginScene');
  game.scene.start('HomeScene');
}

export function goToGame() {
  game.scene.stop('HomeScene');
  game.scene.start('GameScene');
}

export function goToResult() {
  game.scene.stop('GameScene');
  game.scene.start('ResultScene');
}

export function goToLogin() {
  game.scene.stop('HomeScene');
  game.scene.stop('GameScene');
  game.scene.stop('ResultScene');
  game.scene.start('LoginScene');
}
```

### 各シーンでの使用例

```js
// LoginScene → ログイン成功時
import { setPlayerSession, goToHome } from '../game-app.js';

setPlayerSession(sessionData);
goToHome();

// HomeScene → ゲーム開始時
import { goToGame } from '../game-app.js';

goToGame();

// GameScene → ゲーム終了時
import { setLastGameResult, goToResult } from '../game-app.js';

setLastGameResult({score: 1200, gameId: ...});
goToResult();

// ResultScene → ランキング登録後
import { goToHome } from '../game-app.js';

await backendApi.saveScore(appState.playerSession.playerName, score, ...);
goToHome();
```

## チームメイト作業時のチェックリスト

- [ ] シーンファイルを `scenes/` に作成
- [ ] `appState` から必要なデータを読み込み
- [ ] 他の人の `scenes/*.js` に触らない
- [ ] 画面遷移は `goToXxx()` 関数を使う
- [ ] テストデータ使用時は `console.log` で共有
- [ ] PR 前に `src/constants.js` の変更を確認

## 初期状態でも動作確認

```js
// LoginScene から始まる
// ログインなしで進むため、appState.playerSession を仮に設定
if (!appState.playerSession) {
  appState.playerSession = {
    playerName: 'test-player',
    accessToken: 'test-token',
  };
}

// こうするとホーム画面以降は仮素材でも動く
```
