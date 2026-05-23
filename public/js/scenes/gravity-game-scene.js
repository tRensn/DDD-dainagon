// 重力有モード: Matter.js 物理演算によりアイスが転がり・衝突するゲームシーン
import { goToResult } from '../app-init.js';

const TOUCH_TOLERANCE = 16;
const ICE_RADIUS      = 34;
const MELTED_RADIUS   = Math.round(ICE_RADIUS * 0.52); // ≈ 18
const TEX_SIZE        = 76;

export class GravityGameScene extends Phaser.Scene {
  constructor() {
    super({ key: 'GravityGameScene' });
  }

  preload() {
    this.load.image('cone-image', 'js/state/game screen image/image.png');
  }

  create() {
    this.matter.world.setGravity(0, 2.2);

    this.FRAME_X      = Math.round((this.scale.width - 330) / 2);
    this.FRAME_Y      = 96;
    this.FRAME_WIDTH  = 330;
    this.FRAME_HEIGHT = 430;
    this.COLS         = 5;
    this.STEP_X       = this.FRAME_WIDTH / this.COLS;
    this.GAME_OVER_Y  = this.FRAME_Y + 64;

    this.ICE_TYPES = [
      { name: '大納言あずき',          texture: 'grav-azuki',     score: 10 },
      { name: 'クッキーアンドクリーム', texture: 'grav-cookie',    score:  5 },
      { name: 'ストロベリー',           texture: 'grav-strawberry', score:  3 },
      { name: 'チョコミント',           texture: 'grav-mint',      score: -5 },
    ];

    this.score                      = 0;
    this.maxChain                   = 0;
    this.erasedCounts               = [0, 0, 0, 0];
    this.gameActive                 = true;
    this.gameStarted                = false;
    this.isPaused                   = false;
    this.isResolving                = false;
    this.pendingResolve             = false;
    this.placedPieces               = [];
    this.fallingPiece               = null;
    this.fallingCol                 = Math.floor(this.COLS / 2);
    this.nextType                   = Phaser.Math.Between(0, 3);
    this.pieceId                    = 0;
    this.feverGaugeScore            = 0;
    this.feverDurationMs            = 10000;
    this.feverActiveUntil           = 0;
    this.feverEndHandled            = true;
    this.feverRedrawTimer           = 0;
    this.lastPauseTime              = 0;
    this.lastFeverPauseTime         = 0;
    this.meltTimeMs                 = 20000;
    this.elapsedPlayMs              = 0;
    this.lastElapsedTimerUpdateTime = 0;
    this.lastDisplayedElapsedSecond = -1;
    this.fallingPieceY              = 0;
    this.lastPeriodicMatchCheck     = 0;
    this.feverScreenEffect          = null;

    this.createIceCreamTextures();
    this.createBackground();
    this.createWalls();
    this.createIceCreamFrame();
    this.createNextPreviewFrame();
    this.createUI();
    this.createFeverGauge();
    this.createPauseHint();
    this.createMobileControls();
    this.setupInput();
    this.createPastelBgm();
    this.startCountdown();
  }

  // ─── テクスチャ生成 ───

  createIceCreamTextures() {
    this._makeTex('grav-azuki', 0xC78AA0, 0x8A3450, g => {
      g.fillStyle(0x7B2339, 1);
      [[26,28,7,10],[42,23,6,9],[50,40,7,10],[31,48,5,8],[20,41,5,7]].forEach(([x,y,w,h]) => {
        g.fillEllipse(x,y,w,h);
        g.fillStyle(0xB95B72,0.9); g.fillEllipse(x-1,y-2,w*.35,h*.35);
        g.fillStyle(0x7B2339,1);
      });
    });
    this._makeTex('grav-cookie', 0xF6F0DE, 0x5B4B42, g => {
      g.fillStyle(0x3F342F,1);
      [[24,26,7],[46,31,9],[33,45,8],[51,49,6],[20,43,5]].forEach(([x,y,s]) => g.fillRect(x,y,s,s*.75));
      g.fillStyle(0xD9CCB8,0.8); g.fillCircle(38,27,4); g.fillCircle(28,52,3);
    });
    this._makeTex('grav-strawberry', 0xF8AFC9, 0xD9577F, g => {
      g.fillStyle(0xE84E7D,1);
      [[26,27],[42,30],[32,43],[51,45],[21,47]].forEach(([x,y]) => g.fillEllipse(x,y,3,6));
      g.fillStyle(0xFFF7FB,0.8); g.fillEllipse(30,24,16,8); g.fillEllipse(47,39,10,5);
    });
    this._makeTex('grav-mint', 0xA9E8D1, 0x4F9F8B, g => {
      g.fillStyle(0x3F2E2A,1);
      [[25,29,7],[46,26,6],[35,43,8],[52,47,5],[22,49,5]].forEach(([x,y,s]) => g.fillRect(x,y,s,s));
      g.fillStyle(0xE8FFF6,0.75); g.fillEllipse(32,24,14,7); g.fillEllipse(48,39,9,5);
    });
  }

  _makeTex(key, base, outline, drawDetails) {
    if (this.textures.exists(key)) return;
    const g = this.make.graphics({ x:0, y:0, add:false });
    g.fillStyle(0x000000, 0.1); g.fillEllipse(39,60,42,12);
    g.fillStyle(base,1); g.lineStyle(4,outline,1);
    g.fillCircle(38,36,25); g.fillCircle(21,39,13); g.fillCircle(54,41,14);
    g.fillCircle(38,52,14); g.strokeCircle(38,36,25);
    g.fillStyle(0xFFFFFF,0.38); g.fillEllipse(29,25,18,9);
    drawDetails(g);
    g.generateTexture(key, TEX_SIZE, TEX_SIZE);
    g.destroy();
  }

  // ─── 背景 ───

  createBackground() {
    this.cameras.main.setBackgroundColor('#FFEAF4');
    const g = this.add.graphics();
    g.fillStyle(0xFFEAF4,1); g.fillRect(0,0,800,600);
    g.fillStyle(0xE8F8F5,1); g.fillCircle(110,105,95); g.fillCircle(705,470,130);
    g.fillStyle(0xFFF7C8,1); g.fillCircle(635,105,80);
    g.fillStyle(0xDDEBFF,1); g.fillCircle(95,500,115);
  }

  // ─── フレーム（ノーマルモードと同じ見た目） ───

