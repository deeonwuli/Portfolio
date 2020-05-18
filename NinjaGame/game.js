let game
let score = 0
let scoreText
let name = ''
console.log(put(getCookie('username'), getCookie('score')))

// document.cookie = 'username='

// global game options
let gameOptions = {
  // platform speed range, in pixels per second
  platformSpeedRange: [400, 400],

  // enemy speed, in pixels per second
  enemySpeed: 40,

  // mountain speed, in pixels per second
  mountainSpeed: 80,

  // spawn range, how far should be the rightmost platform from the right edge before next platform spawns, in pixels
  spawnRange: [80, 200],

  // platform width range, in pixels
  platformSizeRange: [250, 500],

  // a height range between rightmost platform and next platform to be spawned
  platformHeightRange: [-5, 5],

  // a scale to be multiplied by platformHeightRange
  platformHeightScale: 20,

  // platform max and min height, as screen height ratio
  platformVerticalLimit: [0.4, 0.8],

  // player gravity
  playerGravity: 900,

  // player jump force
  jumpForce: 400,

  // player starting X position
  playerStartPosition: 200,

  // consecutive jumps allowed
  jumps: 2,

  // % of probability a coin appears on the platform
  coinPercent: 25,

  // % of probability an enemy appears on the platform
  enemyPercent: 25
}

window.onload = function () {
  // object containing configuration options
  let gameConfig = {
    type: Phaser.AUTO,
    width: 1334,
    height: 750,
    scene: [preloadGame, titleScreen, nameScreen, storyScreen, playGame, GameOver, Starfield, Highscore, InputPanel],
    pixelArt: true,
    // physics settings
    physics: {
      default: 'arcade'
    }
  }
  game = new Phaser.Game(gameConfig)
  window.focus()
  resize()
  window.addEventListener('resize', resize, false)
}

// preloadGame scene
class preloadGame extends Phaser.Scene {
  constructor () {
    super('PreloadGame')
  }

  preload () {
    // this.load.image('background', 'assets/background.jpg')

    // platform is a tile sprite
    this.load.image('platform', 'assets/platform.png')

    // player is a sprite sheet made by 50x69 pixels
    this.load.spritesheet('player', 'assets/player.png', {
      frameWidth: 50,
      frameHeight: 60
    })

    // enemy is a sprite sheet made by 49.5x48 pixels
    this.load.spritesheet('enemy', 'assets/enemy.png', {
      frameWidth: 49.5,
      frameHeight: 59
    })

    // the coin is a sprite sheet made by 20x20 pixels
    this.load.spritesheet('coin', 'assets/coin.png', {
      frameWidth: 20,
      frameHeight: 20
    })

    // mountains are a sprite sheet made by 512x512 pixels
    this.load.spritesheet('mountain', 'assets/mountain.png', {
      frameWidth: 512,
      frameHeight: 512
    })
  }

  create () {
    // setting player animation
    this.anims.create({
      key: 'run',
      frames: this.anims.generateFrameNumbers('player', {
        start: 0,
        end: 1
      }),
      frameRate: 8,
      repeat: -1
    })

    // setting coin animation
    this.anims.create({
      key: 'rotate',
      frames: this.anims.generateFrameNumbers('coin', {
        start: 0,
        end: 5
      }),
      frameRate: 15,
      yoyo: true,
      repeat: -1
    })

    // setting enemy animation
    this.anims.create({
      key: 'jog',
      frames: this.anims.generateFrameNumbers('enemy', {
        start: 0,
        end: 1
      }),
      frameRate: 8,
      repeat: -1
    })

    this.scene.start('TitleScreen')
  }
}

// title screen
class titleScreen extends Phaser.Scene {
  constructor () {
    super('TitleScreen')
  }

  preload () {
    this.load.image('background', 'assets/titleback.png')
    this.load.image('title', 'assets/penguinja.png')
    this.load.image('start', 'assets/start.png')
    this.load.image('leaderboard', 'assets/leaderboard.png')
    this.load.bitmapFont('arcade', 'assets/arcade.png', 'assets/arcade.xml')
  }

