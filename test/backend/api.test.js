import assert from 'node:assert/strict';
import test from 'node:test';

import {
  BackendApi,
  MockRankingStore,
  SupabaseRankingStore,
  createRankingStore,
  normalizeRankingScore,
  normalizeUserName,
  resetMockRanking,
} from '../../src/backend/api.js';
import { GAME_PARAMETERS } from '../../src/constants.js';

const originalConsoleLog = console.log;

test.beforeEach(() => {
  console.log = () => {};
});

test.afterEach(() => {
  console.log = originalConsoleLog;
});

test('normalizeRankingScore keeps positive scores', () => {
  assert.equal(normalizeRankingScore(1200), 1200);
});

test('normalizeRankingScore keeps negative scores for ranking', () => {
  assert.equal(normalizeRankingScore(-50), -50);
});

test('normalizeRankingScore rejects non-finite scores', () => {
  assert.throws(() => normalizeRankingScore(Number.NaN), TypeError);
  assert.throws(() => normalizeRankingScore(Number.POSITIVE_INFINITY), TypeError);
  assert.throws(() => normalizeRankingScore(Number.NEGATIVE_INFINITY), TypeError);
});

test('normalizeRankingScore rejects non-integer scores', () => {
  assert.throws(() => normalizeRankingScore(10.5), TypeError);
  assert.throws(() => normalizeRankingScore(-7.25), TypeError);
});

test('normalizeRankingScore rejects unsafe integers', () => {
  assert.throws(() => normalizeRankingScore(Number.MAX_SAFE_INTEGER + 1), RangeError);
  assert.throws(() => normalizeRankingScore(Number.MIN_SAFE_INTEGER - 1), RangeError);
});

test('saveScore stores negative game scores as negative ranking scores', async () => {
  resetMockRanking();

  const api = new BackendApi({ rankingStore: new MockRankingStore() });
  const result = await api.saveScore('mint-player', -70);
  const ranking = await api.getRanking();

  assert.deepEqual(result, {
    success: true,
    playerName: 'mint-player',
    score: -70,
    originalScore: -70,
  });
  assert.deepEqual(ranking, [{ playerName: 'mint-player', score: -70 }]);
});

test('saveScore is idempotent when same gameId is submitted multiple times', async () => {
  resetMockRanking();

  const api = new BackendApi({ rankingStore: new MockRankingStore() });
  const first = await api.saveScore('mint-player', 100, { gameId: 'game-001' });
  const second = await api.saveScore('mint-player', 999, { gameId: 'game-001' });
  const ranking = await api.getRanking();

  assert.deepEqual(first, {
    success: true,
    playerName: 'mint-player',
    score: 100,
    originalScore: 100,
    gameId: 'game-001',
  });
  assert.deepEqual(second, first);
  assert.deepEqual(ranking, [{ playerName: 'mint-player', score: 100 }]);
});

test('saveScore throws when gameId is an empty string', () => {
  const api = new BackendApi({ rankingStore: new MockRankingStore() });

  assert.throws(
    () => api.saveScore('mint-player', 100, { gameId: '   ' }),
    /gameId must be a non-empty string/,
  );
});

test('saveScore throws when playerName is an empty string', () => {
  const api = new BackendApi({ rankingStore: new MockRankingStore() });

  assert.throws(() => api.saveScore('', 100), /playerName must be a non-empty string/);
});

test('saveScore throws when playerName is whitespace only', () => {
  const api = new BackendApi({ rankingStore: new MockRankingStore() });

  assert.throws(() => api.saveScore('   ', 100), /playerName must be a non-empty string/);
});

test('normalizeUserName trims playerName', () => {
  assert.equal(normalizeUserName('  mint-player  '), 'mint-player');
});

test('saveScore throws when playerName is too long', () => {
  const api = new BackendApi({ rankingStore: new MockRankingStore() });

  assert.throws(() => api.saveScore('a'.repeat(25), 100), /24 characters or fewer/);
});

test('saveScore throws when playerName is not a string', () => {
  const api = new BackendApi({ rankingStore: new MockRankingStore() });

  assert.throws(() => api.saveScore(123, 100), /playerName must be a non-empty string/);
});

test('updateFeverStatus returns false when total clears are below threshold', async () => {
  const api = new BackendApi({ rankingStore: new MockRankingStore() });

  const isFever = await api.updateFeverStatus({
    totalClearedCount: GAME_PARAMETERS.FEVER_TOTAL_CLEARS_THRESHOLD - 1,
    chainCombo: GAME_PARAMETERS.FEVER_CHAIN_THRESHOLD,
  });

  assert.equal(isFever, false);
});

