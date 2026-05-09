// シーンの定義
class MainScene extends Phaser.Scene {
    constructor() {
        super({ key: 'MainScene' });
    }

    preload() {
        // 画像やアセットの読み込みはここで行います
    }

    create() {
        // 画面中央にテキストを表示
        this.add.text(400, 300, '環境構築 完了！', {
            fontSize: '32px',
            fill: '#00ff00'
        }).setOrigin(0.5);
    }

    update() {
        // ゲームのループ処理（フレームごとの更新）はここで行います
    }
}

// ゲームの基本設定
const config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    backgroundColor: '#000000',
    scene: [MainScene]
};

// ゲームインスタンスの生成
const game = new Phaser.Game(config);