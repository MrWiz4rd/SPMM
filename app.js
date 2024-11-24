// Firebase konfigurácia
const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_AUTH_DOMAIN",
    databaseURL: "YOUR_DATABASE_URL",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_STORAGE_BUCKET",
    messagingSenderId: "YOUR_SENDER_ID",
    appId: "YOUR_APP_ID"
};

// Inicializácia Firebase
firebase.initializeApp(firebaseConfig);
const database = firebase.database();

// Referencie pre signalizáciu
const offerRef = database.ref('/offer');
const answerRef = database.ref('/answer');
const candidatesRef = database.ref('/candidates');

// Výber prvkov z DOM
const localVideo = document.getElementById('local-video');
const remoteVideo = document.getElementById('remote-video');
const muteBtn = document.getElementById('mute-btn');
const cameraBtn = document.getElementById('camera-btn');
const hangupBtn = document.getElementById('hangup-btn');
const muteIcon = document.getElementById('mute-icon');
const cameraIcon = document.getElementById('camera-icon');

let localStream;
let peerConnection;

// ICE konfigurácia pre WebRTC
const iceConfig = {
    iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
};

// Získanie lokálneho video/audio streamu
navigator.mediaDevices.getUserMedia({ video: true, audio: true })
    .then((stream) => {
        localStream = stream;
        localVideo.srcObject = stream;
        setupButtons();
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
            candidatesRef.push(JSON.stringify(event.candidate));
        }
    };
}

// Tvorba ponuky (offer)
function createOffer() {
    initializePeerConnection();

    peerConnection.createOffer()
        .then((offer) => {
            peerConnection.setLocalDescription(offer);
            offerRef.set(JSON.stringify(offer));
        })
        .catch((error) => console.error('Chyba pri vytváraní ponuky:', error));
}

// Prijatie ponuky a vytvorenie odpovede
function listenForOffer() {
    offerRef.on('value', (snapshot) => {
        const offer = snapshot.val();
        if (!offer) return;

        initializePeerConnection();

        peerConnection.setRemoteDescription(new RTCSessionDescription(JSON.parse(offer)))
            .then(() => peerConnection.createAnswer())
            .then((answer) => {
                peerConnection.setLocalDescription(answer);
                answerRef.set(JSON.stringify(answer));
            })
            .catch((error) => console.error('Chyba pri spracovaní ponuky:', error));
    });
}

// Prijatie odpovede
function listenForAnswer() {
    answerRef.on('value', (snapshot) => {
        const answer = snapshot.val();
        if (!answer) return;

        peerConnection.setRemoteDescription(new RTCSessionDescription(JSON.parse(answer)));
    });
}

// Prijatie ICE kandidátov
function listenForCandidates() {
    candidatesRef.on('child_added', (snapshot) => {
        const candidate = JSON.parse(snapshot.val());
        peerConnection.addIceCandidate(new RTCIceCandidate(candidate))
            .catch((error) => console.error('Chyba pri pridávaní ICE kandidáta:', error));
    });
}

// Nastavenie funkcií tlačidiel
function setupButtons() {
    muteBtn.addEventListener('click', () => {
        const audioTrack = localStream.getAudioTracks()[0];
        if (audioTrack) {
            audioTrack.enabled = !audioTrack.enabled;
            muteIcon.classList.toggle('fa-microphone-slash', !audioTrack.enabled);
            muteIcon.classList.toggle('fa-microphone', audioTrack.enabled);
        }
    });

    cameraBtn.addEventListener('click', () => {
        const videoTrack = localStream.getVideoTracks()[0];
        if (videoTrack) {
            videoTrack.enabled = !videoTrack.enabled;
            cameraIcon.classList.toggle('fa-video-slash', !videoTrack.enabled);
            cameraIcon.classList.toggle('fa-video', videoTrack.enabled);
        }
    });

    hangupBtn.addEventListener('click', () => {
        if (localStream) {
            localStream.getTracks().forEach((track) => track.stop());
            localVideo.srcObject = null;
            remoteVideo.srcObject = null;
            alert('Hovor bol ukončený.');
        }
    });
}

// Tlačidlá na začatie/pripojenie hovoru
document.getElementById('start-call').addEventListener('click', createOffer);
document.getElementById('join-call').addEventListener('click', () => {
    listenForOffer();
    listenForAnswer();
    listenForCandidates();
});
