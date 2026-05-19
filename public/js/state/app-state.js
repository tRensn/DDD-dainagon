/**
 * グローバルなアプリケーション状態
 * 全シーンから参照・更新される、単一の真実ソース
 */

export const appState = {
  // ユーザー認証情報
  playerSession: loadPlayerSessionFromStorage(),

  // 現在のゲーム結果（リザルト画面で使用）
  lastGameResult: null,
};

/**
 * プレイヤーセッションを保存＆更新
 * @param {Object} session {playerName, accessToken, refreshToken, expiresAt}
 */
export function setPlayerSession(session) {
  appState.playerSession = session;
  if (session) {
    localStorage.setItem('dainagon-player', JSON.stringify(session));
  } else {
    localStorage.removeItem('dainagon-player');
  }
}

/**
 * ゲーム結果を保存
 * @param {Object} result {score, gameId, totalClearedCount, ...}
 */
export function setLastGameResult(result) {
  appState.lastGameResult = result;
}

/**
 * localStorage からプレイヤーセッションを復元
 * @returns {Object|null}
 */
function loadPlayerSessionFromStorage() {
  try {
    const saved = localStorage.getItem('dainagon-player');
    if (!saved) return null;

    const session = JSON.parse(saved);

    // セッション有効期限チェック
    if (session.expiresAt && session.expiresAt <= Math.floor(Date.now() / 1000)) {
      localStorage.removeItem('dainagon-player');
      return null;
    }

    return session;
  } catch {
    localStorage.removeItem('dainagon-player');
    return null;
  }
}

/**
 * デバッグ用：モックセッションを設定
 */
export function setMockSession(playerName = 'test-player') {
  setPlayerSession({
    playerName,
    accessToken: `mock-token-${Date.now()}`,
    refreshToken: `mock-refresh-${Date.now()}`,
    expiresAt: Math.floor(Date.now() / 1000) + 86400,
  });
}
