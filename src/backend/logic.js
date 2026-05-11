const MATCH_LENGTH = 3;

const DIRECTIONS = [
  { x: 1, y: 0 },
  { x: 0, y: 1 },
  { x: 1, y: 1 },
  { x: -1, y: 1 },
];

function findMatchThree(grid) {
  if (!Array.isArray(grid)) {
    return [];
  }

  const matchedCells = new Map();

  for (let y = 0; y < grid.length; y += 1) {
    const row = grid[y];

    if (!Array.isArray(row)) {
      continue;
    }

    for (let x = 0; x < row.length; x += 1) {
      const iceType = row[x];

      if (!isFilledCell(iceType)) {
        continue;
      }

      for (const direction of DIRECTIONS) {
        const chain = collectChain(grid, x, y, direction, iceType);

        if (chain.length >= MATCH_LENGTH) {
          for (const cell of chain) {
            matchedCells.set(createKey(cell.x, cell.y), cell);
          }
        }
      }
    }
  }

  return Array.from(matchedCells.values());
}

function collectChain(grid, startX, startY, direction, iceType) {
  const chain = [];
  let x = startX;
  let y = startY;

  while (grid[y]?.[x] === iceType) {
    chain.push({ x, y });
    x += direction.x;
    y += direction.y;
  }

  return chain;
}

function isFilledCell(value) {
  return value !== null && value !== undefined && value !== '';
}

function createKey(x, y) {
  return `${x},${y}`;
}

module.exports = {
  findMatchThree,
};
