import { COMBO_SCORE, GAME_PHASES, GAME_PARAMETERS, ICE_TYPE_SCORES } from '../constants.js';

export function createInitialGameState() {
  return {
    phase: GAME_PHASES.READY,
    score: 0,
    combo: 0,
    totalClearedCount: 0,
    chainCombo: 1,
    isResolvingChainCombo: false,
    feverStartedAt: null,
    isGameOver: false,
  };
}

export function beginNextIceDrop(state) {
  return {
    ...state,
    chainCombo: 1,
    isResolvingChainCombo: false,
  };
}

export function startChainComboResolution(state) {
  return {
    ...state,
    isResolvingChainCombo: true,
  };
}

export function finishChainComboResolution(state) {
  return {
    ...state,
    isResolvingChainCombo: false,
  };
}

export function advanceChainCombo(state) {
  const currentChainCombo = Math.max(1, state.chainCombo ?? 1);

  return {
    ...state,
    chainCombo: currentChainCombo + 1,
    isResolvingChainCombo: true,
  };
}

export function canDropIce(state) {
  return !state.isResolvingChainCombo;
}

export function getNextPhase(state, { totalClearedCount = 0, chainCombo = 1 } = {}) {
  if (state.isGameOver) {
    return GAME_PHASES.GAME_OVER;
  }

  if (
    totalClearedCount >= GAME_PARAMETERS.FEVER_TOTAL_CLEARS_THRESHOLD &&
    chainCombo >= GAME_PARAMETERS.FEVER_CHAIN_THRESHOLD
  ) {
    return GAME_PHASES.FEVER;
  }

  return GAME_PHASES.NORMAL;
}

export function applyScore(currentScore, clearScore) {
  return currentScore + clearScore;
}

export function countClearedIce(matches) {
  if (!Array.isArray(matches) || matches.length === 0) {
    return 0;
  }

  return matches.reduce((total, { matchCount }) => {
    if (!Number.isInteger(matchCount)) {
      return total;
    }

    return total + Math.max(0, matchCount);
  }, 0);
}

export function applyClearResolution(state, { matches = [], clearScore = 0 } = {}) {
  const currentScore = state.score ?? 0;
  const currentTotalClearedCount = state.totalClearedCount ?? 0;
  const nextTotalClearedCount = currentTotalClearedCount + countClearedIce(matches);
  const nextScore = applyScore(currentScore, clearScore);
  const nextPhase = getNextPhase(state, {
    totalClearedCount: nextTotalClearedCount,
    chainCombo: state.chainCombo ?? 1,
  });

  return {
    ...state,
    score: nextScore,
    totalClearedCount: nextTotalClearedCount,
    phase: nextPhase,
  };
}

export function canClearMatch(matchCount) {
  return matchCount >= 3;
}

export function calculateChainComboMultiplier(chainCombo = 1) {
  const normalizedChainCombo = Math.max(1, chainCombo);

  return 1 + (normalizedChainCombo - 1) * COMBO_SCORE.CHAIN_COMBO_MULTIPLIER_STEP;
}

export function calculateMatchScore(matchCount, { iceType, isFever = false, chainCombo = 1 } = {}) {
  const clearScore = calculateClearScore([{ iceType, matchCount }], { isFever, chainCombo });

  return clearScore.totalScore;
}

export function calculateClearScore(matches, { isFever = false, chainCombo = 1 } = {}) {
  const chainComboMultiplier = calculateChainComboMultiplier(chainCombo);
  const feverMultiplier = isFever ? COMBO_SCORE.FEVER_MULTIPLIER : 1;

  if (!Array.isArray(matches) || matches.length === 0) {
    return {
      baseScore: 0,
      extraIceBonus: 0,
      feverMultiplier,
      totalScore: 0,
      chainCombo,
      chainComboMultiplier,
      matchScores: [],
      summaryByIceType: {},
    };
  }

  const matchScores = matches.map(({ iceType, matchCount }) => {
    const { baseScore, extraIceBonus, totalScore } = calculateBaseMatchScore(matchCount, iceType);

    return {
      iceType,
      matchCount,
      baseScore,
      extraIceBonus,
      totalScore,
      score: totalScore,
    };
  });
  const baseScore = matchScores.reduce((total, matchScore) => total + matchScore.baseScore, 0);
  const extraIceBonus = matchScores.reduce(
    (total, matchScore) => total + matchScore.extraIceBonus,
    0,
  );
  const subtotal = matchScores.reduce((total, matchScore) => total + matchScore.totalScore, 0);
  const scoreMultiplier = chainComboMultiplier * feverMultiplier;

  return {
    baseScore,
    extraIceBonus,
    feverMultiplier,
    totalScore: Math.floor(subtotal * scoreMultiplier),
    chainCombo,
    chainComboMultiplier,
    matchScores,
    summaryByIceType: createSummaryByIceType(matchScores, scoreMultiplier),
  };
}

function createSummaryByIceType(matchScores, scoreMultiplier) {
  return matchScores.reduce((summary, { iceType, matchCount, totalScore, extraIceBonus }) => {
    const currentSummary = summary[iceType] ?? {
      iceType,
      clearedCount: 0,
      groupCount: 0,
      baseScore: 0,
      extraIceBonus: 0,
      score: 0,
    };

    const nextBaseScore = currentSummary.baseScore + totalScore - extraIceBonus;
    const nextExtraIceBonus = currentSummary.extraIceBonus + extraIceBonus;
    const preMultiplierScore = nextBaseScore + nextExtraIceBonus;

    summary[iceType] = {
      iceType,
      clearedCount: currentSummary.clearedCount + matchCount,
      groupCount: currentSummary.groupCount + 1,
      baseScore: nextBaseScore,
      extraIceBonus: nextExtraIceBonus,
      score: Math.floor(preMultiplierScore * scoreMultiplier),
    };

    return summary;
  }, {});
}

function calculateBaseMatchScore(matchCount, iceType) {
  if (!canClearMatch(matchCount)) {
    throw new RangeError('matchCount must be 3 or more to clear ice blocks.');
  }

  const baseScore = ICE_TYPE_SCORES[iceType];

  if (baseScore === undefined) {
    throw new RangeError(`Unknown ice type: ${iceType}`);
  }

  const extraIceCount = Math.max(0, matchCount - 3);
  const extraIceBonus = extraIceCount * COMBO_SCORE.EXTRA_ICE_BONUS;

  return {
    baseScore,
    extraIceBonus,
    totalScore: baseScore + extraIceBonus,
  };
}
