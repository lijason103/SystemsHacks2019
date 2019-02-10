// Setup connections

/*
* Two protocols: players move horizontal & vertical
* Allow player to join
*/
var express = require('express');
var app = express();
var server = require('http').Server(app);

app.use(express.static(__dirname + '/public'));

app.get('/', function (req, res) {
  res.sendFile(__dirname + '/index.html');
});

var io = require('socket.io').listen(server);

const MAX_ENERGY = 20;
var players = [];
var map = [ ['w', 'w', 'w', 'w', 'w', 'w', 'w', 'w', 'w', 'w', 'w', 'w', 'w', 'w', 'w'],
            ['w', 'e', 'e', 'w', 'e', 'e', 'w', 'e', 'w', 'e', 'e', 'w', 'e', 'e', 'w'],
            ['w', 'e', 'e', 'e', 'e', 'e', 'e', 'e', 'e', 'e', 'e', 'e', 'e', 'e', 'w'],
            ['w', 'e', 'w', 'e', 'w', 'e', 'e', 'e', 'e', 'e', 'w', 'e', 'w', 'e', 'w'],
            ['w', 'w', 'e', 'e', 'e', 'e', 'w', 'e', 'w', 'e', 'e', 'e', 'e', 'w', 'w'],
            ['w', 'e', 'e', 'e', 'e', 'e', 'e', 'e', 'e', 'e', 'e', 'e', 'e', 'e', 'w'],
            ['w', 'e', 'e', 'w', 'e', 'e', 'e', 'e', 'e', 'e', 'e', 'w', 'e', 'e', 'w'],
            ['w', 'e', 'e', 'e', 'e', 'e', 'w', 'e', 'w', 'e', 'e', 'e', 'e', 'e', 'w'],
            ['w', 'w', 'w', 'w', 'w', 'w', 'w', 'w', 'w', 'w', 'w', 'w', 'w', 'w', 'w'],];
var initialLocations = [[1, 1], 
                       [map.length-2, map[1].length-2],
                       [1, map[1].length-2], 
                       [map.length-2, 1]]

let timer = setInterval(function(){
  let amount = 1
  rechargeEnergy(amount)
  for(let i = 0; i < players.length; ++i) {
    let player = players[i]
    // TODO: make a single emit that update all players
    io.emit('player_update', player)
  }
}, 1000);

io.on('connection', function (socket) {
    console.log(`User Connected: ${socket.id}`)
    if (players.length < 4 ) {
      players.push({
        id: socket.id,
        isAlive: true,
        row: initialLocations[players.length][0],
        column: initialLocations[players.length][1],
        energy: MAX_ENERGY,
      })
    }else {
      return;
    }

    // Send player list to newly connected player
    socket.emit('map', map)
    socket.emit('players', players)

    // Tell existing players about the new player
    let playerIndex = getPlayerIndex(socket.id)
    socket.broadcast.emit('newPlayer', players[playerIndex]) // If player exist, then broadcast to everyone

    // Handle player disconnect
    socket.on('disconnect', () => {
      console.log(`User Disconnected: ${socket.id}`)

      // Remove the player from the game
      let playerIndex = getPlayerIndex(socket.id)
      players.splice(playerIndex, 1)
      io.emit('disconnect', socket.id)
    });

    // Handle player movement
    socket.on('player_move_horizontal', steps => {
        movePlayerHorizontal(socket, steps);
    })

    socket.on('player_move_vertical', steps => {
        movePlayerVertical(socket, steps);
    })

});

server.listen(8081, () => {
  	console.log(`Listening on ${server.address().port}`);
});

// Get player id
function getPlayerIndex(id) {
  if (players.length > 0) {
    for (let i = 0; i < players.length; ++i) {
      let player = players[i];
      if (player.id === id) {
        return i;
      }
    }
  }
  return -1;
}

function movePlayerHorizontal(socket, steps) {
  let id = socket.id;
  let playerIndex = getPlayerIndex(id);
  if (playerIndex > -1) {
      let player = players[playerIndex];
    if (player.isAlive && player.energy > Math.abs(steps)) {
      player.column = player.column + checkForWallHorizontal(player, steps);
      player.energy -= Math.abs(steps);
      io.emit('player_update', player)
    }
  }
}

function movePlayerVertical (socket, steps) {
  let id = socket.id;
  let playerIndex = getPlayerIndex(id); if (playerIndex > -1) {
    let player = players[playerIndex];
    if (player.isAlive  && player.energy > Math.abs(steps)) {
      player.row = player.row + checkForWallVertical(player, steps);
      player.energy -= Math.abs(steps);
      io.emit('player_update', player)
    }
  }
}

function checkForWallHorizontal (player, steps) {
  let direction = 1;
  if (steps < 0) {
    direction = -1;
  }

  for (let i = 1; i <= Math.abs(steps); i++) {
    let nextColumn = player.column + (i * direction);
    if (map[player.row][nextColumn] === 'w') {
        return (i - 1) * direction;
    }
    
    let playerDiedIndex = checkForKill(player.row, nextColumn, players)
    if (playerDiedIndex > -1) {
      // A player got killed
      let playerDied = players[playerDiedIndex]
      playerDied.isAlive = false
      io.emit('player_died', players[playerDiedIndex])
    }
  }
  return steps;
}

function checkForWallVertical (player, steps) {
  let direction = 1;
  if (steps < 0) {
    direction = -1;
  }

  for (let i = 1; i <= Math.abs(steps); i++) {
    let nextRow = player.row + (i * direction);
    if (map[nextRow][player.column] === 'w') {
        return (i - 1) * direction;
    }
    let playerDiedIndex = checkForKill(nextRow, player.column, players)
    if (playerDiedIndex > -1) {
      // A player got killed
      let playerDied = players[playerDiedIndex]
      playerDied.isAlive = false
      io.emit('player_died', players[playerDiedIndex])
    }
  }
  return steps;
}

function checkForKill (row, column, players) {
  for (let i = 0; i < players.length; i++) {
    let otherPlayers = players[i];
    if (otherPlayers.row === row && otherPlayers.column === column && otherPlayers.isAlive) {
        return i;
    }
  }
  return -1;
}

function rechargeEnergy(amount) {
  for (let i = 0; i < players.length; i++) {
    let player = players[i];
    if (player.energy < MAX_ENERGY) {
      if (player.energy + amount >= MAX_ENERGY) {
        player.energy = MAX_ENERGY
      } else {
        player.energy += amount;
      }
    }
  }
}
