const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static('public')); // Pre Netlify, slúži súbory z 'public'

io.on('connection', (socket) => {
    console.log('Nový používateľ pripojený');

    socket.on('ready', () => {
        socket.broadcast.emit('ready');
    });

    socket.on('signal', (data) => {
        socket.broadcast.emit('signal', data);
    });

    socket.on('disconnect', () => {
        console.log('Používateľ sa odpojil');
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Server beží na porte ${PORT}`));
