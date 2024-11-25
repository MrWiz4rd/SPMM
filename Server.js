const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static(path.join(__dirname, '/')));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

io.on('connection', (socket) => {
    console.log('Používateľ pripojený:', socket.id);

    socket.on('join', () => {
        socket.broadcast.emit('ready'); // Informuje ostatných, že niekto sa pripojil
    });

    socket.on('signal', (data) => {
        console.log('Signalizácia:', data);
        socket.broadcast.emit('signal', data);
    });

    socket.on('disconnect', () => {
        console.log('Používateľ odpojený:', socket.id);
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server beží na porte ${PORT}`);
});
