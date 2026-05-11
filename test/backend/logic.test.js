const assert = require('node:assert/strict');
const test = require('node:test');

const { findMatchThree } = require('../../src/backend/logic.js');

function sortCells(cells) {
  return [...cells].sort((a, b) => a.y - b.y || a.x - b.x);
}

test('findMatchThree detects a horizontal match', () => {
  const grid = [['vanilla', 'vanilla', 'vanilla', 'choco']];

  assert.deepEqual(sortCells(findMatchThree(grid)), [
    { x: 0, y: 0 },
    { x: 1, y: 0 },
    { x: 2, y: 0 },
  ]);
});

test('findMatchThree detects a vertical match', () => {
  const grid = [['choco'], ['choco'], ['choco'], ['vanilla']];

  assert.deepEqual(sortCells(findMatchThree(grid)), [
    { x: 0, y: 0 },
    { x: 0, y: 1 },
    { x: 0, y: 2 },
  ]);
});

test('findMatchThree detects a down-right diagonal match', () => {
  const grid = [
    ['strawberry', null, null],
    [null, 'strawberry', null],
    [null, null, 'strawberry'],
  ];

  assert.deepEqual(sortCells(findMatchThree(grid)), [
    { x: 0, y: 0 },
    { x: 1, y: 1 },
    { x: 2, y: 2 },
  ]);
});

test('findMatchThree detects a down-left diagonal match', () => {
  const grid = [
    [null, null, 'matcha'],
    [null, 'matcha', null],
    ['matcha', null, null],
  ];

  assert.deepEqual(sortCells(findMatchThree(grid)), [
    { x: 2, y: 0 },
    { x: 1, y: 1 },
    { x: 0, y: 2 },
  ]);
});

test('findMatchThree returns an empty array when there are fewer than 3 adjacent ice blocks', () => {
  const grid = [
    ['vanilla', 'vanilla', 'choco'],
    ['choco', 'strawberry', 'matcha'],
  ];

  assert.deepEqual(findMatchThree(grid), []);
});

test('findMatchThree ignores empty cells', () => {
  const grid = [
    [null, null, null],
    ['', '', ''],
    [undefined, undefined, undefined],
  ];

  assert.deepEqual(findMatchThree(grid), []);
});

test('findMatchThree returns every cell in a chain longer than 3', () => {
  const grid = [['mint', 'mint', 'mint', 'mint']];

  assert.deepEqual(sortCells(findMatchThree(grid)), [
    { x: 0, y: 0 },
    { x: 1, y: 0 },
    { x: 2, y: 0 },
    { x: 3, y: 0 },
  ]);
});

test('findMatchThree returns multiple separate matches', () => {
  const grid = [
    ['vanilla', 'vanilla', 'vanilla'],
    ['choco', null, null],
    ['choco', null, null],
    ['choco', null, null],
  ];

  assert.deepEqual(sortCells(findMatchThree(grid)), [
    { x: 0, y: 0 },
    { x: 1, y: 0 },
    { x: 2, y: 0 },
    { x: 0, y: 1 },
    { x: 0, y: 2 },
    { x: 0, y: 3 },
  ]);
});

test('findMatchThree removes duplicate cells from crossing matches', () => {
  const grid = [
    [null, 'vanilla', null],
    ['vanilla', 'vanilla', 'vanilla'],
    [null, 'vanilla', null],
  ];

  assert.deepEqual(sortCells(findMatchThree(grid)), [
    { x: 1, y: 0 },
    { x: 0, y: 1 },
    { x: 1, y: 1 },
    { x: 2, y: 1 },
    { x: 1, y: 2 },
  ]);
});

test('findMatchThree returns an empty array for invalid input', () => {
  assert.deepEqual(findMatchThree(null), []);
  assert.deepEqual(findMatchThree(undefined), []);
  assert.deepEqual(findMatchThree('vanilla'), []);
});
