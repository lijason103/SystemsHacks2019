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

var players = [];
var map = [['w', 'w', 'w', 'w', 'w', 'w', 'w', 'w', 'w', 'w', 'w', 'w', 'w', 'w', 'w'],
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
    players.push({
    	id: socket.id,
    	x: 1,
    	y: 1,
  	})

    // Send player list to newly connected player
    socket.emit('map', map)
    socket.emit('players', players)

    // Tell existing players about the new player
    let playerIndex = getPlayerIndex(socket.id)
    socket.broadcast.emit('newPlayer', players[playerIndex])

    // Handle player disconnect
    socket.on('disconnect', () => {
      console.log(`User Disconnected: ${socket.id}`)

      // Remove the player from the game
      let playerIndex = getPlayerIndex(socket.id)
      players.splice(playerIndex, 1)
      io.emit('disconnect', socket.id)
    });

});



server.listen(8081, () => {
  	console.log(`Listening on ${server.address().port}`);
});
