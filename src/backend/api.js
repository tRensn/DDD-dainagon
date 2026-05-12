import { GAME_PARAMETERS } from '../constants.js';

const mockRanking = [];
const DEFAULT_RANKING_TABLE = 'rankings';

export class BackendApi {
  constructor({ rankingStore = createRankingStore() } = {}) {
    this.rankingStore = rankingStore;
    this.savedScoreByGameId = new Map();
  }

  saveScore(playerName, score, { gameId } = {}) {
    const rankingScore = normalizeRankingScore(score);
    assertValidGameId(gameId);

    if (gameId !== undefined && this.savedScoreByGameId.has(gameId)) {
      return Promise.resolve(this.savedScoreByGameId.get(gameId));
    }

    console.log('[BackendApi] saveScore:', {
      playerName,
      score,
      rankingScore,
      gameId,
    });

    return this.rankingStore.saveScore(playerName, rankingScore).then(() => {
      const result = {
        success: true,
        playerName,
        score: rankingScore,
        originalScore: score,
      };

      if (gameId !== undefined) {
        result.gameId = gameId;
        this.savedScoreByGameId.set(gameId, result);
      }

      return result;
    });
  }

  getRanking() {
    console.log('[BackendApi] getRanking');

    return this.rankingStore.getRanking();
  }

  updateFeverStatus({ totalClearedCount = 0, chainCombo = 1 } = {}) {
    const isFever =
      totalClearedCount >= GAME_PARAMETERS.FEVER_TOTAL_CLEARS_THRESHOLD &&
      chainCombo >= GAME_PARAMETERS.FEVER_CHAIN_THRESHOLD;

    console.log('[BackendApi mock] updateFeverStatus:', {
      totalClearedCount,
      chainCombo,
      feverTotalClearsThreshold: GAME_PARAMETERS.FEVER_TOTAL_CLEARS_THRESHOLD,
      feverChainThreshold: GAME_PARAMETERS.FEVER_CHAIN_THRESHOLD,
      isFever,
    });

    return Promise.resolve(isFever);
  }
}

export class MockRankingStore {
  saveScore(playerName, score) {
    mockRanking.push({ playerName, score });
    mockRanking.sort((a, b) => b.score - a.score);

    return Promise.resolve();
  }

  getRanking() {
    return Promise.resolve(mockRanking.slice(0, 10));
  }
}

export class SupabaseRankingStore {
  constructor({ url, anonKey, table = DEFAULT_RANKING_TABLE, fetchImpl = globalThis.fetch } = {}) {
    if (!url || !anonKey) {
      throw new Error('Supabase url and anonKey are required.');
    }

    if (!fetchImpl) {
      throw new Error('fetch is required to use SupabaseRankingStore.');
    }

    this.url = url.replace(/\/$/, '');
    this.anonKey = anonKey;
    this.table = table;
    this.fetchImpl = fetchImpl;
  }

  async saveScore(playerName, score) {
    const response = await this.fetchImpl(`${this.restUrl}/${this.table}`, {
      method: 'POST',
      headers: this.createHeaders({
        Prefer: 'return=minimal',
      }),
      body: JSON.stringify({
        player_name: playerName,
        score,
      }),
    });

    await assertSupabaseResponse(response);
  }

  async getRanking() {
    const searchParams = new URLSearchParams({
      select: 'player_name,score,created_at',
      order: 'score.desc,created_at.asc',
      limit: '10',
    });
    const response = await this.fetchImpl(`${this.restUrl}/${this.table}?${searchParams}`, {
      method: 'GET',
      headers: this.createHeaders(),
    });

    await assertSupabaseResponse(response);

    const rows = await response.json();

    return rows.map((row) => ({
      playerName: row.player_name,
      score: row.score,
      createdAt: row.created_at,
    }));
  }

  get restUrl() {
    return `${this.url}/rest/v1`;
  }

  createHeaders(extraHeaders = {}) {
    return {
      apikey: this.anonKey,
      Authorization: `Bearer ${this.anonKey}`,
      'Content-Type': 'application/json',
      ...extraHeaders,
    };
  }
}

export function createRankingStore(env = getRuntimeEnv()) {
  const url = env.SUPABASE_URL;
  const anonKey = env.SUPABASE_ANON_KEY;

  if (url && anonKey) {
    return new SupabaseRankingStore({
      url,
      anonKey,
      table: env.SUPABASE_RANKING_TABLE || DEFAULT_RANKING_TABLE,
    });
  }

  return new MockRankingStore();
}

export function normalizeRankingScore(score) {
  if (!Number.isFinite(score)) {
    throw new TypeError('score must be a finite number.');
  }

  if (!Number.isInteger(score)) {
    throw new TypeError('score must be an integer.');
  }

  if (!Number.isSafeInteger(score)) {
    throw new RangeError('score must be a safe integer.');
  }

  return score;
}

export function resetMockRanking() {
  mockRanking.length = 0;
}

function getRuntimeEnv() {
  return globalThis.process?.env ?? {};
}

function assertValidGameId(gameId) {
  if (gameId === undefined) {
    return;
  }

  if (typeof gameId !== 'string' || gameId.trim().length === 0) {
    throw new TypeError('gameId must be a non-empty string when provided.');
  }
}

async function assertSupabaseResponse(response) {
  if (response.ok) {
    return;
  }

  const errorText = await response.text();
  throw new Error(`Supabase request failed: ${response.status} ${errorText}`);
}

export const backendApi = new BackendApi();
