# Data Contract

フロントエンドとバックエンドで共有する最小契約です。迷ったらこの形に合わせてください。

## Ice Model

```js
{
  id: 'ice_001',
  type: 'dainagon_azuki',
  isFrozen: false,
  meltLevel: 0,
  placedAt: 0,
  x: 0,
  y: 0,
}
```

- `type`: `src/constants.js` の `ICE_TYPES` を使う。
- 有効な `type`: `dainagon_azuki`, `strawberry`, `cookie_and_cream`, `choco_mint`
- `meltLevel`: `0` から `100`。`100` で溶け切り。
- `x`, `y`: グリッド座標。Phaser のピクセル座標ではない。

## Grid

```js
[
  ['dainagon_azuki', 'strawberry', null],
  ['cookie_and_cream', 'dainagon_azuki', null],
  ['choco_mint', 'strawberry', 'dainagon_azuki'],
];
```

- 空セルは `null` を推奨。
- 3つ並び判定は `findMatchThree(grid)` を使う。
- 戻り値の座標は `{ x, y }`。
- スコア計算は `calculateMatchScore(matchCount, { iceType })` を使う。
- 複数グループの同時消しは `calculateClearScore(matches, { chainCombo })` を使う。
- 3個未満は消去不可。`calculateMatchScore()` に渡すと例外になる。
- コンボは連鎖コンボのみ採用。同時消しコンボ、時間内コンボは採用しない。
- 同時に複数グループが消えた場合は各グループの得点を合算し、同時消し倍率はかけない。
- 連鎖が発生した場合だけ、合算後の得点に連鎖倍率をかける。
- `chainCombo` は連鎖が続く間だけ増え、次にアイスを落とすタイミングで `1` に戻す。
- 連鎖コンボの解決中 (`isResolvingChainCombo === true`) は新しいアイスを落とせない。

## Backend API Mock

### 使用例

```js
import { backendApi } from '../src/backend/api.js';

// スコア保存（冪等性なし）
const saveResult1 = await backendApi.saveScore('player', 1200);

// スコア保存（gameId で冪等性を確保）
const saveResult2 = await backendApi.saveScore('player', 1200, { gameId: 'run-20260512-0001' });

// ランキング取得
const ranking = await backendApi.getRanking();

// フィーバー判定
const isFever = await backendApi.updateFeverStatus({
  totalClearedCount: 12,
  chainCombo: 2,
});
```

### saveScore() 戻り値

```js
{
  success: true,
  playerName: 'player',
  score: 1200,                    // 正規化後のスコア（保存される値）
  originalScore: 1200,            // 元のゲームスコア
  gameId?: 'run-20260512-0001'    // gameId が渡された場合のみ含まれる
}
```

**詳細：**

- `success` は常に `true`
- `playerName` は空文字・空白のみ・非文字列を受け付けない（`TypeError`）
- `score` は有限な安全整数 (`Number.isSafeInteger`) のみ受け付ける
- ゲーム中の合計スコアは負の数を許容する（ペナルティ扱い）
- `originalScore` と `score` は通常は同じ値だが、将来の正規化ルール追加に対応
- `gameId` が指定された場合、同じ `gameId` で再度呼び出すと冪等に動作（同じ結果を返す）
- バリデーション失敗時は `Promise` の reject ではなく、呼び出し時点で `TypeError` / `RangeError` を投げる

### getRanking() 戻り値

```js
// モック環境
[
  { playerName: 'Alice', score: 5000 },
  { playerName: 'Bob', score: 4500 },
  // ... 最大10件
]

// Supabase 環境
[
  { playerName: 'Alice', score: 5000, createdAt: '2026-05-12T10:30:00Z' },
  { playerName: 'Bob', score: 4500, createdAt: '2026-05-12T10:25:00Z' },
  // ... 最大10件
]
```

**詳細：**

- スコアの高い順にソート
- 最大10件を返す
- Supabase 環境では `createdAt` (ISO 8601形式) も含まれる
- モック環境では `createdAt` は含まれない

### Mock / Supabase 差分（フロント実装向け）

| 項目                   | Mock                                 | Supabase                           |
| ---------------------- | ------------------------------------ | ---------------------------------- |
| 保存先                 | メモリ配列（プロセス再起動で消える） | `rankings` テーブル                |
| `getRanking()` の要素  | `{ playerName, score }`              | `{ playerName, score, createdAt }` |
| 並び順                 | `score desc`                         | `score desc, created_at asc`       |
| 取得件数               | 上位10件                             | 上位10件                           |
| `saveScore()` の戻り値 | 同一                                 | 同一                               |

- フロントはランキング表示モデルを `{ playerName: string, score: number, createdAt?: string }` として扱う。
- `createdAt` が未定義でも動作する表示実装にしておく。

### updateFeverStatus() 戻り値

```js
true; // または false (boolean)
```

**詳細：**

- `totalClearedCount >= FEVER_TOTAL_CLEARS_THRESHOLD` **かつ** `chainCombo >= FEVER_CHAIN_THRESHOLD` のときだけ `true`
- 両方の条件を満たさない場合は `false`
- 設定値は `src/constants.js` の `GAME_PARAMETERS` を参照

### 全般的な仕様

- `SUPABASE_URL` と `SUPABASE_ANON_KEY` が環境変数に設定されている場合は Supabase に保存
- Supabase 未設定時はモックランキングに保存

## Clear Score Summary

`calculateClearScore(matches, { isFever, chainCombo })` returns `summaryByIceType` for UI/presentation stats.

```js
{
  baseScore: 300,
  extraIceBonus: 60,
  totalScore: 480,
  chainCombo: 2,
  chainComboMultiplier: 1.5,
  feverMultiplier: 1,
  matchScores: [
    {
      iceType: 'dainagon_azuki',
      matchCount: 3,
      baseScore: 150,
      extraIceBonus: 0,
      totalScore: 150,
      score: 150,
    },
    {
      iceType: 'dainagon_azuki',
      matchCount: 5,
      baseScore: 150,
      extraIceBonus: 60,
      totalScore: 210,
      score: 210,
    },
  ],
  summaryByIceType: {
    dainagon_azuki: {
      iceType: 'dainagon_azuki',
      clearedCount: 8,
      groupCount: 2,
      baseScore: 300,
      extraIceBonus: 60,
      score: 540,
    },
  },
}
```

- `summaryByIceType` is keyed by `ICE_TYPES` values.
- `clearedCount` is the total number of cleared ice blocks for that type.
- `groupCount` is the number of matched groups for that type.
- `baseScore` is the per-type score before extra-ice bonus and multipliers.
- `extraIceBonus` is the per-type bonus from ice blocks above 3.
- `score` is after fever/chain multipliers and can be negative for penalty ice.
- `totalScore` is rounded with `Math.floor()` after applying multipliers.
