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
]
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

```js
import { backendApi } from '../src/backend/api.js';

await backendApi.saveScore('player', 1200);
await backendApi.saveScore('player', 1200, { gameId: 'run-20260512-0001' });
const ranking = await backendApi.getRanking();
const isFever = await backendApi.updateFeverStatus({
  totalClearedCount: 12,
  chainCombo: 2,
});
```

- ゲーム中の合計スコアは負の数を許容する。
- ランキング保存時も、負のスコアは負のまま保存する。
- `saveScore()` の `score` は有限な安全整数 (`Number.isSafeInteger`) のみ受け付ける。
- `saveScore(playerName, score)` は保存用スコアを `score`、元のゲームスコアを `originalScore` として返す。
- `saveScore(playerName, score, { gameId })` に同じ `gameId` を渡した場合は冪等に扱い、重複保存しない。
- `updateFeverStatus({ totalClearedCount, chainCombo })` は累計消去数と連鎖回数の両方が閾値以上のときだけ `true` を返す。
- `SUPABASE_URL` と `SUPABASE_ANON_KEY` が設定されている場合は Supabase に保存する。
- Supabase 未設定時はモックランキングに保存する。

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
