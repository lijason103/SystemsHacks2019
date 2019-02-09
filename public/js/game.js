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
}

function create() {
    this.socket = io()
    this.socket.on('disconnect', id => {
        // Remove player and player sprite
    })

    this.socket.on('map', map => {
        console.log(map)
        // Set the block size
        this.blockWidth = width / map[0].length
        this.blockHeight = height / map.length
        this.map = map
    })
    
}

function update(time, delta) {
}
