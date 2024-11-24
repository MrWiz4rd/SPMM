// Výber prvkov z DOM
const localVideo = document.getElementById('local-video');
const remoteVideo = document.getElementById('remote-video');
const muteBtn = document.getElementById('mute-btn');
const muteIcon = document.getElementById('mute-icon');
const cameraBtn = document.getElementById('camera-btn');
const cameraIcon = document.getElementById('camera-icon');
const hangupBtn = document.getElementById('hangup-btn');

let localStream;
let peerConnection;

// ICE konfigurácia pre WebRTC
const iceConfig = {
    iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] // Verejný STUN server
};

// Získanie lokálneho video/audio streamu
navigator.mediaDevices.getUserMedia({ video: true, audio: true })
    .then((stream) => {
        localStream = stream; // Uloženie lokálneho streamu
        localVideo.srcObject = stream; // Priradenie streamu k lokálnemu video elementu
        initializePeerConnection(); // Inicializácia spojenia po získaní streamu
        setupButtons(); // Nastavenie funkcií tlačidiel
    })
    .catch((error) => {
        console.error('Chyba pri prístupe ku kamere/mikrofónu:', error);
        alert('Nie je možné pristúpiť ku kamere/mikrofónu. Povolenie je potrebné.');
    });

// Funkcia na inicializáciu peer-to-peer spojenia
function initializePeerConnection() {
    peerConnection = new RTCPeerConnection(iceConfig);

    // Pridanie lokálnych audio/video stôp do spojenia
    localStream.getTracks().forEach((track) => {
        peerConnection.addTrack(track, localStream);
    });

    // Prijatie vzdialeného streamu
    peerConnection.ontrack = (event) => {
        remoteVideo.srcObject = event.streams[0]; // Zobrazenie vzdialeného streamu
    };

    // Spracovanie ICE kandidátov
    peerConnection.onicecandidate = (event) => {
        if (event.candidate) {
            console.log('ICE kandidát:', event.candidate);
        }
    };

    // Tvorba a nastavenie lokálnej ponuky (offer)
    peerConnection.createOffer()
        .then((offer) => peerConnection.setLocalDescription(offer))
        .then(() => {
            console.log('Ponuka vytvorená:', peerConnection.localDescription);
        })
        .catch((error) => console.error('Chyba pri vytváraní ponuky:', error));
}

// Nastavenie funkcií tlačidiel
function setupButtons() {
    // Prepínanie mikrofónu
    muteBtn.addEventListener('click', () => {
        const audioTrack = localStream.getAudioTracks()[0];
        if (audioTrack) {
            audioTrack.enabled = !audioTrack.enabled; // Prepnutie stavu mikrofónu
            muteIcon.classList.toggle('fa-microphone-slash', !audioTrack.enabled);
            muteIcon.classList.toggle('fa-microphone', audioTrack.enabled);
            muteBtn.classList.toggle('inactive', !audioTrack.enabled); // Zmena farby tlačidla
            muteBtn.classList.toggle('active', audioTrack.enabled);
        }
    });

    // Prepínanie kamery
    cameraBtn.addEventListener('click', () => {
        const videoTrack = localStream.getVideoTracks()[0];
        if (videoTrack) {
            videoTrack.enabled = !videoTrack.enabled; // Prepnutie stavu kamery
            cameraIcon.classList.toggle('fa-video-slash', !videoTrack.enabled);
            cameraIcon.classList.toggle('fa-video', videoTrack.enabled);
            cameraBtn.classList.toggle('inactive', !videoTrack.enabled); // Zmena farby tlačidla
            cameraBtn.classList.toggle('active', videoTrack.enabled);
        }
    });

    // Ukončenie hovoru
    hangupBtn.addEventListener('click', () => {
        if (localStream) {
            localStream.getTracks().forEach((track) => track.stop()); // Zastavenie všetkých stôp
            localVideo.srcObject = null;
            remoteVideo.srcObject = null;
            alert('Hovor bol ukončený.');
        }
    });
}