  createIceCreamFrame() {
    const frameX       = this.FRAME_X;
    const frameY       = this.FRAME_Y;
    const frameWidth   = this.FRAME_WIDTH;
    const frameHeight  = this.FRAME_HEIGHT;
    const cornerRadius = 10;
    const coneTopY     = frameY + frameHeight;
    const coneCenterX  = frameX + frameWidth / 2;
    const sideLineBottomY = this.scale.height;
    const coneOverlapY = 30;

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
    graphics.moveTo(frameX + 18, this.GAME_OVER_Y);
    graphics.lineTo(frameX + frameWidth - 18, this.GAME_OVER_Y);
    graphics.strokePath();

    graphics.lineStyle(9, 0xE85D75, 0.2);
    graphics.beginPath();
    graphics.moveTo(frameX + 18, this.GAME_OVER_Y);
    graphics.lineTo(frameX + frameWidth - 18, this.GAME_OVER_Y);
    graphics.strokePath();

    this.createTransparentConeTexture();
    const coneDisplayWidth  = frameWidth - 10;
    const coneImageTopY     = coneTopY - coneOverlapY;
    const coneDisplayHeight = this.scale.height - coneImageTopY;
    const coneImage = this.add.image(coneCenterX, coneImageTopY, 'cone-transparent');
    coneImage.setOrigin(0.5, 0);
    coneImage.setDisplaySize(coneDisplayWidth, coneDisplayHeight);
    coneImage.setDepth(2);
  }

  createTransparentConeTexture() {
    if (this.textures.exists('cone-transparent')) {
      this.textures.remove('cone-transparent');
    }
    const sourceImage  = this.textures.get('cone-image').getSourceImage();
    const sourceCanvas = document.createElement('canvas');
    sourceCanvas.width  = sourceImage.width;
    sourceCanvas.height = sourceImage.height;
    const ctx = sourceCanvas.getContext('2d');
    ctx.drawImage(sourceImage, 0, 0);
    const imageData = ctx.getImageData(0, 0, sourceCanvas.width, sourceCanvas.height);
    const pixels = imageData.data;
    let minX = sourceCanvas.width, minY = sourceCanvas.height, maxX = 0, maxY = 0;
    for (let i = 0; i < pixels.length; i += 4) {
      const r = pixels[i], g = pixels[i+1], b = pixels[i+2];
      const px = (i/4) % sourceCanvas.width;
      const py = Math.floor((i/4) / sourceCanvas.width);
      const isWhite       = r>238 && g>238 && b>238 && Math.max(r,g,b)-Math.min(r,g,b)<18;
      const isGreen       = g>95 && g>r*1.45 && g>b*1.35;
      const isGreenEdge   = g>105 && g>r+18 && g>b+22 && r<190;
      const isCorner      = px>sourceCanvas.width*0.75 && py>sourceCanvas.height*0.68;
      if (isWhite || isGreen || isGreenEdge || isCorner) { pixels[i+3]=0; continue; }
      minX=Math.min(minX,px); minY=Math.min(minY,py);
      maxX=Math.max(maxX,px); maxY=Math.max(maxY,py);
    }
    ctx.putImageData(imageData, 0, 0);
    const cropX=minX, cropY=minY;
    const cropW=maxX-minX;
    const cropH=Math.max(1, maxY-minY-150);
    const tex = this.textures.createCanvas('cone-transparent', cropW, cropH);
    tex.getContext().drawImage(sourceCanvas, cropX, cropY, cropW, cropH, 0, 0, cropW, cropH);
    tex.refresh();
  }

  // ─── NEXTプレビューフレーム ───

  createNextPreviewFrame() {
    const px = this.FRAME_X + this.FRAME_WIDTH + 10;
    const py = this.FRAME_Y + 18;
    const ps = 118;
    this.nextPreview = { cx: px + ps/2, cy: py + ps/2 };
    const g = this.add.graphics().setDepth(14);
    g.fillStyle(0xFFFDF7,0.94); g.fillRoundedRect(px,py,ps,ps,10);
    g.lineStyle(13,0xF6A7C8,0.18); g.strokeRoundedRect(px,py,ps,ps,10);
    g.lineStyle(8,0xF6A7C8,0.32);  g.strokeRoundedRect(px,py,ps,ps,10);
    g.lineStyle(5,0xF6A7C8,1);     g.strokeRoundedRect(px,py,ps,ps,10);
    g.lineStyle(2,0xFFF7FB,0.9);   g.strokeRoundedRect(px+3,py+3,ps-6,ps-6,8);
  }

  // ─── 物理壁 ───

  createWalls() {
    const { FRAME_X:fx, FRAME_Y:fy, FRAME_WIDTH:fw, FRAME_HEIGHT:fh } = this;
    const t = 30;
    const coneOverlapY = 30; // コーン画像がフレーム底から上に被る量
    const opt = { isStatic:true, friction:0.6, frictionStatic:0.8, label:'wall',
                  collisionFilter:{ category:0x0001 } };
    // 床をコーン画像の上端に合わせる（コーン内部にアイスが入り込まないよう）
    this.matter.add.rectangle(fx+fw/2, fy+fh-coneOverlapY+t/2, fw+t*2, t, opt);
    this.matter.add.rectangle(fx-t/2,  fy+fh/2,   t, fh+t, opt);
    this.matter.add.rectangle(fx+fw+t/2, fy+fh/2, t, fh+t, opt);
  }

  // ─── UI（ノーマルモードと同じ配置） ───

  createUI() {
    // タイマーパネル（左側）
    const timePanel = this.add.graphics().setDepth(14);
    timePanel.fillStyle(0xFFFDF7, 0.82);
    timePanel.fillRoundedRect(14, 188, 206, 70, 12);
    timePanel.lineStyle(3, 0xA9DDF7, 0.9);
    timePanel.strokeRoundedRect(14, 188, 206, 70, 12);

    this.add.text(28, 200, 'タイム', {
      fontSize:'18px', fill:'#5BA7D1', fontStyle:'bold',
      stroke:'#FFFFFF', strokeThickness:4,
    }).setShadow(2,2,'#DDEBFF',2,true,true).setDepth(15);

    this.elapsedTimeText = this.add.text(28, 221, '00:00', {
      fontSize:'30px', fill:'#7F6BAE', fontStyle:'bold',
      stroke:'#FFFFFF', strokeThickness:5,
    }).setShadow(2,2,'#A9DDF7',2,true,true).setDepth(15);

    // スコアパネル（フレーム上部中央）
    const spX = this.FRAME_X, spY = 24, spW = this.FRAME_WIDTH, spH = 58;
    const panel = this.add.graphics().setDepth(14);
    panel.fillStyle(0xFFFDF7, 0.84);
    panel.fillRoundedRect(spX, spY, spW, spH, 14);
    panel.lineStyle(4, 0xF6A7C8, 0.92);
    panel.strokeRoundedRect(spX, spY, spW, spH, 14);
    panel.lineStyle(2, 0xFFF7FB, 0.95);
    panel.strokeRoundedRect(spX+4, spY+4, spW-8, spH-8, 11);

    this.scoreText = this.add.text(0, 0, 'スコア: 0', {
      fontSize:'26px', fill:'#7F6BAE', fontStyle:'bold',
      stroke:'#FFFFFF', strokeThickness:5,
    });
    this.scoreText.setPosition(spX+22, spY+spH/2);
    this.scoreText.setOrigin(0, 0.5);
    this.scoreText.setShadow(2,2,'#F6A7C8',2,true,true);
    this.scoreText.setDepth(15);
  }

