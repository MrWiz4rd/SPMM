const socket = io(); // Inicializácia socket.io
const muteBtn = document.getElementById('mute-btn');
const muteIcon = document.getElementById('mute-icon');
const cameraBtn = document.getElementById('camera-btn');
const cameraIcon = document.getElementById('camera-icon');
const hangupBtn = document.getElementById('hangup-btn');
const localVideo = document.getElementById('webcam');
const remoteVideo = document.getElementById('remote-webcam');
let localStream;
let peerConnection;

const config = {
    iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] // STUN server
};

// Získanie prístupu ku kamere a mikrofónu
navigator.mediaDevices.getUserMedia({ video: true, audio: true })
    .then((stream) => {
        localStream = stream;
        localVideo.srcObject = stream;

        if (!peerConnection) createPeerConnection();
        localStream.getTracks().forEach((track) => peerConnection.addTrack(track, localStream));
    })
    .catch((error) => {
        console.error('Chyba pri prístupe ku kamere alebo mikrofónu:', error);
        alert('Kamera alebo mikrofón neboli povolené.');
    });

// Vytvorenie PeerConnection
function createPeerConnection() {
    peerConnection = new RTCPeerConnection(config);

    peerConnection.onicecandidate = (event) => {
        if (event.candidate) {
            socket.emit('signal', { candidate: event.candidate });
        }
    };

    peerConnection.ontrack = (event) => {
        remoteVideo.srcObject = event.streams[0];
        document.getElementById('remote-webcam-text').style.display = 'none';
    };
}

// Signalizácia
socket.on('signal', async (data) => {
    if (!peerConnection) createPeerConnection();

    if (data.offer) {
        await peerConnection.setRemoteDescription(new RTCSessionDescription(data.offer));
        const answer = await peerConnection.createAnswer();
        await peerConnection.setLocalDescription(answer);
        socket.emit('signal', { answer });
    }

    if (data.answer) {
        await peerConnection.setRemoteDescription(new RTCSessionDescription(data.answer));
    }

    if (data.candidate) {
        await peerConnection.addIceCandidate(new RTCIceCandidate(data.candidate));
    }
});

// Ukončenie hovoru
hangupBtn.addEventListener('click', () => {
    if (peerConnection) {
        peerConnection.close();
        peerConnection = null;
    }
    if (localStream) {
        localStream.getTracks().forEach((track) => track.stop());
        localVideo.srcObject = null;
    }
    remoteVideo.srcObject = null;
    alert('Hovor bol ukončený.');
    socket.disconnect();
});
