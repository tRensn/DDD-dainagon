import assert from 'node:assert/strict';
import test from 'node:test';

import {
  COMBO_SCORE,
  GAME_PHASES,
  GAME_PARAMETERS,
  ICE_TYPES,
  ICE_TYPE_SCORES,
} from '../../src/constants.js';
import {
  applyClearResolution,
  advanceChainCombo,
  applyScore,
  beginNextIceDrop,
  calculateChainComboMultiplier,
  calculateClearScore,
  calculateMatchScore,
  canDropIce,
  canClearMatch,
  countClearedIce,
  createInitialGameState,
  finishChainComboResolution,
  getNextPhase,
  startChainComboResolution,
} from '../../src/backend/state.js';

test('createInitialGameState returns the default ready state', () => {
  assert.deepEqual(createInitialGameState(), {
    phase: GAME_PHASES.READY,
    score: 0,
    combo: 0,
    totalClearedCount: 0,
    chainCombo: 1,
    isResolvingChainCombo: false,
    feverStartedAt: null,
    isGameOver: false,
  });
});

test('beginNextIceDrop resets chain combo to 1', () => {
  const state = {
    ...createInitialGameState(),
    chainCombo: 4,
    isResolvingChainCombo: true,
  };

  assert.deepEqual(beginNextIceDrop(state), {
    ...state,
    chainCombo: 1,
    isResolvingChainCombo: false,
  });
});

test('startChainComboResolution locks ice drop during combo', () => {
  const resolvingState = startChainComboResolution(createInitialGameState());

  assert.equal(canDropIce(resolvingState), false);
});

test('finishChainComboResolution unlocks ice drop after combo', () => {
  const resolvingState = startChainComboResolution(createInitialGameState());
  const finishedState = finishChainComboResolution(resolvingState);

  assert.equal(canDropIce(finishedState), true);
});

test('advanceChainCombo increases chain count while keeping drop lock', () => {
  const state = {
    ...createInitialGameState(),
    chainCombo: 2,
  };
  const nextState = advanceChainCombo(state);

  assert.equal(nextState.chainCombo, 3);
  assert.equal(nextState.isResolvingChainCombo, true);
  assert.equal(canDropIce(nextState), false);
});

test('getNextPhase returns gameOver when the state is already game over', () => {
  const state = {
    ...createInitialGameState(),
    isGameOver: true,
  };

  assert.equal(
    getNextPhase(state, {
      totalClearedCount: GAME_PARAMETERS.FEVER_TOTAL_CLEARS_THRESHOLD,
      chainCombo: GAME_PARAMETERS.FEVER_CHAIN_THRESHOLD,
    }),
    GAME_PHASES.GAME_OVER,
  );
});

test('getNextPhase returns normal when total clear count is below threshold', () => {
  const state = createInitialGameState();

  assert.equal(
    getNextPhase(state, {
      totalClearedCount: GAME_PARAMETERS.FEVER_TOTAL_CLEARS_THRESHOLD - 1,
      chainCombo: GAME_PARAMETERS.FEVER_CHAIN_THRESHOLD,
    }),
    GAME_PHASES.NORMAL,
  );
});

test('getNextPhase returns normal when chain combo is below threshold', () => {
  const state = createInitialGameState();

  assert.equal(
    getNextPhase(state, {
      totalClearedCount: GAME_PARAMETERS.FEVER_TOTAL_CLEARS_THRESHOLD,
      chainCombo: GAME_PARAMETERS.FEVER_CHAIN_THRESHOLD - 1,
    }),
    GAME_PHASES.NORMAL,
  );
});

test('getNextPhase returns fever only when both fever conditions are satisfied', () => {
  const state = createInitialGameState();

  assert.equal(
    getNextPhase(state, {
      totalClearedCount: GAME_PARAMETERS.FEVER_TOTAL_CLEARS_THRESHOLD,
      chainCombo: GAME_PARAMETERS.FEVER_CHAIN_THRESHOLD,
    }),
    GAME_PHASES.FEVER,
  );
});

test('applyScore adds clear score to current score', () => {
  assert.equal(applyScore(1000, 250), 1250);
});

test('applyScore subtracts negative clear score from current score', () => {
  assert.equal(applyScore(1000, -70), 930);
});

test('applyScore allows total score to become negative', () => {
  assert.equal(applyScore(50, -100), -50);
});

test('countClearedIce sums all cleared match counts', () => {
  assert.equal(
    countClearedIce([
      { iceType: ICE_TYPES.DAINAGON_AZUKI, matchCount: 3 },
      { iceType: ICE_TYPES.STRAWBERRY, matchCount: 4 },
      { iceType: ICE_TYPES.CHOCO_MINT, matchCount: 5 },
    ]),
    12,
  );
});

