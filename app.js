// Pripojiť sa k hovoru
joinCallButton.addEventListener('click', async () => {
    const remoteOfferText = remoteOfferTextarea.value.trim();

    if (!remoteOfferText) {
        alert("Remote offer pole je prázdne. Skopírujte a vložte remote offer od druhého účastníka.");
        return;
    }

    try {
        const remoteOffer = JSON.parse(remoteOfferText);
        createPeerConnection();

        await peerConnection.setRemoteDescription(remoteOffer);

        const answer = await peerConnection.createAnswer();
        await peerConnection.setLocalDescription(answer);

        localOfferTextarea.value = JSON.stringify(peerConnection.localDescription);
    } catch (error) {
        console.error("Chyba pri parsovaní remote offer:", error);
        alert("Remote offer je neplatný. Skontrolujte, či ste zadali správne dáta.");
    }
});

// Nastaviť remote offer
setRemoteOfferButton.addEventListener('click', async () => {
    const remoteOfferText = remoteOfferTextarea.value.trim();

    if (!remoteOfferText) {
        alert("Remote offer pole je prázdne. Skopírujte a vložte remote offer od druhého účastníka.");
        return;
    }

    try {
        const remoteOffer = JSON.parse(remoteOfferText);
        await peerConnection.setRemoteDescription(remoteOffer);
    } catch (error) {
        console.error("Chyba pri parsovaní remote offer:", error);
        alert("Remote offer je neplatný. Skontrolujte, či ste zadali správne dáta.");
    }
});
