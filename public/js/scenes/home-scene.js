import { goToRanking } from '../app-init.js';
import { appState, setPlayerSession } from '../state/app-state.js';
import { BackendApi, createRankingStore } from '/src/backend/api.js';

const ICE_ASSETS = [
  { key: 'home-ice-azuki', path: '/assets/images/あずき.png' },
  { key: 'home-ice-cookie', path: '/assets/images/クッキーアンドクリーム.png' },
  { key: 'home-ice-cone', path: '/assets/images/コーン.png' },
  { key: 'home-ice-strawberry', path: '/assets/images/ストロベリー.png' },
  { key: 'home-ice-mint', path: '/assets/images/チョコミント.png' },
];

const SCATTERED_ICES = [
  { key: 'home-ice-strawberry', x: 92, y: 96, size: 122, angle: -18 },
  { key: 'home-ice-mint', x: 694, y: 82, size: 115, angle: 16 },
  { key: 'home-ice-cookie', x: 138, y: 468, size: 137, angle: 12 },
  { key: 'home-ice-azuki', x: 654, y: 478, size: 132, angle: -12 },
  { key: 'home-ice-cone', x: 78, y: 316, size: 145, angle: 20 },
  { key: 'home-ice-strawberry', x: 724, y: 318, size: 105, angle: -24 },
  { key: 'home-ice-mint', x: 250, y: 120, size: 82, angle: 22 },
  { key: 'home-ice-cookie', x: 548, y: 128, size: 87, angle: -15 },
  { key: 'home-ice-azuki', x: 262, y: 510, size: 82, angle: -8 },
  { key: 'home-ice-cone', x: 526, y: 516, size: 92, angle: 14 },
];

const configEnv = window.DAINAGON_CONFIG ?? {};
const backendApi = new BackendApi({
  rankingStore: createRankingStore(configEnv),
});

export class HomeScene extends Phaser.Scene {
  constructor() {
    super({ key: 'HomeScene' });
  }

  preload() {
    ICE_ASSETS.forEach(({ key, path }) => {
      if (!this.textures.exists(key)) {
        this.load.image(key, path);
      }
    });
  }

  create() {
    this.createPastelBackground();
    this.createGameLikeFrame();
    this.scatterIceImages();
    this.createTitle();
    this.createHomeMenu();   // ログイン状態に関わらず常にメニュー表示
    this.createLoginArea();  // 左上にログイン/ログアウト
  }

  createPastelBackground() {
    const { width, height } = this.scale;
    const graphics = this.add.graphics();

    this.cameras.main.setBackgroundColor('#FFEAF4');

    graphics.fillStyle(0xffeaf4, 1);
    graphics.fillRect(0, 0, width, height);

    graphics.fillStyle(0xe8f8f5, 1);
    graphics.fillCircle(110, 105, 95);
    graphics.fillCircle(705, 470, 130);

    graphics.fillStyle(0xfff7c8, 1);
    graphics.fillCircle(635, 105, 80);

    graphics.fillStyle(0xddebff, 1);
    graphics.fillCircle(95, 500, 115);

    graphics.fillStyle(0xffffff, 0.42);
    for (let y = 36; y < height; y += 54) {
      for (let x = 34; x < width; x += 72) {
        graphics.fillCircle(x, y, 3);
      }
    }
  }

  createGameLikeFrame() {
    const graphics = this.add.graphics();
    const frameX = 235;
    const frameY = 70;
    const frameWidth = 330;
    const frameHeight = 450;
    const radius = 12;

    graphics.fillStyle(0xfffdf7, 0.62);
    graphics.fillRoundedRect(frameX, frameY, frameWidth, frameHeight, radius);

    graphics.lineStyle(13, 0xf6a7c8, 0.18);
    graphics.strokeRoundedRect(frameX, frameY, frameWidth, frameHeight, radius);

    graphics.lineStyle(8, 0xf6a7c8, 0.32);
    graphics.strokeRoundedRect(frameX, frameY, frameWidth, frameHeight, radius);

    graphics.lineStyle(5, 0xf6a7c8, 1);
    graphics.strokeRoundedRect(frameX, frameY, frameWidth, frameHeight, radius);

    graphics.lineStyle(2, 0xfff7fb, 0.9);
    graphics.strokeRoundedRect(frameX + 4, frameY + 4, frameWidth - 8, frameHeight - 8, 9);
  }

  scatterIceImages() {
    SCATTERED_ICES.forEach(({ key, x, y, size, angle }, index) => {
      const sprite = this.add.image(x, y, key);
      const texture = this.textures.get(key).getSourceImage();
      const maxTextureSize = Math.max(texture.width, texture.height);
      const displayWidth = (texture.width / maxTextureSize) * size;
      const displayHeight = (texture.height / maxTextureSize) * size;

      sprite
        .setDisplaySize(displayWidth, displayHeight)
        .setAngle(angle)
        .setAlpha(0.9)
        .setDepth(1);

      this.tweens.add({
        targets: sprite,
        y: y + (index % 2 === 0 ? 8 : -8),
        angle: angle + (index % 2 === 0 ? 4 : -4),
        duration: 1800 + index * 120,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      });
    });
  }

