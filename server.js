const http = require('http');
const express = require('express');
const socketIO = require('socket.io');

const app = express();
app.use('/', express.static('static'));

const server = http.createServer(app);

const io = socketIO(server);

const rooms = {};
io.on('connect', (socket) => {
    console.log('Player connected', socket.conn.remoteAddress);
    socket.emit('welcome', "Welcome! You can chat with your buddy here!");

    socket.on('selectRoom', (roomId, username) => {
        if (rooms[roomId] == undefined) {
            rooms[roomId] = new Map();
        }
        const players = rooms[roomId];

        if (players.size >= 2) {
            socket.emit('error', 'Room is full!');
            socket.disconnect();
        } else {
            socket.join(roomId);
            initGame(roomId, players, socket, username);
        }

        socket.on('message', data => {
            console.log("Message: ", data);
            io.to(roomId).emit('message', data)
        });
    })
})

function initGame(roomId, players, socket, username) {
    socket.on('position', pos => {
        console.log('Position: ', pos);
        io.to(roomId).emit('position', pos);
    });

    socket.on('newGame', () => {
        console.log('New Game started');
        io.to(roomId).emit('newGame');
    });

    socket.on('disconnect', () => {
        console.log('Player left');
        io.to(roomId).emit('message', { username, msg: "Left game!" })
        players.delete(socket);
        io.to(roomId).emit('newGame');
    })

    let symbol = 'X';
    if (players.size > 0) {
        const otherPlayerSymbol = [...players.values()][0][0];
        const otherPlayerUsername = [...players.values()][0][1];
        if (otherPlayerSymbol == 'X') {
            symbol = 'O'

        }
        socket.emit('message', { username: otherPlayerUsername, msg: `playing with ${otherPlayerSymbol}` })
    }
    players.set(socket, [symbol, username]);
    console.log('Symbol assigned:', symbol);
    socket.emit('symbol', symbol);
}

server.listen(3000, () => console.log('Server is listening on port 3000'));