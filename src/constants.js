export const ICE_TYPES = {
  DAINAGON_AZUKI: 'dainagon_azuki',
  STRAWBERRY: 'strawberry',
  COOKIE_AND_CREAM: 'cookie_and_cream',
  CHOCO_MINT: 'choco_mint',
};

export const ICE_TYPE_SCORES = {
  [ICE_TYPES.DAINAGON_AZUKI]: 150,
  [ICE_TYPES.STRAWBERRY]: 100,
  [ICE_TYPES.COOKIE_AND_CREAM]: 120,
  [ICE_TYPES.CHOCO_MINT]: 130,
};

export const GAME_PARAMETERS = {
  ICE_MELT_TIME_MS: 30000,
  FEVER_TOTAL_CLEARS_THRESHOLD: 10,
  FEVER_CHAIN_THRESHOLD: 2,
  FEVER_DURATION_MS: 15000,
};

export const GAME_PHASES = {
  READY: 'ready',
  NORMAL: 'normal',
  FEVER: 'fever',
  GAME_OVER: 'gameOver',
};

export const COMBO_SCORE = {
  EXTRA_ICE_BONUS: 30,
  CHAIN_COMBO_MULTIPLIER_STEP: 0.5,
  FEVER_MULTIPLIER: 2,
};

export const BOARD_SETTINGS = {
  COLUMNS: 8,
  ROWS: 12,
};

export const ASSET_KEYS = {
  ICE_DAINAGON_AZUKI: 'ice_dainagon_azuki',
  ICE_STRAWBERRY: 'ice_strawberry',
  ICE_COOKIE_AND_CREAM: 'ice_cookie_and_cream',
  ICE_CHOCO_MINT: 'ice_choco_mint',
};
