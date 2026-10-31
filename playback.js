const playButton = document.createElement("button");
playButton.type = "button";
playButton.className = "play-track-button";
playButton.textContent = "Play";

playButton.dataset.trackUri = track.uri;

playButton.addEventListener("click", async (event) => {
    event.stopPropagation();
    await window.playSpotifyTrack(track);
});

actions.append(playButton);