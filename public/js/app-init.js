/**
 * アプリケーション初期化スクリプト
 * 新しいシーン体系に対応した入口
 */

// シーン定義の import
import { LoginScene } from './scenes/login-scene.js';
import { ResultScene } from './scenes/result-scene.js';
import { HomeScene } from './scenes/home-scene.js';
import { GameScene } from './scenes/game-scene.js';
import { appState, setMockSession } from './state/app-state.js';

const sceneEntries = [
  ['LoginScene', LoginScene],
  ['HomeScene', HomeScene],
  ['GameScene', GameScene],
  ['ResultScene', ResultScene],
];
const initialSceneKey = appState.playerSession?.accessToken ? 'HomeScene' : 'LoginScene';

// ===== Phaser ゲーム設定 =====

const gameConfig = {
  type: Phaser.AUTO,
  parent: 'game-root',
  width: 800,
  height: 600,
  backgroundColor: '#0f172a',
  dom: { createContainer: true },
  scene: buildSceneOrder(initialSceneKey),
};

const game = new Phaser.Game(gameConfig);

// ===== グローバル画面遷移関数 =====

/**
 * ホーム画面へ遷移
 */
export function goToHome() {
  document.body.classList.remove('scene-login');
  game.scene.stop('LoginScene');
  game.scene.stop('GameScene');
  game.scene.stop('ResultScene');
  game.scene.start('HomeScene');
}

/**
 * ゲーム画面へ遷移
 */
export function goToGame() {
  game.scene.stop('HomeScene');
  game.scene.start('GameScene');
}

/**
 * リザルト画面へ遷移
 * @param {number} score ゲーム結果のスコア
 */
export function goToResult(score) {
  game.scene.stop('GameScene');
  game.scene.start('ResultScene', { score });
}

/**
 * ログイン画面へ戻す（ログアウト時）
 */
export function goToLogin() {
  document.body.classList.add('scene-login');
  game.scene.stop('HomeScene');
  game.scene.stop('GameScene');
  game.scene.stop('ResultScene');
  game.scene.start('LoginScene');
}

function buildSceneOrder(startSceneKey) {
  const startScene = sceneEntries.find(([sceneKey]) => sceneKey === startSceneKey);
  const otherScenes = sceneEntries.filter(([sceneKey]) => sceneKey !== startSceneKey);

  return [startScene, ...otherScenes].map(([, sceneClass]) => sceneClass);
}

// ===== デバッグ用初期化 =====

// 開発時: ログイン画面をスキップする場合
if (window.location.hash === '#home') {
  setMockSession('dev-player');
  setTimeout(() => goToHome(), 100);
}

if (window.location.hash === '#result') {
  setMockSession('dev-player');
  setTimeout(() => goToResult(1234), 100);
}
