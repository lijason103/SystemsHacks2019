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

var maxNumberOfPlayers = 4;
var playerCounter = 0;
var players = [];
var map = [ ['w', 'w', 'w', 'w', 'w', 'w', 'w', 'w', 'w', 'w', 'w', 'w', 'w', 'w', 'w'],
            ['w', 'e', 'e', 'e', 'e', 'e', 'e', 'e', 'e', 'e', 'e', 'e', 'e', 'e', 'w'],
            ['w', 'e', 'w', 'e', 'e', 'e', 'e', 'e', 'e', 'e', 'e', 'e', 'e', 'w', 'w'],
            ['w', 'e', 'e', 'w', 'e', 'e', 'w', 'e', 'e', 'e', 'e', 'e', 'e', 'e', 'w'],
            ['w', 'e', 'e', 'e', 'w', 'e', 'w', 'e', 'e', 'e', 'e', 'e', 'w', 'e', 'w'],
            ['w', 'e', 'e', 'w', 'e', 'e', 'e', 'e', 'e', 'e', 'e', 'e', 'e', 'e', 'w'],
            ['w', 'e', 'e', 'w', 'e', 'e', 'e', 'e', 'w', 'w', 'e', 'e', 'e', 'e', 'w'],
            ['w', 'e', 'e', 'e', 'e', 'e', 'e', 'e', 'e', 'e', 'e', 'e', 'e', 'e', 'w'],
            ['w', 'w', 'w', 'w', 'w', 'w', 'w', 'w', 'w', 'w', 'w', 'w', 'w', 'w', 'w'],];

io.on('connection', function (socket) {
    console.log(`User Connected: ${socket.id}`)
    if (playerCounter < 4 ) {
      players.push({
        id: socket.id,
        isAlive: true,
        row: 1,
        column: 1,
      })
    } 
    else if (playerCounter === 4) {
      // Print out cannot join, max number of players
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

function placePlayers() {
  let row = map.length - 1; // 0-4 --> 5 returns 4 for last row
  let column = map[0].length - 1; // 0-5 --> returns 5 for last col

  if (players.length === 2) {
    let player2 = players[1];

    player2.row = --row;
    player2.column = --column;
  }

  if (players.length === 3) {
    let player2 = players[1];
    let player3 = players[2];

    player2.row = --row;
    player2.column = --column;

    player3.row = row;
    player3.column = 1;
  }

  if (players.length === 4) {
    let player2 = players[1];
    let player3 = players[2];
    let player4 = players[3];

    player2.row = --row;
    player2.column = --column;

    player3.row = row;
    player3.column = 1;

    player4.row = 1;
    player4.column = column;
  }
}

function movePlayerHorizontal(socket, steps) {
  let id = socket.id;
  let playerIndex = getPlayerIndex(id);
  if (playerIndex > -1) {
      let player = players[playerIndex];
      player.column = player.column + checkForWallHorizontal(player, steps);
      // console.log(player)
      io.emit('player_update', player)
  }
}

function movePlayerVertical (socket, steps) {
  let id = socket.id;
  let playerIndex = getPlayerIndex(id); if (playerIndex > -1) {
    let player = players[playerIndex];
    player.row = player.row + checkForWallVertical(player, steps);
    console.log(player)
    io.emit('player_update', player)
  }
}

function checkForWallHorizontal (player, steps) {
  let direction = 1;
  if (steps < 0) {
    direction = -1;
  }

  for (let i = 1; i <= Math.abs(steps); ++i) {
    let nextColumn = player.column + (i * direction);
    if (map[player.row][nextColumn] === 'w') {
        return (i - 1) * direction;
    }
    // checkForKill(player.row, nextColumn, players);
  }
  return steps;
}

function checkForWallVertical (player, steps) {
  console.log(steps);
  let direction = 1;
  if (steps < 0) {
    direction = -1;
  }

  for (let i = 1; i <= Math.abs(steps); ++i) {
    let nextRow = player.row + (i * direction);
    if (map[nextRow][player.column] === 'w') {
        return (i - 1) * direction;
    }
    // checkForKill(nextRow, player.column, players);
  }
  return steps;
}

function checkForKill (row, column, players) {
  for (let i = 0; i < players.length; i++) {
    let otherPlayers = players[i];
    if (otherPlayers.row === row && otherPlayers.column === column) {
        otherPlayers.isAlive = false;
        return true;
    }
  }
  return false;
}
