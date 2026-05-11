# Team Coding Guide

このリポジトリはハッカソン発表用の Phaser アイスパズルゲームです。

## 優先順位

1. Git のコンフリクトを減らすため、共通定数とデータ構造を先に使う。
2. Phaser の描画処理と、判定・スコア・ランキング処理を混ぜない。
3. 仮素材でも動く状態を保つ。

## 担当境界

- `src/backend/`: 描画に依存しない判定、状態、ランキングAPIのモック。
- `src/shared/`: フロントとバックエンドで共有するデータモデル。
- `public/js/`: Phaser の Scene、描画、入力、アニメーション。
- `public/assets/`: 画像・音声・フォント。ファイル名は `docs/assets.md` に合わせる。

## PR 前チェック

- 保存時に Prettier / ESLint を通す。
- 共有定数を増やしたら `docs/data-contract.md` も更新する。
- 直接 `main` に大きな変更を入れず、機能単位のブランチで作業する。