  createFeverGauge() {
    const panelX = this.FRAME_X + 20;
    const panelY = this.scale.height - 44;
    const panelW = this.FRAME_WIDTH - 40;
    const panelH = 34;
    const panel  = this.add.graphics().setDepth(14);
    panel.fillStyle(0xFFFDF7, 0.96);
    panel.fillRoundedRect(panelX, panelY, panelW, panelH, 10);
    panel.lineStyle(5, 0xF6A7C8, 1);
    panel.strokeRoundedRect(panelX, panelY, panelW, panelH, 10);
    panel.lineStyle(2, 0xFFE68A, 0.95);
    panel.strokeRoundedRect(panelX+3, panelY+3, panelW-6, panelH-6, 8);

    this.feverGauge = {
      x: panelX+12, y: panelY+10,
      width: panelW-24, height: 16,
      graphics: this.add.graphics().setDepth(15),
    };
    this.updateFeverGauge();
  }

  createPauseHint() {
    this.add.text(660, 565, 'escで一時停止', {
      fontSize:'13px', fill:'#9A8CC2', fontStyle:'bold',
      stroke:'#FFFFFF', strokeThickness:3,
    }).setDepth(6);
  }

  createMobileControls() {
    const buttons = [
      { x:612, y:520, radius:30,  label:'<',    fontSize:'30px',
        action: () => this.moveFallingPiece(-1) },
      { x:684, y:520, radius:30,  label:'>',    fontSize:'30px',
        action: () => this.moveFallingPiece(1) },
      { x:748, y:520, radius:34,  label:'DROP', fontSize:'16px',
        action: () => { if (this.gameStarted && !this.isPaused && this.fallingPiece) this.dropFallingPiece(); } },
    ];
    buttons.forEach(btn => {
      this.add.circle(btn.x, btn.y, btn.radius+6, 0xFFE68A, 0.16).setDepth(15);
      const base = this.add.circle(btn.x, btn.y, btn.radius, 0xFFFDF7, 0.9);
      base.setStrokeStyle(4, 0xF6A7C8, 0.95).setDepth(16).setInteractive({ useHandCursor:true });
      const lbl = this.add.text(btn.x, btn.y, btn.label, {
        fontSize:btn.fontSize, fill:'#7F6BAE', fontStyle:'bold',
        stroke:'#FFFFFF', strokeThickness:4,
      }).setOrigin(0.5).setDepth(17);
      base.on('pointerdown', (p, lx, ly, ev) => {
        if (ev) ev.stopPropagation();
        base.setScale(0.92); lbl.setScale(0.92);
        btn.action();
      });
      base.on('pointerup',  () => { base.setScale(1); lbl.setScale(1); });
      base.on('pointerout', () => { base.setScale(1); lbl.setScale(1); });
    });
  }

  // ─── フィーバーゲージ更新 ───

  updateFeverGauge() {
    if (!this.feverGauge) return;
    const isFever = this.time.now < this.feverActiveUntil;
    const progress = isFever
      ? Phaser.Math.Clamp((this.feverActiveUntil - this.time.now) / this.feverDurationMs, 0, 1)
      : Phaser.Math.Clamp(this.feverGaugeScore / 20, 0, 1);
    const { x, y, width:w, height:h, graphics:g } = this.feverGauge;
    g.clear();
    g.fillStyle(0xFFFFFF, 0.95); g.fillRoundedRect(x,y,w,h,8);
    g.lineStyle(3,0xF6A7C8,1);   g.strokeRoundedRect(x,y,w,h,8);
    if (progress > 0) {
      g.fillStyle(isFever ? 0x5BA7D1 : 0x5FCB7A, 1);
      g.fillRoundedRect(x+4, y+4, (w-8)*progress, h-8, 6);
      g.fillStyle(isFever ? 0xE8F8FF : 0xDDFBE6, 0.85);
      g.fillRoundedRect(x+7, y+6, Math.max(0,(w-14)*progress), 5, 3);
    }
  }

  updateNextPreview() {
    if (this.nextPreviewSprite) this.nextPreviewSprite.destroy();
    this.nextPreviewSprite = this.add.image(
      this.nextPreview.cx, this.nextPreview.cy,
      this.ICE_TYPES[this.nextType].texture
    ).setScale(0.92).setDepth(15);
  }

  // ─── 入力 ───

  setupInput() {
    this.input.keyboard.on('keydown-LEFT',  () => this.moveFallingPiece(-1));
    this.input.keyboard.on('keydown-RIGHT', () => this.moveFallingPiece(+1));
    this.input.keyboard.on('keydown-SPACE', () => { if (this.fallingPiece) this.dropFallingPiece(); });
    this.input.keyboard.on('keydown-ESC', () => {
      if (this.gameActive && this.gameStarted) this.togglePause();
    });
  }

  togglePause() {
    this.isPaused = !this.isPaused;
    this.lastPauseTime = this.time.now;
    this.lastFeverPauseTime = this.time.now;
    this.lastElapsedTimerUpdateTime = this.time.now;
    if (this.isPaused) {
      this.matter.world.pause();
      this.showPauseOverlay();
    } else {
      this.matter.world.resume();
      this.hidePauseOverlay();
    }
  }

  showPauseOverlay() {
    const cx = this.FRAME_X + this.FRAME_WIDTH / 2;
    const y  = this.FRAME_Y + 190;
    const panel = this.add.graphics().setDepth(13);
    panel.fillStyle(0xFFFDF7,0.88); panel.fillRoundedRect(cx-115,y-42,230,92,14);
    panel.lineStyle(4,0xA9DDF7,0.9); panel.strokeRoundedRect(cx-115,y-42,230,92,14);
    const txt = this.add.text(cx, y-12, 'PAUSE', {
      fontSize:'34px', fill:'#7F6BAE', fontStyle:'bold',
      stroke:'#FFFFFF', strokeThickness:6,
    }).setOrigin(0.5).setDepth(14).setShadow(2,2,'#A9DDF7',2,true,true);
    const retryTxt = this.add.text(cx, y+28, 'Enterでリトライ', {
      fontSize:'19px', fill:'#E85D75', fontStyle:'bold',
      stroke:'#FFFFFF', strokeThickness:4,
    }).setOrigin(0.5).setDepth(14).setShadow(2,2,'#F6A7C8',2,true,true);
    this.pauseOverlay = { panel, txt, retryTxt };
  }

  hidePauseOverlay() {
    if (!this.pauseOverlay) return;
    this.pauseOverlay.panel.destroy();
    this.pauseOverlay.txt.destroy();
    this.pauseOverlay.retryTxt.destroy();
    this.pauseOverlay = null;
  }

  // ─── カウントダウン ───

