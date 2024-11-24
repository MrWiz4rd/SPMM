const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Slúži statické súbory (napr. HTML a CSS)
app.use(express.static('public'));

io.on('connection', (socket) => {
    console.log('Používateľ pripojený:', socket.id);

    // Po prijatí signalizačnej správy
    socket.on('signal', (data) => {
        console.log('Signalizácia:', data);
        socket.broadcast.emit('signal', data);
    });

    socket.on('disconnect', () => {
        console.log('Používateľ odpojený:', socket.id);
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Server beží na porte ${PORT}`));
