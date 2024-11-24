// Importy potrebné pre Firebase verziu 9+
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-app.js";
import { getDatabase, ref, set, onValue, push } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-database.js";

// Firebase konfigurácia
const firebaseConfig = {
  apiKey: "AIzaSyAx6FWn6zc36lnMcnk8aYYH4FvCxcIrC6o",
  authDomain: "spmm-a8fa5.firebaseapp.com",
  projectId: "spmm-a8fa5",
  storageBucket: "spmm-a8fa5.firebasestorage.app",
  messagingSenderId: "962431433976",
  appId: "1:962431433976:web:d66c57740a5675e5e58f0d",
  measurementId: "G-2K3YFBQKGE"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

// Referencie pre signalizáciu
const offerRef = ref(database, '/offer');
const answerRef = ref(database, '/answer');
const candidatesRef = ref(database, '/candidates');

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
        setupButtons(); // Nastavenie funkcií tlačidiel po získaní streamu
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
            push(candidatesRef, JSON.stringify(event.candidate));
        }
    };
}

// Tvorba ponuky (offer)
document.getElementById('start-call').addEventListener('click', () => {
    initializePeerConnection();

    peerConnection.createOffer()
        .then((offer) => {
            peerConnection.setLocalDescription(offer);
            set(offerRef, JSON.stringify(offer));
        })
        .catch((error) => console.error('Chyba pri vytváraní ponuky:', error));
});

// Prijatie ponuky a vytvorenie odpovede
document.getElementById('join-call').addEventListener('click', () => {
    onValue(offerRef, (snapshot) => {
        const offer = snapshot.val();
        if (!offer) return;

        initializePeerConnection();

        peerConnection.setRemoteDescription(new RTCSessionDescription(JSON.parse(offer)))
            .then(() => peerConnection.createAnswer())
            .then((answer) => {
                peerConnection.setLocalDescription(answer);
                set(answerRef, JSON.stringify(answer));
            })
            .catch((error) => console.error('Chyba pri spracovaní ponuky:', error));
    });

    onValue(answerRef, (snapshot) => {
        const answer = snapshot.val();
        if (!answer) return;

        peerConnection.setRemoteDescription(new RTCSessionDescription(JSON.parse(answer)));
    });

    onValue(candidatesRef, (snapshot) => {
        snapshot.forEach((childSnapshot) => {
            const candidate = JSON.parse(childSnapshot.val());
            peerConnection.addIceCandidate(new RTCIceCandidate(candidate))
                .catch((error) => console.error('Chyba pri pridávaní ICE kandidáta:', error));
        });
    });
});

// Nastavenie funkcií tlačidiel
function setupButtons() {
    // Prepínanie mikrofónu
    muteBtn.addEventListener('click', () => {
        const audioTrack = localStream.getAudioTracks()[0];
        if (audioTrack) {
            audioTrack.enabled = !audioTrack.enabled;
            muteIcon.classList.toggle('fa-microphone-slash', !audioTrack.enabled);
            muteIcon.classList.toggle('fa-microphone', audioTrack.enabled);
        }
    });

    // Prepínanie kamery
    cameraBtn.addEventListener('click', () => {
        const videoTrack = localStream.getVideoTracks()[0];
        if (videoTrack) {
            videoTrack.enabled = !videoTrack.enabled;
            cameraIcon.classList.toggle('fa-video-slash', !videoTrack.enabled);
            cameraIcon.classList.toggle('fa-video', videoTrack.enabled);
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