test('updateFeverStatus returns false when chain combo is below threshold', async () => {
  const api = new BackendApi({ rankingStore: new MockRankingStore() });

  const isFever = await api.updateFeverStatus({
    totalClearedCount: GAME_PARAMETERS.FEVER_TOTAL_CLEARS_THRESHOLD,
    chainCombo: GAME_PARAMETERS.FEVER_CHAIN_THRESHOLD - 1,
  });

  assert.equal(isFever, false);
});

test('updateFeverStatus returns true when both thresholds are met', async () => {
  const api = new BackendApi({ rankingStore: new MockRankingStore() });

  const isFever = await api.updateFeverStatus({
    totalClearedCount: GAME_PARAMETERS.FEVER_TOTAL_CLEARS_THRESHOLD,
    chainCombo: GAME_PARAMETERS.FEVER_CHAIN_THRESHOLD,
  });

  assert.equal(isFever, true);
});

test('getRanking returns the top 10 scores in descending order', async () => {
  resetMockRanking();

  const api = new BackendApi({ rankingStore: new MockRankingStore() });

  for (let i = 0; i < 12; i += 1) {
    await api.saveScore(`player-${i}`, i * 10);
  }

  const ranking = await api.getRanking();

  assert.equal(ranking.length, 10);
  assert.deepEqual(
    ranking.map(({ score }) => score),
    [110, 100, 90, 80, 70, 60, 50, 40, 30, 20],
  );
});

test('saveScore replaces an existing score for the same playerName', async () => {
  resetMockRanking();

  const api = new BackendApi({ rankingStore: new MockRankingStore() });
  await api.saveScore('mint-player', 100);
  await api.saveScore('mint-player', 250);
  const ranking = await api.getRanking();

  assert.deepEqual(ranking, [{ playerName: 'mint-player', score: 250 }]);
});

test('createRankingStore uses mock store when Supabase env is missing', () => {
  assert.ok(createRankingStore({}) instanceof MockRankingStore);
});

test('createRankingStore uses Supabase store when Supabase env is present', () => {
  const store = createRankingStore({
    SUPABASE_URL: 'https://example.supabase.co',
    SUPABASE_ANON_KEY: 'anon-key',
  });

  assert.ok(store instanceof SupabaseRankingStore);
});

test('SupabaseRankingStore saves scores through Supabase REST API', async () => {
  const requests = [];
  const store = new SupabaseRankingStore({
    url: 'https://example.supabase.co/',
    anonKey: 'anon-key',
    table: 'rankings',
    fetchImpl: async (url, options) => {
      requests.push({ url, options });

      if (options.method === 'PATCH') {
        return {
          ok: true,
          status: 200,
          json: async () => [],
          text: async () => '',
        };
      }

      return {
        ok: true,
        status: 201,
        text: async () => '',
      };
    },
  });

  await store.saveScore('mint-player', -70, { accessToken: 'access-token' });

  assert.match(requests[0].url, /^https:\/\/example\.supabase\.co\/rest\/v1\/rankings\?/);
  assert.match(decodeURIComponent(requests[0].url), /player_name=eq\.mint-player/);
  assert.equal(requests[0].options.method, 'PATCH');
  assert.equal(requests[0].options.headers.apikey, 'anon-key');
  assert.equal(requests[0].options.headers.Authorization, 'Bearer access-token');
  assert.equal(requests[0].options.headers.Prefer, 'return=representation');
  assert.deepEqual(JSON.parse(requests[0].options.body), {
    score: -70,
  });
  assert.equal(requests[1].url, 'https://example.supabase.co/rest/v1/rankings');
  assert.equal(requests[1].options.method, 'POST');
  assert.equal(requests[1].options.headers.Authorization, 'Bearer access-token');
  assert.equal(requests[1].options.headers.Prefer, 'return=minimal');
  assert.deepEqual(JSON.parse(requests[1].options.body), {
    player_name: 'mint-player',
    score: -70,
  });
});

test('SupabaseRankingStore updates existing scores without inserting', async () => {
  const requests = [];
  const store = new SupabaseRankingStore({
    url: 'https://example.supabase.co/',
    anonKey: 'anon-key',
    table: 'rankings',
    fetchImpl: async (url, options) => {
      requests.push({ url, options });

      return {
        ok: true,
        status: 200,
        json: async () => [{ id: 'ranking-001' }],
        text: async () => '',
      };
    },
  });

  await store.saveScore('mint-player', 120, { accessToken: 'access-token' });

  assert.equal(requests.length, 1);
  assert.equal(requests[0].options.method, 'PATCH');
});

