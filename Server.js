const WebSocket = require('ws');

const server = new WebSocket.Server({ port: 3000 });

let clients = [];

server.on('connection', (socket) => {
    clients.push(socket);

    socket.on('message', (message) => {
        // Poslať správu všetkým ostatným klientom
        clients.forEach((client) => {
            if (client !== socket && client.readyState === WebSocket.OPEN) {
                client.send(message);
            }
        });
    });

    socket.on('close', () => {
        // Odstrániť klienta po odpojení
        clients = clients.filter((client) => client !== socket);
    });
});

console.log('Signalizačný server beží na porte 3000');
