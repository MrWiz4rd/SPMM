const webcamElement = document.getElementById('webcam');
const webcamText = document.getElementById('webcam-text');
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
        webcamElement.srcObject = stream; // Pripojenie streamu k video elementu
        console.log('Kamera a mikrofón pripojené.');

        // Skrytie textu po spustení kamery
        webcamText.style.display = 'none';
    })
    .catch((error) => {
        console.error('Chyba pri prístupe ku kamere alebo mikrofónu:', error);
        alert('Kamera alebo mikrofón neboli povolené alebo nie sú dostupné.');
    });

// Funkcia na zapnutie/vypnutie mikrofónu
muteBtn.addEventListener('click', () => {
    if (localStream) {
        const audioTrack = localStream.getAudioTracks()[0];
        if (audioTrack) {
            audioTrack.enabled = !audioTrack.enabled; // Prepnutie stavu mikrofónu

            // Zmena ikony a stavu tlačidla
            muteIcon.classList.toggle('fa-microphone');
            muteIcon.classList.toggle('fa-microphone-slash');
            muteBtn.classList.toggle('active');
            muteBtn.classList.toggle('inactive');
        }
    }
});

// Funkcia na zapnutie/vypnutie kamery
cameraBtn.addEventListener('click', () => {
    if (localStream) {
        const videoTrack = localStream.getVideoTracks()[0];
        if (videoTrack) {
            videoTrack.enabled = !videoTrack.enabled; // Prepnutie stavu kamery

            // Zmena ikony a stavu tlačidla
            cameraIcon.classList.toggle('fa-video');
            cameraIcon.classList.toggle('fa-video-slash');
            cameraBtn.classList.toggle('active');
            cameraBtn.classList.toggle('inactive');
        }
    }
});

// Funkcia na ukončenie hovoru
hangupBtn.addEventListener('click', () => {
    if (localStream) {
        // Zastavenie všetkých stôp (tracks) streamu
        localStream.getTracks().forEach((track) => track.stop());
        webcamElement.srcObject = null; // Odstránenie videa
        alert('Hovor bol ukončený.');
    }
});
