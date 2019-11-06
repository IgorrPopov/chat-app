const express = require('express');
const socketio = require('socket.io');
const http = require('http');
const path = require('path');
const Filter = require('bad-words');
const { generateMessage } = require('./utils/messages');
const { addUser, getUser, getUsersInRoom, removeUser } = require('./utils/users');

const app = express();
const server = http.createServer(app);
const io = socketio(server);


const port = process.env.PORT || 3000;
const pathToPublicFolder = path.join(__dirname, '../public');

app.use(express.static(pathToPublicFolder));

// let count = 0;

io.on('connection', (socket) => {
    console.log('new websocket connection');

    // socket.on('join', ({ username, room }, callback) => {
    //     const { error, user } = addUser({ id: socket.id, username, room });


    socket.on('join', (options, callback) => {
            const { error, user } = addUser({ id: socket.id, ...options });
    

        if (error) {
             return callback(error);
        }

        socket.join(user.room);

        socket.emit('message', generateMessage(user.username, ' welcome')); // to current user
        socket.broadcast.to(user.room).emit('message', generateMessage(user.username, ' has joined!')); // to all other users
        io.to(user.room).emit('roomData', {
            room: user.room,
            users: getUsersInRoom(user.room)
        });


        callback();

        // socket.emit => sends an event to the specific client
        // io.emit => sneds an event to all connected clients
        // socket.broadcast.emit => to all connected clients exept the user how emit event

        // io.to.emit => to room only
        // socket.broadcast.to.emit
    });

    socket.on('sendMessage', (message, callback) => {

        const user = getUser(socket.id);

        const filter = new Filter();

        if (filter.isProfane(message)) {
            return callback('Profanity is not allowed');
        }

        io.to(user.room).emit('message', generateMessage(user.username, message)); // to all users
        callback(); // launche the callback to start function at front end
    });



    socket.on('disconnect', () => {
        const user = removeUser(socket.id);

        if (user) {
            io.to(user.room).emit('message', generateMessage(user.username, ' has left!'));
            io.to(user.room).emit('roomData', {
                room: user.room,
                users: getUsersInRoom(user.room)
            })
        }
    });


    socket.on('sendLocation', (location, callback) => {
        const user = getUser(socket.id);

        socket.broadcast.to(user.room).emit('locationMessage', {url: `http://google.com/maps?q=${location.latitude},${location.longitude}`, username: user.username });
        callback();
    });

    // socket.emit('countUpdated', count);

    // socket.on('increment', () => {
    //     count++;
    //     // socket.emit('countUpdated', count); // it's for single connecction
    //     io.emit('countUpdated', count);
    // });
});



server.listen(port, () => {
    console.log('Server is runing at port ' + port);
});