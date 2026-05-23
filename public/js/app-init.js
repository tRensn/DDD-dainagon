/**
 * アプリケーション初期化スクリプト
 * 新しいシーン体系に対応した入口
 */

// シーン定義の import
import { LoginScene } from './scenes/login-scene.js';
import { ResultScene } from './scenes/result-scene.js';
import { HomeScene } from './scenes/home-scene.js';
import { GameScene } from './scenes/game-scene.js';
import { GravityGameScene } from './scenes/gravity-game-scene.js';
import { HowToScene } from './scenes/how-to-scene.js';
import { RankingScene } from './scenes/ranking-scene.js';
import { ModeSelectScene } from './scenes/mode-select-scene.js';
import { setMockSession } from './state/app-state.js';

const sceneEntries = [
  ['HomeScene', HomeScene],
  ['LoginScene', LoginScene],
  ['HowToScene', HowToScene],
  ['RankingScene', RankingScene],
  ['GameScene', GameScene],
  ['GravityGameScene', GravityGameScene],
  ['ResultScene', ResultScene],
  ['ModeSelectScene', ModeSelectScene],
];

// ===== Phaser ゲーム設定 =====

const gameConfig = {
  type: Phaser.AUTO,
  parent: 'game-root',
  width: 800,
  height: 600,
  transparent: true,
  dom: { createContainer: true },
  physics: {
    default: 'matter',
    matter: { gravity: { y: 0 }, debug: false },
  },
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
  game.scene.stop('HowToScene');
  game.scene.stop('RankingScene');
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
  game.scene.stop('HowToScene');
  game.scene.stop('RankingScene');
  game.scene.stop('ResultScene');
  game.scene.stop('ModeSelectScene');
  game.scene.start('GameScene');
}

export function goToGravityGame() {
  game.scene.stop('HomeScene');
  game.scene.stop('HowToScene');
  game.scene.stop('RankingScene');
  game.scene.stop('ResultScene');
  game.scene.stop('ModeSelectScene');
  game.scene.start('GravityGameScene');
}

export function goToHowTo() {
  game.scene.stop('HomeScene');
  game.scene.stop('RankingScene');
  game.scene.start('HowToScene');
}

export function goToRanking() {
  game.scene.stop('HomeScene');
  game.scene.stop('HowToScene');
  game.scene.start('RankingScene');
}

/**
 * リザルト画面へ遷移
 * @param {number} score ゲーム結果のスコア
 */
export function goToResult(score, stats = {}) {
  game.scene.stop('GameScene');
  game.scene.start('ResultScene', { score, ...stats });
}

// ===== デバッグ用初期化 =====

if (window.location.hash === '#result') {
  setMockSession('dev-player');
  setTimeout(() => goToResult(1234), 100);
}
