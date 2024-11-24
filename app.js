// Výber tlačidiel
const muteBtn = document.getElementById('mute-btn');
const muteIcon = document.getElementById('mute-icon');
const cameraBtn = document.getElementById('camera-btn');
const cameraIcon = document.getElementById('camera-icon');
const hangupBtn = document.getElementById('hangup-btn');

let localStream;

// Získanie prístupu ku kamere a mikrofónu
navigator.mediaDevices.getUserMedia({ video: true, audio: true })
    .then((stream) => {
        localStream = stream; // Uloženie streamu
        document.getElementById('webcam').srcObject = stream; // Pripojenie streamu k video elementu
        document.getElementById('webcam-text').style.display = 'none'; // Skrytie textu
    })
    .catch((error) => {
        console.error('Chyba pri prístupe ku kamere alebo mikrofónu:', error);
        alert('Kamera alebo mikrofón neboli povolené.');
    });

// Funkcia na prepínanie mikrofónu
muteBtn.addEventListener('click', () => {
    if (localStream) {
        const audioTrack = localStream.getAudioTracks()[0];
        if (audioTrack) {
            audioTrack.enabled = !audioTrack.enabled; // Prepnutie stavu mikrofónu

            // Zmena ikony a stavu tlačidla
            muteIcon.classList.toggle('fa-microphone', audioTrack.enabled);
            muteIcon.classList.toggle('fa-microphone-slash', !audioTrack.enabled);
            muteBtn.classList.toggle('inactive', !audioTrack.enabled); // Nastavenie červenej farby
            muteBtn.classList.toggle('active', audioTrack.enabled);   // Nastavenie modrej farby
        }
    }
});

// Funkcia na prepínanie kamery
cameraBtn.addEventListener('click', () => {
    if (localStream) {
        const videoTrack = localStream.getVideoTracks()[0];
        if (videoTrack) {
            videoTrack.enabled = !videoTrack.enabled; // Prepnutie stavu kamery

            // Zmena ikony a stavu tlačidla
            cameraIcon.classList.toggle('fa-video', videoTrack.enabled);
            cameraIcon.classList.toggle('fa-video-slash', !videoTrack.enabled);
            cameraBtn.classList.toggle('inactive', !videoTrack.enabled); // Nastavenie červenej farby
            cameraBtn.classList.toggle('active', videoTrack.enabled);   // Nastavenie modrej farby
        }
    }
});

// Funkcia na ukončenie hovoru
hangupBtn.addEventListener('click', () => {
    if (localStream) {
        // Zastavenie všetkých stôp (tracks) streamu
        localStream.getTracks().forEach((track) => track.stop());
        document.getElementById('webcam').srcObject = null; // Odpojenie streamu
        alert('Hovor bol ukončený.');
    }
});