  startCountdown() {
    const counts = ['3','2','1'];
    counts.forEach((c,i) => this.time.delayedCall(1000+i*700, () => {
      this.showCountText(c);
      this.playCountSe(i);
    }));
    this.time.delayedCall(1000+counts.length*700, () => {
      this.showCountText('START!');
      this.playCountStartSe();
    });
    this.time.delayedCall(1000+counts.length*700+500, () => {
      this.gameStarted = true;
      this.elapsedPlayMs = 0;
      this.lastElapsedTimerUpdateTime = this.time.now;
      this.spawnFallingPiece();
    });
  }

  showCountText(label) {
    const cx = this.FRAME_X + this.FRAME_WIDTH / 2;
    const txt = this.add.text(cx, this.FRAME_Y+190, label, {
      fontSize: label==='START!' ? '42px' : '64px', fill:'#7F6BAE', fontStyle:'bold',
      stroke:'#FFFFFF', strokeThickness:8,
    }).setOrigin(0.5).setDepth(14).setShadow(2,2,'#F6A7C8',3,true,true);
    this.tweens.add({ targets:txt, scale:1.35, alpha:0, duration:620,
      ease:'Cubic.easeOut', onComplete:()=>txt.destroy() });
  }

  // ─── 落下ピース ───

  spawnFallingPiece() {
    if (!this.gameActive || !this.gameStarted) return;
    const type = this.nextType;
    this.nextType = Phaser.Math.Between(0, 3);

    const x = this.FRAME_X + (this.fallingCol + 0.5) * this.STEP_X;
    const y = this.GAME_OVER_Y - ICE_RADIUS - 5;
    this.fallingPieceY = y;

    const piece = this.matter.add.image(x, y, this.ICE_TYPES[type].texture);
    piece.setCircle(ICE_RADIUS, { friction:0.5, frictionStatic:0.6, restitution:0.12,
      label:'ice', collisionFilter:{ category:0x0002, mask:0x0001|0x0002 } });
    piece.setIgnoreGravity(true);
    piece.setDepth(5);
    piece.setScale((ICE_RADIUS * 2) / TEX_SIZE);

    piece._iceType   = type;
    piece._iceId     = this.pieceId++;
    piece._iceRadius = ICE_RADIUS;
    piece._placedAt  = null;
    piece._melted    = false;
    piece._meltParts = null;

    this.fallingPiece = piece;
    this.updateNextPreview();
  }

  moveFallingPiece(dir) {
    if (!this.fallingPiece || !this.gameStarted || this.isPaused) return;
    const newCol = Phaser.Math.Clamp(this.fallingCol + dir, 0, this.COLS - 1);
    if (newCol === this.fallingCol) return;
    this.fallingCol = newCol;
    const newX = this.FRAME_X + (this.fallingCol + 0.5) * this.STEP_X;
    this.fallingPiece.setPosition(newX, this.fallingPieceY);
    Phaser.Physics.Matter.Matter.Body.setVelocity(this.fallingPiece.body, { x:0, y:0 });
    this.playMoveSe();
  }

  dropFallingPiece() {
    if (!this.fallingPiece || !this.gameStarted || this.isPaused) return;
    const piece = this.fallingPiece;
    this.fallingPiece = null;

    piece.setIgnoreGravity(false);
    piece._placedAt = this.time.now;
    this.placedPieces.push(piece);
    this.lastPeriodicMatchCheck = this.time.now;

    this.time.delayedCall(700, () => {
      if (this.gameActive && this.gameStarted && !this.fallingPiece) this.spawnFallingPiece();
    });
    this.time.delayedCall(80, () => {
      if (this.gameActive) this.scheduleMatchResolution();
    });
  }

  // ─── update ───

  update(time, delta) {
    if (!this.gameActive) return;

    if (this.isPaused) {
      this.pauseMeltTimers(time);
      this.pauseFeverTime(time);
      this.lastElapsedTimerUpdateTime = time;
      return;
    }

    this.updateElapsedTime(time);
    this.updateMelt(time);
    this.updateFeverVisuals(time, delta);
    this.pauseMeltTimers(time);
    this.pauseFeverTime(time);

    if (!this.gameStarted) return;

    if (this.fallingPiece) {
      const tx  = this.FRAME_X + (this.fallingCol + 0.5) * this.STEP_X;
      const maxY = this._getAutoFallMaxY(tx);
      this.fallingPieceY = Math.min(this.fallingPieceY + 60 * delta / 1000, maxY);
      this.fallingPiece.setPosition(tx, this.fallingPieceY);
      Phaser.Physics.Matter.Matter.Body.setVelocity(this.fallingPiece.body, { x:0, y:0 });

      // 床またはアイスに触れたら自動で落下確定（DROP ボタン不要）
      if (this.fallingPieceY >= maxY - 0.5) {
        this.dropFallingPiece();
      }
    }

    if (this.isAnyPieceOverLine()) { this.endGame(); return; }

    // 転がってきたアイスの遅延マッチを定期検出（200ms間隔）
    // fallingPiece があっても検出する（既存アイスが転がって揃う場合があるため）
    if (this.gameStarted && !this.isResolving
        && this.placedPieces.length >= 3
        && time - this.lastPeriodicMatchCheck > 200) {
      this.lastPeriodicMatchCheck = time;
      this.scheduleMatchResolution();
    }
  }

  // ─── 経過時間 ───

  updateElapsedTime(time) {
    if (!this.gameStarted) { this.lastElapsedTimerUpdateTime = time; return; }
    if (this.lastElapsedTimerUpdateTime === 0) {
      this.lastElapsedTimerUpdateTime = time;
      this.updateElapsedTimeText();
      return;
    }
    const dt = time - this.lastElapsedTimerUpdateTime;
    this.lastElapsedTimerUpdateTime = time;
    if (dt <= 0) return;
    this.elapsedPlayMs += dt;
    this.updateElapsedTimeText();
  }

  updateElapsedTimeText() {
    if (!this.elapsedTimeText) return;
    const sec = Math.floor(this.elapsedPlayMs / 1000);
    if (sec === this.lastDisplayedElapsedSecond) return;
    this.lastDisplayedElapsedSecond = sec;
    const m = Math.floor(sec / 60), s = sec % 60;
    this.elapsedTimeText.setText(`${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`);
  }

  // ─── 溶けによる縮小 ───

  updateMelt(time) {
    const isFever = time < this.feverActiveUntil;
    for (const p of this.placedPieces) {
      if (!p.active || p._melted || !p._placedAt || isFever) continue;
      if (time - p._placedAt < this.meltTimeMs) continue;
      this._applyMelt(p);
    }
  }

