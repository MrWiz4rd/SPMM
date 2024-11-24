const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Poskytovanie statických súborov z aktuálneho priečinka
app.use(express.static(__dirname));

// Spustenie servera
server.listen(3000, () => {
    console.log('Server beží na http://localhost:3000');
});
