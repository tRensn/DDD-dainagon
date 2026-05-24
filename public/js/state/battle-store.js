/**
 * 対戦部屋の Supabase REST ラッパー
 * battle_rooms テーブルを操作する
 */
export function createBattleStore() {
  const env = window.DAINAGON_CONFIG ?? {};
  const url = env.SUPABASE_URL;
  const key = env.SUPABASE_ANON_KEY;
  if (!url || !key) return null;

  const h = {
    'Content-Type': 'application/json',
    apikey: key,
    Authorization: `Bearer ${key}`,
    Prefer: 'return=representation',
  };

  const base = `${url}/rest/v1/battle_rooms`;
  const byCode = (code) => `${base}?room_code=eq.${encodeURIComponent(code)}`;

  return {
    async create(roomCode, mode, hostName) {
      const res = await fetch(base, {
        method: 'POST', headers: h,
        body: JSON.stringify({
          room_code: roomCode, mode, host_name: hostName,
          status: 'waiting', host_score: 0, guest_score: 0,
          host_finished: false, guest_finished: false,
          host_rematch: false, guest_rematch: false,
        }),
      });
      if (!res.ok) throw new Error(`部屋の作成に失敗しました (${res.status})`);
      const d = await res.json();
      return Array.isArray(d) ? d[0] : d;
    },

    async get(roomCode) {
      const res = await fetch(byCode(roomCode), {
        headers: { apikey: key, Authorization: `Bearer ${key}` },
      });
      if (!res.ok) return null;
      const d = await res.json();
      return d[0] ?? null;
    },

    async join(roomCode, guestName) {
      const res = await fetch(`${byCode(roomCode)}&status=eq.waiting`, {
        method: 'PATCH', headers: h,
        body: JSON.stringify({ guest_name: guestName, status: 'ready' }),
      });
      if (!res.ok) throw new Error('部屋が見つかりません');
      const d = await res.json();
      if (!d.length) throw new Error('部屋が見つかりません（満員か存在しない）');
      return d[0];
    },

    async setPlaying(roomCode) {
      await fetch(byCode(roomCode), {
        method: 'PATCH', headers: h,
        body: JSON.stringify({ status: 'playing' }),
      });
    },

    async updateScore(roomCode, role, score) {
      const field = role === 'host' ? 'host_score' : 'guest_score';
      await fetch(byCode(roomCode), {
        method: 'PATCH', headers: h,
        body: JSON.stringify({ [field]: score }),
      });
    },

    async setFinished(roomCode, role, finalScore) {
      const scoreField    = role === 'host' ? 'host_score'    : 'guest_score';
      const finishedField = role === 'host' ? 'host_finished' : 'guest_finished';
      await fetch(byCode(roomCode), {
        method: 'PATCH', headers: h,
        body: JSON.stringify({ [scoreField]: finalScore, [finishedField]: true }),
      });
    },

    async setRematch(roomCode, role) {
      const field = role === 'host' ? 'host_rematch' : 'guest_rematch';
      await fetch(byCode(roomCode), {
        method: 'PATCH', headers: h,
        body: JSON.stringify({ [field]: true }),
      });
    },

    async resetForRematch(roomCode) {
      await fetch(byCode(roomCode), {
        method: 'PATCH', headers: h,
        body: JSON.stringify({
          host_score: 0, guest_score: 0,
          host_finished: false, guest_finished: false,
          host_rematch: false, guest_rematch: false,
          status: 'playing',
        }),
      });
    },
  };
}

export function genRoomCode() {
  return Math.random().toString(36).substr(2, 4).toUpperCase();
}
