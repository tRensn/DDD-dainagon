// ゲーム画面のシーン - アイスクリームパズル
import { goToResult } from '../app-init.js';

export class GameScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameScene' });
    }

    preload() {
        // 画像やアセットの読み込みはここで行います
    }

    create() {
        this.createPastelBackground();

        // ゲーム状態の初期化
        this.initGame();

        // ゲーム枠表示
        this.createIceCreamFrame();
        this.createNextIceCreamFrame();

        // UI表示
        this.createUI();
        this.createFeverGauge();
        this.createPauseHint();

        // BGM再生
        this.createPastelBgm();

        // 入力設定
        this.setupInput();

        // 開始カウントダウン
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
        const frameX = 60;
        const frameY = 45;
        const frameWidth = 330;
        const frameHeight = 430;
        const cornerRadius = 10;
        const coneTopY = frameY + frameHeight;
        const coneBottomY = coneTopY + 115;
        const coneCenterX = frameX + frameWidth / 2;

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

        graphics.lineStyle(13, 0xF6A7C8, 0.18);
        graphics.beginPath();
        graphics.moveTo(frameX + cornerRadius, frameY);
        graphics.lineTo(frameX + frameWidth - cornerRadius, frameY);
        graphics.arc(frameX + frameWidth - cornerRadius, frameY + cornerRadius, cornerRadius, -Math.PI / 2, 0);
        graphics.lineTo(frameX + frameWidth, coneTopY);
        graphics.moveTo(frameX, coneTopY);
        graphics.lineTo(frameX, frameY + cornerRadius);
        graphics.arc(frameX + cornerRadius, frameY + cornerRadius, cornerRadius, Math.PI, -Math.PI / 2);
        graphics.strokePath();

        graphics.lineStyle(8, 0xF6A7C8, 0.32);
        graphics.beginPath();
        graphics.moveTo(frameX + cornerRadius, frameY);
        graphics.lineTo(frameX + frameWidth - cornerRadius, frameY);
        graphics.arc(frameX + frameWidth - cornerRadius, frameY + cornerRadius, cornerRadius, -Math.PI / 2, 0);
        graphics.lineTo(frameX + frameWidth, coneTopY);
        graphics.moveTo(frameX, coneTopY);
        graphics.lineTo(frameX, frameY + cornerRadius);
        graphics.arc(frameX + cornerRadius, frameY + cornerRadius, cornerRadius, Math.PI, -Math.PI / 2);
        graphics.strokePath();

        graphics.lineStyle(5, 0xF6A7C8, 1);
        graphics.beginPath();
        graphics.moveTo(frameX + cornerRadius, frameY);
        graphics.lineTo(frameX + frameWidth - cornerRadius, frameY);
        graphics.arc(frameX + frameWidth - cornerRadius, frameY + cornerRadius, cornerRadius, -Math.PI / 2, 0);
        graphics.lineTo(frameX + frameWidth, coneTopY);
        graphics.moveTo(frameX, coneTopY);
        graphics.lineTo(frameX, frameY + cornerRadius);
        graphics.arc(frameX + cornerRadius, frameY + cornerRadius, cornerRadius, Math.PI, -Math.PI / 2);
        graphics.strokePath();

        graphics.lineStyle(2, 0xFFF7FB, 0.9);
        graphics.beginPath();
        graphics.moveTo(frameX + cornerRadius + 2, frameY + 1);
        graphics.lineTo(frameX + frameWidth - cornerRadius - 2, frameY + 1);
        graphics.arc(frameX + frameWidth - cornerRadius, frameY + cornerRadius, cornerRadius - 2, -Math.PI / 2, 0);
        graphics.lineTo(frameX + frameWidth - 1, coneTopY - 2);
        graphics.moveTo(frameX + 1, coneTopY - 2);
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

        graphics.fillStyle(0xE9B36A, 1);
        graphics.lineStyle(4, 0xC9823D, 1);
        graphics.fillTriangle(frameX, coneTopY, frameX + frameWidth, coneTopY, coneCenterX, coneBottomY);
        graphics.strokeTriangle(frameX, coneTopY, frameX + frameWidth, coneTopY, coneCenterX, coneBottomY);

        const getConeLeftX = (y) => frameX + ((coneCenterX - frameX) * (y - coneTopY)) / (coneBottomY - coneTopY);
        const getConeRightX = (y) => frameX + frameWidth - ((frameX + frameWidth - coneCenterX) * (y - coneTopY)) / (coneBottomY - coneTopY);

        graphics.lineStyle(2, 0xD8964A, 0.75);
        for (let y = coneTopY + 14; y < coneBottomY - 18; y += 22) {
            graphics.beginPath();
            graphics.moveTo(getConeLeftX(y) + 10, y);
            graphics.lineTo(getConeRightX(y + 18) - 10, y + 18);
            graphics.strokePath();
        }

        for (let y = coneTopY + 14; y < coneBottomY - 18; y += 22) {
            graphics.beginPath();
            graphics.moveTo(getConeRightX(y) - 10, y);
            graphics.lineTo(getConeLeftX(y + 18) + 10, y + 18);
            graphics.strokePath();
        }
    }

    createNextIceCreamFrame() {
        const previewSize = 118;
        const previewX = this.iceCreamFrame.x + this.iceCreamFrame.width + 10;
        const previewY = this.iceCreamFrame.y + 18;
        const graphics = this.add.graphics();

        this.nextPreviewFrame = {
            x: previewX,
            y: previewY,
            size: previewSize,
            centerX: previewX + previewSize / 2,
            centerY: previewY + previewSize / 2
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

    initGame() {
        // ゲーム定数
        this.COLS = 5;
        this.ROWS = 7;
        this.CELL_SIZE = 52;
        this.GRID_START_X = 95;
        this.GRID_START_Y = 106;

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
        this.gameActive = true;
        this.gameStarted = false;
        this.canRetry = false;
        this.isPaused = false;
        this.fallingIceCream = null;
        this.nextIceCreamType = Phaser.Math.Between(0, this.ICE_CREAM_TYPES.length - 1);
        this.grid = this.createEmptyGrid();
        this.dropSpeed = 58;
        this.meltTimeMs = 20000;
        this.feverGaugeScore = 0;
        this.feverDurationMs = 10000;
        this.feverActiveUntil = 0;
        this.feverEndHandled = true;
        this.feverRedrawTimer = 0;
        this.lastPausedTimerUpdateTime = 0;
        this.lastFeverPauseUpdateTime = 0;
        this.placedSprites = [];

        this.createIceCreamTextures();
    }

    createIceCreamTextures() {
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
        const panel = this.add.graphics();
        panel.fillStyle(0xFFFDF7, 0.78);
        panel.fillRoundedRect(540, 82, 220, 72, 12);
        panel.lineStyle(3, 0xF6A7C8, 0.8);
        panel.strokeRoundedRect(540, 82, 220, 72, 12);

        // スコア表示（左側）
        this.scoreText = this.add.text(560, 100, `スコア: ${this.score}`, {
            fontSize: '24px',
            fill: '#7F6BAE',
            fontStyle: 'bold',
            stroke: '#FFFFFF',
            strokeThickness: 5
        });
        this.scoreText.setShadow(2, 2, '#F6A7C8', 2, true, true);

    }

    createFeverGauge() {
        const panel = this.add.graphics();
        panel.fillStyle(0xFFFDF7, 0.78);
        panel.fillRoundedRect(540, 247, 220, 98, 12);
        panel.lineStyle(3, 0xA9DDF7, 0.85);
        panel.strokeRoundedRect(540, 247, 220, 98, 12);

        const label = this.add.text(560, 265, 'フィーバーゲージ', {
            fontSize: '20px',
            fill: '#7F6BAE',
            fontStyle: 'bold',
            stroke: '#FFFFFF',
            strokeThickness: 4
        });
        label.setShadow(2, 2, '#A9DDF7', 2, true, true);

        this.feverGauge = {
            x: 560,
            y: 305,
            width: 180,
            height: 22,
            graphics: this.add.graphics()
        };

        this.updateFeverGauge();
    }

    createPauseHint() {
        this.add.text(660, 565, 'escで一時停止', {
            fontSize: '13px',
            fill: '#9A8CC2',
            fontStyle: 'bold',
            stroke: '#FFFFFF',
            strokeThickness: 3
        }).setDepth(6);
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
            graphics.fillStyle(isFever ? 0x5BA7D1 : 0xA9DDF7, 1);
            graphics.fillRoundedRect(x + 4, y + 4, (width - 8) * progress, height - 8, 6);
            graphics.fillStyle(0xE8F8FF, 0.8);
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
            }
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

        for (let row = 0; row < this.ROWS; row++) {
            for (let col = 0; col < this.COLS; col++) {
                const x = this.GRID_START_X + col * this.CELL_SIZE;
                const y = this.GRID_START_Y + row * this.CELL_SIZE;
                graphics.fillRect(x, y, this.CELL_SIZE, this.CELL_SIZE);
                graphics.strokeRect(x, y, this.CELL_SIZE, this.CELL_SIZE);
            }
        }

        graphics.generateTexture('gameGrid', this.COLS * this.CELL_SIZE, this.ROWS * this.CELL_SIZE);
        graphics.destroy();

        // 配置位置
        const gridX = this.GRID_START_X + (this.COLS * this.CELL_SIZE) / 2;
        const gridY = this.GRID_START_Y + (this.ROWS * this.CELL_SIZE) / 2;
        this.add.image(gridX, gridY, 'gameGrid');
    }

    setupInput() {
        // 左右操作
        this.input.keyboard.on('keydown-LEFT', () => {
            if (!this.isPaused && this.gameStarted && this.fallingIceCream && this.fallingIceCream.col > 0 && this.getLandingRow(this.fallingIceCream.col - 1) !== -1) {
                this.fallingIceCream.col--;
                this.updateFallingSpritePosition();
                this.playMoveSe();
            }
        });

        this.input.keyboard.on('keydown-RIGHT', () => {
            if (!this.isPaused && this.gameStarted && this.fallingIceCream && this.fallingIceCream.col < this.COLS - 1 && this.getLandingRow(this.fallingIceCream.col + 1) !== -1) {
                this.fallingIceCream.col++;
                this.updateFallingSpritePosition();
                this.playMoveSe();
            }
        });

        // スペースキーで即座に落下
        this.input.keyboard.on('keydown-SPACE', () => {
            if (!this.isPaused && this.gameStarted && this.fallingIceCream) {
                this.hardDropIceCream();
            }
        });

        this.input.keyboard.on('keydown-ENTER', () => {
            if (this.canRetry) {
                this.scene.restart();
            }
        });

        this.input.keyboard.on('keydown-ESC', () => {
            if (this.gameActive && this.gameStarted && !this.canRetry) {
                this.togglePause();
            }
        });
    }

    togglePause() {
        this.isPaused = !this.isPaused;
        this.lastPausedTimerUpdateTime = this.time.now;
        this.lastFeverPauseUpdateTime = this.time.now;

        if (this.isPaused) {
            this.showPauseOverlay();
        } else {
            this.hidePauseOverlay();
        }
    }

    showPauseOverlay() {
        if (this.pauseOverlay) return;

        const x = this.iceCreamFrame.x + this.iceCreamFrame.width / 2;
        const y = this.iceCreamFrame.y + 190;
        const panel = this.add.graphics();

        panel.fillStyle(0xFFFDF7, 0.88);
        panel.fillRoundedRect(x - 95, y - 32, 190, 64, 14);
        panel.lineStyle(4, 0xA9DDF7, 0.9);
        panel.strokeRoundedRect(x - 95, y - 32, 190, 64, 14);
        panel.setDepth(13);

        const text = this.add.text(x, y, 'PAUSE', {
            fontSize: '34px',
            fill: '#7F6BAE',
            fontStyle: 'bold',
            stroke: '#FFFFFF',
            strokeThickness: 6
        }).setOrigin(0.5).setDepth(14).setShadow(2, 2, '#A9DDF7', 2, true, true);

        this.pauseOverlay = { panel, text };
    }

    hidePauseOverlay() {
        if (!this.pauseOverlay) return;

        this.pauseOverlay.panel.destroy();
        this.pauseOverlay.text.destroy();
        this.pauseOverlay = null;
    }

    startCountdown() {
        const counts = ['3', '2', '1'];
        const startDelay = 1000;

        counts.forEach((count, index) => {
            this.time.delayedCall(startDelay + index * 700, () => {
                this.showCountdownText(count);
                this.playCountdownSe(index);
            });
        });

        this.time.delayedCall(startDelay + counts.length * 700, () => {
            this.showCountdownText('START!');
            this.playCountdownStartSe();
        });

        this.time.delayedCall(startDelay + counts.length * 700 + 500, () => {
            this.gameStarted = true;
            this.spawnNextIceCream();
        });
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
        const typeIndex = this.nextIceCreamType;
        const startCol = Math.floor(this.COLS / 2);

        this.fallingIceCream = {
            type: typeIndex,
            col: startCol,
            y: this.GRID_START_Y - this.CELL_SIZE * 0.35
        };
        this.nextIceCreamType = Phaser.Math.Between(0, this.ICE_CREAM_TYPES.length - 1);

        if (this.getLandingRow(startCol) === -1) {
            this.endGame();
            return;
        }

        const flavor = this.ICE_CREAM_TYPES[typeIndex];
        this.fallingSprite = this.add.image(this.getCellCenterX(startCol), this.fallingIceCream.y, flavor.texture);
        this.fallingSprite.setDepth(5);
        this.updateNextPreview();
    }

    update(time, delta) {
        if (!this.gameActive) return;

        if (this.isPaused) {
            this.pauseMeltTimersDuringStops(time);
            this.pauseFeverTimeDuringMatchResolution(time);
            return;
        }

        this.updateMeltedIceCreams(time);
        this.updateFeverVisuals(time, delta);
        this.pauseMeltTimersDuringStops(time);
        this.pauseFeverTimeDuringMatchResolution(time);

        if (!this.gameStarted) return;
        if (!this.fallingIceCream) return;

        this.fallingIceCream.y += this.dropSpeed * (delta / 1000);

        const landingRow = this.getLandingRow(this.fallingIceCream.col);
        if (landingRow === -1 || this.fallingIceCream.y >= this.getCellBottomY(landingRow)) {
            this.fixIceCreamToGrid();
            return;
        }

        this.updateFallingSpritePosition();
    }

    fixIceCreamToGrid() {
        // 現在のアイスクリームをグリッドに固定
        const col = this.fallingIceCream.col;
        const row = this.getLandingRow(col);

        if (row === -1) {
            this.endGame();
            return;
        }

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
        this.redrawGame();

        // 3つそろったら消す
        this.startMatchResolution();
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
        this.scoreText.setText(`スコア: ${this.score}`);

        this.checkFeverTime(scoreDelta);
        this.updateFeverGauge();
        this.redrawGame();
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
        this.freezeMeltedIceCreams();
        this.playFeverSe();
        this.showFeverText();
        this.showFeverScreenEffect();
        this.updateFeverGauge();
    }

    freezeMeltedIceCreams() {
        for (let row = 0; row < this.ROWS; row++) {
            for (let col = 0; col < this.COLS; col++) {
                const cell = this.grid[row][col];

                if (cell === null || !cell.melted) continue;

                cell.melted = false;
                cell.placedAt = this.time.now;
                cell.feverFrozenUntil = this.feverActiveUntil;
                this.createSnowflakeEffect(this.getCellCenterX(col), this.getCellCenterY(row));
            }
        }
    }

    calculateMatchScore(typeIndex, count) {
        const baseScore = this.ICE_CREAM_TYPES[typeIndex].score;
        const bonusScore = Math.max(0, count - 3) * 2;

        return baseScore + bonusScore;
    }

    calculateChainScore(baseScore, chainCount) {
        return baseScore + 3 * (chainCount - 1);
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
                this.feverEndHandled = true;
            }
            this.clearFeverScreenEffect();
            return;
        }

        this.feverRedrawTimer += delta;
        if (this.feverRedrawTimer < 500) return;

        this.feverRedrawTimer = 0;
        this.updateFeverGauge();
        this.redrawGame();
    }

    meltExpiredFeverFrozenIceCreams(time) {
        let shouldRedraw = false;

        for (let row = 0; row < this.ROWS; row++) {
            for (let col = 0; col < this.COLS; col++) {
                const cell = this.grid[row][col];

                if (cell === null || !cell.feverFrozenUntil || time < this.feverActiveUntil) {
                    continue;
                }

                cell.melted = true;
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

        const overlay = this.add.rectangle(400, 300, 800, 600, 0xDDF6FF, 0.18);
        const frameGlow = this.add.graphics();
        const snowflakes = [];

        overlay.setDepth(2);
        frameGlow.setDepth(12);
        frameGlow.lineStyle(8, 0xA9DDF7, 0.55);
        frameGlow.strokeRoundedRect(this.iceCreamFrame.x - 5, this.iceCreamFrame.y - 5, this.iceCreamFrame.width + 10, this.iceCreamFrame.height + 10, 14);

        this.tweens.add({
            targets: overlay,
            alpha: 0.3,
            duration: 650,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });

        this.tweens.add({
            targets: frameGlow,
            alpha: 0.35,
            duration: 480,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });

        for (let i = 0; i < 16; i++) {
            const x = Phaser.Math.Between(35, 765);
            const y = Phaser.Math.Between(-80, 560);
            const snowflake = this.createSnowflakeGraphic(x, y, Phaser.Math.Between(7, 13), 0xFFFFFF, 0.82);

            snowflake.setDepth(13);
            snowflakes.push(snowflake);

            this.tweens.add({
                targets: snowflake,
                y: y + Phaser.Math.Between(80, 150),
                x: x + Phaser.Math.Between(-25, 25),
                angle: Phaser.Math.Between(180, 420),
                alpha: 0.35,
                duration: Phaser.Math.Between(1800, 2800),
                repeat: -1,
                yoyo: true,
                ease: 'Sine.easeInOut'
            });
        }

        this.feverScreenEffect = { overlay, frameGlow, snowflakes };
    }

    clearFeverScreenEffect() {
        if (!this.feverScreenEffect) return;

        const { overlay, frameGlow, snowflakes } = this.feverScreenEffect;
        overlay.destroy();
        frameGlow.destroy();
        snowflakes.forEach((snowflake) => snowflake.destroy());
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
        const placedIceScale = 0.88;
        const textureHeight = this.textures.get(this.ICE_CREAM_TYPES[0].texture).getSourceImage().height;
        const iceTop = this.getCellCenterY(row) - (textureHeight * placedIceScale) / 2;
        const iceBottom = this.getCellCenterY(row) + (textureHeight * placedIceScale) / 2;
        const overlapDepth = this.gameOverLineY - iceTop;
        const hasLineOverlap = this.gameOverLineY >= iceTop && this.gameOverLineY <= iceBottom;

        return hasLineOverlap && overlapDepth >= 10;
    }

    isAnyIceCreamOverGameOverLine() {
        for (let row = 0; row < this.ROWS; row++) {
            for (let col = 0; col < this.COLS; col++) {
                if (this.grid[row][col] !== null && this.isIceCreamOverGameOverLine(row)) {
                    return true;
                }
            }
        }

        return false;
    }

    updateFallingSpritePosition() {
        if (!this.fallingSprite || !this.fallingIceCream) return;

        this.fallingSprite.setPosition(this.getCellCenterX(this.fallingIceCream.col), this.fallingIceCream.y);
    }

    hardDropIceCream() {
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

        const flavor = this.ICE_CREAM_TYPES[this.nextIceCreamType];
        this.nextPreviewSprite = this.add.image(this.nextPreviewFrame.centerX, this.nextPreviewFrame.centerY, flavor.texture);
        this.nextPreviewSprite.setScale(0.92);
        this.nextPreviewSprite.setDepth(4);
    }

    redrawGame() {
        this.placedSprites.forEach((sprite) => sprite.destroy());
        this.placedSprites = [];

        // グリッド内のアイスクリームを描画
        for (let row = 0; row < this.ROWS; row++) {
            for (let col = 0; col < this.COLS; col++) {
                if (this.grid[row][col] !== null) {
                    const cell = this.grid[row][col];
                    const typeIndex = cell.type;
                    const flavor = this.ICE_CREAM_TYPES[typeIndex];
                    const sprite = this.add.image(this.getCellCenterX(col), this.getCellCenterY(row), flavor.texture);
                    sprite.setScale(0.88);
                    sprite.setDepth(4);
                    if (cell.melted) {
                        sprite.setAlpha(0.42);
                        sprite.setTint(0xCFE8FF);
                        sprite.setScale(0.95, 0.56);
                        sprite.setY(this.getCellCenterY(row) + 13);
                        this.createMeltedIceCreamOverlay(this.getCellCenterX(col), this.getCellCenterY(row) + 24);
                    } else if (this.isFeverFrozenCell(cell, this.time.now)) {
                        sprite.setTint(0xE8F8FF);
                        this.createFrozenIceCreamOverlay(this.getCellCenterX(col), this.getCellCenterY(row));
                    }
                    this.placedSprites.push(sprite);
                }
            }
        }
    }

    createMeltedIceCreamOverlay(x, y) {
        const shadow = this.add.ellipse(x, y + 4, 56, 20, 0xA9DDF7, 0.35);
        const puddle = this.add.ellipse(x, y, 48, 17, 0xFFFFFF, 0.72);
        const dripLeft = this.add.ellipse(x - 18, y + 7, 15, 9, 0xFFFFFF, 0.6);
        const dripRight = this.add.ellipse(x + 19, y + 8, 18, 11, 0xDDEBFF, 0.62);
        const shine = this.add.ellipse(x - 8, y - 3, 18, 5, 0xFFF7FB, 0.85);

        [shadow, puddle, dripLeft, dripRight, shine].forEach((part) => {
            part.setDepth(5);
        });
        this.placedSprites.push(shadow, puddle, dripLeft, dripRight, shine);
    }

    createFrozenIceCreamOverlay(x, y) {
        const glow = this.add.circle(x, y, 30, 0xDDEBFF, 0.28);
        const snowflake = this.createSnowflakeGraphic(x, y, 20, 0xE8F8FF, 0.98);
        const orbit = this.add.circle(x, y, 24);

        glow.setDepth(5);
        snowflake.setDepth(7);
        orbit.setDepth(6);
        orbit.setStrokeStyle(2, 0xA9DDF7, 0.55);

        this.tweens.add({
            targets: snowflake,
            angle: 360,
            duration: 1800,
            repeat: -1,
            ease: 'Linear'
        });

        this.tweens.add({
            targets: snowflake,
            y: y - 8,
            scale: 1.22,
            duration: 650,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });

        this.tweens.add({
            targets: orbit,
            alpha: 0.18,
            scale: 1.35,
            duration: 700,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });

        this.placedSprites.push(glow, orbit, snowflake);
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