  createTitle() {
    const title = this.add
      .text(400, 150, 'あいすぱずる', {
        fontSize: '64px',
        color: '#e85d75',
        fontFamily: "'Fredoka', 'Comic Sans MS', cursive, sans-serif",
        fontStyle: 'bold italic',
        stroke: '#ffffff',
        strokeThickness: 9,
      })
      .setOrigin(0.5)
      .setAngle(-6)
      .setDepth(4)
      .setShadow(4, 5, '#a9ddf7', 3, true, true);

    this.tweens.add({
      targets: title,
      y: title.y - 8,
      duration: 1300,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
  }

  createLoginArea() {
    if (appState.playerSession?.accessToken) {
      // ログイン済み: アイコン + プレイヤー名（左上）
      this.createUserProfile(28, 31, appState.playerSession.playerName);
    } else {
      // 未ログイン: ログインボタン（左上）
      this._makeSmallBtn(72, 32, 'ログイン', () => {
        this.scene.launch('LoginScene');
        this.scene.bringToTop('LoginScene');
      });
    }
  }

  createUserProfile(iconX, iconY, playerName) {
    const avatar = this.add.graphics().setDepth(6);
    const drawAvatar = alpha => {
      avatar.clear();
      this.drawGuestAvatar(avatar, iconX, iconY, 20, alpha);
    };
    drawAvatar(0.96);

    if (appState.playerSession?.avatarDataUrl) {
      this.createCustomAvatarImage(iconX, iconY, appState.playerSession.avatarDataUrl);
    }

    this.add.text(iconX + 29, iconY, playerName, {
      fontSize: '15px',
      color: '#7f6bae',
      fontFamily: "'Fredoka', sans-serif",
      fontStyle: 'bold',
      stroke: '#ffffff',
      strokeThickness: 4,
    }).setOrigin(0, 0.5).setDepth(6);

    const iconHitArea = this.add.zone(iconX, iconY, 44, 44)
      .setInteractive({ useHandCursor: true }).setDepth(8);
    iconHitArea.on('pointerdown', () => this.toggleUserMenu(iconX, iconY + 28));
    iconHitArea.on('pointerover', () => drawAvatar(0.78));
    iconHitArea.on('pointerout',  () => drawAvatar(0.96));
  }

  toggleUserMenu(x, y) {
    if (this.userMenu) {
      this.userMenu.destroy(true);
      this.userMenu = null;
      return;
    }

    this.userMenu = this.add.container(x - 4, y).setDepth(12);

    const bg = this.add.graphics();
    bg.fillStyle(0xfffdf7, 0.98);
    bg.fillRoundedRect(0, 0, 164, 92, 10);
    bg.lineStyle(3, 0xf6a7c8, 1);
    bg.strokeRoundedRect(0, 0, 164, 92, 10);

    const chooseButton = this.createUserMenuButton(82, 26, 140, 'アイコンをえらぶ', 0x7f6bae, () => {
      this.openAvatarFilePicker();
    });
    const resetButton = this.createUserMenuButton(82, 60, 140, 'サインアウト', 0xe85d75, () => {
      localStorage.removeItem('dainagon-player');
      setPlayerSession(null);
      this.scene.restart();
    });

    this.userMenu.add([bg, ...chooseButton, ...resetButton]);
  }

  createUserMenuButton(x, y, width, labelText, color, onClick) {
    const buttonBg = this.add.graphics();
    const drawButton = alpha => {
      buttonBg.clear();
      buttonBg.fillStyle(color, alpha);
      buttonBg.fillRoundedRect(x - width / 2, y - 14, width, 28, 14);
    };
    drawButton(1);

    const label = this.add.text(x, y, labelText, {
      fontSize: '14px',
      color: '#ffffff',
      fontFamily: "'Fredoka', sans-serif",
      fontStyle: 'bold',
      stroke: '#5f5478',
      strokeThickness: 3,
    }).setOrigin(0.5);

    const hitArea = this.add.zone(x, y, width, 28)
      .setInteractive({ useHandCursor: true });
    hitArea.on('pointerdown', onClick);
    hitArea.on('pointerover', () => drawButton(0.78));
    hitArea.on('pointerout',  () => drawButton(1));

    return [buttonBg, label, hitArea];
  }

  createCustomAvatarImage(iconX, iconY, avatarDataUrl) {
    const avatarImage = document.createElement('img');
    avatarImage.src = avatarDataUrl;
    avatarImage.alt = '';
    avatarImage.style.cssText = [
      'width:40px',
      'height:40px',
      'border-radius:50%',
      'object-fit:cover',
      'border:3px solid #a9ddf7',
      'background:#fffdf7',
      'box-sizing:border-box',
      'pointer-events:none',
    ].join(';');

    this.add.dom(iconX, iconY, avatarImage).setDepth(7);
  }

  openAvatarFilePicker() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.style.display = 'none';

    input.addEventListener('change', () => {
      const file = input.files?.[0];
      input.remove();

      if (!file || !appState.playerSession) {
        return;
      }

      this.saveAvatarFile(file);
    });

    document.body.appendChild(input);
    input.click();
  }

  saveAvatarFile(file) {
    const image = new Image();
    const objectUrl = URL.createObjectURL(file);

    image.onload = () => {
      const canvas = document.createElement('canvas');
      const size = 128;
      const sourceSize = Math.min(image.width, image.height);
      const sourceX = (image.width - sourceSize) / 2;
      const sourceY = (image.height - sourceSize) / 2;
      const context = canvas.getContext('2d');

      canvas.width = size;
      canvas.height = size;
      context.drawImage(image, sourceX, sourceY, sourceSize, sourceSize, 0, 0, size, size);
      URL.revokeObjectURL(objectUrl);

      if (!appState.playerSession) {
        return;
      }

      setPlayerSession({
        ...appState.playerSession,
        avatarDataUrl: canvas.toDataURL('image/png'),
      });
      this.scene.restart();
    };

    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);
    };

