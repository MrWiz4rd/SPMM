const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Poskytovanie statických súborov z aktuálneho priečinka
app.use(express.static(path.join(__dirname)));

// Poskytovanie hlavného súboru HTML
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Signalizácia WebRTC
io.on('connection', (socket) => {
    console.log(`Používateľ pripojený: ${socket.id}`);

    // Pripojenie do miestnosti
    socket.on('join-room', (room) => {
        socket.join(room);
        console.log(`Používateľ ${socket.id} sa pripojil do miestnosti: ${room}`);
    });

    // Odoslanie ponuky WebRTC (offer)
    socket.on('offer', (offer, room) => {
        console.log(`Offer od používateľa ${socket.id} pre miestnosť ${room}`);
        socket.to(room).emit('offer', offer);
    });

    // Odoslanie odpovede WebRTC (answer)
    socket.on('answer', (answer, room) => {
        console.log(`Answer od používateľa ${socket.id} pre miestnosť ${room}`);
        socket.to(room).emit('answer', answer);
    });

    // Odoslanie ICE kandidátov
    socket.on('candidate', (candidate, room) => {
        console.log(`ICE candidate od používateľa ${socket.id} pre miestnosť ${room}`);
        socket.to(room).emit('candidate', candidate);
    });

    // Odpojenie používateľa
    socket.on('disconnect', () => {
        console.log(`Používateľ ${socket.id} sa odpojil.`);
    });
});

// Spustenie servera
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server beží na http://localhost:${PORT}`);
});