  _applyMelt(p) {
    p._melted = true;
    Phaser.Physics.Matter.Matter.Body.setVelocity(p.body, { x:0, y:0 });
    Phaser.Physics.Matter.Matter.Body.setAngularVelocity(p.body, 0);
    Phaser.Physics.Matter.Matter.Body.setStatic(p.body, true);
    // Body.scale はボディを再生成せず頂点を直接縮小するため、静的化後に安全に使える。
    // setCircle はボディ再生成で一時的に動的状態になり上方向に飛ぶため使わない。
    Phaser.Physics.Matter.Matter.Body.scale(p.body, MELTED_RADIUS / ICE_RADIUS, MELTED_RADIUS / ICE_RADIUS);
    p._iceRadius = MELTED_RADIUS;
    p.setVisible(false);

    // ノーマルモードと同じ溶け見た目（潰れたアイス＋水たまりオーバーレイ）
    const mx = p.x, my = p.y;
    const overlay = this.add.image(mx, my + 13, this.ICE_TYPES[p._iceType].texture)
      .setScale(0.84, 0.52).setAlpha(0.42).setTint(0xCFE8FF).setDepth(5);
    const py = my + 24;
    const shadow = this.add.ellipse(mx,     py+4, 56, 20, 0xA9DDF7, 0.35).setDepth(5);
    const puddle = this.add.ellipse(mx,     py,   48, 17, 0xFFFFFF, 0.72).setDepth(5);
    const dripL  = this.add.ellipse(mx-18,  py+7, 15,  9, 0xFFFFFF, 0.60).setDepth(5);
    const dripR  = this.add.ellipse(mx+19,  py+8, 18, 11, 0xDDEBFF, 0.62).setDepth(5);
    const shine  = this.add.ellipse(mx-8,   py-3, 18,  5, 0xFFF7FB, 0.85).setDepth(5);
    p._meltParts = [overlay, shadow, puddle, dripL, dripR, shine];
  }

  unfreezeMeltedPieces() {
    let hasUnfrozen = false;
    for (const p of this.placedPieces) {
      if (!p.active || !p._melted) continue;
      p._melted = false;
      p._placedAt = this.time.now;
      if (p._meltParts) { p._meltParts.forEach(o => o.destroy()); p._meltParts = null; }
      p.setVisible(true);
      p._iceRadius = ICE_RADIUS;
      // Body.scale でボディをスケールアップして動的に戻す（setCircle はボディ再生成するため使わない）
      Phaser.Physics.Matter.Matter.Body.scale(p.body, ICE_RADIUS / MELTED_RADIUS, ICE_RADIUS / MELTED_RADIUS);
      Phaser.Physics.Matter.Matter.Body.setStatic(p.body, false);
      Phaser.Physics.Matter.Matter.Body.setVelocity(p.body, { x:0, y:0 });
      this.createSnowflakeEffect(p.x, p.y);
      hasUnfrozen = true;
    }
    return hasUnfrozen;
  }

  pauseMeltTimers(time) {
    const shouldPause = time < this.feverActiveUntil || this.isResolving || this.isPaused;
    if (!shouldPause) { this.lastPauseTime = time; return; }
    if (this.lastPauseTime === 0) { this.lastPauseTime = time; return; }
    const dt = time - this.lastPauseTime;
    this.lastPauseTime = time;
    if (dt <= 0) return;
    for (const p of this.placedPieces) {
      if (p.active && !p._melted && p._placedAt) p._placedAt += dt;
    }
  }

  pauseFeverTime(time) {
    const shouldPause = (this.isResolving || this.isPaused) && time < this.feverActiveUntil;
    if (!shouldPause) { this.lastFeverPauseTime = time; return; }
    if (this.lastFeverPauseTime === 0) { this.lastFeverPauseTime = time; return; }
    const dt = time - this.lastFeverPauseTime;
    this.lastFeverPauseTime = time;
    if (dt > 0) this.feverActiveUntil += dt;
  }

  // ─── マッチ検出（近接ベース） ───

  scheduleMatchResolution() {
    if (this.isResolving) { this.pendingResolve = true; return; }
    this.resolveInBackground();
  }

  resolveInBackground() {
    this.isResolving = true;
    this.checkAndRemoveMatches();
    if (this.gameActive && this.isAnyPieceOverLine()) { this.endGame(); }
    if (this.pendingResolve && this.gameActive) {
      this.pendingResolve = false;
      this.resolveInBackground();
      return;
    }
    this.isResolving = false;
  }

  checkAndRemoveMatches() {
    let chainCount = 1, scoreDelta = 0, found = true;

    while (found) {
      found = false;
      const groups = [], visited = new Set();

      for (const p of this.placedPieces) {
        if (!p.active || p._melted || visited.has(p._iceId)) continue;
        const group = this.findConnected(p, visited);
        if (group.length >= 3) groups.push(group);
      }

      if (groups.length === 0) break;

      let chainBase = 0;
      const toRemove = new Set();
      for (const group of groups) {
        chainBase += this.calcMatchScore(group[0]._iceType, group.length);
        group.forEach(p => toRemove.add(p));
      }
      scoreDelta += this.calcChainScore(chainBase, chainCount);
      this.playMatchEffect(toRemove, chainCount);

      toRemove.forEach(p => {
        if (!p.active || p._melted) return; // 溶けたアイスを誤って削除しない
        this.erasedCounts[p._iceType]++;
        if (p._meltParts) { p._meltParts.forEach(o => o.destroy()); p._meltParts = null; }
        const idx = this.placedPieces.indexOf(p);
        if (idx >= 0) this.placedPieces.splice(idx, 1);
        p.destroy();
      });
      this.maxChain = Math.max(this.maxChain, chainCount);
      found = true;
      chainCount++;
    }

    this.score += scoreDelta;
    this.scoreText.setText(`スコア: ${this.score}`);
    this.checkFeverTime(scoreDelta);
    this.updateFeverGauge();
  }

  findConnected(start, visited) {
    const result = [], stack = [start];
    while (stack.length) {
      const p = stack.pop();
      if (visited.has(p._iceId)) continue;
      visited.add(p._iceId);
      result.push(p);
      for (const q of this.placedPieces) {
        if (visited.has(q._iceId) || q._melted || !q.active) continue;
        if (q._iceType !== p._iceType) continue;
        const dx = q.x-p.x, dy = q.y-p.y;
        if (Math.sqrt(dx*dx+dy*dy) < p._iceRadius+q._iceRadius+TOUCH_TOLERANCE) stack.push(q);
      }
    }
    return result;
  }

  // ─── ゲームオーバー ───

  isAnyPieceOverLine() {
    const now = this.time.now;
    for (const p of this.placedPieces) {
      if (!p.active || p._melted) continue;
      if (p._placedAt && now - p._placedAt < 500) continue;
      if (p.y - p._iceRadius < this.GAME_OVER_Y) return true;
    }
    return false;
  }