  create () {
    let back = this.add.image(180, 100, 'background').setOrigin(0, 0)
    let ttl = this.add.image(260, 240, 'title').setOrigin(0, 0)
    ttl.setScale(3)

    // Buttons
    let lb = this.add.image(750, 550, 'leaderboard').setOrigin(0)
    let st = this.add.image(300, 550, 'start').setOrigin(0)

    lb.setInteractive({ useHandCursor: true })
    st.setInteractive({ useHandCursor: true })

    lb.on('pointerdown', () => this.clickLeaderboard())
    st.on('pointerdown', () => this.clickStart())

    if (checkLandscape() === false && isMobileDevice() === true) {
      let overlay = this.add.image(180, 100, 'background').setOrigin(0, 0)
      let text = this.add.bitmapText(260, 280, 'arcade', 'Please switch \nyour mobile device \nto Landscape and \nreload the game.').setTint(0xffffff)
      text.setScale(1.5)
    }
  }

  clickLeaderboard () {
    this.scene.start('Highscore')
    this.scene.launch('Starfield')
  }

  clickStart () {
    if (getCookie('username') === '') {
      this.scene.switch('NameScreen')
      score = 0
    } else {
      this.scene.switch('StoryScreen')
      score = 0
    }
  }
}

// name screen for database
class nameScreen extends Phaser.Scene {
  constructor () {
    super('NameScreen')
  }

  preload () {
    this.load.image('background', 'assets/titleback.png')
    this.load.image('block', 'assets/block.png')
    this.load.image('rub', 'assets/rub.png')
    this.load.image('end', 'assets/end.png')
    this.load.bitmapFont('arcade', 'assets/arcade.png', 'assets/arcade.xml')
  }

  create () {
    let back = this.add.image(180, 100, 'background').setOrigin(0, 0)
    let enter = this.add.bitmapText(300, 200, 'arcade', 'Enter your name: ').setTint(0xffffff)
    enter.setScale(1.5)

    let sub = this.add.bitmapText(500, 260, 'arcade', '(in 3 characters) ').setTint(0xffffff)
    sub.setScale(0.7)

    this.playerText = this.add.bitmapText(570, 300, 'arcade', '').setTint(0xffffff)
    this.playerText.setScale(2)

    this.input.keyboard.enabled = true

    this.scene.launch('InputPanel')
    let panel = this.scene.get('InputPanel')

    //  Listen to events from the Input Panel scene
    panel.events.on('updateName', this.updateName, this)
    panel.events.on('submitName', this.submitName, this)
  }

  submitName () {
    this.scene.switch('StoryScreen')
    this.scene.stop('InputPanel')
    name = this.playerText.text
    document.cookie = `username=${name}`
    post(getCookie('username'), 0)
  }

  updateName (name) {
    this.playerText.setText(name)
  }
}

// story screen
class storyScreen extends Phaser.Scene {
  constructor () {
    super('StoryScreen')
    this.name
  }

  preload () {
    this.load.image('back', 'assets/background.jpg')
    this.load.image('skip', 'assets/skipnstart.png')
    this.load.bitmapFont('arcade', 'assets/arcade.png', 'assets/arcade.xml')
  }

  create () {
    let back = this.add.image(180, 100, 'background').setOrigin(0, 0)
    this.loop()

    let skip = this.add.image(760, 630, 'skip').setOrigin(0)
    skip.setInteractive({ useHandCursor: true })
    skip.on('pointerdown', () => this.clickSkip())
  }

  clickSkip () {
    this.scene.switch('PlayGame')
  }

  loop () {
    let storyText = this.add.text(700, 400, '', { font: '40px Courier', fill: '#ffffff', align: 'center' }).setOrigin(0.5)
    let story = 'Welcome ' + getCookie('username') + ',\n to the world of Penguinja. \n After many years of training, \na penguin, Penguinja, \nis attempting to get away from \nthe Ninja Academy. \nHe faces adversaries, \nhis former comrades, and \nmust collect rewards \nin his bid to get away. \n Just tap to help him escape.'
    let writtenString = ''
    let i = 0
    this.time.addEvent({
      delay: 70,
      callback: () => {
        if (i < story.length) {
          writtenString += story.charAt(i)
          storyText.setText(writtenString)
          i++
        }
      },
      loop: true
    })
  }
}

