const socket = io(); // Inicializácia socket.io
const localVideo = document.getElementById('local-video');
const remoteVideo = document.getElementById('remote-video');
const muteBtn = document.getElementById('mute-btn');
const cameraBtn = document.getElementById('camera-btn');
const hangupBtn = document.getElementById('hangup-btn');
const muteIcon = document.getElementById('mute-icon');
const cameraIcon = document.getElementById('camera-icon');

let localStream;
let peerConnection;

// Konfigurácia STUN servera
const config = {
    iceServers: [
        { urls: 'stun:stun.l.google.com:19302' } // STUN server
    ]
};

// Získanie kamery a mikrofónu
navigator.mediaDevices.getUserMedia({ video: true, audio: true })
    .then((stream) => {
        console.log('Úspešne získaný stream:', stream);
        localStream = stream;
        localVideo.srcObject = stream;

        // Pripojenie k signalizačnému serveru
        socket.emit('join');
    })
    .catch((error) => {
        console.error('Chyba pri získavaní mediálneho streamu:', error);
        alert('Kamera alebo mikrofón neboli povolené, alebo sú obsadené inou aplikáciou.');
    });

// Vytvorenie PeerConnection
function createPeerConnection() {
    peerConnection = new RTCPeerConnection(config);

    // Odosielanie ICE kandidátov
    peerConnection.onicecandidate = (event) => {
        if (event.candidate) {
            console.log('Odosielam ICE kandidáta:', event.candidate);
            socket.emit('signal', { candidate: event.candidate });
        }
    };

    // Prijímanie vzdialeného streamu
    peerConnection.ontrack = (event) => {
        remoteVideo.srcObject = event.streams[0];
    };

    // Pridanie lokálnych streamov
    if (localStream) {
        localStream.getTracks().forEach((track) => peerConnection.addTrack(track, localStream));
    } else {
        console.error('Local stream nie je inicializovaný.');
    }
}

// Signalizácia: Spracovanie správ od druhého klienta
socket.on('signal', async (data) => {
    if (!peerConnection) createPeerConnection();

    if (data.offer) {
        console.log('Prijatá ponuka:', data.offer);
        await peerConnection.setRemoteDescription(new RTCSessionDescription(data.offer));
        const answer = await peerConnection.createAnswer();
        await peerConnection.setLocalDescription(answer);
        console.log('Odoslaná odpoveď:', peerConnection.localDescription);
        socket.emit('signal', { answer: peerConnection.localDescription });
    } else if (data.answer) {
        console.log('Prijatá odpoveď:', data.answer);
        await peerConnection.setRemoteDescription(new RTCSessionDescription(data.answer));
    } else if (data.candidate) {
        console.log('Prijatý ICE kandidát:', data.candidate);
        await peerConnection.addIceCandidate(new RTCIceCandidate(data.candidate));
    }
});

// Pripojenie druhého účastníka
socket.on('ready', async () => {
    if (!peerConnection) createPeerConnection();

    const offer = await peerConnection.createOffer();
    await peerConnection.setLocalDescription(offer);
    console.log('Odoslaná ponuka:', peerConnection.localDescription);
    socket.emit('signal', { offer: peerConnection.localDescription });
});

// Ovládacie tlačidlá
// Tlačidlo pre mikrofón
muteBtn.addEventListener('click', () => {
    if (localStream && localStream.getAudioTracks().length > 0) {
        const audioTrack = localStream.getAudioTracks()[0];
        audioTrack.enabled = !audioTrack.enabled;
        muteIcon.classList.toggle('fa-microphone-slash', !audioTrack.enabled);
        muteIcon.classList.toggle('fa-microphone', audioTrack.enabled);
        console.log(`Mikrofón ${audioTrack.enabled ? 'zapnutý' : 'vypnutý'}`);
    } else {
        console.error('Audio stopa nie je dostupná.');
    }
});

// Tlačidlo pre kameru
cameraBtn.addEventListener('click', () => {
    if (localStream && localStream.getVideoTracks().length > 0) {
        const videoTrack = localStream.getVideoTracks()[0];
        videoTrack.enabled = !videoTrack.enabled;
        cameraIcon.classList.toggle('fa-video-slash', !videoTrack.enabled);
        cameraIcon.classList.toggle('fa-video', videoTrack.enabled);
        console.log(`Kamera ${videoTrack.enabled ? 'zapnutá' : 'vypnutá'}`);
    } else {
        console.error('Video stopa nie je dostupná.');
    }
});

// Tlačidlo na ukončenie hovoru
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
    socket.disconnect();
    alert('Hovor bol ukončený.');
    console.log('Hovor bol ukončený.');
});