  endGame() {
    if (!this.gameActive) return;
    this.gameActive = false;
    this.matter.world.pause();
    this.playGameOverBgm();

    if (this.fallingPiece) { this.fallingPiece.destroy(); this.fallingPiece = null; }

    const cx = this.FRAME_X + this.FRAME_WIDTH / 2;
    const y  = this.FRAME_Y + 185;
    const panel = this.add.graphics().setDepth(8);
    panel.fillStyle(0xFFFDF7,0.92); panel.fillRoundedRect(cx-120,y-34,240,72,16);
    panel.lineStyle(4,0xE85D75,0.9); panel.strokeRoundedRect(cx-120,y-34,240,72,16);
    this.add.text(cx, y, 'GAME OVER', {
      fontSize:'34px', fill:'#E85D75', fontStyle:'bold',
      stroke:'#FFFFFF', strokeThickness:6,
    }).setOrigin(0.5).setDepth(9).setShadow(2,2,'#F6A7C8',2,true,true);

    this.time.delayedCall(1000, () => {
      this.add.text(cx, y+62, 'まもなくリザルトへ...', {
        fontSize:'20px', fill:'#7F6BAE', fontStyle:'bold',
        stroke:'#FFFFFF', strokeThickness:4,
      }).setOrigin(0.5).setDepth(9);
    });
    this.time.delayedCall(3000, () =>
      goToResult(this.score, { maxChain:this.maxChain, erasedCounts:this.erasedCounts, mode:'gravity' }));
  }

  // ─── スコア / フィーバー ───

  calcMatchScore(type, count) {
    return this.ICE_TYPES[type].score + Math.max(0, count-3)*2;
  }
  calcChainScore(base, chain) { return base + 3*(chain-1); }

  checkFeverTime(delta) {
    if (delta <= 0 || this.time.now < this.feverActiveUntil) return;
    this.feverGaugeScore += delta;
    if (this.feverGaugeScore >= 20) { this.feverGaugeScore = 0; this.startFeverTime(); }
  }

  startFeverTime() {
    this.feverActiveUntil   = this.time.now + this.feverDurationMs;
    this.feverEndHandled    = false;
    this.feverGaugeScore    = 0;
    this.lastPauseTime      = this.time.now;
    this.lastFeverPauseTime = this.time.now;
    this.playFeverSe();
    this.showFeverText();
    this.showFeverScreenEffect();
    this.updateFeverGauge();
    // 溶けていたアイスを解凍してマッチ判定（ノーマルモードと同じ動作）
    const hasUnfrozen = this.unfreezeMeltedPieces();
    if (hasUnfrozen) this.scheduleMatchResolution();
  }

  updateFeverVisuals(time, delta) {
    if (time >= this.feverActiveUntil) {
      if (!this.feverEndHandled) this.feverEndHandled = true;
      this.clearFeverScreenEffect();
      return;
    }
    this.feverRedrawTimer += delta;
    if (this.feverRedrawTimer > 500) { this.feverRedrawTimer = 0; this.updateFeverGauge(); }
  }

  showFeverText() {
    const gaugeX = this.feverGauge ? this.feverGauge.x + this.feverGauge.width/2 : this.FRAME_X + this.FRAME_WIDTH/2;
    const gaugeY = this.feverGauge ? this.feverGauge.y - 20 : this.FRAME_Y + 120;
    const bubble = this.add.graphics().setDepth(18);
    bubble.fillStyle(0xFFFDF7,0.92);
    bubble.fillRoundedRect(gaugeX-76, gaugeY-22, 152, 42, 14);
    bubble.lineStyle(4,0xFFE68A,0.98);
    bubble.strokeRoundedRect(gaugeX-76, gaugeY-22, 152, 42, 14);
    const txt = this.add.text(gaugeX, gaugeY, 'FEVER', {
      fontSize:'28px', fill:'#FFF45C', fontStyle:'bold',
      stroke:'#7F6BAE', strokeThickness:6,
    }).setOrigin(0.5).setDepth(19);
    this.tweens.add({ targets:[txt, bubble], y:gaugeY-16, alpha:0, scale:1.16,
      duration:1000, ease:'Cubic.easeOut',
      onComplete:()=>{ txt.destroy(); bubble.destroy(); } });
  }

  // ─── エフェクト ───

  playMatchEffect(pieces, chainCount) {
    if (this.audioContext) {
      const now = this.audioContext.currentTime;
      this.playTone(783.99,  now,      0.18, 0.04,  'sparkle');
      this.playTone(1046.50, now+0.09, 0.2,  0.045, 'sparkle');
      this.playTone(1318.51, now+0.2,  0.22, 0.04,  'sparkle');
      this.playTone(1567.98, now+0.33, 0.32, 0.032, 'sparkle');
    }
    [...pieces].forEach((p,i) => {
      const bx = p.x, by = p.y;
      this.time.delayedCall(i*65, () => this.createBurst(bx, by));
    });
    this.showChainText(chainCount);
  }

  showChainText(n) {
    const cx = this.FRAME_X + this.FRAME_WIDTH / 2;
    const txt = this.add.text(cx, this.FRAME_Y+78, `${n}連鎖!`, {
      fontSize:'34px', fill:'#5BA7D1', fontStyle:'bold',
      stroke:'#FFFFFF', strokeThickness:6,
    }).setOrigin(0.5).setDepth(13).setShadow(2,2,'#A9DDF7',2,true,true);
    this.tweens.add({ targets:txt, y:txt.y-28, alpha:0, scale:1.28, duration:900,
      ease:'Cubic.easeOut', onComplete:()=>txt.destroy() });
  }

  createBurst(x, y) {
    const colors = [0xFFF7FB,0xFFE68A,0xA9E8D1,0xF8AFC9];
    for (let i = 0; i < 14; i++) {
      const angle = (Math.PI*2*i)/14;
      const d = Phaser.Math.Between(24,48);
      const s = this.add.circle(x,y,Phaser.Math.Between(3,5),colors[i%4],0.95).setDepth(9);
      this.tweens.add({ targets:s, x:x+Math.cos(angle)*d, y:y+Math.sin(angle)*d,
        alpha:0, scale:0.2, duration:720, ease:'Cubic.easeOut', onComplete:()=>s.destroy() });
    }
    const ring = this.add.circle(x,y,10).setDepth(8).setStrokeStyle(4,0xFFF7FB,0.95);
    this.tweens.add({ targets:ring, alpha:0, scale:3, duration:680,
      ease:'Quad.easeOut', onComplete:()=>ring.destroy() });
  }

  // ─── BGM / SE ───

