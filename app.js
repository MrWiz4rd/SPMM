const localVideo = document.getElementById('local-video');
const remoteVideo = document.getElementById('remote-video');
const offerInput = document.getElementById('offer-input');
const answerInput = document.getElementById('answer-input');
const copyOfferButton = document.getElementById('copy-offer-btn');
const copyAnswerButton = document.getElementById('copy-answer-btn');
const createOfferButton = document.getElementById('create-offer-btn');
const setAnswerButton = document.getElementById('set-answer-btn');

let localStream;
let peerConnection;

// ICE konfigurácia
const iceConfig = {
    iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
};

// Získanie lokálneho streamu
navigator.mediaDevices.getUserMedia({ video: true, audio: true })
    .then((stream) => {
        localStream = stream;
        localVideo.srcObject = stream;
    })
    .catch((error) => {
        console.error('Chyba pri prístupe ku kamere/mikrofónu:', error);
    });

// Vytvorenie peer-to-peer spojenia
function createPeerConnection() {
    peerConnection = new RTCPeerConnection(iceConfig);

    // Počas prijatia médií zo vzdialeného klienta
    peerConnection.ontrack = (event) => {
        remoteVideo.srcObject = event.streams[0];
    };

    // Odosielanie lokálneho streamu
    localStream.getTracks().forEach((track) => {
        peerConnection.addTrack(track, localStream);
    });

    // Odosielanie ICE kandidátov (do konzoly alebo iného kanála)
    peerConnection.onicecandidate = (event) => {
        if (event.candidate) {
            console.log('Nový ICE kandidat:', event.candidate);
        }
    };
}

// Tvorba ponuky (offer)
createOfferButton.addEventListener('click', async () => {
    createPeerConnection();

    const offer = await peerConnection.createOffer();
    await peerConnection.setLocalDescription(offer);

    console.log('Vytvorená ponuka:', offer);
    offerInput.value = JSON.stringify(offer);
});

// Nastavenie odpovede (answer)
setAnswerButton.addEventListener('click', async () => {
    const answer = JSON.parse(answerInput.value);
    await peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
    console.log('Nastavená odpoveď:', answer);
});

// Prijatie ponuky a vytvorenie odpovede
offerInput.addEventListener('change', async () => {
    createPeerConnection();

    const offer = JSON.parse(offerInput.value);
    await peerConnection.setRemoteDescription(new RTCSessionDescription(offer));

    const answer = await peerConnection.createAnswer();
    await peerConnection.setLocalDescription(answer);

    console.log('Vytvorená odpoveď:', answer);
    answerInput.value = JSON.stringify(answer);
});

// Kopírovanie ponuky alebo odpovede
copyOfferButton.addEventListener('click', () => {
    offerInput.select();
    document.execCommand('copy');
    alert('Ponuka skopírovaná!');
});

copyAnswerButton.addEventListener('click', () => {
    answerInput.select();
    document.execCommand('copy');
    alert('Odpoveď skopírovaná!');
});
