// Importovanie funkcií z WebRTC API (alebo iných knižníc, ak sú potrebné)
import { RTCPeerConnection, RTCSessionDescription } from "webrtc-adapter";

// ICE konfigurácia
const iceConfig = {
    iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
};

let localStream;
let peerConnection;

// Načítanie lokálneho streamu
navigator.mediaDevices.getUserMedia({ video: true, audio: true })
    .then((stream) => {
        localStream = stream;
        document.getElementById('local-video').srcObject = stream;
    })
    .catch((error) => {
        console.error('Chyba pri prístupe ku kamere/mikrofónu:', error);
        alert('Nie je možné pristúpiť ku kamere/mikrofónu.');
    });

// Tvorba Peer-to-Peer spojenia
function createPeerConnection() {
    peerConnection = new RTCPeerConnection(iceConfig);

    // Pridanie lokálnych stôp
    localStream.getTracks().forEach((track) => peerConnection.addTrack(track, localStream));

    // Prijatie vzdialených stôp
    peerConnection.ontrack = (event) => {
        document.getElementById('remote-video').srcObject = event.streams[0];
    };

    // ICE kandidáti
    peerConnection.onicecandidate = (event) => {
        if (event.candidate) {
            console.log("ICE kandidát odoslaný:", event.candidate);
        }
    };
}

// Pripojenie k hovoru
document.getElementById('start-call').addEventListener('click', () => {
    createPeerConnection();

    peerConnection.createOffer()
        .then((offer) => {
            return peerConnection.setLocalDescription(offer);
        })
        .then(() => {
            console.log("Ponuka vytvorená:", peerConnection.localDescription);
        })
        .catch((error) => console.error('Chyba pri vytváraní ponuky:', error));
});

document.getElementById('join-call').addEventListener('click', () => {
    createPeerConnection();

    // Prijatie ponuky (príklad, kde by sa načítala ponuka zo servera)
    const offer = {/* Načítaná ponuka */};
    peerConnection.setRemoteDescription(new RTCSessionDescription(offer))
        .then(() => peerConnection.createAnswer())
        .then((answer) => {
            return peerConnection.setLocalDescription(answer);
        })
        .then(() => {
            console.log("Odpoveď vytvorená:", peerConnection.localDescription);
        })
        .catch((error) => console.error('Chyba pri prijímaní ponuky:', error));
});