// playGame scene
class playGame extends Phaser.Scene {
  constructor () {
    super('PlayGame')
  }

  preload () {
    this.load.image('score', 'assets/score.png')
    this.load.image('high', 'assets/highscore.png')
    this.load.bitmapFont('arcade', 'assets/arcade.png', 'assets/arcade.xml')
  }

  create () {
    this.scene.stop('Starfield')
    this.scene.stop('InputPanel')
    this.scene.stop('Highscore')

    // group with all active mountains.
    this.mountainGroup = this.add.group()

    // group with all active platforms.
    this.platformGroup = this.add.group({
      // once a platform is removed, it's added to the pool
      removeCallback: function (platform) {
        platform.scene.platformPool.add(platform)
      }
    })

    // platform pool
    this.platformPool = this.add.group({
      // once a platform is removed from the pool, it's added to the active platforms group
      removeCallback: function (platform) {
        platform.scene.platformGroup.add(platform)
      }
    })

    // group with all active coins.
    this.coinGroup = this.add.group({
      // once a coin is removed, it's added to the pool
      removeCallback: function (coin) {
        coin.scene.coinPool.add(coin)
      }
    })

    // coin pool
    this.coinPool = this.add.group({
      // once a coin is removed from the pool, it's added to the active coins group
      removeCallback: function (coin) {
        coin.scene.coinGroup.add(coin)
      }
    })

    // group with all active enemies
    this.enemyGroup = this.add.group({
      // once an ememy is removed, it is added to the group
      removeCallback: function (enemy) {
        enemy.scene.enemyPool.add(enemy)
      }
    })

    // enemy pool
    this.enemyPool = this.add.group({
      // once an ememy is removed from the pool, it is added to the active coin group
      removeCallback: function (enemy) {
        enemy.scene.enemyGroup.add(enemy)
      }
    })

    // adding a mountain
    this.addMountains()

    // keeping track of added platforms
    this.addedPlatforms = 0

    // number of consecutive jumps made by the player so far
    this.playerJumps = 0

    // adding a platform to the game, the arguments are platform width, x position and y position
    this.addPlatform(game.config.width, game.config.width / 2, game.config.height * gameOptions.platformVerticalLimit[1])

    // adding the player
    this.player = this.physics.add.sprite(gameOptions.playerStartPosition, game.config.height * 0.7, 'player')
    this.player.setGravityY(gameOptions.playerGravity)
    this.player.setDepth(2)

    // the player is not dying
    this.dying = false

    // setting collisions between the player and the platform group
    this.platformCollider = this.physics.add.collider(this.player, this.platformGroup, function () {
      // play "run" animation if the player is on a platform
      if (!this.player.anims.isPlaying) {
        this.player.anims.play('run')
      } else {
        score += 0.05
        scoreText.setText(Math.round(score))
      }
    }, null, this)

    // setting collisions between the player and the coin group
    this.physics.add.collider(this.player, this.coinGroup, function (player, coin) {
      this.tweens.add({
        targets: coin,
        y: coin.y - 100,
        alpha: 0,
        duration: 800,
        ease: 'Cubic.easeOut',
        callbackScope: this,
        onComplete: function () {
          score += 5
          this.coinGroup.killAndHide(coin)
          this.coinGroup.remove(coin)
          scoreText.setText(Math.round(score))
        }
      })
    }, null, this)

    // setting collisions between the player and the enemy
    this.physics.add.collider(this.player, this.enemyGroup, function (player, enemy) {
      this.dying = true
      this.player.anims.stop()
      this.player.setFrame(2)
      this.player.body.setVelocityY(-200)
      this.physics.world.removeCollider(this.platformCollider)
    }, null, this)

    // checking for input
    this.input.on('pointerdown', this.jump, this)
    this.input.keyboard.on('keyup_SPACE', this.jump, this)

    let txt = this.add.image(25, 25, 'score').setOrigin(0, 0)
    scoreText = this.add.bitmapText(220, 15, 'arcade', Math.round(score)).setTint(0xffffff)
    scoreText.setScale(1.3)
    scoreText.setScrollFactor(0)
    let highScore = this.add.image(830, 25, 'high').setOrigin(0, 0)
    let highText = this.add.bitmapText(1180, 15, 'arcade', getCookie('score'))
    highText.setScale(1.3)
  }

