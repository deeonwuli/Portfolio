let game

// global game options
let gameOptions = {

  // platform speed range, in pixels per second
  platformSpeedRange: [300, 300],

  // mountain speed, in pixels per second
  mountainSpeed: 80,

  // spawn range, how far should be the rightmost platform from the right edge
  // before next platform spawns, in pixels
  spawnRange: [80, 300],

  // platform width range, in pixels
  platformSizeRange: [90, 300],

  // a height range between rightmost platform and next platform to be spawned
  platformHeightRange: [-5, 5],

  // a scale to be multiplied by platformHeightRange
  platformHeighScale: 20,

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

  // % of probability enemy appears on the platform
  enemyPercent: 25
}

window.onload = function () {
  // object containing configuration options
  let gameConfig = {
    type: Phaser.AUTO,
    width: 1334,
    height: 750,
    scene: [preloadGame, playGame],
    backgroundColor: 0x87CEFA,

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
    this.load.image('platform', 'assets/platform.png')

    // the enemy is a sprite sheet made by 24 by 48 pixels
    this.load.spritesheet('enemy', 'assets/enemy.png', {
      frameWidth: 24,
      frameHeight: 48
    })

    // player is a sprite sheet made by 24x48 pixels
    this.load.spritesheet('player', 'assets/player.png', {
      frameWidth: 24,
      frameHeight: 48
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
      key: 'run',
      frames: this.anims.generateFrameNumbers('enemy', {
        start: 0,
        end: 1
      }),
      frameRate: 8,
      repeat: -1
    })

    this.scene.start('PlayGame')
  }
}

// playGame scene
class playGame extends Phaser.Scene {
  constructor () {
    super('PlayGame')
  }

  create () {
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
      // once an enemy is removed, it's added to the pool
      removeCallback: function (enemy) {
        enemy.scene.enemyPool.add(enemy)
      }
    })

    // enemy pool
    this.enemyPool = this.add.group({
      // once an enemy is removed from the pool, it's added to the active enemy group
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

    // adding the enemy
    this.enemy = this.physics.add.sprite(gameOptions.playerStartPosition, game.config.height * 0.7, 'enemy')
    this.enemy.setGravityY(gameOptions.playerGravity)
    this.enemy.setDepth(2)

    // setting collisions between the player and the platform group
    this.platformCollider = this.physics.add.collider(this.player, this.platformGroup, function () {
      // play "run" animation if the player is on a platform
      if (!this.player.anims.isPlaying) {
        this.player.anims.play('run')
      }
    }, null, this)

    // setting collisions between the player and the coin group
    this.physics.add.overlap(this.player, this.coinGroup, function (player, coin) {
      this.tweens.add({
        targets: coin,
        y: coin.y - 100,
        alpha: 0,
        duration: 800,
        ease: 'Cubic.easeOut',
        callbackScope: this,
        onComplete: function () {
          this.coinGroup.killAndHide(coin)
          this.coinGroup.remove(coin)
        }
      })
    }, null, this)

    // setting collisions between the player and the enemy group
    this.platformCollider = this.physics.add.collider(this.enemy, this.player, function (player, enemy) {
      this.dying = true
      this.player.anims.stop()
      this.player.setFrame(2)
      this.player.setVelocityY(-200)
      this.physics.world.removeCollider(this.platformCollider)
    }, null, this)

    // checking for input
    this.input.on('pointerdown', this.jump, this)
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

  // the core of the script: platforms are added from the pool or created on the fly
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

    // is there a coin over the platform?
    if (this.addedPlatforms > 1) {
      if (Phaser.Math.Between(1, 100) <= gameOptions.coinPercent) {
        if (this.coinPool.getLength()) {
          let coin = this.coinPool.getFirst()
          coin.x = posX
          coin.y = posY - 96
          coin.alpha = 1
          coin.active = true
          coin.visible = true
          this.coinPool.remove(coin)
        } else {
          let coin = this.physics.add.sprite(posX, posY - 96, 'coin')
          coin.setImmovable(true)
          coin.setVelocityX(platform.body.velocity.x)
          coin.anims.play('rotate')
          coin.setDepth(2)
          this.coinGroup.add(coin)
        }
      }
    }

    // is there an enemy over the platform?
    if (Phaser.Math.Between(1, 100) <= gameOptions.percent) {
      if (this.enemyPool.getLength()) {
        let enemy = this.enemyPool.getFirst()
        enemy.x = posX - platformWidth / 2 + Phaser.Math.Between(1, platformWidth)
        enemy.y = posY - 46
        enemy.alpha = 1
        enemy.active = true
        this.enemyPool.remove(enemy)
      } else {
        let enemy = this.physics.add.image(posX - platformWidth / 2 + Phaser.Math.Between(1, platformWidth), posY - 46, 'enemy')
        enemy.setImmovable(true)
        enemy.setVelocityX(platform.body.velocity.x)
        enemy.setSize(8, 2, true)
        enemy.setDepth(2)
        this.enemyGroup.add(enemy)
      }
    }
  }

  // the player jumps when on the ground, or once in the air as long as there are jumps left and the first jump was on the ground
  jump () {
    if((!this.dying) &amp;&amp; (this.player.body.touching.down || (this.playerJumps > 0 &amp;&amp; this.playerJumps < gameOptions.jumps))){
    //if (this.player.body.touching.down || (this.playerJumps > 0 && this.playerJumps < gameOptions.jumps)) {
      if (this.player.body.touching.down) {
        this.playerJumps = 0
      }
      this.player.setVelocityY(gameOptions.jumpForce * -1)
      this.playerJumps++

      // stops animation
      this.player.anims.stop()
    }
  }

  update () {
    // game over
    if (this.player.y > game.config.height) {
      alert('Game over')
      this.scene.start('PlayGame')
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

    // recycling enemies
    this.enemyGroup.getChildren().forEach(function (enemy) {
      if (enemy.x < -enemy.displayWidth / 2) {
        this.enemyGroup.killAndHide(enemy)
        this.enemyGroup.remove(enemy)
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

    // adding new platforms
    if (minDistance > this.nextPlatformDistance) {
      let nextPlatformWidth = Phaser.Math.Between(gameOptions.platformSizeRange[0], gameOptions.platformSizeRange[1])
      let platformRandomHeight = gameOptions.platformHeighScale * Phaser.Math.Between(gameOptions.platformHeightRange[0], gameOptions.platformHeightRange[1])
      let nextPlatformGap = rightmostPlatformHeight + platformRandomHeight
      let minPlatformHeight = game.config.height * gameOptions.platformVerticalLimit[0]
      let maxPlatformHeight = game.config.height * gameOptions.platformVerticalLimit[1]
      let nextPlatformHeight = Phaser.Math.Clamp(nextPlatformGap, minPlatformHeight, maxPlatformHeight)
      this.addPlatform(nextPlatformWidth, game.config.width + nextPlatformWidth / 2, nextPlatformHeight)
    }
  }
}

function resize () {fp
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
