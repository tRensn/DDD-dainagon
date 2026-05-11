# Hackathon Workflow

## Branches

- `main`: 発表できる状態だけを置く。
- `feature/frontend-*`: Phaser の画面・入力・演出。
- `feature/backend-*`: 判定・スコア・ランキング・状態管理。
- `feature/assets-*`: 画像・音声差し替え。

## Conflict Prevention

- 共有値は `src/constants.js` に集約する。
- データ構造は `src/shared/models.js` と `docs/data-contract.md` を優先する。
- Phaser 側は `src/backend/logic.js` を直接変更せず、必要な変更はバックエンド担当に相談する。
- 画像と音声は `docs/assets.md` のファイル名で差し替える。

## Recommended Flow

1. 作業前に `main` を取り込む。
2. 小さいブランチを切る。
3. 保存時に ESLint / Prettier を通す。
4. PR を出して CodeRabbit とチームメンバーの確認を受ける。
5. 発表直前は `main` に動くものだけマージする。
