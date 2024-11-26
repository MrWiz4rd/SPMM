const socket = io();
const localVideo = document.getElementById('local-video');
const remoteVideos = [
    document.getElementById('remote-video-1'),
    document.getElementById('remote-video-2'),
    document.getElementById('remote-video-3'),
];
const muteBtn = document.getElementById('mute-btn');
const cameraBtn = document.getElementById('camera-btn');
const hangupBtn = document.getElementById('hangup-btn');
const muteIcon = document.getElementById('mute-icon');
const cameraIcon = document.getElementById('camera-icon');

let localStream = null;
let peerConnections = {};
let videoAssignments = {};
let pendingICECandidates = {};
let pendingSignals = [];

// ICE server config (Xirsys)
const config = {
    iceServers: [
        { urls: ["stun:fr-turn8.xirsys.com"] },
        {
            username: "9w3hi9eeV_UJu8PN1EbNENx4RJl4YL_8dDfKsPbOa9PFCZpSwsELwycOqrqqflGjAAAAAGdF9JNXaXp5eQ==",
            credential: "eb47a1f4-ac11-11ef-b454-0242ac120004",
            urls: [
                "turn:fr-turn8.xirsys.com:80?transport=udp",
                "turn:fr-turn8.xirsys.com:3478?transport=udp",
                "turn:fr-turn8.xirsys.com:80?transport=tcp",
                "turn:fr-turn8.xirsys.com:3478?transport=tcp",
                "turns:fr-turn8.xirsys.com:443?transport=tcp",
                "turns:fr-turn8.xirsys.com:5349?transport=tcp"
            ]
        }
    ]
};

// Inicializácia mediálneho streamu
async function initializeMedia() {
    try {
        localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        console.log('Úspešne získaný stream:', localStream);
        localVideo.srcObject = localStream;

        socket.emit('join');

        // Spracovanie odložených signalizácií
        if (pendingSignals.length > 0) {
            console.log('Spracovanie odložených signalizácií...');
            pendingSignals.forEach((signal) => handleSignal(signal));
            pendingSignals = [];
        }
    } catch (error) {
        console.error('Chyba pri získavaní mediálneho streamu:', error);
        alert('Kamera alebo mikrofón neboli povolené.');
    }
}

// Zavolanie inicializácie streamu
initializeMedia();

// Vytvorenie PeerConnection
function createPeerConnection(id) {
    if (!localStream) {
        console.error(`localStream nie je pripravený pre ID: ${id}`);
        return null;
    }

    const peerConnection = new RTCPeerConnection(config);

    peerConnection.onicecandidate = (event) => {
        if (event.candidate) {
            socket.emit('signal', { target: id, candidate: event.candidate });
        }
    };

    peerConnection.ontrack = (event) => {
        if (!videoAssignments[id]) {
            const availableVideo = remoteVideos.find((video) => !Object.values(videoAssignments).includes(video));
            if (availableVideo) {
                videoAssignments[id] = availableVideo;
                availableVideo.srcObject = event.streams[0];
                console.log(`Priradený vzdialený stream k video oknu pre ID: ${id}`);
            } else {
                console.error('Nie sú dostupné voľné video prvky pre ID:', id);
            }
        }
    };

    localStream.getTracks().forEach((track) => peerConnection.addTrack(track, localStream));

    return peerConnection;
}

// Spracovanie signalizačných správ
socket.on('signal', (data) => {
    if (!localStream) {
        console.log('Odkladám signalizačnú správu, kým sa nepripraví localStream:', data);
        pendingSignals.push(data);
        return;
    }
    handleSignal(data);
});

async function handleSignal(data) {
    const { from, offer, answer, candidate } = data;

    if (!peerConnections[from]) {
        peerConnections[from] = createPeerConnection(from);
    }

    const peerConnection = peerConnections[from];

    if (offer) {
        console.log('Prijatá ponuka od:', from);
        await peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
        const answer = await peerConnection.createAnswer();
        await peerConnection.setLocalDescription(answer);
        socket.emit('signal', { target: from, answer: peerConnection.localDescription });

        // Spracovanie odložených ICE kandidátov
        if (pendingICECandidates[from]) {
            console.log(`Spracovanie odložených ICE kandidátov pre ID: ${from}`);
            pendingICECandidates[from].forEach((candidate) => {
                peerConnection.addIceCandidate(candidate).catch((error) => {
                    console.error('Chyba pri pridávaní odloženého ICE kandidáta:', error);
                });
            });
            delete pendingICECandidates[from];
        }
    } else if (answer) {
        console.log('Prijatá odpoveď od:', from);
        await peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
    } else if (candidate) {
        if (peerConnection.remoteDescription) {
            console.log('Prijatý ICE kandidát od:', from);
            await peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
        } else {
            console.log(`Odložený ICE kandidát pre ID: ${from}`);
            if (!pendingICECandidates[from]) pendingICECandidates[from] = [];
            pendingICECandidates[from].push(candidate);
        }
    }
}

// Pripojenie nového účastníka
socket.on('ready', (id) => {
    if (!peerConnections[id]) {
        console.log('Pripájam nového účastníka:', id);
        peerConnections[id] = createPeerConnection(id);
    }

    const peerConnection = peerConnections[id];
    peerConnection.createOffer()
        .then((offer) => peerConnection.setLocalDescription(offer))
        .then(() => {
            socket.emit('signal', { target: id, offer: peerConnection.localDescription });
        });
});

// Odpojenie účastníka
socket.on('participant-left', (id) => {
    console.log('Účastník odpojený:', id);

    if (peerConnections[id]) {
        peerConnections[id].close();
        delete peerConnections[id];
    }

    if (videoAssignments[id]) {
        videoAssignments[id].srcObject = null;
        delete videoAssignments[id];
    }

    if (pendingICECandidates[id]) {
        delete pendingICECandidates[id];
    }
});

// Ovládanie tlačidiel
muteBtn.addEventListener('click', () => {
    if (localStream) {
        const audioTrack = localStream.getAudioTracks()[0];
        audioTrack.enabled = !audioTrack.enabled;
        muteIcon.classList.toggle('fa-microphone-slash', !audioTrack.enabled);
        muteIcon.classList.toggle('fa-microphone', audioTrack.enabled);
        console.log(`Mikrofón ${audioTrack.enabled ? 'zapnutý' : 'vypnutý'}`);
    }
});

cameraBtn.addEventListener('click', () => {
    if (localStream) {
        const videoTrack = localStream.getVideoTracks()[0];
        videoTrack.enabled = !videoTrack.enabled;
        cameraIcon.classList.toggle('fa-video-slash', !videoTrack.enabled);
        cameraIcon.classList.toggle('fa-video', videoTrack.enabled);
        console.log(`Kamera ${videoTrack.enabled ? 'zapnutá' : 'vypnutá'}`);
    }
});

hangupBtn.addEventListener('click', () => {
    console.log('Ukončenie hovoru');
    Object.values(peerConnections).forEach((pc) => pc.close());
    peerConnections = {};
    if (localStream) {
        localStream.getTracks().forEach((track) => track.stop());
        localVideo.srcObject = null;
    }
    remoteVideos.forEach((video) => (video.srcObject = null));
    videoAssignments = {};
    pendingICECandidates = {};
    pendingSignals = [];
    socket.disconnect();
    alert('Hovor bol ukončený.');
});