  // adding mountains
  addMountains () {
    let rightmostMountain = this.getRightmostMountain()
    if (rightmostMountain < game.config.width * 2) {
      let mountain = this.physics.add.sprite(rightmostMountain + Phaser.Math.Between(100, 350), game.config.height + Phaser.Math.Between(0, 100), 'mountain')
      mountain.setOrigin(0.5, 1)
      mountain.body.setVelocityX(gameOptions.mountainSpeed * -1)
      this.mountainGroup.add(mountain)
      if (Phaser.Math.Between(0, 1)) {
        mountain.setDepth(1)
      }
      mountain.setFrame(Phaser.Math.Between(0, 3))
      this.addMountains()
    }
  }

  // getting rightmost mountain x position
  getRightmostMountain () {
    let rightmostMountain = -200
    this.mountainGroup.getChildren().forEach(function (mountain) {
      rightmostMountain = Math.max(rightmostMountain, mountain.x)
    })
    return rightmostMountain
  }

  // the core of the script: platform are added from the pool or created on the fly
  addPlatform (platformWidth, posX, posY) {
    this.addedPlatforms++
    let platform
    if (this.platformPool.getLength()) {
      platform = this.platformPool.getFirst()
      platform.x = posX
      platform.y = posY
      platform.active = true
      platform.visible = true
      this.platformPool.remove(platform)
      let newRatio = platformWidth / platform.displayWidth
      platform.displayWidth = platformWidth
      platform.tileScaleX = 1 / platform.scaleX
    } else {
      platform = this.add.tileSprite(posX, posY, platformWidth, 32, 'platform')
      this.physics.add.existing(platform)
      platform.body.setImmovable(true)
      platform.body.setVelocityX(Phaser.Math.Between(gameOptions.platformSpeedRange[0], gameOptions.platformSpeedRange[1]) * -1)
      platform.setDepth(2)
      this.platformGroup.add(platform)
    }
    this.nextPlatformDistance = Phaser.Math.Between(gameOptions.spawnRange[0], gameOptions.spawnRange[1])

    // if this is not the starting platform
    if (this.addedPlatforms > 1) {
      // is there a coin over the platform?
      if (Phaser.Math.Between(1, 100) <= gameOptions.coinPercent) {
        if (this.coinPool.getLength()) {
          let coin = this.coinPool.getFirst()
          coin.x = posX
          coin.y = posY - 75
          coin.alpha = 1
          coin.active = true
          coin.visible = true
          this.coinPool.remove(coin)
        } else {
          let coin = this.physics.add.sprite(posX, posY - 75, 'coin')
          coin.setImmovable(true)
          coin.setVelocityX(platform.body.velocity.x)
          coin.anims.play('rotate')
          coin.setDepth(2)
          this.coinGroup.add(coin)
        }
      }

      // is there an enemy over the platform?
      if (Phaser.Math.Between(1, 100) <= gameOptions.enemyPercent) {
        if (this.enemyPool.getLength()) {
          let enemy = this.enemyPool.getFirst()
          // enemy.setVelocityX(gameOptions.enemySpeed * -0.5)
          enemy.x = posX - platformWidth / 2 + Phaser.Math.Between(1, platformWidth)
          enemy.y = posY - 50
          enemy.alpha = 1
          enemy.active = true
          enemy.visible = true
          this.enemyPool.remove(enemy)
        } else {
          let enemy = this.physics.add.sprite(posX - platformWidth / 2 + Phaser.Math.Between(1, platformWidth), posY - 50, 'enemy')
          enemy.setVelocityX(platform.body.velocity.x)
          enemy.setImmovable(true)
          enemy.anims.play('jog')
          enemy.setDepth(2)
          this.enemyGroup.add(enemy)
        }
      }
    }
  }

