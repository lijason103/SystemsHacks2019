// Initalize
var config = {
    type: Phaser.AUTO,
    parent: 'phaser-example',
    width: 1000,
    height: 600,
    physics: {
      default: 'arcade',
      arcade: {
        debug: false,
        gravity: { y: 0 }
      }
    },
    scene: {
        preload: preload,
        create: create,
        update: update,
    },
};

var game = new Phaser.Game(config);

function preload() {
    // Load map tiles
    this.load.image('ground', 'assets/ground.png') // 2 types of grounds
    this.load.image('floor', 'assets/floor.png')
    this.load.image('wall', 'assets/wall.png')
    this.load.image('border', 'assets/border.png')
    this.load.image('corner', 'assets/Corner.png')
    this.load.image('corner_1', 'assets/corner_1.png')
    this.load.image('corner_2', 'assets/corner_2.png')
    this.load.image('corner_3', 'assets/corner_3.png')
    this.load.image('wall_horizontal', 'assets/wall_horizontal.png')


    // Load players
    this.load.spritesheet('player_0', 'assets/player_0.png', { frameWidth: 42.47, frameHeight: 55})
    this.load.spritesheet('player_1', 'assets/player_1.png', { frameWidth: 42.47, frameHeight: 55})
    this.load.spritesheet('player_2', 'assets/player_2.png', { frameWidth: 42.47, frameHeight: 55})
    this.load.spritesheet('player_3', 'assets/player_3.png', { frameWidth: 42.47, frameHeight: 55})

    // Load audio 
    this.load.audio('music', 'assets/music.ogg')

    // Variables
    this.players = []
    this.playerSprites = []
}

function create() {
    // Load animations
    this.anims.create({
        key: 'stand_0',
        frames: this.anims.generateFrameNumbers('player_0', { start: 16, end: 16 }),
        frameRate: 10,
        repeat: -1
    })

    this.sound.add('music').play()

    let sceneWidth = this.game.config.width
    let sceneHeight = this.game.config.height
    this.socket = io()
    this.socket.on('disconnect', id => {
        console.log(id, "Disconnected")
        // Remove player and player sprite
        let playerIndex = getPlayerIndex(this.players, id)
        if (playerIndex > -1) {
            this.playerSprites[playerIndex].destroy()
            this.players.splice(playerIndex, 1)
            this.playerSprites.splice(playerIndex, 1)
        }
    })

    this.socket.on('players', players => {
        this.players = players
        this.playerSprites = []
        for (let i = 0; i < this.players.length; ++i) {
            let player = this.players[i]
            renderPlayer(this, player)
        }
    })

    this.socket.on('newPlayer', player => {
        this.players.push(player)
        renderPlayer(this, player)
    })

    this.socket.on('map', map => {
        // Set the block size
        this.blockHeight = sceneHeight / map.length
        this.blockWidth = sceneWidth / map[0].length
        this.map = map
        renderMap(this)
        this.energyText = this.add.text(sceneWidth/2 - 75, 16, 'ENERGY = 0', { fontSize: '28pt', fill: '#ffffff', fontFamily: 'VT323'})
        this.restartText = this.add.text(16, 16, '', { fontSize: '28pt', fill: '#ffffff', fontFamily: 'VT323'})
    })

    // Handle player update from server
    this.socket.on('player_update', player => {
        let playerIndex = getPlayerIndex(this.players, player.id)
        if (playerIndex > -1) {
            this.players[playerIndex] = player
            let playerSprite = this.playerSprites[playerIndex]
            let x = calculateX(player.column, this.blockWidth)
            let y = calculateY(player.row, this.blockHeight)
            // TODO: Add dashing animation
            // playerSprite.x = calculateX(player.column, this.blockWidth)
            let tween = this.tweens.add({
                targets: playerSprite,
                x: x,               // '+=100'
                y: y,               // '+=100'
                ease: 'Linear',       // 'Cubic', 'Elastic', 'Bounce', 'Back'
                duration: 100,
            });
            if (player.isAlive) {
                playerSprite.alpha = 1
            }
        }
    })

    // Handle player died
    this.socket.on('player_died', player => {
        let playerIndex = getPlayerIndex(this.players, player.id)
        if (playerIndex > -1) {
            this.players[playerIndex] = player
            let playerSprite = this.playerSprites[playerIndex]
            // playerSprite.disableBody(true, true)
            let tween = this.tweens.add({
                targets: playerSprite,
                alpha: 0,
                ease: 'Linear',       // 'Cubic', 'Elastic', 'Bounce', 'Back'
                duration: 1000,
            });
            this.cameras.main.flash()
        }

    })
}

