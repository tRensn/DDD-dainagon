export const ICE_TYPES = {
  VANILLA: 'vanilla',
  CHOCO: 'choco',
  STRAWBERRY: 'strawberry',
  MATCHA: 'matcha',
  MINT: 'mint',
};

export const SCORE_BASE = {
  MATCH_3: 100,
  FEVER_MATCH_3: 200,
};

export const GAME_PARAMETERS = {
  ICE_MELT_TIME_MS: 30000,
  FEVER_THRESHOLD: 10,
  FEVER_DURATION_MS: 15000,
};

export const GAME_PHASES = {
  READY: 'ready',
  NORMAL: 'normal',
  FEVER: 'fever',
  GAME_OVER: 'gameOver',
};

export const COMBO_SCORE = {
  BASE_MULTIPLIER: 1,
  BONUS_PER_EXTRA_ICE: 0.25,
  FEVER_MULTIPLIER: 2,
};

export const BOARD_SETTINGS = {
  COLUMNS: 8,
  ROWS: 12,
};

export const ASSET_KEYS = {
  ICE_VANILLA: 'ice_vanilla',
  ICE_CHOCO: 'ice_choco',
  ICE_STRAWBERRY: 'ice_strawberry',
  ICE_MATCHA: 'ice_matcha',
  ICE_MINT: 'ice_mint',
};