test('countClearedIce ignores invalid matchCount values', () => {
  assert.equal(
    countClearedIce([
      { iceType: ICE_TYPES.DAINAGON_AZUKI, matchCount: 3 },
      { iceType: ICE_TYPES.STRAWBERRY, matchCount: -2 },
      { iceType: ICE_TYPES.CHOCO_MINT, matchCount: 1.5 },
    ]),
    3,
  );
});

test('applyClearResolution updates score and total cleared count', () => {
  const state = {
    ...createInitialGameState(),
    phase: GAME_PHASES.NORMAL,
    score: 100,
    totalClearedCount: 7,
    chainCombo: 1,
  };

  const nextState = applyClearResolution(state, {
    matches: [
      { iceType: ICE_TYPES.DAINAGON_AZUKI, matchCount: 3 },
      { iceType: ICE_TYPES.STRAWBERRY, matchCount: 2 },
    ],
    clearScore: 150,
  });

  assert.equal(nextState.score, 250);
  assert.equal(nextState.totalClearedCount, 12);
  assert.equal(nextState.phase, GAME_PHASES.NORMAL);
});

test('applyClearResolution can transition to fever when both conditions are met', () => {
  const state = {
    ...createInitialGameState(),
    phase: GAME_PHASES.NORMAL,
    score: 0,
    totalClearedCount: GAME_PARAMETERS.FEVER_TOTAL_CLEARS_THRESHOLD - 3,
    chainCombo: GAME_PARAMETERS.FEVER_CHAIN_THRESHOLD,
  };

  const nextState = applyClearResolution(state, {
    matches: [{ iceType: ICE_TYPES.DAINAGON_AZUKI, matchCount: 3 }],
    clearScore: 100,
  });

  assert.equal(nextState.phase, GAME_PHASES.FEVER);
});

test('canClearMatch returns false for fewer than 3 matches', () => {
  assert.equal(canClearMatch(0), false);
  assert.equal(canClearMatch(1), false);
  assert.equal(canClearMatch(2), false);
});

test('canClearMatch returns true for 3 or more matches', () => {
  assert.equal(canClearMatch(3), true);
  assert.equal(canClearMatch(4), true);
});

test('calculateMatchScore rejects fewer than 3 matches', () => {
  assert.throws(() => calculateMatchScore(0), RangeError);
  assert.throws(() => calculateMatchScore(1), RangeError);
  assert.throws(() => calculateMatchScore(2), RangeError);
});

test('calculateMatchScore returns the ice type score for exactly 3 matches', () => {
  assert.equal(
    calculateMatchScore(3, { iceType: ICE_TYPES.DAINAGON_AZUKI }),
    ICE_TYPE_SCORES[ICE_TYPES.DAINAGON_AZUKI],
  );
  assert.equal(
    calculateMatchScore(3, { iceType: ICE_TYPES.STRAWBERRY }),
    ICE_TYPE_SCORES[ICE_TYPES.STRAWBERRY],
  );
  assert.equal(
    calculateMatchScore(3, { iceType: ICE_TYPES.COOKIE_AND_CREAM }),
    ICE_TYPE_SCORES[ICE_TYPES.COOKIE_AND_CREAM],
  );
  assert.equal(
    calculateMatchScore(3, { iceType: ICE_TYPES.CHOCO_MINT }),
    ICE_TYPE_SCORES[ICE_TYPES.CHOCO_MINT],
  );
});

test('calculateMatchScore adds an extra ice bonus for more than 3 matches', () => {
  const expectedScore = ICE_TYPE_SCORES[ICE_TYPES.STRAWBERRY] + COMBO_SCORE.EXTRA_ICE_BONUS;

  assert.equal(calculateMatchScore(4, { iceType: ICE_TYPES.STRAWBERRY }), expectedScore);
});

test('calculateMatchScore adds the extra ice bonus for each ice over 3', () => {
  const expectedScore = ICE_TYPE_SCORES[ICE_TYPES.DAINAGON_AZUKI] + COMBO_SCORE.EXTRA_ICE_BONUS * 2;

  assert.equal(calculateMatchScore(5, { iceType: ICE_TYPES.DAINAGON_AZUKI }), expectedScore);
});

test('calculateMatchScore applies fever multiplier', () => {
  const expectedScore = Math.floor(
    ICE_TYPE_SCORES[ICE_TYPES.COOKIE_AND_CREAM] * COMBO_SCORE.FEVER_MULTIPLIER,
  );

  assert.equal(
    calculateMatchScore(3, { iceType: ICE_TYPES.COOKIE_AND_CREAM, isFever: true }),
    expectedScore,
  );
});