  // the player jumps when on the ground, or once in the air as long as there are jumps left and the first jump was on the ground
  jump () {
    if (this.player.body.touching.down || (this.playerJumps > 0 && this.playerJumps < gameOptions.jumps)) {
      if (this.player.body.touching.down) {
        this.playerJumps = 0
      }
      this.player.setVelocityY(gameOptions.jumpForce * -1)
      this.playerJumps++

      // stops animation
      this.player.anims.stop()
    }
  }

  showGameOver () {
    if (score > getCookie('score')) {
      document.cookie = `score=${Math.round(score)}`
      put(getCookie('username'), getCookie('score'))
    }
    this.scene.start('GameOver', { score: this.score })
  }

  update () {
    // game over
    if (this.player.y > game.config.height) {
      this.time.addEvent({
        delay: 1000,
        callback: this.showGameOver,
        callbackScope: this
      })
    }
    this.player.x = gameOptions.playerStartPosition

    // recycling platforms
    let minDistance = game.config.width
    let rightmostPlatformHeight = 0
    this.platformGroup.getChildren().forEach(function (platform) {
      let platformDistance = game.config.width - platform.x - platform.displayWidth / 2
      if (platformDistance < minDistance) {
        minDistance = platformDistance
        rightmostPlatformHeight = platform.y
      }
      if (platform.x < -platform.displayWidth / 2) {
        this.platformGroup.killAndHide(platform)
        this.platformGroup.remove(platform)
      }
    }, this)

    // recycling coins
    this.coinGroup.getChildren().forEach(function (coin) {
      if (coin.x < -coin.displayWidth / 2) {
        this.coinGroup.killAndHide(coin)
        this.coinGroup.remove(coin)
      }
    }, this)

    // recycling mountains
    this.mountainGroup.getChildren().forEach(function (mountain) {
      if (mountain.x < -mountain.displayWidth) {
        let rightmostMountain = this.getRightmostMountain()
        mountain.x = rightmostMountain + Phaser.Math.Between(100, 350)
        mountain.y = game.config.height + Phaser.Math.Between(0, 100)
        mountain.setFrame(Phaser.Math.Between(0, 3))
        if (Phaser.Math.Between(0, 1)) {
          mountain.setDepth(1)
        }
      }
    }, this)

    // recycling enemies
    this.enemyGroup.getChildren().forEach(function (enemy) {
      if (enemy.x < -enemy.displayWidth / 2) {
        this.enemyGroup.killAndHide(enemy)
        this.enemyGroup.remove(enemy)
      }
    }, this)

    // adding new platforms
    if (minDistance > this.nextPlatformDistance) {
      let nextPlatformWidth = Phaser.Math.Between(gameOptions.platformSizeRange[0], gameOptions.platformSizeRange[1])
      let platformRandomHeight = gameOptions.platformHeightScale * Phaser.Math.Between(gameOptions.platformHeightRange[0], gameOptions.platformHeightRange[1])
      let nextPlatformGap = rightmostPlatformHeight + platformRandomHeight
      let minPlatformHeight = game.config.height * gameOptions.platformVerticalLimit[0]
      let maxPlatformHeight = game.config.height * gameOptions.platformVerticalLimit[1]
      let nextPlatformHeight = Phaser.Math.Clamp(nextPlatformGap, minPlatformHeight, maxPlatformHeight)
      this.addPlatform(nextPlatformWidth, game.config.width + nextPlatformWidth / 2, nextPlatformHeight)
    }
  }
}

class GameOver extends Phaser.Scene {
  constructor () {
    super({
      key: 'GameOver',
      active: false
    })
  }

  init (data) {
    this.score = data.score
    this.config = this.sys.game.config
  }

  preload () {
    this.load.image('gameover', 'assets/gameover.png')
    this.load.image('score', 'assets/score.png')
    this.load.image('background', 'assets/over.png')
    this.load.image('leaderboard', 'assets/leaderboard.png')
    this.load.image('tryAgain', 'assets/tryagain.png')
    this.load.bitmapFont('arcade', 'assets/arcade.png', 'assets/arcade.xml')
  }

