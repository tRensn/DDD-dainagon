import { COMBO_SCORE, GAME_PHASES, GAME_PARAMETERS, SCORE_BASE } from '../constants.js';

export function createInitialGameState() {
  return {
    phase: GAME_PHASES.READY,
    score: 0,
    combo: 0,
    feverStartedAt: null,
    isGameOver: false,
  };
}

export function getNextPhase(state, currentScore) {
  if (state.isGameOver) {
    return GAME_PHASES.GAME_OVER;
  }

  if (currentScore >= GAME_PARAMETERS.FEVER_THRESHOLD) {
    return GAME_PHASES.FEVER;
  }

  return GAME_PHASES.NORMAL;
}

export function calculateMatchScore(matchCount, { isFever = false } = {}) {
  if (matchCount < 3) {
    return 0;
  }

  const baseScore = isFever ? SCORE_BASE.FEVER_MATCH_3 : SCORE_BASE.MATCH_3;
  const extraIceCount = Math.max(0, matchCount - 3);
  const comboMultiplier =
    COMBO_SCORE.BASE_MULTIPLIER + extraIceCount * COMBO_SCORE.BONUS_PER_EXTRA_ICE;
  const feverMultiplier = isFever ? COMBO_SCORE.FEVER_MULTIPLIER : 1;

  return Math.floor(baseScore * comboMultiplier * feverMultiplier);
}