test('SupabaseRankingStore requires a signed-in player to save scores', async () => {
  const store = new SupabaseRankingStore({
    url: 'https://example.supabase.co/',
    anonKey: 'anon-key',
  });

  await assert.rejects(() => store.saveScore('mint-player', -70), /signed-in player/);
});

test('SupabaseRankingStore fetches ranking through Supabase REST API', async () => {
  const requests = [];
  const store = new SupabaseRankingStore({
    url: 'https://example.supabase.co',
    anonKey: 'anon-key',
    fetchImpl: async (url, options) => {
      requests.push({ url, options });

      return {
        ok: true,
        status: 200,
        json: async () => [
          { player_name: 'high', score: 120, created_at: '2026-05-11T00:00:00Z' },
          { player_name: 'low', score: -10, created_at: '2026-05-11T00:01:00Z' },
        ],
        text: async () => '',
      };
    },
  });

  const ranking = await store.getRanking();

  assert.equal(requests[0].options.method, 'GET');
  assert.match(requests[0].url, /^https:\/\/example\.supabase\.co\/rest\/v1\/rankings\?/);
  assert.match(decodeURIComponent(requests[0].url), /order=score\.desc,created_at\.asc/);
  assert.match(decodeURIComponent(requests[0].url), /limit=50/);
  assert.deepEqual(ranking, [
    { playerName: 'high', score: 120, createdAt: '2026-05-11T00:00:00Z' },
    { playerName: 'low', score: -10, createdAt: '2026-05-11T00:01:00Z' },
  ]);
});

test('SupabaseRankingStore deduplicates ranking rows by playerName', async () => {
  const store = new SupabaseRankingStore({
    url: 'https://example.supabase.co',
    anonKey: 'anon-key',
    fetchImpl: async () => ({
      ok: true,
      status: 200,
      json: async () => [
        { player_name: 'mikan', score: 200, created_at: '2026-05-13T12:00:00Z' },
        { player_name: 'mikan', score: 100, created_at: '2026-05-13T11:00:00Z' },
        { player_name: 'berry', score: 90, created_at: '2026-05-13T10:00:00Z' },
      ],
      text: async () => '',
    }),
  });

  const ranking = await store.getRanking();

  assert.deepEqual(ranking, [
    { playerName: 'mikan', score: 200, createdAt: '2026-05-13T12:00:00Z' },
    { playerName: 'berry', score: 90, createdAt: '2026-05-13T10:00:00Z' },
  ]);
});

test('SupabaseRankingStore throws when Supabase responds with an error', async () => {
  const store = new SupabaseRankingStore({
    url: 'https://example.supabase.co',
    anonKey: 'anon-key',
    fetchImpl: async () => ({
      ok: false,
      status: 500,
      text: async () => 'database is down',
    }),
  });

  await assert.rejects(
    () => store.saveScore('player', 100, { accessToken: 'access-token' }),
    /database is down/,
  );
});

test('MockRankingStore registers and signs in players', async () => {
  resetMockRanking();

  const api = new BackendApi({ rankingStore: new MockRankingStore() });
  const registered = await api.registerUser(' mint-player ', 'secret1');
  const signedIn = await api.signInUser('mint-player', 'secret1');

  assert.equal(registered.playerName, 'mint-player');
  assert.match(registered.accessToken, /^mock-access-token:mint-player:/);
  assert.equal(signedIn.playerName, 'mint-player');
  assert.match(signedIn.accessToken, /^mock-access-token:mint-player:/);
});

test('MockRankingStore rejects duplicate player names', async () => {
  resetMockRanking();

  const api = new BackendApi({ rankingStore: new MockRankingStore() });
  await api.registerUser('mint-player', 'secret1');

  await assert.rejects(() => api.registerUser('mint-player', 'secret2'), /already registered/);
});

test('SupabaseRankingStore registers players through Auth and profiles table', async () => {
  const requests = [];
  const store = new SupabaseRankingStore({
    url: 'https://example.supabase.co/',
    anonKey: 'anon-key',
    fetchImpl: async (url, options) => {
      requests.push({ url, options });

      if (url.includes('/rest/v1/profiles?')) {
        return {
          ok: true,
          status: 200,
          json: async () => [],
          text: async () => '',
        };
      }

      if (url.endsWith('/auth/v1/signup')) {
        return {
          ok: true,
          status: 200,
          json: async () => ({
            session: {
              access_token: 'access-token',
              refresh_token: 'refresh-token',
              expires_at: 1770000000,
            },
          }),
          text: async () => '',
        };
      }

      return {
        ok: true,
        status: 201,
        text: async () => '',
      };
    },
  });

  const session = await store.registerUser('Mint Player', 'secret1');

  assert.match(requests[0].url, /^https:\/\/example\.supabase\.co\/rest\/v1\/profiles\?/);
  assert.equal(requests[0].options.method, 'GET');
  assert.equal(requests[1].url, 'https://example.supabase.co/auth/v1/signup');
  assert.deepEqual(JSON.parse(requests[1].options.body), {
    email: 'u-6d696e7420706c61796572@dainagon.example.com',
    password: 'secret1',
    data: { username: 'Mint Player' },
  });
  assert.equal(requests[2].url, 'https://example.supabase.co/rest/v1/profiles');
  assert.equal(requests[2].options.headers.Authorization, 'Bearer access-token');
  assert.deepEqual(JSON.parse(requests[2].options.body), { username: 'Mint Player' });
  assert.deepEqual(session, {
    playerName: 'Mint Player',
    accessToken: 'access-token',
    refreshToken: 'refresh-token',
    expiresAt: 1770000000,
  });
});