function update(time, delta) {
    let myPlayerIndex = getPlayerIndex(this.players, this.socket.id)
    // update energy
    if (myPlayerIndex > -1) {
        let myPlayer = this.players[myPlayerIndex]
        this.energyText.setText(`ENERGY: ${myPlayer.energy}`)
    }

    if (myPlayerIndex === 0 && this.restartText.text !== 'RESTART') {
        this.restartText.setText("RESTART")
        this.restartText.setInteractive()
        this.restartText.on('pointerdown', pointer => {
            this.socket.emit('restart')
        })
    }
}

function renderMap(scene) {
    let map = scene.map
    for (let row = 0; row < map.length; ++row) {
        for (let column = 0; column < map[row].length; ++column) {
            let x = column * scene.blockWidth + scene.blockWidth / 2
            let y = row * scene.blockHeight + scene.blockHeight / 2
            let tile = map[row][column]
            let image
            // render wall
            if (column === 0 && row === 0) {
                image = scene.add.sprite(x, y, 'corner')
            }
            else if (column === 0 && row === map.length-1) {
                image = scene.add.sprite(x, y, 'corner_3')
            }
            else if (column === map[0].length-1 && row === 0) {
                image = scene.add.sprite(x, y, 'corner_2')
            }
            else if (column === map[0].length-1 && row === map.length-1) {
                image = scene.add.sprite(x, y, 'corner_1')
            }
            else if (row === 0 && column !== 0 || row === 0 && column !== 14) {
                image = scene.add.sprite(x, y, 'wall_horizontal')
            }
            else if (row === 8 && column !== 0 || row === 8 && column !== 14) {
                image = scene.add.sprite(x, y, 'wall_horizontal')
            }
            else if (column === 0 && row !== 0 || column === 0 && row !== 8) {
                image = scene.add.sprite(x, y, 'border')
            }
            else if (column === 14 && row !== 0 || column === 14 && row !== 8) {
                image = scene.add.sprite(x, y, 'border')
            }
            else if (tile == 'w') {
                image = scene.add.sprite(x, y, 'wall')
            }
            // render floor
            else if (tile == 'e') {
                let randomizer = Math.random() * (5 - 1) + 1;
                if (randomizer > 2) {
                    image = scene.add.sprite(x, y, 'floor')
                }
                else {
                    image = scene.add.sprite(x, y, 'ground')
                }
            }

            if (image) {
                image.displayWidth = scene.blockWidth
                image.displayHeight = scene.blockHeight
                image.setInteractive()
                image.on('pointerdown', pointer => {
                    onTilePress(scene, pointer, row, column)
                })
            }
        }
    }    
}

function onTilePress(scene, pointer, row, column) {
    let playerIndex = getPlayerIndex(scene.players, scene.socket.id)
    if (playerIndex > -1) {
        let player = scene.players[playerIndex]
        // only try to move if the row == player's row or
        // column == player's column
        if (player.row === row && player === column) {
            // TODO: maybe do something?
        } else if (player.row === row) {   
            // send horizontal steps to server
            scene.socket.emit('player_move_horizontal', column - player.column)
        } else if (player.column === column) {
            // send vertical steps to server
            scene.socket.emit('player_move_vertical', row - player.row)
        }
    }
}

function renderPlayer(scene, player) {
    let x = calculateX(player.column, scene.blockWidth)
    let y = calculateX(player.row, scene.blockHeight)
    let sprite = scene.add.sprite(x, y, `player_0`)
    if (player.id !== scene.socket.id) {
        sprite.setTint(0xef5350)
    }
    scene.playerSprites.push(sprite)
    sprite.anims.play(`stand_0`)
    if (!player.isAlive) {
        sprite.alpha = 0
    }
}

function calculateX(column, blockWidth) {
    return column * blockWidth + blockWidth / 2
}

function calculateY(row, blockHeight) {
    return row * blockHeight + blockHeight / 2
}

function getPlayerIndex(players, id) {
    for (let i = 0; i < players.length; i++) {
        let player = players[i]
        if (player.id === id) {
            return i
        }
    }
    return -1
}