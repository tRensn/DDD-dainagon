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
  ['HomeScene', HomeScene],
  ['LoginScene', LoginScene],
  ['GameScene', GameScene],
  ['ResultScene', ResultScene],
];

// ===== Phaser ゲーム設定 =====

const gameConfig = {
  type: Phaser.AUTO,
  parent: 'game-root',
  width: 800,
  height: 600,
  transparent: true,
  dom: { createContainer: true },
  scene: sceneEntries.map(([, sceneClass]) => sceneClass),
};

const game = new Phaser.Game(gameConfig);

// ===== グローバル画面遷移関数 =====

/**
 * ホーム画面へ遷移（ログイン後・ログアウト後共通）
 * サイドパネルのプレイヤー情報表示も更新する
 */
export function goToHome() {
  game.scene.stop('LoginScene');
  game.scene.stop('GameScene');
  game.scene.stop('ResultScene');
  game.scene.start('HomeScene');
}

/**
 * ログインモーダルをホーム画面の上に表示
 */
export function showLoginModal() {
  game.scene.launch('LoginScene');
  game.scene.bringToTop('LoginScene');
}

/**
 * ゲーム画面へ遷移
 */
export function goToGame() {
  game.scene.stop('HomeScene');
  game.scene.stop('ResultScene');
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

// ===== デバッグ用初期化 =====

if (window.location.hash === '#result') {
  setMockSession('dev-player');
  setTimeout(() => goToResult(1234), 100);
}
