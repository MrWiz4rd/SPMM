// Výber tlačidiel
const muteBtn = document.getElementById('mute-btn');
const muteIcon = document.getElementById('mute-icon');
const cameraBtn = document.getElementById('camera-btn');
const cameraIcon = document.getElementById('camera-icon');
const hangupBtn = document.getElementById('hangup-btn');

const localVideo = document.getElementById('local-video');
const remoteVideo = document.getElementById('remote-video');

let localStream;
let peerConnection;

// Signalizačný server
const socket = io();

// ICE konfigurácia
const iceConfig = {
    iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
};

// Získanie lokálneho streamu
navigator.mediaDevices.getUserMedia({ video: true, audio: true })
    .then((stream) => {
        localStream = stream;
        localVideo.srcObject = stream;

        // Obsluha tlačidiel po získaní streamu
        setupButtons();
    })
    .catch((error) => {
        console.error('Chyba pri prístupe ku kamere/mikrofónu:', error);
    });

// Signalizácia
socket.on('offer', async (offer) => {
    peerConnection = new RTCPeerConnection(iceConfig);

    peerConnection.ontrack = (event) => {
        remoteVideo.srcObject = event.streams[0];
    };

    localStream.getTracks().forEach((track) => {
        peerConnection.addTrack(track, localStream);
    });

    await peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
    const answer = await peerConnection.createAnswer();
    await peerConnection.setLocalDescription(answer);

    socket.emit('answer', answer);
});

socket.on('answer', async (answer) => {
    await peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
});

socket.on('candidate', async (candidate) => {
    await peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
});

// Vytváranie spojenia
document.addEventListener('DOMContentLoaded', () => {
    peerConnection = new RTCPeerConnection(iceConfig);

    peerConnection.ontrack = (event) => {
        remoteVideo.srcObject = event.streams[0];
    };

    localStream.getTracks().forEach((track) => {
        peerConnection.addTrack(track, localStream);
    });

    peerConnection.onicecandidate = (event) => {
        if (event.candidate) {
            socket.emit('candidate', event.candidate);
        }
    };

    peerConnection.createOffer()
        .then((offer) => {
            peerConnection.setLocalDescription(offer);
            socket.emit('offer', offer);
        })
        .catch((error) => console.error(error));
});

// Funkcia na nastavenie tlačidiel
function setupButtons() {
    // Prepínanie mikrofónu
    muteBtn.addEventListener('click', () => {
        const audioTrack = localStream.getAudioTracks()[0];
        if (audioTrack) {
            audioTrack.enabled = !audioTrack.enabled;

            // Prepnutie ikon a stavu tlačidla
            muteIcon.classList.toggle('fa-microphone', audioTrack.enabled);
            muteIcon.classList.toggle('fa-microphone-slash', !audioTrack.enabled);
            muteBtn.classList.toggle('active', audioTrack.enabled);
            muteBtn.classList.toggle('inactive', !audioTrack.enabled);
        }
    });

    // Prepínanie kamery
    cameraBtn.addEventListener('click', () => {
        const videoTrack = localStream.getVideoTracks()[0];
        if (videoTrack) {
            videoTrack.enabled = !videoTrack.enabled;

            // Prepnutie ikon a stavu tlačidla
            cameraIcon.classList.toggle('fa-video', videoTrack.enabled);
            cameraIcon.classList.toggle('fa-video-slash', !videoTrack.enabled);
            cameraBtn.classList.toggle('active', videoTrack.enabled);
            cameraBtn.classList.toggle('inactive', !videoTrack.enabled);
        }
    });

    // Ukončenie hovoru
    hangupBtn.addEventListener('click', () => {
        if (localStream) {
            localStream.getTracks().forEach((track) => track.stop());
            localVideo.srcObject = null;
            remoteVideo.srcObject = null;
            alert('Hovor bol ukončený.');
        }
    });
}
