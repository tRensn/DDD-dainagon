# 実装ガイド - チームメイト向け

## 概要

このプロダクトは以下の4つの画面で構成されています：

| 画面 | 担当 | ファイル | 状態 |
|------|------|---------|------|
| ログイン・登録 | メイン | `scenes/login-scene.js` | ✅ 実装済み |
| ホーム | チームメイト1 | `scenes/home-scene.js` | 🔄 テンプレート提供 |
| ゲーム | チームメイト2 | `scenes/game-scene.js` | 🔄 テンプレート提供 |
| リザルト | メイン | `scenes/result-scene.js` | ✅ 実装済み |

## セットアップ

```bash
# 依存パッケージをインストール
npm install

# 開発サーバー起動
npm run dev

# テスト実行
npm test
```

サーバー起動後、ブラウザで `http://localhost:3000` を開いてください。

## 開発時のデバッグ

ログイン画面をスキップして、特定の画面から始めたい場合：

```
# ホーム画面から始める
http://localhost:3000/#home

# リザルト画面から始める
http://localhost:3000/#result
```

## ホーム画面の実装例

`scenes/home-scene.js` には最小テンプレートが用意されています。以下の機能を参考に拡張してください：

```js
import { appState } from '../state/app-state.js';
import { goToGame } from '../app-init.js';

export class HomeScene extends Phaser.Scene {
  constructor() {
    super({ key: 'HomeScene' });
  }

  create() {
    // appState.playerSession から現在のプレイヤー情報を取得
    const playerName = appState.playerSession?.playerName ?? 'Player';

    // ゲーム開始ボタン
    this.add.text(400, 300, 'ゲーム開始').setInteractive()
      .on('pointerdown', () => goToGame());

    // 遷移時は goToGame() を使用
  }
}
```

### 使用可能な API

```js
// 状態の読み込み
import { appState } from '../state/app-state.js';
const { playerName, accessToken } = appState.playerSession;

// 画面遷移
import { goToGame, goToHome, goToResult } from '../app-init.js';

// バックエンド API
import { BackendApi, createRankingStore } from '/src/backend/api.js';
const backendApi = new BackendApi({
  rankingStore: createRankingStore(window.DAINAGON_CONFIG ?? {})
});
const ranking = await backendApi.getRanking();
```

## ゲーム画面の実装例

`scenes/game-scene.js` には最小テンプレートが用意されています。以下の機能を参考に拡張してください：

```js
import { appState, setLastGameResult } from '../state/app-state.js';
import { goToResult } from '../app-init.js';

export class GameScene extends Phaser.Scene {
  create() {
    // ゲームロジック実装
  }

  finishGame() {
    const score = 1234;  // ゲーム結果から計算

    // リザルト画面へスコアを渡す
    setLastGameResult({
      score: score,
      gameId: `game-${Date.now()}`,
      // 必要に応じて他のデータも追加
    });

    goToResult(score);
  }
}
```

### 重要なポイント

1. **状態管理の使用**
   - `appState` から必要なデータを読み込む
   - 状態を更新する場合は、`setState*()` 関数を使用

2. **画面遷移**
   - 画面間の遷移は `goToXxx()` 関数を使用
   - 遷移時にデータを渡す場合は `setLastGameResult()` を使用

3. **Git コンフリクト回避**
   - 自分の `scenes/*.js` ファイルのみを編集
   - `src/constants.js` の変更は事前に相談
   - `app-init.js`, `state/app-state.js` に直接変更を加えない

4. **テストの維持**
   - `src/backend/**` のテストを破壊しない
   - 新しい機能のテストがあれば `test/` に追加

## コンフリクト回避チェックリスト

実装前に確認：

- [ ] 自分の `scenes/*.js` ファイルだけを編集しているか
- [ ] `appState` からデータを読み込んでいるか
- [ ] 画面遷移に `goToXxx()` 関数を使用しているか
- [ ] `src/constants.js` に変更を加えていないか
- [ ] `npm test` が通るか

## 問題が起きた場合

### ビルドエラー
```bash
# キャッシュをクリア
rm -rf node_modules package-lock.json
npm install
npm run dev
```

### Import エラー
ファイルパスの確認：
- 相対パス: `../state/app-state.js`
- 絶対パス: `/src/backend/api.js`, `/src/constants.js`

### 画面が遷移しない
`app-init.js` の遷移関数が正しく呼び出されているか確認：
```js
// ✅ 正しい
goToResult(score);

// ❌ 間違い
this.scene.start('ResultScene');
```

## 参考資料

- [Phaser 3 ドキュメント](https://photonstorm.github.io/phaser3-docs/)
- `docs/architecture.md` - ファイル構成とコンフリクト対策
- `AGENTS.md` - チーム開発のルール
- `docs/data-contract.md` - API 仕様