  create () {
    // background
    let bg = this.add.image(150, 100, 'background').setOrigin(0)

    // Title
    let title = this.add.image(300, 200, 'gameover').setOrigin(0, 0)
    title.setScale(2.5)

    // score text
    let txt_score = this.add.image(350, 350, 'score').setOrigin(0, 0)
    txt_score.setScale(2)

    // score
    let scores = this.add.bitmapText(730, 345, 'arcade', Math.round(score)).setTint(0xffffff)
    scores.setScale(2)

    // Buttons
    let lb = this.add.image(650, 500, 'leaderboard').setOrigin(0)
    let ta = this.add.image(300, 500, 'tryAgain').setOrigin(0)

    lb.setInteractive({ useHandCursor: true })
    ta.setInteractive({ useHandCursor: true })

    lb.on('pointerdown', () => this.clickLeaderboard())
    ta.on('pointerdown', () => this.clickTryAgain())
  }

  clickLeaderboard () {
    this.scene.start('Highscore')
    this.scene.launch('Starfield')
  }

  clickTryAgain () {
    this.scene.switch('PlayGame')
    score = 0
  }
}

function resize () {
  let canvas = document.querySelector('canvas')
  let windowWidth = window.innerWidth
  let windowHeight = window.innerHeight
  let windowRatio = windowWidth / windowHeight
  let gameRatio = game.config.width / game.config.height
  if (windowRatio < gameRatio) {
    canvas.style.width = windowWidth + 'px'
    canvas.style.height = (windowWidth / gameRatio) + 'px'
  } else {
    canvas.style.width = (windowHeight * gameRatio) + 'px'
    canvas.style.height = windowHeight + 'px'
  }
}

function isMobileDevice () {
  return (typeof window.orientation !== 'undefined') || (navigator.userAgent.indexOf('IEMobile') !== -1)
}

function checkLandscape () {
  if (window.innerWidth > window.innerHeight) {
    return true
  } else {
    return false
  }
}