test('calculateMatchScore applies both extra ice bonus and fever multiplier', () => {
  const expectedScore = Math.floor(
    (ICE_TYPE_SCORES[ICE_TYPES.CHOCO_MINT] + COMBO_SCORE.EXTRA_ICE_BONUS) *
      COMBO_SCORE.FEVER_MULTIPLIER,
  );

  assert.equal(
    calculateMatchScore(4, { iceType: ICE_TYPES.CHOCO_MINT, isFever: true }),
    expectedScore,
  );
});

test('calculateChainComboMultiplier increases only by chain combo count', () => {
  assert.equal(calculateChainComboMultiplier(1), 1);
  assert.equal(calculateChainComboMultiplier(2), 1.5);
  assert.equal(calculateChainComboMultiplier(3), 2);
});

test('calculateMatchScore applies chain combo multiplier', () => {
  const expectedScore = Math.floor(
    ICE_TYPE_SCORES[ICE_TYPES.DAINAGON_AZUKI] * calculateChainComboMultiplier(2),
  );

  assert.equal(
    calculateMatchScore(3, { iceType: ICE_TYPES.DAINAGON_AZUKI, chainCombo: 2 }),
    expectedScore,
  );
});

test('calculateClearScore sums simultaneous clears without simultaneous combo multiplier', () => {
  const result = calculateClearScore([
    { iceType: ICE_TYPES.CHOCO_MINT, matchCount: 4 },
    { iceType: ICE_TYPES.STRAWBERRY, matchCount: 5 },
  ]);

  assert.deepEqual(result.matchScores, [
    {
      iceType: ICE_TYPES.CHOCO_MINT,
      matchCount: 4,
      baseScore: ICE_TYPE_SCORES[ICE_TYPES.CHOCO_MINT],
      extraIceBonus: COMBO_SCORE.EXTRA_ICE_BONUS,
      totalScore: ICE_TYPE_SCORES[ICE_TYPES.CHOCO_MINT] + COMBO_SCORE.EXTRA_ICE_BONUS,
      score: ICE_TYPE_SCORES[ICE_TYPES.CHOCO_MINT] + COMBO_SCORE.EXTRA_ICE_BONUS,
    },
    {
      iceType: ICE_TYPES.STRAWBERRY,
      matchCount: 5,
      baseScore: ICE_TYPE_SCORES[ICE_TYPES.STRAWBERRY],
      extraIceBonus: COMBO_SCORE.EXTRA_ICE_BONUS * 2,
      totalScore: ICE_TYPE_SCORES[ICE_TYPES.STRAWBERRY] + COMBO_SCORE.EXTRA_ICE_BONUS * 2,
      score: ICE_TYPE_SCORES[ICE_TYPES.STRAWBERRY] + COMBO_SCORE.EXTRA_ICE_BONUS * 2,
    },
  ]);
  assert.equal(
    result.baseScore,
    ICE_TYPE_SCORES[ICE_TYPES.CHOCO_MINT] + ICE_TYPE_SCORES[ICE_TYPES.STRAWBERRY],
  );
  assert.equal(result.extraIceBonus, COMBO_SCORE.EXTRA_ICE_BONUS * 3);
  assert.equal(result.feverMultiplier, 1);
  assert.equal(result.chainComboMultiplier, 1);
  assert.equal(result.totalScore, 320);
  assert.deepEqual(result.summaryByIceType, {
    [ICE_TYPES.CHOCO_MINT]: {
      iceType: ICE_TYPES.CHOCO_MINT,
      clearedCount: 4,
      groupCount: 1,
      baseScore: ICE_TYPE_SCORES[ICE_TYPES.CHOCO_MINT],
      extraIceBonus: COMBO_SCORE.EXTRA_ICE_BONUS,
      score: ICE_TYPE_SCORES[ICE_TYPES.CHOCO_MINT] + COMBO_SCORE.EXTRA_ICE_BONUS,
    },
    [ICE_TYPES.STRAWBERRY]: {
      iceType: ICE_TYPES.STRAWBERRY,
      clearedCount: 5,
      groupCount: 1,
      baseScore: ICE_TYPE_SCORES[ICE_TYPES.STRAWBERRY],
      extraIceBonus: COMBO_SCORE.EXTRA_ICE_BONUS * 2,
      score: ICE_TYPE_SCORES[ICE_TYPES.STRAWBERRY] + COMBO_SCORE.EXTRA_ICE_BONUS * 2,
    },
  });
});

test('calculateClearScore applies chain combo multiplier to simultaneous clear subtotal', () => {
  const result = calculateClearScore(
    [
      { iceType: ICE_TYPES.CHOCO_MINT, matchCount: 4 },
      { iceType: ICE_TYPES.STRAWBERRY, matchCount: 5 },
    ],
    { chainCombo: 2 },
  );

  assert.equal(result.chainComboMultiplier, 1.5);
  assert.equal(result.totalScore, 480);
});