    image.src = objectUrl;
  }

  drawGuestAvatar(graphics, x, y, radius, alpha = 1) {
    graphics.fillStyle(0xfffdf7, alpha);
    graphics.fillCircle(x, y, radius);
    graphics.lineStyle(Math.max(2, radius * 0.15), 0xa9ddf7, 1);
    graphics.strokeCircle(x, y, radius);
    graphics.fillStyle(0x7f6bae, 1);
    graphics.fillCircle(x, y - radius * 0.3, radius * 0.3);
    graphics.fillRoundedRect(
      x - radius * 0.5,
      y + radius * 0.18,
      radius,
      radius * 0.5,
      radius * 0.3,
    );
  }

  _makeSmallBtn(cx, cy, label, onClick) {
    const BW = 128, BH = 36;
    const g = this.add.graphics().setDepth(6);
    const draw = alpha => {
      g.clear();
      g.fillStyle(0xfffdf7, alpha);
      g.fillRoundedRect(cx - BW / 2, cy - BH / 2, BW, BH, BH / 2);
      g.lineStyle(2.5, 0xa9ddf7, 1);
      g.strokeRoundedRect(cx - BW / 2, cy - BH / 2, BW, BH, BH / 2);
    };
    draw(0.94);

    this.add.text(cx, cy, label, {
      fontSize: '15px',
      color: '#5ba7d1',
      fontFamily: "'Fredoka', sans-serif",
      fontStyle: 'bold',
      stroke: '#ffffff',
      strokeThickness: 3,
    }).setOrigin(0.5).setDepth(7);

    const zone = this.add.zone(cx, cy, BW, BH)
      .setInteractive({ useHandCursor: true }).setDepth(8);
    zone.on('pointerdown', onClick);
    zone.on('pointerover', () => draw(0.7));
    zone.on('pointerout',  () => draw(0.94));
  }

  createHomeMenu() {
    this.createMenuButton(400, 252, 'ソロ', () => {
      this.scene.launch('ModeSelectScene');
      this.scene.bringToTop('ModeSelectScene');
    });
    this.createMenuButton(400, 352, '対戦', () => {
      this.scene.launch('BattleModeSelectScene');
      this.scene.bringToTop('BattleModeSelectScene');
    });
    this.createMenuButton(400, 452, 'ランキング', () => goToRanking());
  }

  createMenuButton(centerX, centerY, label, onClick) {
    const glow = this.add.ellipse(centerX, centerY + 4, 280, 96, 0xffffff, 0.72);
    glow.setDepth(2);

    const button = this.add.graphics();
    button.fillStyle(0xfffdf7, 0.94);
    button.fillRoundedRect(centerX - 138, centerY - 42, 276, 84, 24);
    button.lineStyle(5, 0xf6a7c8, 1);
    button.strokeRoundedRect(centerX - 138, centerY - 42, 276, 84, 24);
    button.lineStyle(2, 0xa9ddf7, 0.95);
    button.strokeRoundedRect(centerX - 126, centerY - 31, 252, 62, 18);
    button.setDepth(3);

    const buttonText = this.add
      .text(centerX, centerY, label, {
        fontSize: label.length > 4 ? '40px' : '46px',
        color: '#7f6bae',
        fontFamily: "'Fredoka', 'Comic Sans MS', cursive, sans-serif",
        fontStyle: 'bold italic',
        stroke: '#ffffff',
        strokeThickness: 8,
      })
      .setOrigin(0.5)
      .setAngle(-5)
      .setDepth(4)
      .setShadow(3, 4, '#f6a7c8', 3, true, true);

    const hitArea = this.add.zone(centerX, centerY, 276, 84);
    hitArea
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true })
      .on('pointerover', () => {
        buttonText.setScale(1.06);
        glow.setAlpha(0.92);
      })
      .on('pointerout', () => {
        buttonText.setScale(1);
        glow.setAlpha(0.72);
      })
      .on('pointerdown', onClick);

    this.tweens.add({
      targets: [buttonText, glow],
      y: '-=8',
      duration: 1100,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
  }

}