test('SupabaseRankingStore rejects duplicate player names before Auth signup', async () => {
  const requests = [];
  const store = new SupabaseRankingStore({
    url: 'https://example.supabase.co/',
    anonKey: 'anon-key',
    fetchImpl: async (url, options) => {
      requests.push({ url, options });

      return {
        ok: true,
        status: 200,
        json: async () => [{ username: 'Mint Player' }],
        text: async () => '',
      };
    },
  });

  await assert.rejects(() => store.registerUser('Mint Player', 'secret1'), /already registered/);

  assert.equal(requests.length, 1);
});

// 不足テスト: saveScore の score 型検証
test('saveScore throws when score is a string', () => {
  const api = new BackendApi({ rankingStore: new MockRankingStore() });

  assert.throws(() => api.saveScore('player', '1200'), /score must be a finite number/);
});

test('saveScore throws when score is null', () => {
  const api = new BackendApi({ rankingStore: new MockRankingStore() });

  assert.throws(() => api.saveScore('player', null), /score must be a finite number/);
});

test('saveScore throws when score is NaN', () => {
  const api = new BackendApi({ rankingStore: new MockRankingStore() });

  assert.throws(() => api.saveScore('player', Number.NaN), /score must be a finite number/);
});

// 不足テスト: gameId の型検証
test('saveScore throws when gameId is a number', () => {
  const api = new BackendApi({ rankingStore: new MockRankingStore() });

  assert.throws(
    () => api.saveScore('player', 100, { gameId: 12345 }),
    /gameId must be a non-empty string/,
  );
});

test('saveScore throws when gameId is an object', () => {
  const api = new BackendApi({ rankingStore: new MockRankingStore() });

  assert.throws(
    () => api.saveScore('player', 100, { gameId: {} }),
    /gameId must be a non-empty string/,
  );
});

// 不足テスト: Mock と Supabase の返却差分
test('MockRankingStore does not include createdAt in getRanking', async () => {
  resetMockRanking();

  const store = new MockRankingStore();
  await store.saveScore('player', 100);

  const ranking = await store.getRanking();

  assert.deepEqual(ranking, [{ playerName: 'player', score: 100 }]);
  assert.ok(!('createdAt' in ranking[0]));
});

test('SupabaseRankingStore includes createdAt in getRanking', async () => {
  const store = new SupabaseRankingStore({
    url: 'https://example.supabase.co',
    anonKey: 'anon-key',
    fetchImpl: async () => ({
      ok: true,
      status: 200,
      json: async () => [{ player_name: 'player', score: 100, created_at: '2026-05-13T12:00:00Z' }],
      text: async () => '',
    }),
  });

  const ranking = await store.getRanking();

  assert.equal(ranking[0].createdAt, '2026-05-13T12:00:00Z');
});

// 不足テスト: createRankingStore の境界条件
test('createRankingStore falls back to mock when only SUPABASE_URL is set', () => {
  const store = createRankingStore({
    SUPABASE_URL: 'https://example.supabase.co',
  });

  assert.ok(store instanceof MockRankingStore);
});

test('createRankingStore falls back to mock when only SUPABASE_ANON_KEY is set', () => {
  const store = createRankingStore({
    SUPABASE_ANON_KEY: 'anon-key',
  });

  assert.ok(store instanceof MockRankingStore);
});

test('createRankingStore uses custom table name when SUPABASE_RANKING_TABLE is set', () => {
  const store = createRankingStore({
    SUPABASE_URL: 'https://example.supabase.co',
    SUPABASE_ANON_KEY: 'anon-key',
    SUPABASE_RANKING_TABLE: 'custom_rankings',
  });

  assert.ok(store instanceof SupabaseRankingStore);
  assert.equal(store.table, 'custom_rankings');
});
