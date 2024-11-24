const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Slúži statické súbory (HTML, CSS, obrázky)
app.use(express.static(__dirname));

// Slúži index.html pri GET požiadavke na koreň
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

io.on('connection', (socket) => {
    console.log('Používateľ pripojený:', socket.id);

    // Preposielanie signalizačných správ ostatným
    socket.on('signal', (data) => {
        console.log('Signalizácia od', socket.id);
        socket.broadcast.emit('signal', data);
    });

    socket.on('disconnect', () => {
        console.log('Používateľ odpojený:', socket.id);
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Server beží na porte ${PORT}`));
