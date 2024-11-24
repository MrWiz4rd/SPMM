const localVideo = document.getElementById('local-video');
const remoteVideo = document.getElementById('remote-video');
const startCallButton = document.getElementById('start-call');
const joinCallButton = document.getElementById('join-call');
const localOfferTextarea = document.getElementById('local-offer');
const remoteOfferTextarea = document.getElementById('remote-offer');
const setRemoteOfferButton = document.getElementById('set-remote-offer');

let localStream;
let peerConnection;

const iceConfig = {
    iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
};

// Získanie lokálneho video/audio streamu
navigator.mediaDevices.getUserMedia({ video: true, audio: true })
    .then((stream) => {
        localStream = stream;
        localVideo.srcObject = stream;
    })
    .catch((error) => console.error('Chyba pri získaní streamu:', error));

// Vytvorenie PeerConnection
function createPeerConnection() {
    peerConnection = new RTCPeerConnection(iceConfig);

    // Pridanie lokálnych stôp
    localStream.getTracks().forEach((track) => peerConnection.addTrack(track, localStream));

    // Prijatie vzdialeného streamu
    peerConnection.ontrack = (event) => {
        remoteVideo.srcObject = event.streams[0];
    };

    // ICE kandidáti
    peerConnection.onicecandidate = (event) => {
        if (event.candidate) {
            console.log('Nový ICE kandidát:', JSON.stringify(event.candidate));
        }
    };
}

// Začať hovor
startCallButton.addEventListener('click', async () => {
    createPeerConnection();

    const offer = await peerConnection.createOffer();
    await peerConnection.setLocalDescription(offer);

    localOfferTextarea.value = JSON.stringify(peerConnection.localDescription);
});

// Pripojiť sa k hovoru
joinCallButton.addEventListener('click', async () => {
    createPeerConnection();

    const remoteOffer = JSON.parse(remoteOfferTextarea.value);
    await peerConnection.setRemoteDescription(remoteOffer);

    const answer = await peerConnection.createAnswer();
    await peerConnection.setLocalDescription(answer);

    localOfferTextarea.value = JSON.stringify(peerConnection.localDescription);
});

// Nastaviť remote offer
setRemoteOfferButton.addEventListener('click', async () => {
    const remoteOffer = JSON.parse(remoteOfferTextarea.value);
    await peerConnection.setRemoteDescription(remoteOffer);
});
