const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Poskytovanie statických súborov
app.use(express.static(path.join(__dirname, 'public')));

server.listen(3000, () => {
    console.log('Server beží na http://localhost:3000');
});