test('calculateClearScore returns an empty ice type summary without matches', () => {
  const result = calculateClearScore([]);

  assert.equal(result.baseScore, 0);
  assert.equal(result.extraIceBonus, 0);
  assert.equal(result.feverMultiplier, 1);
  assert.equal(result.totalScore, 0);
  assert.deepEqual(result.summaryByIceType, {});
});

test('calculateClearScore summarizes multiple groups by ice type', () => {
  const result = calculateClearScore(
    [
      { iceType: ICE_TYPES.DAINAGON_AZUKI, matchCount: 3 },
      { iceType: ICE_TYPES.CHOCO_MINT, matchCount: 4 },
      { iceType: ICE_TYPES.DAINAGON_AZUKI, matchCount: 5 },
    ],
    { chainCombo: 2 },
  );

  assert.deepEqual(result.summaryByIceType, {
    [ICE_TYPES.DAINAGON_AZUKI]: {
      iceType: ICE_TYPES.DAINAGON_AZUKI,
      clearedCount: 8,
      groupCount: 2,
      baseScore: ICE_TYPE_SCORES[ICE_TYPES.DAINAGON_AZUKI] * 2,
      extraIceBonus: COMBO_SCORE.EXTRA_ICE_BONUS * 2,
      score: Math.floor(
        (ICE_TYPE_SCORES[ICE_TYPES.DAINAGON_AZUKI] * 2 + COMBO_SCORE.EXTRA_ICE_BONUS * 2) *
          calculateChainComboMultiplier(2),
      ),
    },
    [ICE_TYPES.CHOCO_MINT]: {
      iceType: ICE_TYPES.CHOCO_MINT,
      clearedCount: 4,
      groupCount: 1,
      baseScore: ICE_TYPE_SCORES[ICE_TYPES.CHOCO_MINT],
      extraIceBonus: COMBO_SCORE.EXTRA_ICE_BONUS,
      score: Math.floor(
        (ICE_TYPE_SCORES[ICE_TYPES.CHOCO_MINT] + COMBO_SCORE.EXTRA_ICE_BONUS) *
          calculateChainComboMultiplier(2),
      ),
    },
  });
});

test('calculateMatchScore allows negative ice type scores', () => {
  const originalScore = ICE_TYPE_SCORES[ICE_TYPES.CHOCO_MINT];
  ICE_TYPE_SCORES[ICE_TYPES.CHOCO_MINT] = -50;

  try {
    assert.equal(calculateMatchScore(3, { iceType: ICE_TYPES.CHOCO_MINT }), -50);
    assert.equal(
      calculateMatchScore(4, { iceType: ICE_TYPES.CHOCO_MINT }),
      -50 + COMBO_SCORE.EXTRA_ICE_BONUS,
    );
  } finally {
    ICE_TYPE_SCORES[ICE_TYPES.CHOCO_MINT] = originalScore;
  }
});

test('calculateClearScore allows a negative total score', () => {
  const originalScore = ICE_TYPE_SCORES[ICE_TYPES.CHOCO_MINT];
  ICE_TYPE_SCORES[ICE_TYPES.CHOCO_MINT] = -100;

  try {
    const result = calculateClearScore([{ iceType: ICE_TYPES.CHOCO_MINT, matchCount: 4 }]);

    assert.equal(result.matchScores[0].score, -100 + COMBO_SCORE.EXTRA_ICE_BONUS);
    assert.equal(result.totalScore, -70);
    assert.deepEqual(result.summaryByIceType[ICE_TYPES.CHOCO_MINT], {
      iceType: ICE_TYPES.CHOCO_MINT,
      clearedCount: 4,
      groupCount: 1,
      baseScore: -100,
      extraIceBonus: COMBO_SCORE.EXTRA_ICE_BONUS,
      score: -70,
    });
  } finally {
    ICE_TYPE_SCORES[ICE_TYPES.CHOCO_MINT] = originalScore;
  }
});

test('calculateClearScore allows a negative total score with chain combo multiplier', () => {
  const originalScore = ICE_TYPE_SCORES[ICE_TYPES.CHOCO_MINT];
  ICE_TYPE_SCORES[ICE_TYPES.CHOCO_MINT] = -100;

  try {
    const result = calculateClearScore([{ iceType: ICE_TYPES.CHOCO_MINT, matchCount: 4 }], {
      chainCombo: 2,
    });

    assert.equal(result.totalScore, Math.floor(-70 * 1.5));
  } finally {
    ICE_TYPE_SCORES[ICE_TYPES.CHOCO_MINT] = originalScore;
  }
});

test('calculateMatchScore rejects unknown ice types', () => {
  assert.throws(() => calculateMatchScore(3, { iceType: 'vanilla' }), RangeError);
});
