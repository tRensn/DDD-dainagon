import { GAME_PARAMETERS, ICE_TYPES } from '../constants.js';

export const ICE_MODEL_TEMPLATE = {
  id: '',
  type: ICE_TYPES.VANILLA,
  isFrozen: false,
  meltLevel: 0,
  placedAt: 0,
  x: 0,
  y: 0,
};

export function createIceModel({
  id,
  type = ICE_TYPES.VANILLA,
  isFrozen = false,
  meltLevel = 0,
  placedAt = Date.now(),
  x = 0,
  y = 0,
} = {}) {
  return {
    id: id ?? `ice_${placedAt}_${Math.random().toString(36).slice(2, 8)}`,
    type,
    isFrozen,
    meltLevel,
    placedAt,
    x,
    y,
  };
}

export function calculateMeltLevel(placedAt, now = Date.now()) {
  const elapsedTime = Math.max(0, now - placedAt);
  const meltRatio = elapsedTime / GAME_PARAMETERS.ICE_MELT_TIME_MS;

  return Math.min(100, Math.floor(meltRatio * 100));
}