  createPastelBgm() {
    this.bgmBeatMs = 220; this.bgmBeatIndex = 0; this.bgmStarted = false;
    this.bgmMeasures = [
      { chord:[261.63,329.63,392.00], bass:[261.63,392.00,329.63,392.00],
        melody:[659.25,783.99,880.00,null,987.77,880.00,783.99,659.25] },
      { chord:[349.23,440.00,523.25], bass:[349.23,523.25,440.00,523.25],
        melody:[698.46,880.00,1046.50,1174.66,null,1046.50,880.00,698.46] },
      { chord:[392.00,493.88,587.33], bass:[392.00,587.33,493.88,587.33],
        melody:[783.99,987.77,1174.66,1318.51,1174.66,null,987.77,880.00] },
      { chord:[329.63,392.00,493.88], bass:[329.63,493.88,392.00,493.88],
        melody:[659.25,783.99,987.77,1046.50,987.77,880.00,783.99,659.25] },
      { chord:[440.00,523.25,659.25], bass:[440.00,659.25,523.25,659.25],
        melody:[880.00,1046.50,1174.66,1318.51,null,1174.66,1046.50,880.00] },
      { chord:[392.00,493.88,659.25], bass:[392.00,659.25,493.88,659.25],
        melody:[987.77,1174.66,1318.51,1567.98,1318.51,1174.66,null,987.77] },
      { chord:[349.23,440.00,587.33], bass:[349.23,587.33,440.00,587.33],
        melody:[880.00,1046.50,1174.66,1046.50,880.00,783.99,698.46,null] },
      { chord:[392.00,523.25,659.25], bass:[392.00,659.25,523.25,659.25],
        melody:[783.99,880.00,987.77,1046.50,880.00,783.99,659.25,523.25] },
    ];
    const start = () => this.startBgm();
    this.time.delayedCall(300, start);
    this.input.once('pointerdown', start);
    this.input.keyboard.once('keydown', start);
    this.game.events.on('focus', () => {
      if (this.audioContext?.state === 'suspended') this.audioContext.resume();
    });
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      if (this.bgmLoop) { this.bgmLoop.remove(false); this.bgmLoop = null; }
      this.bgmStarted = false;
    });
  }

  startBgm() {
    if (this.bgmStarted && this.audioContext?.state === 'running') return;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    this.audioContext = this.audioContext || new AC();
    this.setupAudio();
    if (this.audioContext.state === 'suspended') this.audioContext.resume();
    this.bgmStarted = true;
    if (this.bgmLoop) return;
    this.playBgmBeat();
    this.bgmLoop = this.time.addEvent({ delay:110, loop:true, callback:()=>this.playBgmBeat() });
  }

  setupAudio() {
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

  playBgmBeat() {
    if (!this.audioContext) return;
    const now     = this.audioContext.currentTime;
    const measure = this.bgmMeasures[Math.floor(this.bgmBeatIndex/8) % this.bgmMeasures.length];
    const beat    = this.bgmBeatIndex % 8;
    const isFever = this.time.now < this.feverActiveUntil;
    const bs      = (isFever ? this.bgmBeatMs*0.72 : this.bgmBeatMs) / 1000;

    if (this.bgmBeatIndex % 2 === 1) {
      if (isFever) this.playTone(measure.chord[beat%measure.chord.length]*2, now, bs*0.4, 0.024, 'sparkle');
      this.bgmBeatIndex++;
      return;
    }

    const mel = measure.melody[beat];
    if (mel) {
      const isPhraseEnd = beat===3 || beat===7;
      this.playTone(mel, now, isPhraseEnd ? bs*1.35 : bs*0.92, isFever?0.072:0.05, 'lead');
      if (isFever) this.playTone(mel*1.5, now+bs*0.18, bs*0.65, 0.032, 'sparkle');
    }

    this.playTone(measure.chord[beat%measure.chord.length], now+bs*0.5, bs*0.58, isFever?0.024:0.016, 'chord');

    if (beat % 2 === 0) {
      this.playTone(measure.bass[Math.floor(beat/2)%measure.bass.length], now, bs*1.55, isFever?0.045:0.03, 'bass');
      if (isFever) measure.chord.forEach(n => this.playTone(n*2, now+bs*0.08, bs*1.1, 0.018, 'chord'));
    }

    if (beat===6 && mel) this.playTone(mel*2, now+bs*0.25, bs*0.45, isFever?0.035:0.018, 'sparkle');

    this.bgmBeatIndex++;
  }

  playTone(freq, start, dur, vol, role) {
    this.setupAudio();
    const s = {
      lead:    { type:'triangle', overtone:2,   filter:2200, attack:0.018, decay:0.18 },
      chord:   { type:'sine',     overtone:1.5, filter:1300, attack:0.04,  decay:0.52 },
      bass:    { type:'triangle', overtone:2,   filter:900,  attack:0.025, decay:0.34 },
      sparkle: { type:'sine',     overtone:2,   filter:2600, attack:0.01,  decay:0.12 },
    }[role];
    const osc    = this.audioContext.createOscillator();
    const ov     = this.audioContext.createOscillator();
    const flt    = this.audioContext.createBiquadFilter();
    const gain   = this.audioContext.createGain();
    const ovGain = this.audioContext.createGain();
    osc.type = s.type; osc.frequency.setValueAtTime(freq, start);
    osc.frequency.exponentialRampToValueAtTime(freq*1.006, start+dur*0.35);
    ov.type = 'sine'; ov.frequency.setValueAtTime(freq*s.overtone, start);
    flt.type = 'lowpass'; flt.frequency.setValueAtTime(s.filter, start); flt.Q.setValueAtTime(1.2, start);
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.linearRampToValueAtTime(vol, start+s.attack);
    gain.gain.setTargetAtTime(vol*0.35, start+s.decay, 0.08);
    gain.gain.setTargetAtTime(0.0001, start+dur*0.72, 0.06);
    ovGain.gain.setValueAtTime(vol*0.22, start);
    ovGain.gain.setTargetAtTime(0.0001, start+dur*0.55, 0.05);
    osc.connect(flt); ov.connect(ovGain); ovGain.connect(flt); flt.connect(gain); gain.connect(this.masterGain);
    osc.start(start); ov.start(start); osc.stop(start+dur+0.18); ov.stop(start+dur+0.18);
    osc.onended = () => { osc.disconnect(); ov.disconnect(); ovGain.disconnect(); flt.disconnect(); gain.disconnect(); };
  }

  playMoveSe() {
    if (!this.audioContext) return;
    const now = this.audioContext.currentTime;
    this.playTone(587.33, now,       0.07, 0.026, 'sparkle');
    this.playTone(783.99, now+0.025, 0.08, 0.018, 'sparkle');
  }

  playFeverSe() {
    if (!this.audioContext) return;
    const now = this.audioContext.currentTime;
    this.playTone(987.77,  now,      0.18, 0.045, 'sparkle');
    this.playTone(1318.51, now+0.08, 0.2,  0.04,  'sparkle');
    this.playTone(1760.00, now+0.18, 0.35, 0.038, 'sparkle');
  }

  playCountSe(index) {
    if (!this.audioContext) return;
    this.playTone(659.25 + index*110, this.audioContext.currentTime, 0.16, 0.04, 'sparkle');
  }

  playCountStartSe() {
    if (!this.audioContext) return;
    const now = this.audioContext.currentTime;
    this.playTone(1046.50, now,      0.18, 0.045, 'sparkle');
    this.playTone(1318.51, now+0.08, 0.22, 0.04,  'sparkle');
  }

  playGameOverBgm() {
    if (this.bgmLoop) { this.bgmLoop.remove(false); this.bgmLoop = null; }
    if (!this.audioContext) return;
    const now = this.audioContext.currentTime;
    [659.25,587.33,523.25,392.00].forEach((n,i) =>
      this.playTone(n, now+i*0.34, 0.42, 0.045, 'lead'));
    this.playTone(261.63, now+1.05, 1.1, 0.035, 'bass');
  }

  // ─── 落下ピースの自動落下上限Y（積まれたアイスの上で止まる） ───

  _getAutoFallMaxY(tx) {
    // 床の物理壁の上面 = FRAME_Y + FRAME_HEIGHT - coneOverlapY(30)
    // アイス中心は上面 - ICE_RADIUS
    const floorY = this.FRAME_Y + this.FRAME_HEIGHT - 30 - ICE_RADIUS;
    let maxY = floorY;
    for (const p of this.placedPieces) {
      if (!p.active) continue;
      const dx = Math.abs(p.x - tx);
      if (dx < ICE_RADIUS * 1.8) {
        const stopY = p.y - p._iceRadius - ICE_RADIUS;
        if (stopY < maxY) maxY = stopY;
      }
    }
    return maxY;
  }

  // ─── 雪の結晶エフェクト（フィーバー時） ───

  createSnowflakeEffect(x, y) {
    const g = this.createSnowflakeGraphic(x, y, 28, 0xE8F8FF, 0.98);
    g.setDepth(11);
    const ring = this.add.circle(x, y, 18).setDepth(10).setStrokeStyle(3, 0xA9DDF7, 0.9);
    this.tweens.add({
      targets: [g, ring], alpha: 0, scale: 1.8, angle: 180, duration: 900,
      ease: 'Cubic.easeOut', onComplete: () => { g.destroy(); ring.destroy(); },
    });
  }

  createSnowflakeGraphic(x, y, radius, color, alpha) {
    const g = this.add.graphics({ x, y });
    g.lineStyle(3, color, alpha);
    for (let i = 0; i < 6; i++) {
      const a = (Math.PI * 2 * i) / 6;
      const ex = Math.cos(a) * radius, ey = Math.sin(a) * radius;
      const bx = Math.cos(a) * radius * 0.58, by = Math.sin(a) * radius * 0.58;
      g.beginPath(); g.moveTo(0, 0); g.lineTo(ex, ey); g.strokePath();
      g.beginPath();
      g.moveTo(bx, by);
      g.lineTo(bx + Math.cos(a + 0.78) * radius * 0.32, by + Math.sin(a + 0.78) * radius * 0.32);
      g.moveTo(bx, by);
      g.lineTo(bx + Math.cos(a - 0.78) * radius * 0.32, by + Math.sin(a - 0.78) * radius * 0.32);
      g.strokePath();
    }
    g.fillStyle(0xFFFFFF, 0.95); g.fillCircle(0, 0, 4);
    return g;
  }

  // ─── フィーバー画面エフェクト ───

  showFeverScreenEffect() {
    this.clearFeverScreenEffect();
    const fx = this.FRAME_X, fy = this.FRAME_Y, fw = this.FRAME_WIDTH;
    const overlay = this.add.rectangle(400, 300, 800, 600, 0x070B26, 0.58).setDepth(2);
    const frameGlow = this.add.graphics().setDepth(12);
    const effects = [];
    this._drawFeverFrameGlow(frameGlow);
    this.tweens.add({ targets: frameGlow, alpha: 0.35, duration: 480, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });

    const spotlight = this.add.graphics().setDepth(3);
    spotlight.fillStyle(0xFFE68A, 0.12);
    spotlight.fillTriangle(0, 0, 248, 0, fx + 20, this.scale.height);
    spotlight.fillTriangle(this.scale.width, 0, this.scale.width - 248, 0, fx + fw - 20, this.scale.height);
    spotlight.fillStyle(0xF8AFC9, 0.08);
    spotlight.fillTriangle(120, 0, 330, 0, fx + fw / 2, this.scale.height);
    effects.push(spotlight);
    this.tweens.add({ targets: spotlight, alpha: 0.42, duration: 820, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });

    const lightColors = [0xFFE68A, 0xF8AFC9, 0xA9E8D1, 0xA9DDF7];
    const leftX = fx + 10, rightX = fx + fw - 10;
    const topY = fy + 10, bottomY = this.scale.height - 22;
    for (let i = 0; i < 6; i++) {
      const t = i / 5;
      [leftX, rightX].forEach(lx => {
        const light = this.add.circle(lx, Phaser.Math.Linear(topY + 58, bottomY, t), 7, lightColors[i % 4], 0.92).setDepth(13);
        effects.push(light);
        this.tweens.add({ targets: light, scale: 2.35, alpha: 0.22, duration: 430 + (i % 4) * 90, repeat: -1, yoyo: true, ease: 'Sine.easeInOut' });
      });
    }
    for (let i = 0; i < 20; i++) {
      const side = i % 2 === 0 ? -1 : 1;
      const sx = side < 0 ? Phaser.Math.Between(24, 104) : Phaser.Math.Between(696, 776);
      const sy = Phaser.Math.Between(70, 520);
      const star = this.add.star(sx, sy, 5, 4, 11, lightColors[i % 4], 0.72).setDepth(13);
      effects.push(star);
      this.tweens.add({ targets: star, y: sy - Phaser.Math.Between(28, 64), angle: Phaser.Math.Between(160, 320), alpha: 0.18, duration: Phaser.Math.Between(1200, 2200), repeat: -1, yoyo: true, ease: 'Sine.easeInOut' });
    }
    this.feverScreenEffect = { overlay, frameGlow, effects };
  }

  _drawFeverFrameGlow(g) {
    const fx = this.FRAME_X, fy = this.FRAME_Y, fw = this.FRAME_WIDTH;
    const bot = this.scale.height, cr = 14;
    g.lineStyle(16, 0xFFE68A, 0.22);
    g.beginPath(); g.moveTo(fx+cr, fy-5); g.lineTo(fx+fw-cr, fy-5);
    g.arc(fx+fw-cr, fy+cr-5, cr, -Math.PI/2, 0); g.lineTo(fx+fw+5, bot);
    g.moveTo(fx-5, bot); g.lineTo(fx-5, fy+cr-5);
    g.arc(fx+cr, fy+cr-5, cr, Math.PI, -Math.PI/2); g.strokePath();
    g.lineStyle(7, 0xF8AFC9, 0.72);
    g.beginPath(); g.moveTo(fx+cr, fy); g.lineTo(fx+fw-cr, fy);
    g.arc(fx+fw-cr, fy+cr, cr, -Math.PI/2, 0); g.lineTo(fx+fw, bot);
    g.moveTo(fx, bot); g.lineTo(fx, fy+cr);
    g.arc(fx+cr, fy+cr, cr, Math.PI, -Math.PI/2); g.strokePath();
  }

  clearFeverScreenEffect() {
    if (!this.feverScreenEffect) return;
    const { overlay, frameGlow, effects } = this.feverScreenEffect;
    overlay.destroy(); frameGlow.destroy();
    effects.forEach(e => e.destroy());
    this.feverScreenEffect = null;
  }

  wait(ms) { return new Promise(r => this.time.delayedCall(ms, r)); }
}
