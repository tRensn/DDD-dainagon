// ゲーム画面のシーン - アイスクリームパズル
import { goToResult } from '../app-init.js';

export class GameScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameScene' });
    }

    preload() {
        this.load.image('cone-image', 'js/state/game screen image/image.png');
        this.load.image('ice-azuki-source', 'assets/images/あずき.png');
        this.load.image('ice-cookie-source', 'assets/images/クッキーアンドクリーム.png');
        this.load.image('ice-strawberry-source', 'assets/images/ストロベリー.png');
        this.load.image('ice-mint-source', 'assets/images/チョコミント.png');
        this.load.image('game-character-source', 'assets/images/ロックの画像倉庫/ゲーム画面キャラ.png');
        // 画像やアセットの読み込みはここで行います
    }

    create() {
        this.createPastelBackground();

        // ゲーム状態の初期化
        this.initGame();

        // ゲーム枠表示
        this.initGame();
        this.createIceCreamFrame();
        this.createGameCharacter();
        this.createNextIceCreamFrame();
        this.createScoreGuideFrame();

        // UI表示
        this.createUI();
        this.createFeverGauge();
        this.createPauseButton();
        this.createPauseHint();
        this.createMobileControls();

        // BGM再生
        this.createPastelBgm();

        // 入力設定
        this.setupInput();

        // 開始カウントダウン
        this.setupInput();
        this.startCountdown();
    }

    createPastelBackground() {
        this.cameras.main.setBackgroundColor('#FFEAF4');

        const width = this.scale.width;
        const height = this.scale.height;
        const graphics = this.add.graphics();

        graphics.fillStyle(0xFFEAF4, 1);
        graphics.fillRect(0, 0, width, height);

        graphics.fillStyle(0xE8F8F5, 1);
        graphics.fillCircle(110, 105, 95);
        graphics.fillCircle(705, 470, 130);

        graphics.fillStyle(0xFFF7C8, 1);
        graphics.fillCircle(635, 105, 80);

        graphics.fillStyle(0xDDEBFF, 1);
        graphics.fillCircle(95, 500, 115);
    }

    createIceCreamFrame() {
        const frameX = this.FRAME_X;
        const frameY = this.FRAME_Y;
        const frameWidth = this.FRAME_WIDTH;
        const frameHeight = this.FRAME_HEIGHT;
        const cornerRadius = 10;
        const coneTopY = frameY + frameHeight;
        const coneCenterX = frameX + frameWidth / 2;
        const sideLineBottomY = this.scale.height;
        const coneOverlapY = 30;

        this.iceCreamFrame = {
            x: frameX,
            y: frameY,
            width: frameWidth,
            height: frameHeight
        };
        this.gameOverLineY = frameY + 64;

        const graphics = this.add.graphics();

        graphics.fillStyle(0xFFFDF7, 0.92);
        graphics.fillRoundedRect(frameX, frameY, frameWidth, frameHeight, cornerRadius);
        graphics.fillRect(frameX, coneTopY, frameWidth, this.scale.height - coneTopY);

        graphics.lineStyle(13, 0xF6A7C8, 0.18);
        graphics.beginPath();
        graphics.moveTo(frameX + cornerRadius, frameY);
        graphics.lineTo(frameX + frameWidth - cornerRadius, frameY);
        graphics.arc(frameX + frameWidth - cornerRadius, frameY + cornerRadius, cornerRadius, -Math.PI / 2, 0);
        graphics.lineTo(frameX + frameWidth, sideLineBottomY);
        graphics.moveTo(frameX, sideLineBottomY);
        graphics.lineTo(frameX, frameY + cornerRadius);
        graphics.arc(frameX + cornerRadius, frameY + cornerRadius, cornerRadius, Math.PI, -Math.PI / 2);
        graphics.strokePath();

        graphics.lineStyle(8, 0xF6A7C8, 0.32);
        graphics.beginPath();
        graphics.moveTo(frameX + cornerRadius, frameY);
        graphics.lineTo(frameX + frameWidth - cornerRadius, frameY);
        graphics.arc(frameX + frameWidth - cornerRadius, frameY + cornerRadius, cornerRadius, -Math.PI / 2, 0);
        graphics.lineTo(frameX + frameWidth, sideLineBottomY);
        graphics.moveTo(frameX, sideLineBottomY);
        graphics.lineTo(frameX, frameY + cornerRadius);
        graphics.arc(frameX + cornerRadius, frameY + cornerRadius, cornerRadius, Math.PI, -Math.PI / 2);
        graphics.strokePath();

        graphics.lineStyle(5, 0xF6A7C8, 1);
        graphics.beginPath();
        graphics.moveTo(frameX + cornerRadius, frameY);
        graphics.lineTo(frameX + frameWidth - cornerRadius, frameY);
        graphics.arc(frameX + frameWidth - cornerRadius, frameY + cornerRadius, cornerRadius, -Math.PI / 2, 0);
        graphics.lineTo(frameX + frameWidth, sideLineBottomY);
        graphics.moveTo(frameX, sideLineBottomY);
        graphics.lineTo(frameX, frameY + cornerRadius);
        graphics.arc(frameX + cornerRadius, frameY + cornerRadius, cornerRadius, Math.PI, -Math.PI / 2);
        graphics.strokePath();

        graphics.lineStyle(2, 0xFFF7FB, 0.9);
        graphics.beginPath();
        graphics.moveTo(frameX + cornerRadius + 2, frameY + 1);
        graphics.lineTo(frameX + frameWidth - cornerRadius - 2, frameY + 1);
        graphics.arc(frameX + frameWidth - cornerRadius, frameY + cornerRadius, cornerRadius - 2, -Math.PI / 2, 0);
        graphics.lineTo(frameX + frameWidth - 1, sideLineBottomY - 2);
        graphics.moveTo(frameX + 1, sideLineBottomY - 2);
        graphics.lineTo(frameX + 1, frameY + cornerRadius + 2);
        graphics.arc(frameX + cornerRadius, frameY + cornerRadius, cornerRadius - 2, Math.PI, -Math.PI / 2);
        graphics.strokePath();

        graphics.lineStyle(5, 0xE85D75, 1);
        graphics.beginPath();
        graphics.moveTo(frameX + 18, this.gameOverLineY);
        graphics.lineTo(frameX + frameWidth - 18, this.gameOverLineY);
        graphics.strokePath();

        graphics.lineStyle(9, 0xE85D75, 0.2);
        graphics.beginPath();
        graphics.moveTo(frameX + 18, this.gameOverLineY);
        graphics.lineTo(frameX + frameWidth - 18, this.gameOverLineY);
        graphics.strokePath();

        this.createTransparentConeTexture();
        const coneDisplayWidth = frameWidth - 10;
        const coneImageTopY = coneTopY - coneOverlapY;
        const coneDisplayHeight = this.scale.height - coneImageTopY;
        const coneImage = this.add.image(coneCenterX, coneImageTopY, 'cone-transparent');
        coneImage.setOrigin(0.5, 0);
        coneImage.setX(coneCenterX);
        coneImage.setDisplaySize(coneDisplayWidth, coneDisplayHeight);
        coneImage.setDepth(2);
    }

    createTransparentConeTexture() {
        if (this.textures.exists('cone-transparent')) {
            this.textures.remove('cone-transparent');
        }

        const sourceImage = this.textures.get('cone-image').getSourceImage();
        const sourceCanvas = document.createElement('canvas');
        sourceCanvas.width = sourceImage.width;
        sourceCanvas.height = sourceImage.height;

        const sourceContext = sourceCanvas.getContext('2d');
        sourceContext.drawImage(sourceImage, 0, 0);

        const imageData = sourceContext.getImageData(0, 0, sourceCanvas.width, sourceCanvas.height);
        const pixels = imageData.data;
        let minX = sourceCanvas.width;
        let minY = sourceCanvas.height;
        let maxX = 0;
        let maxY = 0;

        for (let index = 0; index < pixels.length; index += 4) {
            const red = pixels[index];
            const green = pixels[index + 1];
            const blue = pixels[index + 2];
            const pixelIndex = index / 4;
            const x = pixelIndex % sourceCanvas.width;
            const y = Math.floor(pixelIndex / sourceCanvas.width);
            const isWhiteBackground = red > 238 && green > 238 && blue > 238 && Math.max(red, green, blue) - Math.min(red, green, blue) < 18;
            const isStrongGreenBackground = green > 95 && green > red * 1.45 && green > blue * 1.35;
            const isGreenEdge = green > 105 && green > red + 18 && green > blue + 22 && red < 190;
            const isDecorativeCorner = x > sourceCanvas.width * 0.75 && y > sourceCanvas.height * 0.68;

            if (isWhiteBackground || isStrongGreenBackground || isGreenEdge || isDecorativeCorner) {
                pixels[index + 3] = 0;
                continue;
            }

            minX = Math.min(minX, x);
            minY = Math.min(minY, y);
            maxX = Math.max(maxX, x);
            maxY = Math.max(maxY, y);
        }

        sourceContext.putImageData(imageData, 0, 0);

        const padding = 0;
        const cropX = Math.max(0, minX - padding);
        const cropY = Math.max(0, minY - padding);
        const cropWidth = Math.min(sourceCanvas.width - cropX, maxX - minX + padding * 2);
        const bottomCrop = 150;
        const cropHeight = Math.min(sourceCanvas.height - cropY, Math.max(1, maxY - minY + padding * 2 - bottomCrop));
        const textureWidth = cropWidth;
        const coneTexture = this.textures.createCanvas('cone-transparent', textureWidth, cropHeight);
        const coneContext = coneTexture.getContext();

        coneContext.drawImage(sourceCanvas, cropX, cropY, cropWidth, cropHeight, 0, 0, cropWidth, cropHeight);
        coneTexture.refresh();
    }

    createGameCharacter() {
        this.createWhiteBackgroundTransparentTexture('game-character-source', 'game-character-transparent');

        const leftMargin = 2;
        const gapFromFrame = 0;
        const maxWidth = Math.max(120, this.iceCreamFrame.x - leftMargin - gapFromFrame);
        const maxHeight = 250;
        const sourceImage = this.textures.get('game-character-transparent').getSourceImage();
        const scale = Math.min(maxWidth / sourceImage.width, maxHeight / sourceImage.height);
        const displayWidth = sourceImage.width * scale;
        const displayHeight = sourceImage.height * scale;
        const maxX = Math.max(leftMargin, this.iceCreamFrame.x - displayWidth - gapFromFrame);
        const centeredX = (this.iceCreamFrame.x - displayWidth) / 2;
        const x = Phaser.Math.Clamp(centeredX, leftMargin, maxX);
        const y = this.scale.height - displayHeight - 2;
        const character = this.add.image(x, y, 'game-character-transparent');

        character.setOrigin(0, 0);
        character.setDisplaySize(displayWidth, displayHeight);
        character.setDepth(12);
        this.gameCharacter = character;
    }

    createWhiteBackgroundTransparentTexture(sourceKey, textureKey) {
        if (this.textures.exists(textureKey)) {
            this.textures.remove(textureKey);
        }

        const sourceImage = this.textures.get(sourceKey).getSourceImage();
        const sourceCanvas = document.createElement('canvas');
        sourceCanvas.width = sourceImage.width;
        sourceCanvas.height = sourceImage.height;

        const sourceContext = sourceCanvas.getContext('2d');
        sourceContext.drawImage(sourceImage, 0, 0);

        const imageData = sourceContext.getImageData(0, 0, sourceCanvas.width, sourceCanvas.height);
        const pixels = imageData.data;
        const width = sourceCanvas.width;
        const height = sourceCanvas.height;
        const visited = new Uint8Array(width * height);
        const stack = [];

        const isBackgroundWhite = (pixelIndex) => {
            const index = pixelIndex * 4;
            const red = pixels[index];
            const green = pixels[index + 1];
            const blue = pixels[index + 2];
            const alpha = pixels[index + 3];
            return alpha > 0 && red > 238 && green > 238 && blue > 238 && Math.max(red, green, blue) - Math.min(red, green, blue) < 28;
        };

        const pushIfWhite = (x, y) => {
            if (x < 0 || y < 0 || x >= width || y >= height) return;
            const pixelIndex = y * width + x;
            if (visited[pixelIndex] || !isBackgroundWhite(pixelIndex)) return;
            visited[pixelIndex] = 1;
            stack.push(pixelIndex);
        };

        for (let x = 0; x < width; x++) {
            pushIfWhite(x, 0);
            pushIfWhite(x, height - 1);
        }
        for (let y = 0; y < height; y++) {
            pushIfWhite(0, y);
            pushIfWhite(width - 1, y);
        }

        while (stack.length > 0) {
            const pixelIndex = stack.pop();
            const x = pixelIndex % width;
            const y = Math.floor(pixelIndex / width);
            pixels[pixelIndex * 4 + 3] = 0;
            pushIfWhite(x + 1, y);
            pushIfWhite(x - 1, y);
            pushIfWhite(x, y + 1);
            pushIfWhite(x, y - 1);
        }

        let minX = width;
        let minY = height;
        let maxX = 0;
        let maxY = 0;
        for (let index = 0; index < pixels.length; index += 4) {
            if (pixels[index + 3] === 0) continue;
            const pixelIndex = index / 4;
            const x = pixelIndex % width;
            const y = Math.floor(pixelIndex / width);
            minX = Math.min(minX, x);
            minY = Math.min(minY, y);
            maxX = Math.max(maxX, x);
            maxY = Math.max(maxY, y);
        }

        sourceContext.putImageData(imageData, 0, 0);

        const padding = 4;
        const cropX = Math.max(0, minX - padding);
        const cropY = Math.max(0, minY - padding);
        const cropWidth = Math.min(width - cropX, maxX - minX + padding * 2);
        const cropHeight = Math.min(height - cropY, maxY - minY + padding * 2);
        const transparentTexture = this.textures.createCanvas(textureKey, cropWidth, cropHeight);
        const transparentContext = transparentTexture.getContext();

        transparentContext.clearRect(0, 0, cropWidth, cropHeight);
        transparentContext.drawImage(sourceCanvas, cropX, cropY, cropWidth, cropHeight, 0, 0, cropWidth, cropHeight);
        transparentTexture.refresh();
    }

    createNextIceCreamFrame() {
        const previewSize = 118;
        const previewX = this.iceCreamFrame.x + this.iceCreamFrame.width + 10;
        const previewY = this.iceCreamFrame.y + 18;
        const graphics = this.add.graphics();
        graphics.setDepth(14);

        this.nextPreviewFrame = {
            x: previewX,
            y: previewY,
            size: previewSize,
            centerX: previewX + previewSize / 2,
            centerY: previewY + previewSize / 2,
            firstY: previewY + 38,
            secondY: previewY + 82
        };

        graphics.fillStyle(0xFFFDF7, 0.94);
        graphics.fillRoundedRect(previewX, previewY, previewSize, previewSize, 10);

        graphics.lineStyle(13, 0xF6A7C8, 0.18);
        graphics.strokeRoundedRect(previewX, previewY, previewSize, previewSize, 10);

        graphics.lineStyle(8, 0xF6A7C8, 0.32);
        graphics.strokeRoundedRect(previewX, previewY, previewSize, previewSize, 10);

        graphics.lineStyle(5, 0xF6A7C8, 1);
        graphics.strokeRoundedRect(previewX, previewY, previewSize, previewSize, 10);

        graphics.lineStyle(2, 0xFFF7FB, 0.9);
        graphics.strokeRoundedRect(previewX + 3, previewY + 3, previewSize - 6, previewSize - 6, 8);
    }

    createScoreGuideFrame() {
        {
            const x = this.nextPreviewFrame.x;
            const y = this.nextPreviewFrame.y + this.nextPreviewFrame.size + 12;
            const width = this.scale.width - x - 10;
            const height = 174;
            const graphics = this.add.graphics();
            graphics.setDepth(14);

            graphics.fillStyle(0xFFFDF7, 0.92);
            graphics.fillRoundedRect(x, y, width, height, 10);
            graphics.lineStyle(5, 0xA9DDF7, 0.95);
            graphics.strokeRoundedRect(x, y, width, height, 10);
            graphics.lineStyle(2, 0xFFFFFF, 0.9);
            graphics.strokeRoundedRect(x + 3, y + 3, width - 6, height - 6, 8);

            const lines = [
                { text: '基礎点（3個消し）', size: '15px', color: '#7F6BAE', y: y + 25 },
                { text: '大納言あずき  +10', size: '14px', color: '#8A3450', y: y + 60 },
                { text: 'クッキー&クリーム  +5', size: '13px', color: '#5B4B42', y: y + 90 },
                { text: 'ストロベリー  +3', size: '14px', color: '#D9577F', y: y + 120 },
                { text: 'チョコミント  -5', size: '14px', color: '#4F9F8B', y: y + 150 }
            ];

            this.scoreGuideTexts = lines.map((line) =>
                this.add.text(x + width / 2, line.y, line.text, {
                    fontFamily: "'Nunito', sans-serif",
                    fontSize: line.size,
                    fill: line.color,
                    fontStyle: 'bold',
                    stroke: '#FFFFFF',
                    strokeThickness: 3
                }).setOrigin(0.5).setDepth(15)
            );
            return;
        }

        {
            const x = this.nextPreviewFrame.x;
            const y = this.nextPreviewFrame.y + this.nextPreviewFrame.size + 12;
            const width = this.scale.width - x - 10;
            const height = 174;
            const graphics = this.add.graphics();
            graphics.setDepth(14);

            graphics.fillStyle(0xFFFDF7, 0.92);
            graphics.fillRoundedRect(x, y, width, height, 10);
            graphics.lineStyle(5, 0xA9DDF7, 0.95);
            graphics.strokeRoundedRect(x, y, width, height, 10);
            graphics.lineStyle(2, 0xFFFFFF, 0.9);
            graphics.strokeRoundedRect(x + 3, y + 3, width - 6, height - 6, 8);

            const lines = [
                { text: '基礎点', size: '18px', color: '#7F6BAE', y: y + 20 },
                { text: '3個消し', size: '14px', color: '#7F6BAE', y: y + 42 },
                { text: '大納言あずき  +10', size: '14px', color: '#8A3450', y: y + 72 },
                { text: 'クッキー&クリーム  +5', size: '13px', color: '#5B4B42', y: y + 100 },
                { text: 'ストロベリー  +3', size: '14px', color: '#D9577F', y: y + 128 },
                { text: 'チョコミント  -5', size: '14px', color: '#4F9F8B', y: y + 156 }
            ];

            this.scoreGuideTexts = lines.map((line) =>
                this.add.text(x + width / 2, line.y, line.text, {
                    fontSize: line.size,
                    fill: line.color,
                    fontStyle: 'bold',
                    stroke: '#FFFFFF',
                    strokeThickness: 3
                }).setOrigin(0.5).setDepth(15)
            );
            return;
        }

        {
            const x = this.nextPreviewFrame.x;
            const y = this.nextPreviewFrame.y + this.nextPreviewFrame.size + 12;
            const width = this.scale.width - x - 10;
            const height = 166;
            const graphics = this.add.graphics();
            graphics.setDepth(14);

            graphics.fillStyle(0xFFFDF7, 0.9);
            graphics.fillRoundedRect(x, y, width, height, 10);
            graphics.lineStyle(5, 0xA9DDF7, 0.95);
            graphics.strokeRoundedRect(x, y, width, height, 10);
            graphics.lineStyle(2, 0xFFFFFF, 0.9);
            graphics.strokeRoundedRect(x + 3, y + 3, width - 6, height - 6, 8);

            const lines = [
                { text: '基礎点（3個消し）', size: '14px', color: '#7F6BAE', y: y + 22 },
                { text: '大納言あずき +10', size: '12px', color: '#8A3450', y: y + 56 },
                { text: 'クッキー&クリーム +5', size: '11px', color: '#5B4B42', y: y + 84 },
                { text: 'ストロベリー +3', size: '12px', color: '#D9577F', y: y + 112 },
                { text: 'チョコミント -5', size: '12px', color: '#4F9F8B', y: y + 140 }
            ];

            this.scoreGuideTexts = lines.map((line) =>
                this.add.text(x + width / 2, line.y, line.text, {
                    fontSize: line.size,
                    fill: line.color,
                    fontStyle: 'bold',
                    stroke: '#FFFFFF',
                    strokeThickness: 3
                }).setOrigin(0.5).setDepth(15)
            );
            return;
        }

        const width = Math.min(174, this.scale.width - this.nextPreviewFrame.x - 10);
        const x = this.nextPreviewFrame.x - Math.max(0, width - this.nextPreviewFrame.size);
        const y = this.nextPreviewFrame.y + this.nextPreviewFrame.size + 12;
        const height = 186;
        const graphics = this.add.graphics();
        graphics.setDepth(14);

        graphics.fillStyle(0xFFFDF7, 0.9);
        graphics.fillRoundedRect(x, y, width, height, 10);
        graphics.lineStyle(5, 0xA9DDF7, 0.95);
        graphics.strokeRoundedRect(x, y, width, height, 10);
        graphics.lineStyle(2, 0xFFFFFF, 0.9);
        graphics.strokeRoundedRect(x + 3, y + 3, width - 6, height - 6, 8);

        const lines = [
            { text: '各種類の', size: '14px', color: '#7F6BAE', y: y + 14 },
            { text: 'スコア増減', size: '14px', color: '#7F6BAE', y: y + 30 },
            { text: '大納言あずき +10', size: '12px', color: '#8A3450', y: y + 56 },
            { text: 'クッキー&', size: '12px', color: '#5B4B42', y: y + 78 },
            { text: 'クリーム +5', size: '12px', color: '#5B4B42', y: y + 94 },
            { text: 'ストロベリー +3', size: '12px', color: '#D9577F', y: y + 118 },
            { text: 'チョコミント -5', size: '12px', color: '#4F9F8B', y: y + 140 },
            { text: '連鎖・4個以上で+', size: '11px', color: '#7F6BAE', y: y + 166 }
        ];

        this.scoreGuideTexts = lines.map((line) =>
            this.add.text(x + width / 2, line.y, line.text, {
                fontSize: line.size,
                fill: line.color,
                fontStyle: 'bold',
                stroke: '#FFFFFF',
                strokeThickness: 3
            }).setOrigin(0.5).setDepth(15)
        );
    }

    initGame() {
        // ゲーム定数
        this.COLS = 6;
        this.VISIBLE_ROWS = 7;
        this.HIDDEN_ROWS = 1;
        this.ROWS = this.VISIBLE_ROWS + this.HIDDEN_ROWS;
        this.CELL_SIZE = 49;
        this.ICE_SCALE = 0.78;
        this.useTsumPhysics = false;
        this.TSUM_RADIUS = 27;
        this.TSUM_GRAVITY = 900;
        this.TSUM_BOUNCE = 0.006;
        this.TSUM_FRICTION = 0.88;
        this.MELTED_ICE_SCALE_X = 0.84;
        this.MELTED_ICE_SCALE_Y = 0.52;
        this.FRAME_WIDTH = 330;
        this.FRAME_HEIGHT = 430;
        this.FRAME_X = Math.round((this.scale.width - this.FRAME_WIDTH) / 2);
        this.FRAME_Y = 96;
        this.VISIBLE_GRID_START_Y = this.FRAME_Y + this.FRAME_HEIGHT - this.VISIBLE_ROWS * this.CELL_SIZE - 23;
        this.GRID_START_X = this.FRAME_X + (this.FRAME_WIDTH - this.COLS * this.CELL_SIZE) / 2;
        this.GRID_START_Y = this.VISIBLE_GRID_START_Y - this.HIDDEN_ROWS * this.CELL_SIZE;

        // アイスクリームの種類
        this.ICE_CREAM_TYPES = [
            { name: '大納言あずき', texture: 'ice-azuki', score: 10 },
            { name: 'クッキーアンドクリーム', texture: 'ice-cookie', score: 5 },
            { name: 'ストロベリー', texture: 'ice-strawberry', score: 3 },
            { name: 'チョコミント', texture: 'ice-mint', score: -5 }
        ];

        // ゲーム状態
        this.score = 0;
        this.maxChain = 0;
        this.erasedCounts = [0, 0, 0, 0];
        this.elapsedPlayMs = 0;
        this.lastElapsedTimerUpdateTime = 0;
        this.lastDisplayedElapsedSecond = -1;
        this.gameActive = true;
        this.gameStarted = false;
        this.canRetry = false;
        this.isPaused = false;
        this.countdownEvents = [];
        this.heldMoveDirection = 0;
        this.lastAutoMoveAt = 0;
        this.autoMoveStartDelayMs = 260;
        this.autoMoveIntervalMs = 110;
        this.mobileAutoMoveStartDelayMs = 260;
        this.mobileAutoMoveIntervalMs = 110;
        this.mobileHoldMoveEvent = null;
        this.meltAnimationMs = 760;
        this.fallingIceCream = null;
        this.nextIceCreamTypes = [
            Phaser.Math.Between(0, this.ICE_CREAM_TYPES.length - 1),
            Phaser.Math.Between(0, this.ICE_CREAM_TYPES.length - 1)
        ];
        this.nextIceCreamType = this.nextIceCreamTypes[0];
        this.grid = this.createEmptyGrid();
        this.dropSpeedLevels = [
            { score: 0, speed: 58 },
            { score: 30, speed: 166 },
            { score: 60, speed: 275 },
            { score: 90, speed: 383 },
            { score: 120, speed: 492 },
            { score: 150, speed: 600 }
        ];
        this.dropSpeed = this.dropSpeedLevels[0].speed;
        this.horizontalPassThroughMs = 260;
        this.meltTimeMs = 20000;
        this.feverGaugeScore = 0;
        this.feverDurationMs = 10000;
        this.feverActiveUntil = 0;
        this.feverEndHandled = true;
        this.feverRedrawTimer = 0;
        this.lastPausedTimerUpdateTime = 0;
        this.lastFeverPauseUpdateTime = 0;
        this.placedSprites = [];
        this.tsumPieces = [];

        this.createIceCreamTextures();
    }

    createIceCreamTextures() {
        this.createIceCreamImageTexture('ice-azuki', 'ice-azuki-source');
        this.createIceCreamImageTexture('ice-cookie', 'ice-cookie-source');
        this.createIceCreamImageTexture('ice-strawberry', 'ice-strawberry-source');
        this.createIceCreamImageTexture('ice-mint', 'ice-mint-source');
        return;

        this.createIceCreamTexture('ice-azuki', 0xC78AA0, 0x8A3450, (graphics) => {
            graphics.fillStyle(0x7B2339, 1);
            [[26, 28, 7, 10], [42, 23, 6, 9], [50, 40, 7, 10], [31, 48, 5, 8], [20, 41, 5, 7]].forEach(([x, y, w, h]) => {
                graphics.fillEllipse(x, y, w, h);
                graphics.fillStyle(0xB95B72, 0.9);
                graphics.fillEllipse(x - 1, y - 2, w * 0.35, h * 0.35);
                graphics.fillStyle(0x7B2339, 1);
            });
        });

        this.createIceCreamTexture('ice-cookie', 0xF6F0DE, 0x5B4B42, (graphics) => {
            graphics.fillStyle(0x3F342F, 1);
            [[24, 26, 7], [46, 31, 9], [33, 45, 8], [51, 49, 6], [20, 43, 5]].forEach(([x, y, size]) => {
                graphics.fillRect(x, y, size, size * 0.75);
            });
            graphics.fillStyle(0xD9CCB8, 0.8);
            graphics.fillCircle(38, 27, 4);
            graphics.fillCircle(28, 52, 3);
        });

        this.createIceCreamTexture('ice-strawberry', 0xF8AFC9, 0xD9577F, (graphics) => {
            graphics.fillStyle(0xE84E7D, 1);
            [[26, 27], [42, 30], [32, 43], [51, 45], [21, 47]].forEach(([x, y]) => {
                graphics.fillEllipse(x, y, 3, 6);
            });
            graphics.fillStyle(0xFFF7FB, 0.8);
            graphics.fillEllipse(30, 24, 16, 8);
            graphics.fillEllipse(47, 39, 10, 5);
        });

        this.createIceCreamTexture('ice-mint', 0xA9E8D1, 0x4F9F8B, (graphics) => {
            graphics.fillStyle(0x3F2E2A, 1);
            [[25, 29, 7], [46, 26, 6], [35, 43, 8], [52, 47, 5], [22, 49, 5]].forEach(([x, y, size]) => {
                graphics.fillRect(x, y, size, size);
            });
            graphics.fillStyle(0xE8FFF6, 0.75);
            graphics.fillEllipse(32, 24, 14, 7);
            graphics.fillEllipse(48, 39, 9, 5);
        });
    }

    createIceCreamImageTexture(key, sourceKey, options = {}) {
        if (this.textures.exists(key)) return;

        const source = this.textures.get(sourceKey).getSourceImage();
        const size = 76;
        const padding = 3;
        const cropSize = Math.min(source.width, source.height);
        const cropX = Math.round((source.width - cropSize) / 2);
        const cropY = Math.round((source.height - cropSize) / 2);
        const texture = this.textures.createCanvas(key, size, size);
        const context = texture.getContext();

        context.clearRect(0, 0, size, size);
        context.drawImage(source, cropX, cropY, cropSize, cropSize, padding, padding, size - padding * 2, size - padding * 2);

        if (options.removeBlack) {
            const imageData = context.getImageData(0, 0, size, size);
            const pixels = imageData.data;

            for (let i = 0; i < pixels.length; i += 4) {
                const red = pixels[i];
                const green = pixels[i + 1];
                const blue = pixels[i + 2];
                const alpha = pixels[i + 3];
                const isBlackBackground = alpha > 0 && red < 42 && green < 42 && blue < 42;

                if (isBlackBackground) {
                    pixels[i + 3] = 0;
                }
            }

            context.putImageData(imageData, 0, 0);
        }

        texture.refresh();
    }

    createIceCreamTexture(key, baseColor, outlineColor, drawDetails) {
        if (this.textures.exists(key)) return;

        const graphics = this.make.graphics({ x: 0, y: 0, add: false });

        graphics.fillStyle(0x000000, 0.1);
        graphics.fillEllipse(39, 60, 42, 12);

        graphics.fillStyle(baseColor, 1);
        graphics.lineStyle(4, outlineColor, 1);
        graphics.fillCircle(38, 36, 25);
        graphics.fillCircle(21, 39, 13);
        graphics.fillCircle(54, 41, 14);
        graphics.fillCircle(38, 52, 14);
        graphics.strokeCircle(38, 36, 25);

        graphics.fillStyle(0xFFFFFF, 0.38);
        graphics.fillEllipse(29, 25, 18, 9);

        drawDetails(graphics);

        graphics.generateTexture(key, 76, 76);
        graphics.destroy();
    }

    createEmptyGrid() {
        // グリッドの初期化（null = 空）
        const grid = [];
        for (let row = 0; row < this.ROWS; row++) {
            grid[row] = [];
            for (let col = 0; col < this.COLS; col++) {
                grid[row][col] = null;
            }
        }
        return grid;
    }

    createUI() {
        const timePanel = this.add.graphics();
        timePanel.setDepth(14);
        timePanel.fillStyle(0xFFFDF7, 0.82);
        timePanel.fillRoundedRect(14, 188, 206, 70, 12);
        timePanel.lineStyle(3, 0xA9DDF7, 0.9);
        timePanel.strokeRoundedRect(14, 188, 206, 70, 12);

        this.timeLabelText = this.add.text(28, 200, 'タイム', {
            fontSize: '18px',
            fill: '#5BA7D1',
            fontStyle: 'bold',
            stroke: '#FFFFFF',
            strokeThickness: 4
        });
        this.timeLabelText.setShadow(2, 2, '#DDEBFF', 2, true, true);
        this.timeLabelText.setDepth(15);

        this.elapsedTimeText = this.add.text(28, 221, '00:00', {
            fontSize: '30px',
            fill: '#7F6BAE',
            fontStyle: 'bold',
            stroke: '#FFFFFF',
            strokeThickness: 5
        });
        this.elapsedTimeText.setShadow(2, 2, '#A9DDF7', 2, true, true);
        this.elapsedTimeText.setDepth(15);

        const panel = this.add.graphics();
        panel.setDepth(14);
        const scorePanelX = this.iceCreamFrame.x;
        const scorePanelY = 24;
        const scorePanelWidth = this.iceCreamFrame.width;
        const scorePanelHeight = 58;
        panel.fillStyle(0xFFFDF7, 0.84);
        panel.fillRoundedRect(scorePanelX, scorePanelY, scorePanelWidth, scorePanelHeight, 14);
        panel.lineStyle(4, 0xF6A7C8, 0.92);
        panel.strokeRoundedRect(scorePanelX, scorePanelY, scorePanelWidth, scorePanelHeight, 14);
        panel.lineStyle(2, 0xFFF7FB, 0.95);
        panel.strokeRoundedRect(scorePanelX + 4, scorePanelY + 4, scorePanelWidth - 8, scorePanelHeight - 8, 11);
        // スコア表示（左側）
        this.scoreText = this.add.text(560, 100, `スコア: ${this.score}`, {
            fontSize: '26px',
            fill: '#7F6BAE',
            fontStyle: 'bold',
            stroke: '#FFFFFF',
            strokeThickness: 5
        });
        this.scoreText.setPosition(scorePanelX + 22, scorePanelY + scorePanelHeight / 2);
        this.scoreText.setOrigin(0, 0.5);
        this.scoreText.setShadow(2, 2, '#F6A7C8', 2, true, true);
        this.scoreText.setDepth(15);

    }

    createFeverGauge() {
        const panelX = this.iceCreamFrame.x + 20;
        const panelY = this.scale.height - 44;
        const panelWidth = this.iceCreamFrame.width - 40;
        const panelHeight = 34;
        const panel = this.add.graphics();

        panel.fillStyle(0xFFFDF7, 0.96);
        panel.fillRoundedRect(panelX, panelY, panelWidth, panelHeight, 10);
        panel.lineStyle(5, 0xF6A7C8, 1);
        panel.strokeRoundedRect(panelX, panelY, panelWidth, panelHeight, 10);
        panel.lineStyle(2, 0xFFE68A, 0.95);
        panel.strokeRoundedRect(panelX + 3, panelY + 3, panelWidth - 6, panelHeight - 6, 8);
        panel.setDepth(14);

        this.feverGauge = {
            x: panelX + 12,
            y: panelY + 10,
            width: panelWidth - 24,
            height: 16,
            graphics: this.add.graphics()
        };
        this.feverGauge.graphics.setDepth(15);

        this.updateFeverGauge();
    }

    createPauseHint() {
    }

    createPauseButton() {
        const x = 20;
        const y = 18;
        const width = 140;
        const height = 42;
        const radius = 12;
        const button = this.add.graphics();

        button.fillStyle(0xFFFDF7, 0.94);
        button.fillRoundedRect(x, y, width, height, radius);
        button.lineStyle(4, 0xF6A7C8, 1);
        button.strokeRoundedRect(x, y, width, height, radius);
        button.lineStyle(2, 0xFFF7FB, 0.9);
        button.strokeRoundedRect(x + 3, y + 3, width - 6, height - 6, radius - 3);
        button.setDepth(18);

        const label = this.add.text(x + width / 2, y + height / 2, 'PAUSE（esc）', {
            fontSize: '17px',
            fill: '#7F6BAE',
            fontStyle: 'bold',
            stroke: '#FFFFFF',
            strokeThickness: 4
        }).setOrigin(0.5).setDepth(19);

        const hitArea = this.add.zone(x + width / 2, y + height / 2, width, height);
        hitArea.setDepth(20);
        hitArea.setInteractive({ useHandCursor: true });
        hitArea.on('pointerdown', (pointer, localX, localY, event) => {
            if (event) event.stopPropagation();
            if (!this.gameActive || this.canRetry) return;

            button.setAlpha(0.76);
            label.setScale(0.96);
            this.togglePause();
        });
        hitArea.on('pointerup', () => {
            button.setAlpha(1);
            label.setScale(1);
        });
        hitArea.on('pointerout', () => {
            button.setAlpha(1);
            label.setScale(1);
        });

        this.pauseButton = { button, label, hitArea };
    }

    createMobileControls() {
        const buttons = [
            { x: 632, y: 488, radius: 28, label: '<', fontSize: '29px', holdDirection: -1, action: () => this.moveFallingIceCream(-1) },
            { x: 732, y: 488, radius: 28, label: '>', fontSize: '29px', holdDirection: 1, action: () => this.moveFallingIceCream(1) },
            {
                x: 682,
                y: 552,
                radius: 34,
                label: 'DROP',
                fontSize: '16px',
                action: () => {
                    if (!this.isPaused && this.gameStarted && this.fallingIceCream) {
                        this.hardDropIceCream();
                    }
                }
            }
        ];

        this.mobileControlButtons = buttons.map((button) => {
            const glow = this.add.circle(button.x, button.y, button.radius + 6, 0xFFE68A, 0.16);
            glow.setDepth(15);

            const base = this.add.circle(button.x, button.y, button.radius, 0xFFFDF7, 0.9);
            base.setStrokeStyle(4, 0xF6A7C8, 0.95);
            base.setDepth(16);
            base.setInteractive({ useHandCursor: true });

            const label = this.add.text(button.x, button.y, button.label, {
                fontSize: button.fontSize,
                fill: '#7F6BAE',
                fontStyle: 'bold',
                stroke: '#FFFFFF',
                strokeThickness: 4
            }).setOrigin(0.5).setDepth(17);

            base.on('pointerdown', (pointer, localX, localY, event) => {
                if (event) event.stopPropagation();
                base.setScale(0.92);
                label.setScale(0.92);
                button.action();
                if (button.holdDirection) {
                    this.startMobileHoldMove(button.holdDirection);
                }
            });

            base.on('pointerup', () => {
                base.setScale(1);
                label.setScale(1);
                this.stopMobileHoldMove();
            });

            base.on('pointerout', () => {
                base.setScale(1);
                label.setScale(1);
                this.stopMobileHoldMove();
            });

            return { base, glow, label };
        });
    }

    startMobileHoldMove(direction) {
        this.stopMobileHoldMove();
        const delayedStart = this.time.delayedCall(this.mobileAutoMoveStartDelayMs, () => {
            this.mobileHoldMoveEvent = this.time.addEvent({
                delay: this.mobileAutoMoveIntervalMs,
                loop: true,
                callback: () => this.moveFallingIceCream(direction)
            });
        });
        this.mobileHoldMoveEvent = delayedStart;
    }

    stopMobileHoldMove() {
        if (!this.mobileHoldMoveEvent) return;
        this.mobileHoldMoveEvent.remove(false);
        this.mobileHoldMoveEvent = null;
    }

    updateFeverGauge() {
        if (!this.feverGauge) return;

        const isFever = this.time.now < this.feverActiveUntil;
        const progress = isFever
            ? Phaser.Math.Clamp((this.feverActiveUntil - this.time.now) / this.feverDurationMs, 0, 1)
            : Phaser.Math.Clamp(this.feverGaugeScore / 20, 0, 1);
        const { x, y, width, height, graphics } = this.feverGauge;

        graphics.clear();
        graphics.fillStyle(0xFFFFFF, 0.95);
        graphics.fillRoundedRect(x, y, width, height, 8);
        graphics.lineStyle(3, 0xF6A7C8, 1);
        graphics.strokeRoundedRect(x, y, width, height, 8);

        if (progress > 0) {
            graphics.fillStyle(isFever ? 0x5BA7D1 : 0x5FCB7A, 1);
            graphics.fillRoundedRect(x + 4, y + 4, (width - 8) * progress, height - 8, 6);
            graphics.fillStyle(isFever ? 0xE8F8FF : 0xDDFBE6, 0.85);
            graphics.fillRoundedRect(x + 7, y + 6, Math.max(0, (width - 14) * progress), 5, 3);
        }
    }

    createPastelBgm() {
        this.bgmBeatMs = 220;
        this.bgmBeatIndex = 0;
        this.bgmMeasures = [
            {
                chord: [261.63, 329.63, 392.00],
                bass: [261.63, 392.00, 329.63, 392.00],
                melody: [659.25, 783.99, 880.00, null, 987.77, 880.00, 783.99, 659.25]
            },
            {
                chord: [349.23, 440.00, 523.25],
                bass: [349.23, 523.25, 440.00, 523.25],
                melody: [698.46, 880.00, 1046.50, 1174.66, null, 1046.50, 880.00, 698.46]
            },
            {
                chord: [392.00, 493.88, 587.33],
                bass: [392.00, 587.33, 493.88, 587.33],
                melody: [783.99, 987.77, 1174.66, 1318.51, 1174.66, null, 987.77, 880.00]
            },
            {
                chord: [329.63, 392.00, 493.88],
                bass: [329.63, 493.88, 392.00, 493.88],
                melody: [659.25, 783.99, 987.77, 1046.50, 987.77, 880.00, 783.99, 659.25]
            },
            {
                chord: [440.00, 523.25, 659.25],
                bass: [440.00, 659.25, 523.25, 659.25],
                melody: [880.00, 1046.50, 1174.66, 1318.51, null, 1174.66, 1046.50, 880.00]
            },
            {
                chord: [392.00, 493.88, 659.25],
                bass: [392.00, 659.25, 493.88, 659.25],
                melody: [987.77, 1174.66, 1318.51, 1567.98, 1318.51, 1174.66, null, 987.77]
            },
            {
                chord: [349.23, 440.00, 587.33],
                bass: [349.23, 587.33, 440.00, 587.33],
                melody: [880.00, 1046.50, 1174.66, 1046.50, 880.00, 783.99, 698.46, null]
            },
            {
                chord: [392.00, 523.25, 659.25],
                bass: [392.00, 659.25, 523.25, 659.25],
                melody: [783.99, 880.00, 987.77, 1046.50, 880.00, 783.99, 659.25, 523.25]
            }
        ];
        this.bgmStarted = false;

        const startBgm = () => {
            this.startPastelBgm();
        };

        this.time.delayedCall(300, startBgm);
        this.input.once('pointerdown', startBgm);
        this.input.keyboard.once('keydown', startBgm);
        this.game.events.on('focus', () => {
            if (this.audioContext?.state === 'suspended') {
                this.audioContext.resume();
            }
        });
        this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
            if (this.bgmLoop) {
                this.bgmLoop.remove(false);
                this.bgmLoop = null;
            }
            this.bgmStarted = false;
        });
    }

    startPastelBgm() {
        if (this.bgmStarted && this.audioContext?.state === 'running') return;

        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (!AudioContext) return;

        this.audioContext = this.audioContext || new AudioContext();
        this.setupAudioOutput();

        if (this.audioContext.state === 'suspended') {
            this.audioContext.resume();
        }

        this.bgmStarted = true;
        if (this.bgmLoop) return;

        this.playBgmNote();
        this.bgmLoop = this.time.addEvent({
            delay: 110,
            loop: true,
            callback: () => this.playBgmNote()
        });
    }

    setupAudioOutput() {
        if (this.masterGain) return;

        this.masterGain = this.audioContext.createGain();
        this.masterGain.gain.setValueAtTime(0.55, this.audioContext.currentTime);

        this.audioLimiter = this.audioContext.createDynamicsCompressor();
        this.audioLimiter.threshold.setValueAtTime(-18, this.audioContext.currentTime);
        this.audioLimiter.knee.setValueAtTime(16, this.audioContext.currentTime);
        this.audioLimiter.ratio.setValueAtTime(6, this.audioContext.currentTime);
        this.audioLimiter.attack.setValueAtTime(0.004, this.audioContext.currentTime);
        this.audioLimiter.release.setValueAtTime(0.18, this.audioContext.currentTime);

        this.masterGain.connect(this.audioLimiter);
        this.audioLimiter.connect(this.audioContext.destination);
    }

    playBgmNote() {
        if (!this.audioContext) return;

        const now = this.audioContext.currentTime;
        const measure = this.bgmMeasures[Math.floor(this.bgmBeatIndex / 8) % this.bgmMeasures.length];
        const beat = this.bgmBeatIndex % 8;
        const melodyNote = measure.melody[beat];
        const bassNote = measure.bass[Math.floor(beat / 2) % measure.bass.length];
        const arpeggioNote = measure.chord[beat % measure.chord.length];
        const isFever = this.time.now < this.feverActiveUntil;
        const beatSeconds = (isFever ? this.bgmBeatMs * 0.72 : this.bgmBeatMs) / 1000;
        const isSubBeat = this.bgmBeatIndex % 2 === 1;

        if (isSubBeat) {
            if (isFever) {
                this.playInstrumentTone(arpeggioNote * 2, now, beatSeconds * 0.4, 0.024, 'sparkle');
            }

            this.bgmBeatIndex++;
            return;
        }

        if (melodyNote) {
            const isPhraseEnd = beat === 3 || beat === 7;
            this.playInstrumentTone(melodyNote, now, isPhraseEnd ? beatSeconds * 1.35 : beatSeconds * 0.92, isFever ? 0.072 : 0.05, 'lead');

            if (isFever) {
                this.playInstrumentTone(melodyNote * 1.5, now + beatSeconds * 0.18, beatSeconds * 0.65, 0.032, 'sparkle');
            }
        }

        this.playInstrumentTone(arpeggioNote, now + beatSeconds * 0.5, beatSeconds * 0.58, isFever ? 0.024 : 0.016, 'chord');

        if (beat % 2 === 0) {
            this.playInstrumentTone(bassNote, now, beatSeconds * 1.55, isFever ? 0.045 : 0.03, 'bass');

            if (isFever) {
                measure.chord.forEach((chordNote) => {
                    this.playInstrumentTone(chordNote * 2, now + beatSeconds * 0.08, beatSeconds * 1.1, 0.018, 'chord');
                });
            }
        }

        if (beat === 6 && melodyNote) {
            this.playInstrumentTone(melodyNote * 2, now + beatSeconds * 0.25, beatSeconds * 0.45, isFever ? 0.035 : 0.018, 'sparkle');
        }

        this.bgmBeatIndex++;
    }

    playInstrumentTone(frequency, startTime, duration, volume, role) {
        this.setupAudioOutput();

        const oscillator = this.audioContext.createOscillator();
        const overtone = this.audioContext.createOscillator();
        const filter = this.audioContext.createBiquadFilter();
        const gain = this.audioContext.createGain();
        const overtoneGain = this.audioContext.createGain();

        const settings = {
            lead: { type: 'triangle', overtone: 2, filter: 2200, attack: 0.018, decay: 0.18 },
            chord: { type: 'sine', overtone: 1.5, filter: 1300, attack: 0.04, decay: 0.52 },
            bass: { type: 'triangle', overtone: 2, filter: 900, attack: 0.025, decay: 0.34 },
            sparkle: { type: 'sine', overtone: 2, filter: 2600, attack: 0.01, decay: 0.12 }
        }[role];

        oscillator.type = settings.type;
        oscillator.frequency.setValueAtTime(frequency, startTime);
        oscillator.frequency.exponentialRampToValueAtTime(frequency * 1.006, startTime + duration * 0.35);

        overtone.type = 'sine';
        overtone.frequency.setValueAtTime(frequency * settings.overtone, startTime);

        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(settings.filter, startTime);
        filter.Q.setValueAtTime(1.2, startTime);

        gain.gain.cancelScheduledValues(startTime);
        gain.gain.setValueAtTime(0.0001, startTime);
        gain.gain.linearRampToValueAtTime(volume, startTime + settings.attack);
        gain.gain.setTargetAtTime(volume * 0.35, startTime + settings.decay, 0.08);
        gain.gain.setTargetAtTime(0.0001, startTime + duration * 0.72, 0.06);

        overtoneGain.gain.setValueAtTime(volume * 0.22, startTime);
        overtoneGain.gain.setTargetAtTime(0.0001, startTime + duration * 0.55, 0.05);

        oscillator.connect(filter);
        overtone.connect(overtoneGain);
        overtoneGain.connect(filter);
        filter.connect(gain);
        gain.connect(this.masterGain);

        oscillator.start(startTime);
        overtone.start(startTime);
        oscillator.stop(startTime + duration + 0.18);
        overtone.stop(startTime + duration + 0.18);

        oscillator.onended = () => {
            oscillator.disconnect();
            overtone.disconnect();
            overtoneGain.disconnect();
            filter.disconnect();
            gain.disconnect();
        };
    }

    createGameGrid() {
        // グリッドの背景描画
        const graphics = this.make.graphics({ x: 0, y: 0, add: false });
        graphics.lineStyle(2, 0xD9C7E8, 1);
        graphics.fillStyle(0xFFFDF7, 1);

        for (let row = this.HIDDEN_ROWS; row < this.ROWS; row++) {
            for (let col = 0; col < this.COLS; col++) {
                const x = this.GRID_START_X + col * this.CELL_SIZE;
                const y = this.GRID_START_Y + row * this.CELL_SIZE;
                graphics.fillRect(x, y, this.CELL_SIZE, this.CELL_SIZE);
                graphics.strokeRect(x, y, this.CELL_SIZE, this.CELL_SIZE);
            }
        }

        graphics.generateTexture('gameGrid', this.COLS * this.CELL_SIZE, this.VISIBLE_ROWS * this.CELL_SIZE);
        graphics.destroy();

        // 配置位置
        const gridX = this.GRID_START_X + (this.COLS * this.CELL_SIZE) / 2;
        const gridY = this.VISIBLE_GRID_START_Y + (this.VISIBLE_ROWS * this.CELL_SIZE) / 2;
        this.add.image(gridX, gridY, 'gameGrid');
    }

    setupInput() {
        if (this.inputSetupDone) return;
        this.inputSetupDone = true;

        this.input.keyboard.addCapture([
            Phaser.Input.Keyboard.KeyCodes.LEFT,
            Phaser.Input.Keyboard.KeyCodes.RIGHT,
            Phaser.Input.Keyboard.KeyCodes.SPACE
        ]);

        this.browserKeyBlocker = (event) => {
            const isLeft = event.key === 'ArrowLeft';
            const isRight = event.key === 'ArrowRight';
            const isSpace = event.key === 'Space' || event.key === ' ' || event.code === 'Space';
            const shouldBlockScroll = isLeft || isRight || event.key === 'ArrowUp' || event.key === 'ArrowDown' || isSpace;

            if (!shouldBlockScroll) return;

            event.preventDefault();

            if (event.type === 'keydown') {
                if (isLeft) {
                    this.heldMoveDirection = -1;
                    if (!event.repeat) {
                        this.lastAutoMoveAt = this.time.now + this.autoMoveStartDelayMs;
                        this.moveFallingIceCream(-1);
                    }
                } else if (isRight) {
                    this.heldMoveDirection = 1;
                    if (!event.repeat) {
                        this.lastAutoMoveAt = this.time.now + this.autoMoveStartDelayMs;
                        this.moveFallingIceCream(1);
                    }
                } else if (isSpace && !event.repeat && !this.isPaused && this.gameStarted && this.fallingIceCream) {
                    this.hardDropIceCream();
                }
            } else if (event.type === 'keyup') {
                if ((isLeft && this.heldMoveDirection === -1) || (isRight && this.heldMoveDirection === 1)) {
                    this.heldMoveDirection = 0;
                }
            }

            event.stopImmediatePropagation();
        };
        window.addEventListener('keydown', this.browserKeyBlocker, { capture: true });
        window.addEventListener('keyup', this.browserKeyBlocker, { capture: true });
        document.addEventListener('keydown', this.browserKeyBlocker, { capture: true });
        this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
            window.removeEventListener('keydown', this.browserKeyBlocker, { capture: true });
            window.removeEventListener('keyup', this.browserKeyBlocker, { capture: true });
            document.removeEventListener('keydown', this.browserKeyBlocker, { capture: true });
            this.browserKeyBlocker = null;
            this.inputSetupDone = false;
            this.heldMoveDirection = 0;
            this.stopMobileHoldMove();
        });

        this.input.keyboard.on('keydown-LEFT', () => {
            this.heldMoveDirection = -1;
            this.lastAutoMoveAt = this.time.now + this.autoMoveStartDelayMs;
            this.moveFallingIceCream(-1);
        });

        this.input.keyboard.on('keydown-SPACE', () => {
            if (!this.isPaused && this.gameStarted && this.fallingIceCream) {
                this.hardDropIceCream();
            }
        });
        // 左右操作
        this.input.keyboard.on('keydown-LEFT', () => {
            this.heldMoveDirection = -1;
            this.lastAutoMoveAt = this.time.now + this.autoMoveStartDelayMs;
            this.moveFallingIceCream(-1);
        });

        this.input.keyboard.on('keydown-RIGHT', () => {
            this.heldMoveDirection = 1;
            this.lastAutoMoveAt = this.time.now + this.autoMoveStartDelayMs;
            this.moveFallingIceCream(1);
        });

        // スペースキーで即座に落下
        this.input.keyboard.on('keydown-SPACE', () => {
            if (!this.isPaused && this.gameStarted && this.fallingIceCream) {
                this.hardDropIceCream();
            }
        });

        this.input.keyboard.on('keydown-ENTER', () => {
            if (this.canRetry) {
                this.prepareSceneRestart();
                this.scene.restart();
            }
        });

        this.input.keyboard.on('keydown-ESC', () => {
            if (this.gameActive && !this.canRetry) {
                this.togglePause();
            }
        });
    }

    moveFallingIceCream(direction) {
        if (this.isPaused || !this.gameStarted || !this.fallingIceCream) {
            return;
        }

        if (this.useTsumPhysics) {
            const bounds = this.getTsumBounds();
            const nextX = Phaser.Math.Clamp(
                this.fallingIceCream.x + direction * this.CELL_SIZE,
                bounds.left + this.TSUM_RADIUS,
                bounds.right - this.TSUM_RADIUS
            );

            if (Math.abs(nextX - this.fallingIceCream.x) < 1) return;

            this.fallingIceCream.x = nextX;
            this.fallingIceCream.vx = direction * 120;
            this.updateFallingSpritePosition();
            this.playMoveSe();
            return;
        }

        const nextCol = this.findHorizontalMoveTargetCol(direction);
        if (nextCol === this.fallingIceCream.col) return;

            this.fallingIceCream.col = nextCol;
            this.fallingIceCream.passThroughUntil = this.time.now + this.horizontalPassThroughMs;
            this.updateFallingSpritePosition();
            this.updateDropMarker();
            this.playMoveSe();
        }

    findHorizontalMoveTargetCol(direction) {
        for (let col = this.fallingIceCream.col + direction; col >= 0 && col < this.COLS; col += direction) {
            const landingRow = this.getLandingRow(col);

            if (landingRow === -1) {
                continue;
            }

            if (this.fallingIceCream.y < this.getCellBottomY(landingRow)) {
                return col;
            }
        }

        return this.fallingIceCream.col;
    }

    prepareSceneRestart() {
        if (this.bgmLoop) {
            this.bgmLoop.remove(false);
            this.bgmLoop = null;
        }
        this.bgmStarted = false;

        if (this.browserKeyBlocker) {
            window.removeEventListener('keydown', this.browserKeyBlocker, { capture: true });
            window.removeEventListener('keyup', this.browserKeyBlocker, { capture: true });
            document.removeEventListener('keydown', this.browserKeyBlocker, { capture: true });
            this.browserKeyBlocker = null;
        }

        this.inputSetupDone = false;
    }

    togglePause() {
        this.isPaused = !this.isPaused;
        this.lastPausedTimerUpdateTime = this.time.now;
        this.lastFeverPauseUpdateTime = this.time.now;
        this.lastElapsedTimerUpdateTime = this.time.now;

        if (this.isPaused) {
            this.showPauseOverlay();
        } else {
            this.hidePauseOverlay();
        }
        this.setCountdownPaused(this.isPaused);
        this.updatePauseButtonLabel();
    }

    updatePauseButtonLabel() {
        if (!this.pauseButton) return;
        this.pauseButton.label.setText(this.isPaused ? 'RESUME' : 'PAUSE（esc）');
    }

    setCountdownPaused(paused) {
        if (!this.countdownEvents) return;
        this.countdownEvents.forEach((event) => {
            if (event) event.paused = paused;
        });
    }

    showPauseOverlay() {
        if (this.pauseOverlay) return;

        const x = this.iceCreamFrame.x + this.iceCreamFrame.width / 2;
        const y = this.iceCreamFrame.y + 190;
        const panel = this.add.graphics();

        panel.fillStyle(0xFFFDF7, 0.88);
        panel.fillRoundedRect(x - 125, y - 62, 250, 246, 16);
        panel.lineStyle(4, 0xA9DDF7, 0.9);
        panel.strokeRoundedRect(x - 125, y - 62, 250, 246, 16);
        panel.setDepth(13);

        const text = this.add.text(x, y - 12, 'PAUSE', {
            fontSize: '34px',
            fill: '#7F6BAE',
            fontStyle: 'bold',
            stroke: '#FFFFFF',
            strokeThickness: 6
        }).setOrigin(0.5).setDepth(14).setShadow(2, 2, '#A9DDF7', 2, true, true);

        const retryButton = this.createPauseMenuButton(x, y + 42, 176, 40, 'リトライ', () => {
            this.prepareSceneRestart();
            this.scene.restart();
        });
        const restartButton = this.createPauseMenuButton(x, y + 88, 176, 40, 'リスタート', () => {
            this.togglePause();
        });
        const homeButton = this.createPauseMenuButton(x, y + 134, 176, 40, 'ホーム画面へ', () => {
            this.prepareSceneRestart();
            this.scene.start('HomeScene');
        });

        this.pauseOverlay = { panel, text, buttons: [retryButton, homeButton, restartButton] };
    }

    createPauseMenuButton(x, y, width, height, labelText, action) {
        const base = this.add.graphics();
        base.fillStyle(0xFFFFFF, 0.96);
        base.fillRoundedRect(x - width / 2, y - height / 2, width, height, 12);
        base.lineStyle(4, 0xF6A7C8, 1);
        base.strokeRoundedRect(x - width / 2, y - height / 2, width, height, 12);
        base.lineStyle(2, 0xFFF7FB, 0.95);
        base.strokeRoundedRect(x - width / 2 + 3, y - height / 2 + 3, width - 6, height - 6, 9);
        base.setDepth(14);

        const label = this.add.text(x, y, labelText, {
            fontSize: '20px',
            fill: '#7F6BAE',
            fontStyle: 'bold',
            stroke: '#FFFFFF',
            strokeThickness: 4
        }).setOrigin(0.5).setDepth(15);

        const hitArea = this.add.zone(x, y, width, height);
        hitArea.setDepth(16);
        hitArea.setInteractive({ useHandCursor: true });
        hitArea.on('pointerdown', (pointer, localX, localY, event) => {
            if (event) event.stopPropagation();
            base.setAlpha(0.72);
            label.setScale(0.95);
            action();
        });
        hitArea.on('pointerup', () => {
            base.setAlpha(1);
            label.setScale(1);
        });
        hitArea.on('pointerout', () => {
            base.setAlpha(1);
            label.setScale(1);
        });

        return { base, label, hitArea };
    }

    hidePauseOverlay() {
        if (!this.pauseOverlay) return;

        this.pauseOverlay.panel.destroy();
        this.pauseOverlay.text.destroy();
        if (this.pauseOverlay.buttons) {
            this.pauseOverlay.buttons.forEach((button) => {
                button.base.destroy();
                button.label.destroy();
                button.hitArea.destroy();
            });
        }
        this.pauseOverlay = null;
    }

    updateElapsedTime(time) {
        if (!this.gameStarted) {
            this.lastElapsedTimerUpdateTime = time;
            return;
        }

        if (this.lastElapsedTimerUpdateTime === 0) {
            this.lastElapsedTimerUpdateTime = time;
            this.updateElapsedTimeText();
            return;
        }

        const delta = time - this.lastElapsedTimerUpdateTime;
        this.lastElapsedTimerUpdateTime = time;

        if (delta <= 0) return;

        this.elapsedPlayMs += delta;
        this.updateElapsedTimeText();
    }

    updateElapsedTimeText() {
        if (!this.elapsedTimeText) return;

        const elapsedSecond = Math.floor(this.elapsedPlayMs / 1000);
        if (elapsedSecond === this.lastDisplayedElapsedSecond) return;

        this.lastDisplayedElapsedSecond = elapsedSecond;
        this.elapsedTimeText.setText(this.formatElapsedTime(elapsedSecond));
    }

    formatElapsedTime(elapsedSecond) {
        const minutes = Math.floor(elapsedSecond / 60);
        const seconds = elapsedSecond % 60;

        return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    }

    startCountdown() {
        const counts = ['3', '2', '1'];
        const startDelay = 1000;
        this.countdownEvents = [];

        counts.forEach((count, index) => {
            const event = this.time.delayedCall(startDelay + index * 700, () => {
                this.showCountdownText(count);
                this.playCountdownSe(index);
            });
            this.countdownEvents.push(event);
        });

        const startTextEvent = this.time.delayedCall(startDelay + counts.length * 700, () => {
            this.showCountdownText('START!');
            this.playCountdownStartSe();
        });
        this.countdownEvents.push(startTextEvent);

        const startGameEvent = this.time.delayedCall(startDelay + counts.length * 700 + 500, () => {
            this.gameStarted = true;
            this.elapsedPlayMs = 0;
            this.lastElapsedTimerUpdateTime = this.time.now;
            this.updateElapsedTimeText();
            this.spawnNextIceCream();
        });
        this.countdownEvents.push(startGameEvent);
    }

    showCountdownText(label) {
        const text = this.add.text(this.iceCreamFrame.x + this.iceCreamFrame.width / 2, this.iceCreamFrame.y + 190, label, {
            fontSize: label === 'START!' ? '42px' : '64px',
            fill: '#7F6BAE',
            fontStyle: 'bold',
            stroke: '#FFFFFF',
            strokeThickness: 8
        }).setOrigin(0.5).setDepth(14).setShadow(2, 2, '#F6A7C8', 3, true, true);

        this.tweens.add({
            targets: text,
            scale: 1.35,
            alpha: 0,
            duration: 620,
            ease: 'Cubic.easeOut',
            onComplete: () => text.destroy()
        });
    }

    playCountdownSe(index) {
        if (!this.audioContext) return;

        const now = this.audioContext.currentTime;
        this.playInstrumentTone(659.25 + index * 110, now, 0.16, 0.04, 'sparkle');
    }

    playCountdownStartSe() {
        if (!this.audioContext) return;

        const now = this.audioContext.currentTime;
        this.playInstrumentTone(1046.50, now, 0.18, 0.045, 'sparkle');
        this.playInstrumentTone(1318.51, now + 0.08, 0.22, 0.04, 'sparkle');
    }

    playMoveSe() {
        if (!this.audioContext) return;

        const now = this.audioContext.currentTime;
        this.playInstrumentTone(587.33, now, 0.07, 0.026, 'sparkle');
        this.playInstrumentTone(783.99, now + 0.025, 0.08, 0.018, 'sparkle');
    }

    spawnNextIceCream() {
        // 新しいアイスクリームを生成
        const currentTypeIndex = this.nextIceCreamTypes[0];
        const startCol = Math.floor(this.COLS / 2);
        const bounds = this.getTsumBounds();
        const startX = this.iceCreamFrame.x + this.iceCreamFrame.width / 2;

        this.fallingIceCream = {
            type: currentTypeIndex,
            col: startCol,
            x: Phaser.Math.Clamp(startX, bounds.left + this.TSUM_RADIUS, bounds.right - this.TSUM_RADIUS),
            y: this.GRID_START_Y - this.CELL_SIZE * 0.35,
            vx: 0,
            vy: 0,
            angle: 0,
            isDropping: false,
            passThroughUntil: 0
        };
        this.nextIceCreamTypes.shift();
        this.nextIceCreamTypes.push(Phaser.Math.Between(0, this.ICE_CREAM_TYPES.length - 1));
        this.nextIceCreamType = this.nextIceCreamTypes[0];

        if (this.useTsumPhysics && this.isAnyIceCreamOverGameOverLine()) {
            this.endGame();
            return;
        }

        if (!this.useTsumPhysics && this.getLandingRow(startCol) === -1) {
            this.endGame();
            return;
        }

        const flavor = this.ICE_CREAM_TYPES[currentTypeIndex];
        this.fallingSprite = this.add.image(
            this.useTsumPhysics ? this.fallingIceCream.x : this.getCellCenterX(startCol),
            this.fallingIceCream.y,
            flavor.texture
        );
        this.fallingSprite.setScale(this.ICE_SCALE);
        this.fallingSprite.setDepth(5);
        this.createDropMarker();
        this.updateDropMarker();
        this.updateNextPreview();
    }

    update(time, delta) {
        if (!this.gameActive) return;

        if (this.isPaused) {
            this.pauseMeltTimersDuringStops(time);
            this.pauseFeverTimeDuringMatchResolution(time);
            this.lastElapsedTimerUpdateTime = time;
            return;
        }

        this.updateElapsedTime(time);
        this.updateMeltedIceCreams(time);
        this.updateFeverVisuals(time, delta);
        this.pauseMeltTimersDuringStops(time);
        this.pauseFeverTimeDuringMatchResolution(time);

        if (this.useTsumPhysics) {
            this.updateTsumPhysics(time, delta);
        }

        if (!this.gameStarted) return;
        if (!this.fallingIceCream) return;
        this.updateHeldHorizontalMove(time);

        if (this.useTsumPhysics) {
            this.updateFallingTsum(time, delta);
            return;
        }

        this.fallingIceCream.y += this.dropSpeed * (delta / 1000);

        const landingRow = this.getLandingRow(this.fallingIceCream.col);
        const isPassingThrough = time < (this.fallingIceCream.passThroughUntil || 0);
        if (!isPassingThrough && (landingRow === -1 || this.fallingIceCream.y >= this.getCellCenterY(landingRow))) {
            this.fixIceCreamToGrid();
            return;
        }

        this.updateFallingSpritePosition();
        this.updateDropMarker();
    }

    updateHeldHorizontalMove(time) {
        if (this.heldMoveDirection === 0) return;
        if (this.isPaused || !this.gameStarted || !this.fallingIceCream) return;
        if (time < this.lastAutoMoveAt) return;

        this.moveFallingIceCream(this.heldMoveDirection);
        this.lastAutoMoveAt = time + this.autoMoveIntervalMs;
    }

    fixIceCreamToGrid() {
        if (this.useTsumPhysics) {
            this.fixIceCreamToTsumPile();
            return;
        }

        // 現在のアイスクリームをグリッドに固定
        const col = this.fallingIceCream.col;
        const row = this.getLandingRow(col);

        if (row === -1) {
            this.endGame();
            return;
        }

        this.destroyDropMarker();

        this.grid[row][col] = {
            type: this.fallingIceCream.type,
            placedAt: this.time.now,
            melted: false
        };

        if (this.fallingSprite) {
            this.fallingSprite.destroy();
            this.fallingSprite = null;
        }

        this.fallingIceCream = null;
        const shouldEndGame = this.isAnyIceCreamOverGameOverLine();
        this.redrawGame();
        if (shouldEndGame) {
            this.endGame();
            return;
        }

        // 3つそろったら消す
        this.startMatchResolution();
    }

    getTsumBounds() {
        return {
            left: this.iceCreamFrame.x + 16,
            right: this.iceCreamFrame.x + this.iceCreamFrame.width - 16,
            top: this.iceCreamFrame.y,
            floor: this.iceCreamFrame.y + this.iceCreamFrame.height - 28
        };
    }

    updateFallingTsum(time, delta) {
        if (!this.fallingIceCream) return;

        const dt = Math.min(delta / 1000, 0.033);
        const bounds = this.getTsumBounds();
        const radius = this.TSUM_RADIUS;
        const falling = this.fallingIceCream;

        if (!falling.isDropping) {
            falling.vx *= 0.85;
            this.updateFallingSpritePosition();
            return;
        }

        falling.vy += this.TSUM_GRAVITY * dt;
        falling.x += falling.vx * dt;
        falling.y += falling.vy * dt;
        falling.angle += falling.vx * dt * 0.55;
        falling.vx *= 0.992;

        if (falling.x < bounds.left + radius) {
            falling.x = bounds.left + radius;
            falling.vx = Math.abs(falling.vx) * this.TSUM_BOUNCE;
        } else if (falling.x > bounds.right - radius) {
            falling.x = bounds.right - radius;
            falling.vx = -Math.abs(falling.vx) * this.TSUM_BOUNCE;
        }

        let touched = false;
        if (falling.y > bounds.floor - radius) {
            falling.y = bounds.floor - radius;
            falling.vy *= -this.TSUM_BOUNCE;
            falling.vx *= 0.34;
            touched = true;
        }

        for (const piece of this.tsumPieces) {
            const dx = falling.x - piece.x;
            const dy = falling.y - piece.y;
            const minDistance = radius * 2;
            const distance = Math.max(1, Math.hypot(dx, dy));

            if (distance >= minDistance) continue;

            const nx = dx / distance;
            const ny = dy / distance;
            const overlap = minDistance - distance;
            falling.x += nx * overlap;
            falling.y += ny * overlap;

            const impact = falling.vx * nx + falling.vy * ny;
            if (impact < 0) {
                falling.vx -= 0.28 * impact * nx;
                falling.vy -= 0.28 * impact * ny;
            }

            falling.vx += piece.vx * 0.015;
            falling.angle += nx * 0.9;
            piece.vx -= nx * 0.8;
            piece.vy -= ny * 0.25;
            touched = true;
        }

        this.updateFallingSpritePosition();

        const slowEnough = Math.abs(falling.vy) < 130 && Math.abs(falling.vx) < 70;
        if (touched && slowEnough && falling.y > bounds.top + radius * 2) {
            falling.vx *= 0.08;
            falling.vy *= 0.04;
            this.fixIceCreamToGrid();
        }
    }

    updateTsumPhysics(time, delta) {
        if (!this.tsumPieces || this.tsumPieces.length === 0) return;

        const dt = Math.min(delta / 1000, 0.033);
        const bounds = this.getTsumBounds();
        const radius = this.TSUM_RADIUS;

        for (const piece of this.tsumPieces) {
            if (piece.removing) continue;

            piece.vy += this.TSUM_GRAVITY * dt;
            piece.x += piece.vx * dt;
            piece.y += piece.vy * dt;
            piece.angle += piece.vx * dt * 0.55;
            piece.vx *= this.TSUM_FRICTION;
            piece.vy *= 0.997;

            if (piece.x < bounds.left + radius) {
                piece.x = bounds.left + radius;
                piece.vx = Math.abs(piece.vx) * this.TSUM_BOUNCE;
            } else if (piece.x > bounds.right - radius) {
                piece.x = bounds.right - radius;
                piece.vx = -Math.abs(piece.vx) * this.TSUM_BOUNCE;
            }

            if (piece.y > bounds.floor - radius) {
                piece.y = bounds.floor - radius;
                piece.vy *= -this.TSUM_BOUNCE;
                piece.vx *= 0.34;
            }
        }

        for (let i = 0; i < this.tsumPieces.length; i++) {
            const a = this.tsumPieces[i];
            if (a.removing) continue;

            for (let j = i + 1; j < this.tsumPieces.length; j++) {
                const b = this.tsumPieces[j];
                if (b.removing) continue;

                const dx = b.x - a.x;
                const dy = b.y - a.y;
                const minDistance = radius * 2;
                const distance = Math.max(1, Math.hypot(dx, dy));
                if (distance >= minDistance) continue;

                const nx = dx / distance;
                const ny = dy / distance;
                const overlap = minDistance - distance;
                a.x -= nx * overlap * 0.5;
                a.y -= ny * overlap * 0.5;
                b.x += nx * overlap * 0.5;
                b.y += ny * overlap * 0.5;

                const relativeVelocity = (b.vx - a.vx) * nx + (b.vy - a.vy) * ny;
                if (relativeVelocity < 0) {
                    const impulse = -relativeVelocity * 0.025;
                    a.vx -= impulse * nx;
                    a.vy -= impulse * ny;
                    b.vx += impulse * nx;
                    b.vy += impulse * ny;
                }
            }
        }

        this.syncTsumSprites();
    }

    fixIceCreamToTsumPile() {
        if (!this.fallingIceCream) return;

        const flavor = this.ICE_CREAM_TYPES[this.fallingIceCream.type];
        const sprite = this.add.image(this.fallingIceCream.x, this.fallingIceCream.y, flavor.texture);
        sprite.setScale(this.ICE_SCALE);
        sprite.setDepth(4);

        this.tsumPieces.push({
            type: this.fallingIceCream.type,
            x: this.fallingIceCream.x,
            y: this.fallingIceCream.y,
            vx: this.fallingIceCream.vx || 0,
            vy: this.fallingIceCream.vy || 0,
            angle: this.fallingIceCream.angle || 0,
            placedAt: this.time.now,
            melted: false,
            feverFrozenUntil: 0,
            sprite
        });

        if (this.fallingSprite) {
            this.fallingSprite.destroy();
            this.fallingSprite = null;
        }

        this.fallingIceCream = null;
        this.syncTsumSprites();
        this.time.delayedCall(520, () => this.startMatchResolution());
    }

    syncTsumSprites() {
        for (const piece of this.tsumPieces) {
            if (!piece.sprite || piece.removing) continue;

            piece.sprite.setPosition(piece.x, piece.y);
            piece.sprite.setAngle(piece.angle);

            if (piece.melted) {
                piece.sprite.setTexture(this.ICE_CREAM_TYPES[piece.type].texture);
                piece.sprite.setAlpha(0.46);
                piece.sprite.setTint(0xCFE8FF);
                piece.sprite.setScale(this.ICE_SCALE);
            } else if (this.isFeverFrozenCell(piece, this.time.now)) {
                piece.sprite.setTexture(this.ICE_CREAM_TYPES[piece.type].texture);
                piece.sprite.setAlpha(1);
                piece.sprite.setTint(0xE8F8FF);
                piece.sprite.setScale(this.ICE_SCALE);
            } else {
                piece.sprite.setTexture(this.ICE_CREAM_TYPES[piece.type].texture);
                piece.sprite.setAlpha(1);
                piece.sprite.clearTint();
                piece.sprite.setScale(this.ICE_SCALE);
            }
        }
    }

    startMatchResolution() {
        if (this.isResolvingMatches) {
            this.pendingMatchResolution = true;
            return;
        }

        this.resolveMatchesInBackground();
    }

    async resolveMatchesInBackground() {
        this.isResolvingMatches = true;

        do {
            this.pendingMatchResolution = false;
            await this.checkAndRemove3Match();

            if (this.isAnyIceCreamOverGameOverLine()) {
                this.endGame();
                this.isResolvingMatches = false;
                return;
            }
        } while (this.pendingMatchResolution && this.gameActive);

        this.isResolvingMatches = false;

        if (this.gameActive && !this.fallingIceCream) {
            this.spawnNextIceCream();
        }
    }

    async checkAndRemove3Match() {
        if (this.useTsumPhysics) {
            await this.checkAndRemoveTsumMatches();
            return;
        }

        // 同じ味が3つ以上つながったアイスクリームをチェックして消す
        let scoreDelta = 0;
        let chainCount = 1;
        let removed = true;

        while (removed) {
            removed = false;
            let chainBaseScore = 0;
            const removeTargets = new Set();
            const visited = Array.from({ length: this.ROWS }, () => Array(this.COLS).fill(false));

            for (let row = 0; row < this.ROWS; row++) {
                for (let col = 0; col < this.COLS; col++) {
                    if (visited[row][col] || this.grid[row][col] === null || this.grid[row][col].melted) continue;

                    const connected = this.findConnectedIceCreams(row, col, visited);

                    if (connected.length >= 3) {
                        chainBaseScore += this.calculateMatchScore(this.grid[row][col].type, connected.length);

                        connected.forEach((cell) => {
                            removeTargets.add(`${cell.row},${cell.col}`);
                        });
                    }
                }
            }

            if (removeTargets.size > 0) {
                scoreDelta += this.calculateChainScore(chainBaseScore, chainCount);
                this.playMatchEffect(removeTargets, chainCount);

                removeTargets.forEach((target) => {
                    const [row, col] = target.split(',').map(Number);
                    this.erasedCounts[this.grid[row][col].type]++;
                    this.grid[row][col] = null;
                });
                this.maxChain = Math.max(this.maxChain, chainCount);

                removed = true;
                chainCount++;
                this.redrawGame();
                await this.wait(980);
                this.applyGravity();
                this.redrawGame();
            }
        }

        // スコア更新
        this.score += scoreDelta;
        this.updateDropSpeedByScore();
        this.scoreText.setText(`スコア: ${this.score}`);

        this.checkFeverTime(scoreDelta);
        this.updateFeverGauge();
        this.redrawGame();
    }

    async checkAndRemoveTsumMatches() {
        let scoreDelta = 0;
        let chainCount = 1;
        let removed = true;

        while (removed) {
            removed = false;
            let chainBaseScore = 0;
            const removeTargets = new Set();
            const visited = new Set();

            for (let i = 0; i < this.tsumPieces.length; i++) {
                const piece = this.tsumPieces[i];
                if (visited.has(i) || piece.removing || piece.melted) continue;

                const connected = this.findConnectedTsumPieces(i, visited);
                if (connected.length >= 3) {
                    chainBaseScore += this.calculateMatchScore(piece.type, connected.length);
                    connected.forEach((index) => removeTargets.add(index));
                }
            }

            if (removeTargets.size > 0) {
                scoreDelta += this.calculateChainScore(chainBaseScore, chainCount);
                this.playTsumMatchEffect([...removeTargets], chainCount);

                [...removeTargets]
                    .sort((a, b) => b - a)
                    .forEach((index) => {
                        const piece = this.tsumPieces[index];
                        if (!piece) return;
                        this.erasedCounts[piece.type]++;
                        if (piece.sprite) piece.sprite.destroy();
                        this.tsumPieces.splice(index, 1);
                    });

                this.maxChain = Math.max(this.maxChain, chainCount);
                removed = true;
                chainCount++;
                await this.wait(980);
                this.nudgeTsumPileAfterRemoval();
                await this.wait(360);
            }
        }

        this.score += scoreDelta;
        this.updateDropSpeedByScore();
        this.scoreText.setText(`スコア: ${this.score}`);
        this.checkFeverTime(scoreDelta);
        this.updateFeverGauge();
        this.syncTsumSprites();
    }

    findConnectedTsumPieces(startIndex, visited) {
        const type = this.tsumPieces[startIndex].type;
        const connected = [];
        const stack = [startIndex];
        const connectDistance = this.TSUM_RADIUS * 2.28;

        visited.add(startIndex);

        while (stack.length > 0) {
            const currentIndex = stack.pop();
            const current = this.tsumPieces[currentIndex];
            connected.push(currentIndex);

            for (let i = 0; i < this.tsumPieces.length; i++) {
                const next = this.tsumPieces[i];
                if (
                    visited.has(i) ||
                    next.removing ||
                    next.melted ||
                    next.type !== type ||
                    Math.hypot(next.x - current.x, next.y - current.y) > connectDistance
                ) {
                    continue;
                }

                visited.add(i);
                stack.push(i);
            }
        }

        return connected;
    }

    playTsumMatchEffect(targetIndexes, chainCount) {
        if (this.audioContext) {
            const now = this.audioContext.currentTime;
            this.playInstrumentTone(783.99, now, 0.18, 0.04, 'sparkle');
            this.playInstrumentTone(1046.50, now + 0.09, 0.2, 0.045, 'sparkle');
            this.playInstrumentTone(1318.51, now + 0.2, 0.22, 0.04, 'sparkle');
            this.playInstrumentTone(1567.98, now + 0.33, 0.32, 0.032, 'sparkle');
        }

        targetIndexes.forEach((index, order) => {
            const piece = this.tsumPieces[index];
            if (!piece) return;

            const flavor = this.ICE_CREAM_TYPES[piece.type];
            const delay = order * 65;
            this.createMatchedIceCreamPop(piece.x, piece.y, flavor.texture, delay);
            this.time.delayedCall(delay, () => this.createSparkleBurst(piece.x, piece.y));
        });

        this.showChainText(chainCount);
    }

    nudgeTsumPileAfterRemoval() {
        for (const piece of this.tsumPieces) {
            piece.vx += Phaser.Math.Between(-60, 60);
            piece.vy -= Phaser.Math.Between(20, 80);
        }
    }

    wait(duration) {
        return new Promise((resolve) => {
            this.time.delayedCall(duration, resolve);
        });
    }

    checkFeverTime(scoreDelta) {
        if (scoreDelta <= 0 || this.time.now < this.feverActiveUntil) return;

        this.feverGaugeScore += scoreDelta;

        if (this.feverGaugeScore >= 20) {
            this.feverGaugeScore = 0;
            this.startFeverTime();
        }
    }

    startFeverTime() {
        this.feverActiveUntil = this.time.now + this.feverDurationMs;
        this.feverEndHandled = false;
        this.feverGaugeScore = 0;
        this.feverRedrawTimer = 0;
        this.lastPausedTimerUpdateTime = this.time.now;
        this.lastFeverPauseUpdateTime = this.time.now;
        const hasFrozenIceCreams = this.freezeMeltedIceCreams();
        this.playFeverSe();
        this.showFeverText();
        this.showFeverScreenEffect();
        this.updateFeverGauge();

        if (hasFrozenIceCreams) {
            this.startMatchResolution();
        }
    }

    freezeMeltedIceCreams() {
        if (this.useTsumPhysics) {
            let hasFrozenIceCreams = false;

            for (const piece of this.tsumPieces) {
                if (!piece.melted) continue;

                piece.melted = false;
                piece.meltedAt = 0;
                piece.placedAt = this.time.now;
                piece.feverFrozenUntil = this.feverActiveUntil;
                hasFrozenIceCreams = true;
                this.createSnowflakeEffect(piece.x, piece.y);
            }

            this.syncTsumSprites();
            return hasFrozenIceCreams;
        }

        let hasFrozenIceCreams = false;

        for (let row = 0; row < this.ROWS; row++) {
            for (let col = 0; col < this.COLS; col++) {
                const cell = this.grid[row][col];

                if (cell === null || !cell.melted) continue;

                cell.melted = false;
                cell.meltedAt = 0;
                cell.placedAt = this.time.now;
                cell.feverFrozenUntil = this.feverActiveUntil;
                hasFrozenIceCreams = true;
                this.createSnowflakeEffect(this.getCellCenterX(col), this.getCellCenterY(row));
            }
        }

        return hasFrozenIceCreams;
    }

    calculateMatchScore(typeIndex, count) {
        const baseScore = this.ICE_CREAM_TYPES[typeIndex].score;
        const bonusScore = Math.max(0, count - 3) * 2;

        return baseScore + bonusScore;
    }

    calculateChainScore(baseScore, chainCount) {
        return baseScore + 3 * (chainCount - 1);
    }

    updateDropSpeedByScore() {
        const speedLevel = this.dropSpeedLevels.reduce((currentLevel, level) => {
            return this.score >= level.score ? level : currentLevel;
        }, this.dropSpeedLevels[0]);

        this.dropSpeed = speedLevel.speed;
    }

    findConnectedIceCreams(startRow, startCol, visited) {
        const type = this.grid[startRow][startCol].type;
        const connected = [];
        const stack = [{ row: startRow, col: startCol }];
        const directions = [
            { row: -1, col: 0 },
            { row: 1, col: 0 },
            { row: 0, col: -1 },
            { row: 0, col: 1 }
        ];

        visited[startRow][startCol] = true;

        while (stack.length > 0) {
            const current = stack.pop();
            connected.push(current);

            directions.forEach((direction) => {
                const nextRow = current.row + direction.row;
                const nextCol = current.col + direction.col;

                if (
                    nextRow < 0 ||
                    nextRow >= this.ROWS ||
                    nextCol < 0 ||
                    nextCol >= this.COLS ||
                    visited[nextRow][nextCol] ||
                    this.grid[nextRow][nextCol] === null ||
                    this.grid[nextRow][nextCol].melted ||
                    this.grid[nextRow][nextCol].type !== type
                ) {
                    return;
                }

                visited[nextRow][nextCol] = true;
                stack.push({ row: nextRow, col: nextCol });
            });
        }

        return connected;
    }

    playMatchEffect(removeTargets, chainCount) {
        if (this.audioContext) {
            const now = this.audioContext.currentTime;
            this.playInstrumentTone(783.99, now, 0.18, 0.04, 'sparkle');
            this.playInstrumentTone(1046.50, now + 0.09, 0.2, 0.045, 'sparkle');
            this.playInstrumentTone(1318.51, now + 0.2, 0.22, 0.04, 'sparkle');
            this.playInstrumentTone(1567.98, now + 0.33, 0.32, 0.032, 'sparkle');
        }

        removeTargets.forEach((target, index) => {
            const [row, col] = target.split(',').map(Number);
            const x = this.getCellCenterX(col);
            const y = this.getCellCenterY(row);
            const typeIndex = this.grid[row][col].type;
            const flavor = this.ICE_CREAM_TYPES[typeIndex];
            const delay = index * 65;

            this.createMatchedIceCreamPop(x, y, flavor.texture, delay);

            this.time.delayedCall(delay, () => {
                this.createSparkleBurst(x, y);
            });
        });

        this.showChainText(chainCount);
    }

    showChainText(chainCount) {
        const text = this.add.text(this.iceCreamFrame.x + this.iceCreamFrame.width / 2, this.iceCreamFrame.y + 78, `${chainCount}連鎖!`, {
            fontSize: '34px',
            fill: '#5BA7D1',
            fontStyle: 'bold',
            stroke: '#FFFFFF',
            strokeThickness: 6
        }).setOrigin(0.5).setDepth(13).setShadow(2, 2, '#A9DDF7', 2, true, true);

        this.tweens.add({
            targets: text,
            y: text.y - 28,
            alpha: 0,
            scale: 1.28,
            duration: 900,
            ease: 'Cubic.easeOut',
            onComplete: () => text.destroy()
        });
    }

    createMatchedIceCreamPop(x, y, texture, delay) {
        const glow = this.add.circle(x, y, 24, 0xFFF7FB, 0.85);
        const ice = this.add.image(x, y, texture);

        glow.setDepth(9);
        ice.setDepth(10);
        ice.setScale(0.88);

        this.tweens.add({
            targets: glow,
            scale: 2.3,
            alpha: 0,
            duration: 760,
            delay,
            ease: 'Cubic.easeOut',
            onComplete: () => glow.destroy()
        });

        this.tweens.add({
            targets: ice,
            scale: 1.18,
            angle: Phaser.Math.Between(-10, 10),
            duration: 280,
            delay,
            yoyo: true,
            ease: 'Back.easeOut',
            onComplete: () => {
                this.tweens.add({
                    targets: ice,
                    alpha: 0,
                    y: y - 18,
                    scale: 0.45,
                    duration: 420,
                    ease: 'Cubic.easeIn',
                    onComplete: () => ice.destroy()
                });
            }
        });
    }

    createSparkleBurst(x, y) {
        const colors = [0xFFF7FB, 0xFFE68A, 0xA9E8D1, 0xF8AFC9];

        for (let i = 0; i < 14; i++) {
            const angle = (Math.PI * 2 * i) / 14;
            const distance = Phaser.Math.Between(24, 48);
            const sparkle = this.add.circle(x, y, Phaser.Math.Between(3, 5), colors[i % colors.length], 0.95);

            sparkle.setDepth(9);
            this.tweens.add({
                targets: sparkle,
                x: x + Math.cos(angle) * distance,
                y: y + Math.sin(angle) * distance,
                alpha: 0,
                scale: 0.2,
                duration: 720,
                ease: 'Cubic.easeOut',
                onComplete: () => sparkle.destroy()
            });
        }

        const ring = this.add.circle(x, y, 10);
        ring.setDepth(8);
        ring.setStrokeStyle(4, 0xFFF7FB, 0.95);
        this.tweens.add({
            targets: ring,
            alpha: 0,
            scale: 3,
            duration: 680,
            ease: 'Quad.easeOut',
            onComplete: () => ring.destroy()
        });
    }

    applyGravity() {
        for (let col = 0; col < this.COLS; col++) {
            const stacked = [];

            for (let row = this.ROWS - 1; row >= 0; row--) {
                if (this.grid[row][col] !== null) {
                    stacked.push(this.grid[row][col]);
                }
            }

            for (let row = this.ROWS - 1; row >= 0; row--) {
                this.grid[row][col] = stacked[this.ROWS - 1 - row] ?? null;
            }
        }
    }

    getLandingRow(col) {
        for (let row = this.ROWS - 1; row >= 0; row--) {
            if (this.grid[row][col] === null) {
                return row;
            }
        }

        return -1;
    }

    isFeverFrozenCell(cell, time) {
        return Boolean(cell && cell.feverFrozenUntil && time < this.feverActiveUntil);
    }

    updateMeltedIceCreams(time) {
        if (this.useTsumPhysics) {
            let shouldSync = false;

            for (const piece of this.tsumPieces) {
                if (
                    piece.melted ||
                    this.isFeverFrozenCell(piece, time) ||
                    time - piece.placedAt < this.meltTimeMs
                ) {
                    continue;
                }

                piece.melted = true;
                piece.meltedAt = time;
                shouldSync = true;
            }

            if (shouldSync) this.syncTsumSprites();
            return;
        }

        let shouldRedraw = false;

        for (let row = 0; row < this.ROWS; row++) {
            for (let col = 0; col < this.COLS; col++) {
                const cell = this.grid[row][col];

                if (
                    cell === null ||
                    cell.melted ||
                    this.isFeverFrozenCell(cell, time) ||
                    time - cell.placedAt < this.meltTimeMs
                ) {
                    continue;
                }

                cell.melted = true;
                cell.meltedAt = time;
                shouldRedraw = true;
            }
        }

        if (shouldRedraw) {
            this.redrawGame();
        }
    }

    updateFeverVisuals(time, delta) {
        if (time >= this.feverActiveUntil) {
            if (!this.feverEndHandled) {
                this.meltExpiredFeverFrozenIceCreams(time);
                this.feverGaugeScore = 0;
                this.updateFeverGauge();
                this.feverEndHandled = true;
            }
            this.clearFeverScreenEffect();
            return;
        }

        this.feverRedrawTimer += delta;
        if (this.feverRedrawTimer < 500) return;

        this.feverRedrawTimer = 0;
        this.updateFeverGauge();
    }

    meltExpiredFeverFrozenIceCreams(time) {
        if (this.useTsumPhysics) {
            let shouldSync = false;

            for (const piece of this.tsumPieces) {
                if (!piece.feverFrozenUntil || time < this.feverActiveUntil) continue;

                piece.melted = true;
                piece.meltedAt = time;
                piece.feverFrozenUntil = 0;
                shouldSync = true;
            }

            if (shouldSync) this.syncTsumSprites();
            return;
        }

        let shouldRedraw = false;

        for (let row = 0; row < this.ROWS; row++) {
            for (let col = 0; col < this.COLS; col++) {
                const cell = this.grid[row][col];

                if (cell === null || !cell.feverFrozenUntil || time < this.feverActiveUntil) {
                    continue;
                }

                cell.melted = true;
                cell.meltedAt = time;
                cell.feverFrozenUntil = 0;
                shouldRedraw = true;
            }
        }

        if (shouldRedraw) {
            this.redrawGame();
        }
    }

    pauseMeltTimersDuringStops(time) {
        const shouldPause = time < this.feverActiveUntil || this.isResolvingMatches || this.isPaused;

        if (!shouldPause) {
            this.lastPausedTimerUpdateTime = time;
            return;
        }

        if (this.lastPausedTimerUpdateTime === 0) {
            this.lastPausedTimerUpdateTime = time;
            return;
        }

        const pausedDuration = time - this.lastPausedTimerUpdateTime;
        this.lastPausedTimerUpdateTime = time;

        if (pausedDuration <= 0) return;

        if (this.useTsumPhysics) {
            for (const piece of this.tsumPieces) {
                if (!piece.melted) {
                    piece.placedAt += pausedDuration;
                }
            }
            return;
        }

        for (let row = 0; row < this.ROWS; row++) {
            for (let col = 0; col < this.COLS; col++) {
                const cell = this.grid[row][col];

                if (cell !== null && !cell.melted) {
                    cell.placedAt += pausedDuration;
                }
            }
        }
    }

    pauseFeverTimeDuringMatchResolution(time) {
        const shouldPauseFever = (this.isResolvingMatches || this.isPaused) && time < this.feverActiveUntil;

        if (!shouldPauseFever) {
            this.lastFeverPauseUpdateTime = time;
            return;
        }

        if (this.lastFeverPauseUpdateTime === 0) {
            this.lastFeverPauseUpdateTime = time;
            return;
        }

        const pausedDuration = time - this.lastFeverPauseUpdateTime;
        this.lastFeverPauseUpdateTime = time;

        if (pausedDuration > 0) {
            this.feverActiveUntil += pausedDuration;
        }
    }

    showFeverScreenEffect() {
        this.clearFeverScreenEffect();

        const overlay = this.add.rectangle(400, 300, 800, 600, 0x070B26, 0.58);
        const frameGlow = this.add.graphics();
        const effects = [];

        overlay.setDepth(2);
        frameGlow.setDepth(12);
        this.drawFeverFrameGlow(frameGlow);

        this.tweens.add({
            targets: frameGlow,
            alpha: 0.35,
            duration: 480,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });

        const spotlight = this.add.graphics();
        spotlight.setDepth(3);
        spotlight.fillStyle(0xFFE68A, 0.12);
        spotlight.fillTriangle(0, 0, 248, 0, this.iceCreamFrame.x + 20, this.scale.height);
        spotlight.fillTriangle(this.scale.width, 0, this.scale.width - 248, 0, this.iceCreamFrame.x + this.iceCreamFrame.width - 20, this.scale.height);
        spotlight.fillStyle(0xF8AFC9, 0.08);
        spotlight.fillTriangle(120, 0, 330, 0, this.iceCreamFrame.x + this.iceCreamFrame.width / 2, this.scale.height);
        effects.push(spotlight);

        this.tweens.add({
            targets: spotlight,
            alpha: 0.42,
            duration: 820,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });

        const lightColors = [0xFFE68A, 0xF8AFC9, 0xA9E8D1, 0xA9DDF7];
        const lightPositions = [];
        const leftX = this.iceCreamFrame.x + 10;
        const rightX = this.iceCreamFrame.x + this.iceCreamFrame.width - 10;
        const topY = this.iceCreamFrame.y + 10;
        const bottomY = this.scale.height - 22;

        for (let i = 0; i < 8; i++) {
            const t = i / 7;
            const x = Phaser.Math.Linear(leftX + 22, rightX - 22, t);
            const isNearFeverLabel = Math.abs(x - this.iceCreamFrame.x - this.iceCreamFrame.width / 2) < 86;
            if (!isNearFeverLabel) {
                lightPositions.push({ x, y: topY });
            }
        }

        for (let i = 0; i < 6; i++) {
            const t = i / 5;
            lightPositions.push({ x: leftX, y: Phaser.Math.Linear(topY + 58, bottomY, t) });
            lightPositions.push({ x: rightX, y: Phaser.Math.Linear(topY + 58, bottomY, t) });
        }

        lightPositions.forEach((position, index) => {
            const light = this.add.circle(position.x, position.y, 7, lightColors[index % lightColors.length], 0.92);
            light.setDepth(13);
            effects.push(light);

            this.tweens.add({
                targets: light,
                scale: 2.35,
                alpha: 0.22,
                duration: 430 + (index % 4) * 90,
                repeat: -1,
                yoyo: true,
                ease: 'Sine.easeInOut'
            });
        });

        for (let i = 0; i < 26; i++) {
            const side = i % 2 === 0 ? -1 : 1;
            const x = side < 0 ? Phaser.Math.Between(24, 104) : Phaser.Math.Between(696, 776);
            const y = Phaser.Math.Between(70, 520);
            const star = this.add.star(x, y, 5, 4, 11, lightColors[i % lightColors.length], 0.72);
            star.setDepth(13);
            effects.push(star);

            this.tweens.add({
                targets: star,
                y: y - Phaser.Math.Between(28, 64),
                angle: Phaser.Math.Between(160, 320),
                alpha: 0.18,
                duration: Phaser.Math.Between(1200, 2200),
                repeat: -1,
                yoyo: true,
                ease: 'Sine.easeInOut'
            });
        }

        const feverLabelClearX = this.iceCreamFrame.x + this.iceCreamFrame.width / 2;
        const feverLabelClearY = this.iceCreamFrame.y + 22;
        for (let i = 0; i < 14; i++) {
            const useLeftSide = i % 2 === 0;
            const x = useLeftSide
                ? Phaser.Math.Between(36, Math.max(36, feverLabelClearX - 132))
                : Phaser.Math.Between(Math.min(this.scale.width - 36, feverLabelClearX + 132), this.scale.width - 36);
            const y = Phaser.Math.Between(18, 82);
            const sparkle = this.add.star(x, y, 4, 3, 7, lightColors[(i + 2) % lightColors.length], 0.72);
            sparkle.setDepth(13);
            sparkle.setAngle(Phaser.Math.Between(0, 45));
            effects.push(sparkle);

            this.tweens.add({
                targets: sparkle,
                x: x + Phaser.Math.Between(-18, 18),
                y: y + Phaser.Math.Between(12, 28),
                angle: Phaser.Math.Between(120, 260),
                alpha: 0.2,
                duration: Phaser.Math.Between(850, 1500),
                repeat: -1,
                yoyo: true,
                ease: 'Sine.easeInOut'
            });
        }

        this.feverScreenEffect = { overlay, frameGlow, effects };
    }

    drawFeverFrameGlow(frameGlow) {
        const frameX = this.iceCreamFrame.x;
        const frameY = this.iceCreamFrame.y;
        const frameWidth = this.iceCreamFrame.width;
        const sideLineBottomY = this.scale.height;
        const cornerRadius = 14;

        frameGlow.lineStyle(16, 0xFFE68A, 0.22);
        frameGlow.beginPath();
        frameGlow.moveTo(frameX + cornerRadius, frameY - 5);
        frameGlow.lineTo(frameX + frameWidth - cornerRadius, frameY - 5);
        frameGlow.arc(frameX + frameWidth - cornerRadius, frameY + cornerRadius - 5, cornerRadius, -Math.PI / 2, 0);
        frameGlow.lineTo(frameX + frameWidth + 5, sideLineBottomY);
        frameGlow.moveTo(frameX - 5, sideLineBottomY);
        frameGlow.lineTo(frameX - 5, frameY + cornerRadius - 5);
        frameGlow.arc(frameX + cornerRadius, frameY + cornerRadius - 5, cornerRadius, Math.PI, -Math.PI / 2);
        frameGlow.strokePath();

        frameGlow.lineStyle(7, 0xF8AFC9, 0.72);
        frameGlow.beginPath();
        frameGlow.moveTo(frameX + cornerRadius, frameY);
        frameGlow.lineTo(frameX + frameWidth - cornerRadius, frameY);
        frameGlow.arc(frameX + frameWidth - cornerRadius, frameY + cornerRadius, cornerRadius, -Math.PI / 2, 0);
        frameGlow.lineTo(frameX + frameWidth, sideLineBottomY);
        frameGlow.moveTo(frameX, sideLineBottomY);
        frameGlow.lineTo(frameX, frameY + cornerRadius);
        frameGlow.arc(frameX + cornerRadius, frameY + cornerRadius, cornerRadius, Math.PI, -Math.PI / 2);
        frameGlow.strokePath();
    }

    clearFeverScreenEffect() {
        if (!this.feverScreenEffect) return;

        const { overlay, frameGlow, effects } = this.feverScreenEffect;
        overlay.destroy();
        frameGlow.destroy();
        effects.forEach((effect) => effect.destroy());
        this.feverScreenEffect = null;
    }

    getCellCenterX(col) {
        return this.GRID_START_X + col * this.CELL_SIZE + this.CELL_SIZE / 2;
    }

    getCellCenterY(row) {
        return this.GRID_START_Y + row * this.CELL_SIZE + this.CELL_SIZE / 2;
    }

    getCellBottomY(row) {
        return this.GRID_START_Y + (row + 1) * this.CELL_SIZE;
    }

    isIceCreamOverGameOverLine(row) {
        const placedIceScale = this.ICE_SCALE;
        const textureHeight = this.textures.get(this.ICE_CREAM_TYPES[0].texture).getSourceImage().height;
        const iceTop = this.getCellCenterY(row) - (textureHeight * placedIceScale) / 2;
        const gameOverThresholdY = this.gameOverLineY - this.CELL_SIZE;

        return iceTop <= gameOverThresholdY;
    }

    isAnyIceCreamOverGameOverLine() {
        if (this.useTsumPhysics) {
            return this.tsumPieces.some((piece) => piece.y - this.TSUM_RADIUS <= this.gameOverLineY - this.TSUM_RADIUS * 2);
        }

        for (let row = 0; row < this.ROWS; row++) {
            for (let col = 0; col < this.COLS; col++) {
                if (this.grid[row][col] !== null && this.isIceCreamOverGameOverLine(row)) {
                    return true;
                }
            }
        }

        return false;
    }

    getDropMarkerColor(typeIndex) {
        const colors = [
            { fill: 0xC78AA0, stroke: 0x7B2339 },
            { fill: 0xF6F0DE, stroke: 0x5B4B42 },
            { fill: 0xF8AFC9, stroke: 0xD9577F },
            { fill: 0xA9E8D1, stroke: 0x4F9F8B }
        ];
        return colors[typeIndex] ?? { fill: 0xFFFDF7, stroke: 0x7F6BAE };
    }

    createDropMarker() {
        this.destroyDropMarker();

        if (!this.fallingIceCream || this.useTsumPhysics) return;

        const colors = this.getDropMarkerColor(this.fallingIceCream.type);
        const shadow = this.add.circle(0, 0, 15, 0x2B2440, 0.22);
        shadow.setDepth(5);

        const glow = this.add.circle(0, 0, 18, colors.fill, 0.28);
        glow.setDepth(5);

        const marker = this.add.circle(0, 0, 10, colors.fill, 1);
        marker.setStrokeStyle(5, colors.stroke, 1);
        marker.setDepth(6);

        const shine = this.add.circle(0, 0, 4, 0xFFFFFF, 0.9);
        shine.setDepth(7);

        this.dropMarker = { marker, glow, shadow, shine };

        this.tweens.add({
            targets: [marker, glow, shadow, shine],
            scale: 1.18,
            duration: 420,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });
    }

    updateDropMarker() {
        if (!this.dropMarker || !this.fallingIceCream || this.useTsumPhysics) return;

        const landingRow = this.getLandingRow(this.fallingIceCream.col);
        if (landingRow === -1) {
            this.dropMarker.marker.setVisible(false);
            this.dropMarker.glow.setVisible(false);
            this.dropMarker.shadow.setVisible(false);
            this.dropMarker.shine.setVisible(false);
            return;
        }

        const x = this.getCellCenterX(this.fallingIceCream.col);
        const y = this.getCellCenterY(landingRow);
        this.dropMarker.marker.setVisible(true);
        this.dropMarker.glow.setVisible(true);
        this.dropMarker.shadow.setVisible(true);
        this.dropMarker.shine.setVisible(true);
        this.dropMarker.marker.setPosition(x, y);
        this.dropMarker.glow.setPosition(x, y);
        this.dropMarker.shadow.setPosition(x, y + 2);
        this.dropMarker.shine.setPosition(x - 3, y - 3);
    }

    destroyDropMarker() {
        if (!this.dropMarker) return;

        this.dropMarker.marker.destroy();
        this.dropMarker.glow.destroy();
        this.dropMarker.shadow.destroy();
        this.dropMarker.shine.destroy();
        this.dropMarker = null;
    }

    updateFallingSpritePosition() {
        if (!this.fallingSprite || !this.fallingIceCream) return;

        if (this.useTsumPhysics) {
            this.fallingSprite.setPosition(this.fallingIceCream.x, this.fallingIceCream.y);
            this.fallingSprite.setAngle(this.fallingIceCream.angle || 0);
            return;
        }

        this.fallingSprite.setPosition(this.getCellCenterX(this.fallingIceCream.col), this.fallingIceCream.y);
    }

    hardDropIceCream() {
        if (this.useTsumPhysics) {
            if (!this.fallingIceCream) return;

            if (!this.fallingIceCream.isDropping) {
                this.fallingIceCream.isDropping = true;
                this.fallingIceCream.vy = Math.max(this.fallingIceCream.vy || 0, 80);
                this.playMoveSe();
                return;
            }

            this.fallingIceCream.vy = Math.max(this.fallingIceCream.vy || 0, 900);
            this.fallingIceCream.vx *= 0.5;
            this.playMoveSe();
            return;
        }

        const landingRow = this.getLandingRow(this.fallingIceCream.col);
        if (landingRow === -1) {
            this.endGame();
            return;
        }

        this.fallingIceCream.y = this.getCellCenterY(landingRow);
        this.fixIceCreamToGrid();
    }

    updateNextPreview() {
        if (this.nextPreviewSprite) {
            this.nextPreviewSprite.destroy();
        }
        if (this.nextPreviewSecondSprite) {
            this.nextPreviewSecondSprite.destroy();
        }

        const nextFlavor = this.ICE_CREAM_TYPES[this.nextIceCreamTypes[0]];
        const secondFlavor = this.ICE_CREAM_TYPES[this.nextIceCreamTypes[1]];
        this.nextPreviewSprite = this.add.image(this.nextPreviewFrame.centerX, this.nextPreviewFrame.firstY, nextFlavor.texture);
        this.nextPreviewSprite.setScale(0.72);
        this.nextPreviewSprite.setDepth(15);

        this.nextPreviewSecondSprite = this.add.image(this.nextPreviewFrame.centerX, this.nextPreviewFrame.secondY, secondFlavor.texture);
        this.nextPreviewSecondSprite.setScale(0.52);
        this.nextPreviewSecondSprite.setAlpha(0.72);
        this.nextPreviewSecondSprite.setDepth(15);
    }

    redrawGame() {
        if (this.useTsumPhysics) {
            this.syncTsumSprites();
            return;
        }

        this.placedSprites.forEach((sprite) => {
            this.tweens.killTweensOf(sprite);
            sprite.destroy();
        });
        this.placedSprites = [];

        // グリッド内のアイスクリームを描画
        for (let row = 0; row < this.ROWS; row++) {
            for (let col = 0; col < this.COLS; col++) {
                if (this.grid[row][col] !== null) {
                    const cell = this.grid[row][col];
                    const typeIndex = cell.type;
                    const flavor = this.ICE_CREAM_TYPES[typeIndex];
                    const texture = flavor.texture;
                    const sprite = this.add.image(this.getCellCenterX(col), this.getCellCenterY(row), texture);
                    sprite.setScale(this.ICE_SCALE);
                    sprite.setDepth(4);
                    if (cell.melted) {
                        const meltAge = cell.meltedAt ? this.time.now - cell.meltedAt : this.meltAnimationMs;
                        const animateMelt = meltAge >= 0 && meltAge < this.meltAnimationMs;
                        sprite.setAlpha(animateMelt ? 0.92 : 0.46);
                        sprite.setTint(0xCFE8FF);
                        sprite.setScale(this.ICE_SCALE);
                        if (animateMelt) {
                            this.tweens.add({
                                targets: sprite,
                                alpha: 0.46,
                                duration: this.meltAnimationMs,
                                ease: 'Sine.easeInOut'
                            });
                        }
                        this.createMeltedIceCreamOverlay(this.getCellCenterX(col), this.getCellCenterY(row), flavor.texture, animateMelt);
                    } else if (this.isFeverFrozenCell(cell, this.time.now)) {
                        sprite.setTint(0xE8F8FF);
                        this.createFrozenIceCreamOverlay(this.getCellCenterX(col), this.getCellCenterY(row));
                    }
                    this.placedSprites.push(sprite);
                }
            }
        }
    }

    createMeltedIceCreamOverlay(x, y, texture, animate = false) {
        const meltTint = this.add.circle(x, y, 25, 0xDDEBFF, 0.12);
        const meltedShape = this.add.image(x, y + 12, texture);
        const syrup = this.add.graphics();
        const puddleY = y + 29;
        const shadow = this.add.ellipse(x, puddleY + 4, 48, 14, 0x7F6BAE, 0.1);
        const puddle = this.add.ellipse(x, puddleY, 44, 14, 0xFFFFFF, 0.46);
        const dripLeft = this.add.ellipse(x - 15, puddleY + 6, 12, 7, 0xFFFFFF, 0.42);
        const dripRight = this.add.ellipse(x + 16, puddleY + 7, 14, 8, 0xDDEBFF, 0.44);
        const shine = this.add.ellipse(x - 7, puddleY - 2, 14, 4, 0xFFF7FB, 0.56);
        const flowingDrops = [
            this.add.ellipse(x - 18, y + 5, 7, 13, 0xFFFFFF, 0.38),
            this.add.ellipse(x + 2, y + 11, 6, 12, 0xDDEBFF, 0.34),
            this.add.ellipse(x + 18, y + 3, 7, 14, 0xFFFFFF, 0.36)
        ];

        syrup.fillStyle(0xFFFFFF, 0.42);
        syrup.fillRoundedRect(x - 20, y - 3, 7, 22, 4);
        syrup.fillRoundedRect(x - 1, y + 4, 6, 18, 4);
        syrup.fillRoundedRect(x + 16, y - 5, 7, 24, 4);
        syrup.fillStyle(0xA9DDF7, 0.3);
        syrup.fillCircle(x - 17, y + 21, 5);
        syrup.fillCircle(x + 19, y + 22, 6);
        syrup.fillCircle(x + 2, y + 20, 4);

        meltedShape.setScale(this.MELTED_ICE_SCALE_X, this.MELTED_ICE_SCALE_Y);
        meltedShape.setAlpha(0.32);
        meltedShape.setTint(0xDDEBFF);

        [meltTint, meltedShape, syrup, shadow, puddle, dripLeft, dripRight, shine, ...flowingDrops].forEach((part) => {
            part.setDepth(5);
        });
        syrup.setDepth(6);
        flowingDrops.forEach((drop) => drop.setDepth(7));

        if (animate) {
            [meltTint, meltedShape, syrup, shadow, puddle, dripLeft, dripRight, shine, ...flowingDrops].forEach((part) => {
                part.setAlpha(0);
            });
            meltedShape.setY(y + 4);
            meltedShape.setScale(this.ICE_SCALE, this.ICE_SCALE);
            puddle.setScale(0.25, 0.35);
            dripLeft.setScale(0.2, 0.25);
            dripRight.setScale(0.2, 0.25);
            shine.setScale(0.25, 0.4);
            shadow.setScale(0.2, 0.35);
            flowingDrops.forEach((drop) => drop.setScale(0.25, 0.2));

            this.tweens.add({
                targets: [meltTint, syrup, shadow, puddle, dripLeft, dripRight, shine, ...flowingDrops],
                alpha: { from: 0, to: 1 },
                duration: this.meltAnimationMs,
                ease: 'Sine.easeInOut'
            });
            this.tweens.add({
                targets: meltedShape,
                y: y + 12,
                alpha: 0.32,
                scaleX: this.MELTED_ICE_SCALE_X,
                scaleY: this.MELTED_ICE_SCALE_Y,
                duration: this.meltAnimationMs,
                ease: 'Sine.easeInOut'
            });
            this.tweens.add({
                targets: [puddle, dripLeft, dripRight, shine, shadow],
                scaleX: 1,
                scaleY: 1,
                duration: this.meltAnimationMs,
                ease: 'Back.easeOut'
            });
            this.tweens.add({
                targets: flowingDrops,
                scaleX: 1,
                scaleY: 1,
                duration: this.meltAnimationMs,
                ease: 'Back.easeOut'
            });
        }

        this.tweens.add({
            targets: meltTint,
            scale: 1.18,
            alpha: 0.22,
            delay: animate ? this.meltAnimationMs : 0,
            duration: 1700,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });
        this.tweens.add({
            targets: meltedShape,
            y: y + 16,
            scaleX: this.MELTED_ICE_SCALE_X * 1.08,
            scaleY: this.MELTED_ICE_SCALE_Y * 0.92,
            delay: animate ? this.meltAnimationMs : 0,
            duration: 1900,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });
        this.tweens.add({
            targets: [puddle, shadow],
            scaleX: 1.16,
            scaleY: 0.9,
            delay: animate ? this.meltAnimationMs : 0,
            duration: 1750,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });
        this.tweens.add({
            targets: [dripLeft, dripRight, shine],
            y: '+=4',
            scaleX: 1.1,
            delay: animate ? this.meltAnimationMs : 0,
            duration: 1450,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });
        flowingDrops.forEach((drop, index) => {
            this.tweens.add({
                targets: drop,
                y: drop.y + 14,
                alpha: { from: 0.62, to: 0.08 },
                scaleY: 1.35,
                delay: (animate ? this.meltAnimationMs : 0) + index * 180,
                duration: 1250 + index * 120,
                repeat: -1,
                ease: 'Sine.easeInOut',
                onRepeat: () => {
                    drop.y = y + 3 + index * 4;
                    drop.setAlpha(0.58);
                    drop.setScale(1, 1);
                }
            });
        });

        this.placedSprites.push(meltTint, meltedShape, syrup, shadow, puddle, dripLeft, dripRight, shine, ...flowingDrops);
    }

    createFrozenIceCreamOverlay(x, y) {
        const glow = this.add.circle(x, y, 31, 0xDDEBFF, 0.2);
        const windRing = this.add.circle(x, y, 27);
        const blizzardParts = [];

        glow.setDepth(5);
        windRing.setDepth(6);
        windRing.setStrokeStyle(2, 0xE8F8FF, 0.42);

        this.tweens.add({
            targets: windRing,
            angle: 360,
            alpha: 0.16,
            scale: 1.22,
            duration: 900,
            repeat: -1,
            yoyo: true,
            ease: 'Sine.easeInOut'
        });

        this.tweens.add({
            targets: glow,
            alpha: 0.34,
            scale: 1.12,
            duration: 620,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });

        for (let i = 0; i < 10; i++) {
            const angle = (Math.PI * 2 * i) / 10;
            const radius = i % 2 === 0 ? 24 : 31;
            const startX = x + Math.cos(angle) * radius;
            const startY = y + Math.sin(angle) * radius * 0.72;
            const flake = this.add.circle(startX, startY, i % 3 === 0 ? 3 : 2, 0xFFFFFF, 0.82);
            flake.setDepth(7);
            blizzardParts.push(flake);

            this.tweens.add({
                targets: flake,
                x: startX + Phaser.Math.Between(-22, 22),
                y: startY + Phaser.Math.Between(-12, 12),
                alpha: 0.2,
                scale: 0.45,
                duration: 520 + i * 45,
                repeat: -1,
                yoyo: true,
                ease: 'Sine.easeInOut'
            });
        }

        this.placedSprites.push(glow, windRing, ...blizzardParts);
    }

    createSnowflakeGraphic(x, y, radius, color, alpha) {
        const graphics = this.add.graphics({ x, y });
        graphics.lineStyle(3, color, alpha);

        for (let i = 0; i < 6; i++) {
            const angle = (Math.PI * 2 * i) / 6;
            const endX = Math.cos(angle) * radius;
            const endY = Math.sin(angle) * radius;
            const branchX = Math.cos(angle) * radius * 0.58;
            const branchY = Math.sin(angle) * radius * 0.58;

            graphics.beginPath();
            graphics.moveTo(0, 0);
            graphics.lineTo(endX, endY);
            graphics.strokePath();

            graphics.beginPath();
            graphics.moveTo(branchX, branchY);
            graphics.lineTo(branchX + Math.cos(angle + 0.78) * radius * 0.32, branchY + Math.sin(angle + 0.78) * radius * 0.32);
            graphics.moveTo(branchX, branchY);
            graphics.lineTo(branchX + Math.cos(angle - 0.78) * radius * 0.32, branchY + Math.sin(angle - 0.78) * radius * 0.32);
            graphics.strokePath();
        }

        graphics.fillStyle(0xFFFFFF, 0.95);
        graphics.fillCircle(0, 0, 4);

        return graphics;
    }

    createSnowflakeEffect(x, y) {
        const graphics = this.createSnowflakeGraphic(x, y, 28, 0xE8F8FF, 0.98);
        graphics.setDepth(11);

        const ring = this.add.circle(x, y, 18);
        ring.setDepth(10);
        ring.setStrokeStyle(3, 0xA9DDF7, 0.9);

        this.tweens.add({
            targets: [graphics, ring],
            alpha: 0,
            scale: 1.8,
            angle: 180,
            duration: 900,
            ease: 'Cubic.easeOut',
            onComplete: () => {
                graphics.destroy();
                ring.destroy();
            }
        });
    }

    playFeverSe() {
        if (!this.audioContext) return;

        const now = this.audioContext.currentTime;
        this.playInstrumentTone(987.77, now, 0.18, 0.045, 'sparkle');
        this.playInstrumentTone(1318.51, now + 0.08, 0.2, 0.04, 'sparkle');
        this.playInstrumentTone(1760.00, now + 0.18, 0.35, 0.038, 'sparkle');
    }

    showFeverText() {
        const gaugeX = this.feverGauge
            ? this.feverGauge.x + this.feverGauge.width / 2
            : this.iceCreamFrame.x + this.iceCreamFrame.width / 2;
        const gaugeY = this.feverGauge ? this.feverGauge.y - 20 : this.iceCreamFrame.y + 120;
        const feverStartBubble = this.add.graphics();

        feverStartBubble.fillStyle(0xFFFDF7, 0.92);
        feverStartBubble.fillRoundedRect(gaugeX - 76, gaugeY - 22, 152, 42, 14);
        feverStartBubble.lineStyle(4, 0xFFE68A, 0.98);
        feverStartBubble.strokeRoundedRect(gaugeX - 76, gaugeY - 22, 152, 42, 14);
        feverStartBubble.setDepth(18);

        const feverStartText = this.add.text(gaugeX, gaugeY, 'FEVER', {
            fontSize: '28px',
            fill: '#FFF45C',
            fontStyle: 'bold',
            stroke: '#7F6BAE',
            strokeThickness: 6
        }).setOrigin(0.5).setDepth(19);

        this.tweens.add({
            targets: [feverStartText, feverStartBubble],
            y: gaugeY - 16,
            alpha: 0,
            scale: 1.16,
            duration: 1000,
            ease: 'Cubic.easeOut',
            onComplete: () => {
                feverStartText.destroy();
                feverStartBubble.destroy();
            }
        });
        return;

        const bubble = this.add.graphics();
        const x = this.iceCreamFrame.x + this.iceCreamFrame.width / 2;
        const y = this.iceCreamFrame.y + 120;

        bubble.fillStyle(0xFFFDF7, 0.9);
        bubble.fillRoundedRect(x - 120, y - 28, 240, 58, 16);
        bubble.lineStyle(4, 0xA9DDF7, 0.95);
        bubble.strokeRoundedRect(x - 120, y - 28, 240, 58, 16);
        bubble.setDepth(11);

        const text = this.add.text(this.iceCreamFrame.x + this.iceCreamFrame.width / 2, this.iceCreamFrame.y + 120, 'フィーバータイム！', {
            fontSize: '26px',
            fill: '#5BA7D1',
            fontStyle: 'bold',
            stroke: '#FFFFFF',
            strokeThickness: 5
        }).setOrigin(0.5).setDepth(12);

        this.tweens.add({
            targets: [text, bubble],
            y: text.y - 34,
            alpha: 0,
            scale: 1.22,
            duration: 500,
            ease: 'Cubic.easeOut',
            onComplete: () => {
                text.destroy();
                bubble.destroy();
            }
        });
    }

    endGame() {
        if (!this.gameActive) return;

        this.gameActive = false;
        this.playGameOverBgm();

        if (this.fallingSprite) {
            this.fallingSprite.destroy();
            this.fallingSprite = null;
        }
        this.destroyDropMarker();

        const x = this.iceCreamFrame.x + this.iceCreamFrame.width / 2;
        const y = this.iceCreamFrame.y + 185;
        const panel = this.add.graphics();
        panel.fillStyle(0xFFFDF7, 0.92);
        panel.fillRoundedRect(x - 120, y - 34, 240, 72, 16);
        panel.lineStyle(4, 0xE85D75, 0.9);
        panel.strokeRoundedRect(x - 120, y - 34, 240, 72, 16);
        panel.setDepth(8);

        this.add.text(x, y, 'GAME OVER', {
            fontSize: '34px',
            fill: '#E85D75',
            fontStyle: 'bold',
            stroke: '#FFFFFF',
            strokeThickness: 6
        }).setOrigin(0.5).setDepth(9).setShadow(2, 2, '#F6A7C8', 2, true, true);

        this.time.delayedCall(1000, () => {
            this.add.text(x, y + 62, 'まもなくリザルトへ...', {
                fontSize: '20px',
                fill: '#7F6BAE',
                fontStyle: 'bold',
                stroke: '#FFFFFF',
                strokeThickness: 4
            }).setOrigin(0.5).setDepth(9);
        });

        this.time.delayedCall(3000, () => {
            goToResult(this.score, { maxChain: this.maxChain, erasedCounts: this.erasedCounts });
        });
    }

    showRetryText(x, y) {
        const text = this.add.text(x, y, 'Enterでもう一度プレイ', {
            fontSize: '22px',
            fill: '#7F6BAE',
            fontStyle: 'bold',
            stroke: '#FFFFFF',
            strokeThickness: 5
        }).setOrigin(0.5).setDepth(9).setShadow(2, 2, '#A9DDF7', 2, true, true);

        this.tweens.add({
            targets: text,
            alpha: 0.45,
            duration: 720,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });
    }

    playGameOverBgm() {
        if (this.bgmLoop) {
            this.bgmLoop.remove(false);
            this.bgmLoop = null;
        }

        if (!this.audioContext) return;

        const now = this.audioContext.currentTime;
        const notes = [659.25, 587.33, 523.25, 392.00];

        notes.forEach((note, index) => {
            this.playInstrumentTone(note, now + index * 0.34, 0.42, 0.045, 'lead');
        });

        this.playInstrumentTone(261.63, now + 1.05, 1.1, 0.035, 'bass');
    }
}