class InputPanel extends Phaser.Scene {
  constructor () {
    super({
      key: 'InputPanel',
      active: false
    })
    this.chars = [
      [ 'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J' ],
      [ 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T' ],
      [ 'U', 'V', 'W', 'X', 'Y', 'Z', '.', '-', '<', '>' ]
    ]
    this.cursor = new Phaser.Math.Vector2()

    this.text
    this.block

    this.name = ''
    this.charLimit = 3
  }

  create () {
    let text = this.add.bitmapText(400, 400, 'arcade', 'ABCDEFGHIJ\n\nKLMNOPQRST\n\nUVWXYZ.-')

    text.setLetterSpacing(20)
    text.setInteractive()

    this.add.image(text.x + 430, text.y + 148, 'rub')
    this.add.image(text.x + 482, text.y + 148, 'end')

    this.block = this.add.image(text.x - 10, text.y - 2, 'block').setOrigin(0)

    this.text = text

    this.input.keyboard.on('keyup_LEFT', this.moveLeft, this)
    this.input.keyboard.on('keyup_RIGHT', this.moveRight, this)
    this.input.keyboard.on('keyup_UP', this.moveUp, this)
    this.input.keyboard.on('keyup_DOWN', this.moveDown, this)
    this.input.keyboard.on('keyup_ENTER', this.pressKey, this)
    this.input.keyboard.on('keyup_SPACE', this.pressKey, this)
    this.input.keyboard.on('keyup', this.anyKey, this)

    text.on('pointermove', this.moveBlock, this)
    text.on('pointerup', this.pressKey, this)

    this.tweens.add({
      targets: this.block,
      alpha: 0.2,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
      duration: 350
    })
  }

  moveBlock (pointer, x, y) {
    let cx = Phaser.Math.Snap.Floor(x, 52, 0, true)
    let cy = Phaser.Math.Snap.Floor(y, 64, 0, true)
    let char = this.chars[cy][cx]

    this.cursor.set(cx, cy)

    this.block.x = this.text.x - 10 + (cx * 52)
    this.block.y = this.text.y - 2 + (cy * 64)
  }

  moveLeft () {
    if (this.cursor.x > 0) {
      this.cursor.x--
      this.block.x -= 52
    } else {
      this.cursor.x = 9
      this.block.x += 52 * 9
    }
  }

  moveRight () {
    if (this.cursor.x < 9) {
      this.cursor.x++
      this.block.x += 52
    } else {
      this.cursor.x = 0
      this.block.x -= 52 * 9
    }
  }

  moveUp () {
    if (this.cursor.y > 0) {
      this.cursor.y--
      this.block.y -= 64
    } else {
      this.cursor.y = 2
      this.block.y += 64 * 2
    }
  }

  moveDown () {
    if (this.cursor.y < 2) {
      this.cursor.y++
      this.block.y += 64
    } else {
      this.cursor.y = 0
      this.block.y -= 64 * 2
    }
  }

  anyKey (event) {
    //  Only allow A-Z . and -
    let code = event.keyCode
    if (code === Phaser.Input.Keyboard.KeyCodes.PERIOD) {
      this.cursor.set(6, 2)
      this.pressKey()
    } else if (code === Phaser.Input.Keyboard.KeyCodes.MINUS) {
      this.cursor.set(7, 2)
      this.pressKey()
    } else if (code === Phaser.Input.Keyboard.KeyCodes.BACKSPACE || code === Phaser.Input.Keyboard.KeyCodes.DELETE) {
      this.cursor.set(8, 2)
      this.pressKey()
    } else if (code === Phaser.Input.Keyboard.KeyCodes.ENTER) {
      this.cursor.set(9, 2)
      this.pressKey()
    } else if (code >= Phaser.Input.Keyboard.KeyCodes.A && code <= Phaser.Input.Keyboard.KeyCodes.Z) {
      code -= 65

      let y = Math.floor(code / 10)
      let x = code - (y * 10)

      this.cursor.set(x, y)
      this.pressKey()
    }
  }

  pressKey () {
    let x = this.cursor.x
    let y = this.cursor.y
    let nameLength = this.name.length

    this.block.x = this.text.x - 10 + (x * 52)
    this.block.y = this.text.y - 2 + (y * 64)

    if (x === 9 && y === 2 && nameLength > 0) {
      //  Submit
      this.events.emit('submitName', this.name)
    } else if (x === 8 && y === 2 && nameLength > 0) {
      //  Rub
      this.name = this.name.substr(0, nameLength - 1)

      this.events.emit('updateName', this.name)
    } else if (this.name.length < this.charLimit) {
      //  Add
      this.name = this.name.concat(this.chars[y][x])

      this.events.emit('updateName', this.name)
    }
  }
}

class Starfield extends Phaser.Scene {
  constructor () {
    super({
      key: 'Starfield',
      active: true
    })

    this.stars

    this.distance = 300
    this.speed = 250

    this.max = 500
    this.xx = []
    this.yy = []
    this.zz = []
  }

  preload () {
    this.load.image('star', 'assets/star.png')
  }

  create () {
    //  Do this, otherwise this Scene will steal all keyboard input
    this.input.keyboard.enabled = false

    this.stars = this.add.blitter(150, 150, 'star')

    for (let i = 0; i < this.max; i++) {
      this.xx[i] = Math.floor(Math.random() * 800) - 400
      this.yy[i] = Math.floor(Math.random() * 600) - 300
      this.zz[i] = Math.floor(Math.random() * 1700) - 100

      let perspective = this.distance / (this.distance - this.zz[i])
      let x = 400 + this.xx[i] * perspective
      let y = 300 + this.yy[i] * perspective

      this.stars.create(x, y)
    }
  }

  update (time, delta) {
    for (let i = 0; i < this.max; i++) {
      let perspective = this.distance / (this.distance - this.zz[i])
      let x = 400 + this.xx[i] * perspective
      let y = 300 + this.yy[i] * perspective

      this.zz[i] += this.speed * (delta / 1000)

      if (this.zz[i] > 300) {
        this.zz[i] -= 600
      }

      let bob = this.stars.children.list[i]

      bob.x = x
      bob.y = y
    }
  }
}

class Highscore extends Phaser.Scene {
  constructor () {
    super({
      key: 'Highscore',
      active: false
    })
    this.playerText
  }

