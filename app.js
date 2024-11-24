// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
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
const offerRef = database.ref('/offer');
const answerRef = database.ref('/answer');
const candidatesRef = database.ref('/candidates');

// WebRTC logika
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
        document.getElementById('local-video').srcObject = stream;
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
        document.getElementById('remote-video').srcObject = event.streams[0];
    };

    // Odosielanie ICE kandidátov
    peerConnection.onicecandidate = (event) => {
        if (event.candidate) {
            candidatesRef.push(JSON.stringify(event.candidate));
        }
    };
}

// Tvorba ponuky (offer)
document.getElementById('start-call').addEventListener('click', () => {
    initializePeerConnection();

    peerConnection.createOffer()
        .then((offer) => {
            peerConnection.setLocalDescription(offer);
            offerRef.set(JSON.stringify(offer));
        })
        .catch((error) => console.error('Chyba pri vytváraní ponuky:', error));
});

// Prijatie ponuky a vytvorenie odpovede
document.getElementById('join-call').addEventListener('click', () => {
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

    answerRef.on('value', (snapshot) => {
        const answer = snapshot.val();
        if (!answer) return;

        peerConnection.setRemoteDescription(new RTCSessionDescription(JSON.parse(answer)));
    });

    candidatesRef.on('child_added', (snapshot) => {
        const candidate = JSON.parse(snapshot.val());
        peerConnection.addIceCandidate(new RTCIceCandidate(candidate))
            .catch((error) => console.error('Chyba pri pridávaní ICE kandidáta:', error));
    });
});

// Nastavenie funkcií tlačidiel
function setupButtons() {
    // Prepínanie mikrofónu
    document.getElementById('mute-btn').addEventListener('click', () => {
        const audioTrack = localStream.getAudioTracks()[0];
        audioTrack.enabled = !audioTrack.enabled;
    });

    // Prepínanie kamery
    document.getElementById('camera-btn').addEventListener('click', () => {
        const videoTrack = localStream.getVideoTracks()[0];
        videoTrack.enabled = !videoTrack.enabled;
    });

    // Ukončenie hovoru
    document.getElementById('hangup-btn').addEventListener('click', () => {
        if (localStream) {
            localStream.getTracks().forEach((track) => track.stop());
        }
        document.getElementById('local-video').srcObject = null;
        document.getElementById('remote-video').srcObject = null;
        alert('Hovor bol ukončený.');
    });
}
