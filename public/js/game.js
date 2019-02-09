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
    }
};

var game = new Phaser.Game(config);

function preload() {
    // Load map tiles
    this.load.image('ground', 'assets/ground.png')
    this.load.image('wall', 'assets/wall.png')

    // Load players
}

function create() {
    let sceneWidth = this.game.config.width
    let sceneHeight = this.game.config.height
    this.socket = io()
    this.socket.on('disconnect', id => {
        // Remove player and player sprite
    })

    this.socket.on('map', map => {
        // Set the block size
        this.blockHeight = sceneHeight / map.length
        this.blockWidth = sceneWidth / map[0].length
        this.map = map
        renderMap(this)
    })
}

function update(time, delta) {
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
            if (tile == 'w') {
                image = scene.add.sprite(x, y, 'wall')
                image.displayWidth = scene.blockWidth
                image.displayHeight = scene.blockHeight
            }
            // render floor
            if (tile == 'e') {
                image = scene.add.sprite(x, y, 'ground')
                image.displayWidth = scene.blockWidth
                image.displayHeight = scene.blockHeight
            }
        }
    }    
}

