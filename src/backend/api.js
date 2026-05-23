import { GAME_PARAMETERS } from '../constants.js';

const mockRankingByNamespace = new Map();
const mockPlayers = new Map();
const DEFAULT_RANKING_TABLE = 'rankings';
const DEFAULT_GRAVITY_RANKING_TABLE = 'rankings_gravity';
const DEFAULT_TIMED_RANKING_TABLE = 'rankings_timed';
const DEFAULT_GRAVITY_TIMED_RANKING_TABLE = 'rankings_gravity_timed';
const DEFAULT_PROFILE_TABLE = 'profiles';
const AUTH_EMAIL_DOMAIN = 'dainagon.example.com';

export class BackendApi {
  constructor({ rankingStore = createRankingStore() } = {}) {
    this.rankingStore = rankingStore;
    this.savedScoreByGameId = new Map();
  }

  /**
   * スコアをランキングに保存
   * @param {string} playerName プレイヤー名
   * @param {number} score 安全整数のスコア（負の数も許容）
   * @param {{ gameId?: string }} options gameId で冪等性を確保（オプション）
   * @returns {Promise<{ success: true, playerName: string, score: number, originalScore: number, gameId?: string }>}
   */
  saveScore(playerName, score, { gameId, accessToken } = {}) {
    assertValidPlayerName(playerName);
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

    return this.rankingStore.saveScore(playerName, rankingScore, { accessToken }).then(() => {
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

  /**
   * ランキングを取得（上位10件）
   * @returns {Promise<Array<{ playerName: string, score: number, createdAt?: string }>>}
   * - スコアの高い順にソート
   * - Supabase 環境では createdAt (ISO 8601) も含まれる
   * - モック環境では createdAt は含まれない
   */
  getRanking() {
    console.log('[BackendApi] getRanking');

    return this.rankingStore.getRanking();
  }

  registerUser(playerName, password) {
    assertValidPlayerName(playerName);
    assertValidPassword(password);

    return this.rankingStore.registerUser(playerName, password);
  }

  signInUser(playerName, password) {
    assertValidPlayerName(playerName);
    assertValidPassword(password);

    return this.rankingStore.signInUser(playerName, password);
  }

  /**
   * フィーバー状態を判定
   * @param {{ totalClearedCount?: number, chainCombo?: number }} options
   * @returns {Promise<boolean>} 累計消去数と連鎖回数の両方が閾値以上の場合のみ true
   */
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
  constructor(namespace = 'default') {
    this.namespace = namespace;
    if (!mockRankingByNamespace.has(namespace)) {
      mockRankingByNamespace.set(namespace, []);
    }
  }

  get _data() { return mockRankingByNamespace.get(this.namespace); }

  saveScore(playerName, score) {
    const username = normalizeUserName(playerName);
    const data = this._data;
    const existing = data.find((entry) => entry.playerName === username);

    if (existing) {
      existing.score = score;
    } else {
      data.push({ playerName: username, score });
    }

    data.sort((a, b) => b.score - a.score);

    return Promise.resolve();
  }

  getRanking() {
    return Promise.resolve(this._data.slice(0, 10));
  }

  registerUser(playerName, password) {
    const username = normalizeUserName(playerName);

    if (mockPlayers.has(username)) {
      return Promise.reject(new Error('Player name is already registered.'));
    }

    const session = createMockSession(username);
    mockPlayers.set(username, { password, session });

    return Promise.resolve({
      playerName: username,
      accessToken: session.accessToken,
      refreshToken: session.refreshToken,
      expiresAt: session.expiresAt,
    });
  }

  signInUser(playerName, password) {
    const username = normalizeUserName(playerName);
    const player = mockPlayers.get(username);

    if (!player || player.password !== password) {
      return Promise.reject(new Error('Player name or password is incorrect.'));
    }

    player.session = createMockSession(username);

    return Promise.resolve({
      playerName: username,
      accessToken: player.session.accessToken,
      refreshToken: player.session.refreshToken,
      expiresAt: player.session.expiresAt,
    });
  }
}

export class SupabaseRankingStore {
  constructor({
    url,
    anonKey,
    table = DEFAULT_RANKING_TABLE,
    profileTable = DEFAULT_PROFILE_TABLE,
    fetchImpl = globalThis.fetch,
  } = {}) {
    if (!url || !anonKey) {
      throw new Error('Supabase url and anonKey are required.');
    }

    if (!fetchImpl) {
      throw new Error('fetch is required to use SupabaseRankingStore.');
    }

    this.url = url.replace(/\/$/, '');
    this.anonKey = anonKey;
    this.table = table;
    this.profileTable = profileTable;
    this.fetchImpl = fetchImpl.bind?.(globalThis) ?? fetchImpl;
  }

  async saveScore(playerName, score, { accessToken } = {}) {
    if (!accessToken) {
      throw new Error('Supabase score registration requires a signed-in player.');
    }

    const username = normalizeUserName(playerName);
    const updateParams = new URLSearchParams({
      player_name: `eq.${username}`,
      select: 'id',
    });
    const updateResponse = await this.fetchImpl(`${this.restUrl}/${this.table}?${updateParams}`, {
      method: 'PATCH',
      headers: this.createHeaders({
        Authorization: `Bearer ${accessToken}`,
        Prefer: 'return=representation',
      }),
      body: JSON.stringify({
        score,
      }),
    });

    // テーブルが存在しない場合はスキップ（404 PGRST205）
    if (isTableNotFound(updateResponse)) return;
    await assertSupabaseResponse(updateResponse);

    const updatedRows = await updateResponse.json();

    if (updatedRows.length > 0) {
      return;
    }

    const response = await this.fetchImpl(`${this.restUrl}/${this.table}`, {
      method: 'POST',
      headers: this.createHeaders({
        Authorization: `Bearer ${accessToken}`,
        Prefer: 'return=minimal',
      }),
      body: JSON.stringify({
        player_name: username,
        score,
      }),
    });

    if (isTableNotFound(response)) return;
    await assertSupabaseResponse(response);
  }

  async getRanking() {
    const searchParams = new URLSearchParams({
      select: 'player_name,score,created_at',
      order: 'score.desc,created_at.asc',
      limit: '50',
    });
    const response = await this.fetchImpl(`${this.restUrl}/${this.table}?${searchParams}`, {
      method: 'GET',
      headers: this.createHeaders(),
    });

    // テーブルが存在しない場合は空配列を返す（404 PGRST205）
    if (isTableNotFound(response)) return [];
    await assertSupabaseResponse(response);

    const rows = await response.json();

    return dedupeRankingRows(rows)
      .slice(0, 10)
      .map((row) => ({
        playerName: row.player_name,
        score: row.score,
        createdAt: row.created_at,
      }));
  }

  async registerUser(playerName, password) {
    const username = normalizeUserName(playerName);

    if (await this.playerExists(username)) {
      throw new Error('Player name is already registered.');
    }

    const authResult = await this.requestAuth('/signup', {
      email: createAuthEmail(username),
      password,
      data: { username },
    });

    const session = authResult.session ?? authResult;

    if (!session?.access_token) {
      throw new Error(
        'Supabase signup did not return a session. Disable email confirmation for this app.',
      );
    }

    await this.ensureProfile(username, session.access_token);

    return toAuthSession(username, session);
  }

  async signInUser(playerName, password) {
    const username = normalizeUserName(playerName);
    const authResult = await this.requestAuth('/token?grant_type=password', {
      email: createAuthEmail(username),
      password,
    });

    return toAuthSession(username, authResult);
  }

  async playerExists(playerName) {
    const searchParams = new URLSearchParams({
      select: 'username',
      username: `eq.${playerName}`,
      limit: '1',
    });
    const response = await this.fetchImpl(`${this.restUrl}/${this.profileTable}?${searchParams}`, {
      method: 'GET',
      headers: this.createHeaders(),
    });

    await assertSupabaseResponse(response);

    const rows = await response.json();

    return rows.length > 0;
  }

  async ensureProfile(playerName, accessToken) {
    const response = await this.fetchImpl(`${this.restUrl}/${this.profileTable}`, {
      method: 'POST',
      headers: this.createHeaders({
        Authorization: `Bearer ${accessToken}`,
        Prefer: 'return=minimal,resolution=merge-duplicates',
      }),
      body: JSON.stringify({
        username: playerName,
      }),
    });

    await assertSupabaseResponse(response);
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

  async requestAuth(pathname, body) {
    const response = await this.fetchImpl(`${this.url}/auth/v1${pathname}`, {
      method: 'POST',
      headers: this.createHeaders(),
      body: JSON.stringify(body),
    });

    await assertSupabaseResponse(response);

    return response.json();
  }
}

export function createRankingStore(env = getRuntimeEnv(), { table } = {}) {
  const url = env.SUPABASE_URL;
  const anonKey = env.SUPABASE_ANON_KEY;
  const resolvedTable = table || env.SUPABASE_RANKING_TABLE || DEFAULT_RANKING_TABLE;

  if (url && anonKey) {
    return new SupabaseRankingStore({
      url,
      anonKey,
      table: resolvedTable,
      profileTable: env.SUPABASE_PROFILE_TABLE || DEFAULT_PROFILE_TABLE,
    });
  }

  return new MockRankingStore(resolvedTable);
}

export { DEFAULT_GRAVITY_RANKING_TABLE, DEFAULT_TIMED_RANKING_TABLE, DEFAULT_GRAVITY_TIMED_RANKING_TABLE };

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
  mockRankingByNamespace.clear();
  mockPlayers.clear();
}

export function normalizeUserName(playerName) {
  assertValidPlayerName(playerName);

  return playerName.trim();
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

function assertValidPlayerName(playerName) {
  if (typeof playerName !== 'string' || playerName.trim().length === 0) {
    throw new TypeError('playerName must be a non-empty string.');
  }

  if (playerName.trim().length > 24) {
    throw new RangeError('playerName must be 24 characters or fewer.');
  }
}

function assertValidPassword(password) {
  if (typeof password !== 'string' || password.length < 6) {
    throw new TypeError('password must be at least 6 characters.');
  }
}

async function assertSupabaseResponse(response) {
  if (response.ok) {
    return;
  }

  const errorText = await response.text();
  throw new Error(`Supabase request failed: ${response.status} ${errorText}`);
}

function isTableNotFound(response) {
  return response.status === 404;
}

function dedupeRankingRows(rows) {
  const rankingByPlayerName = new Map();

  for (const row of rows) {
    if (!rankingByPlayerName.has(row.player_name)) {
      rankingByPlayerName.set(row.player_name, row);
    }
  }

  return [...rankingByPlayerName.values()];
}

function createAuthEmail(playerName) {
  const bytes = new TextEncoder().encode(playerName.toLowerCase());
  const localPart = Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');

  return `u-${localPart}@${AUTH_EMAIL_DOMAIN}`;
}

function createMockSession(playerName) {
  return {
    accessToken: `mock-access-token:${playerName}:${Date.now()}`,
    refreshToken: `mock-refresh-token:${playerName}:${Date.now()}`,
    expiresAt: Math.floor(Date.now() / 1000) + 3600,
  };
}

function toAuthSession(playerName, session) {
  return {
    playerName,
    accessToken: session.access_token,
    refreshToken: session.refresh_token,
    expiresAt: session.expires_at,
  };
}

export const backendApi = new BackendApi();
