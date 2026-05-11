# Data Contract

フロントエンドとバックエンドで共有する最小契約です。迷ったらこの形に合わせてください。

## Ice Model

```js
{
  id: 'ice_001',
  type: 'vanilla',
  isFrozen: false,
  meltLevel: 0,
  placedAt: 0,
  x: 0,
  y: 0,
}
```

- `type`: `src/constants.js` の `ICE_TYPES` を使う。
- `meltLevel`: `0` から `100`。`100` で溶け切り。
- `x`, `y`: グリッド座標。Phaser のピクセル座標ではない。

## Grid

```js
[
  ['vanilla', 'choco', null],
  ['strawberry', 'vanilla', null],
  ['matcha', 'choco', 'vanilla'],
]
```

- 空セルは `null` を推奨。
- 3つ並び判定は `findMatchThree(grid)` を使う。
- 戻り値の座標は `{ x, y }`。

## Backend API Mock

```js
import { backendApi } from '../src/backend/api.js';

await backendApi.saveScore('player', 1200);
const ranking = await backendApi.getRanking();
const isFever = await backendApi.updateFeverStatus(1200);
```
