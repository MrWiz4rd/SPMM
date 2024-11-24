const localVideo = document.getElementById('local-video');
const remoteVideo = document.getElementById('remote-video');

const startCallBtn = document.getElementById('start-call');
const joinCallBtn = document.getElementById('join-call');

const ws = new WebSocket('ws://localhost:3000');
let localStream;
let peerConnection;

// ICE konfigurácia pre WebRTC
const iceConfig = {
    iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
};

// Inicializácia lokálneho streamu
navigator.mediaDevices.getUserMedia({ video: true, audio: true })
    .then((stream) => {
        localStream = stream;
        localVideo.srcObject = stream;
    })
    .catch((error) => {
        console.error('Chyba pri prístupe ku kamere/mikrofónu:', error);
        alert('Nie je možné pristúpiť ku kamere/mikrofónu. Povolenie je potrebné.');
    });

// Inicializácia Peer-to-Peer spojenia
function initializePeerConnection() {
    peerConnection = new RTCPeerConnection(iceConfig);

    // Pridanie lokálnych stôp
    localStream.getTracks().forEach((track) => {
        peerConnection.addTrack(track, localStream);
    });

    // Prijatie vzdialených stôp
    peerConnection.ontrack = (event) => {
        remoteVideo.srcObject = event.streams[0];
    };

    // Odosielanie ICE kandidátov
    peerConnection.onicecandidate = (event) => {
        if (event.candidate) {
            ws.send(JSON.stringify({ type: 'candidate', candidate: event.candidate }));
        }
    };
}

// Vytvorenie ponuky (offer)
startCallBtn.addEventListener('click', () => {
    initializePeerConnection();

    peerConnection.createOffer()
        .then((offer) => {
            peerConnection.setLocalDescription(offer);
            ws.send(JSON.stringify({ type: 'offer', offer }));
        })
        .catch((error) => console.error('Chyba pri vytváraní ponuky:', error));
});

// Pripojenie k hovoru (prijatie ponuky)
joinCallBtn.addEventListener('click', () => {
    initializePeerConnection();
    ws.addEventListener('message', (message) => {
        const data = JSON.parse(message.data);

        if (data.type === 'offer') {
            peerConnection.setRemoteDescription(new RTCSessionDescription(data.offer))
                .then(() => peerConnection.createAnswer())
                .then((answer) => {
                    peerConnection.setLocalDescription(answer);
                    ws.send(JSON.stringify({ type: 'answer', answer }));
                })
                .catch((error) => console.error('Chyba pri prijímaní ponuky:', error));
        } else if (data.type === 'answer') {
            peerConnection.setRemoteDescription(new RTCSessionDescription(data.answer));
        } else if (data.type === 'candidate') {
            peerConnection.addIceCandidate(new RTCIceCandidate(data.candidate));
        }
    });
});