  preload () {
    this.load.image('block', 'assets/block.png')
    this.load.image('rub', 'assets/rub.png')
    this.load.image('end', 'assets/end.png')

    this.load.bitmapFont('arcade', 'assets/arcade.png', 'assets/arcade.xml')
  }

  create () {
    this.add.bitmapText(350, 350, 'arcade', 'RANK  SCORE   NAME').setTint(0xff00ff)
    this.add.bitmapText(350, 400, 'arcade', '1ST   ' + Math.round(score)).setTint(0xff0000)

    this.playerText = this.add.bitmapText(830, 400, 'arcade', '').setTint(0xff0000)

    //  Do this, otherwise this Scene will steal all keyboard input
    this.input.keyboard.enabled = true

    this.scene.launch('InputPanel')

    let panel = this.scene.get('InputPanel')

    //  Listen to events from the Input Panel scene
    panel.events.on('updateName', this.updateName, this)
    panel.events.on('submitName', this.submitName, this)
  }

  submitName () {
    this.scene.stop('InputPanel')

    this.add.bitmapText(350, 450, 'arcade', '2ND   40000    ANT').setTint(0xff8200)
    this.add.bitmapText(350, 500, 'arcade', '3RD   30000    .-.').setTint(0xffff00)
    this.add.bitmapText(350, 550, 'arcade', '4TH   20000    BOB').setTint(0x00ff00)
    this.add.bitmapText(350, 600, 'arcade', '5TH   10000    ZIK').setTint(0x00bfff)
  }

  updateName (name) {
    this.playerText.setText(name)
  }
}

function getCookie (cname) {
  var name = cname + '='
  var decodedCookie = decodeURIComponent(document.cookie)
  var ca = decodedCookie.split(';')
  for (var i = 0; i < ca.length; i++) {
    var c = ca[i]
    while (c.charAt(0) === ' ') {
      c = c.substring(1)
    }
    if (c.indexOf(name) === 0) {
      return c.substring(name.length, c.length)
    }
  }
  return ''
}

function get () {
  fetch('https://penguinjaleaderboard-a704.restdb.io/rest/score', {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'x-apikey': '5e9e2bed436377171a0c267d'
    }
  }).then(function (response) {
  // The API call was successful!
    if (response.ok) {
      return response.json()
    } else {
      return Promise.reject(response)
    }
  }).then(function (data) {
  // This is the JSON from our response
    console.log('I was here')
    console.log(data)
  }).catch(function (err) {
  // There was an error
    console.warn('Something really went wrong.', err)
  })
}

function post (name, score) {
  let data = { name: name, score: score }
  fetch('https://penguinjaleaderboard-a704.restdb.io/rest/score', {
    method: 'POST',
    body: JSON.stringify(data),
    headers: {
      'Content-Type': 'application/json',
      'x-apikey': '5e9e2bed436377171a0c267d'
    },
    referrer: 'no-referrer'
  }).then(function (response) {
    // The API call was successful!
    if (response.ok) {
      return response.json()
    } else {
      return Promise.reject(response)
    }
  }).then(function (data) {
    document.cookie = `id=${data._id}`
    // This is the JSON from our response
    console.log('Dumebi is cool')
    console.log(data)
  }).catch(function (err) {
    // There was an error
    console.warn('Something went wrong.', err)
  })
}

function put (name, score) {
  let data = { name: name, score: score }
  fetch('https://penguinjaleaderboard-a704.restdb.io/rest/score/' + getCookie('id'), {
    method: 'PUT',
    body: JSON.stringify(data),
    headers: {
      'Content-Type': 'dapplication/json',
      'x-apikey': '5e9e2bed436377171a0c267d'
    }
  }).then(function (response) {
  // The API call was successful!
    if (response.ok) {
      return response.json()
    } else {
      return Promise.reject(response)
    }
  }).then(function (data) {
  // This is the JSON from our response
    console.log('I was here')
    console.log(data)
  }).catch(function (err) {
  // There was an error
    console.warn('Something really went wrong.', err)
  })
}
