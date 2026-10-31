
/* =========================================
   CADENCE STUDIO — PLAYLIST MANAGEMENT
========================================= */

let selectedTracks = [];
let activeTrack = null;
let availablePlaylists = [];


/* =========================================
   SELECTED TRACK MANAGEMENT
========================================= */

function addTrackToSelection(track) {
    if (!track || !track.uri) {
        console.error("Invalid track:", track);
        return;
    }

    const alreadyAdded = selectedTracks.some(
        item => item.uri === track.uri
    );

    if (alreadyAdded) {
        showPlaylistMessage("This track is already selected.");
        return;
    }

    selectedTracks.push(track);

    showPlaylistMessage(
        `Added "${track.name}" to your selection.`
    );

    renderSelectedTracks();
}


function removeTrackFromSelection(trackUri) {
    selectedTracks = selectedTracks.filter(
        track => track.uri !== trackUri
    );

    renderSelectedTracks();
}


function renderSelectedTracks() {
    const container = document.getElementById("selectedTracks");

    if (!container) return;

    container.replaceChildren();

    if (selectedTracks.length === 0) {
        const message = document.createElement("p");
        message.textContent = "No tracks selected yet.";
        container.appendChild(message);
        return;
    }

    selectedTracks.forEach(track => {
        const row = document.createElement("div");
        row.className = "selected-track-row";

        const label = document.createElement("span");
        label.textContent =
            `${track.name} — ${track.artists?.map(a => a.name).join(", ") || "Unknown artist"}`;

        const removeButton = document.createElement("button");
        removeButton.type = "button";
        removeButton.textContent = "Remove";
        removeButton.addEventListener("click", () => {
            removeTrackFromSelection(track.uri);
        });

        row.append(label, removeButton);
        container.appendChild(row);
    });
}


/* =========================================
   CREATE SPOTIFY PLAYLIST
========================================= */

async function createPlaylistFromSelection() {
    if (selectedTracks.length === 0) {
        alert("Add some songs first!");
        return;
    }

    const nameInput = document.getElementById("playlistName");
    const name = nameInput?.value.trim() || "My Music Discovery";

    const createButton = document.getElementById("createPlaylistBtn");

    if (createButton) {
        createButton.disabled = true;
        createButton.textContent = "Creating...";
    }

    try {
        // Create the playlist for the authenticated Spotify user.
        const playlist = await createSpotifyPlaylist(
            name,
            "Created with Cadence Studio"
        );

        const trackUris = selectedTracks.map(track => track.uri);

        // Add the selected tracks to the new playlist.
        await spotifyRequest(
            `/playlists/${encodeURIComponent(playlist.id)}/items`,
            {
                method: "POST",
                body: JSON.stringify({
                    uris: trackUris
                })
            }
        );

        alert("Playlist created successfully!");

        selectedTracks = [];
        renderSelectedTracks();

        // Refresh the Spotify playlist list.
        if (typeof loadSpotifyData === "function") {
            await loadSpotifyData();
        }

        // Open the newly created playlist.
        if (playlist.external_urls?.spotify) {
            window.open(
                playlist.external_urls.spotify,
                "_blank",
                "noopener,noreferrer"
            );
        }

    } catch (error) {
        console.error("Playlist creation failed:", error);
        alert(`Could not create playlist: ${error.message}`);

    } finally {
        if (createButton) {
            createButton.disabled = false;
            createButton.textContent = "Create Playlist";
        }
    }
}


/* =========================================
   PLAYLIST MODAL
========================================= */

function openPlaylistModal(track) {
    activeTrack = track;

    const modal = document.getElementById("playlistModal");
    const selectedTrackElement = document.getElementById("selectedTrack");

    if (selectedTrackElement) {
        selectedTrackElement.textContent =
            `${track.name} — ${track.artists?.map(a => a.name).join(", ") || "Unknown artist"}`;
    }

    if (modal) {
        modal.classList.add("open");
        modal.setAttribute("aria-hidden", "false");
    }

    loadPlaylistsIntoModal();
}


function closePlaylistModal() {
    const modal = document.getElementById("playlistModal");

    if (modal) {
        modal.classList.remove("open");
        modal.setAttribute("aria-hidden", "true");
    }

    activeTrack = null;
}


async function loadPlaylistsIntoModal() {
    const container = document.getElementById("modalPlaylistList");

    if (!container) return;

    container.textContent = "Loading playlists...";

    try {
        const data = await getUserPlaylists();
        availablePlaylists = data.items || [];

        container.replaceChildren();

        if (availablePlaylists.length === 0) {
            container.textContent = "No playlists found.";
            return;
        }

        availablePlaylists.forEach(playlist => {
            const button = document.createElement("button");
            button.type = "button";
            button.className = "modal-playlist-item";
            button.textContent = playlist.name;

            button.addEventListener("click", async () => {
                if (!activeTrack) return;

                button.disabled = true;

                try {
                    await addTrackToPlaylist(
                        playlist.id,
                        activeTrack.uri
                    );

                    alert(`Added to "${playlist.name}".`);
                    closePlaylistModal();

                } catch (error) {
                    console.error(error);
                    alert(`Could not add track: ${error.message}`);
                    button.disabled = false;
                }
            });

            container.appendChild(button);
        });

    } catch (error) {
        console.error("Could not load modal playlists:", error);
        container.textContent = error.message;
    }
}


/* =========================================
   PLAYLIST STATUS MESSAGE
========================================= */

function showPlaylistMessage(message) {
    const status = document.getElementById("playlistStatus");

    if (status) {
        status.textContent = message;
    } else {
        console.log(message);
    }
}


/* =========================================
   EVENT LISTENERS
========================================= */

document.addEventListener("DOMContentLoaded", () => {
    document.getElementById("createPlaylistBtn")
        ?.addEventListener("click", createPlaylistFromSelection);

    document.getElementById("modalClose")
        ?.addEventListener("click", closePlaylistModal);

    document.getElementById("playlistModal")
        ?.addEventListener("click", event => {
            if (event.target.id === "playlistModal") {
                closePlaylistModal();
            }
        });

    document.getElementById("newPlaylistBtn")
        ?.addEventListener("click", () => {
            const input = document.getElementById("playlistName");

            if (input) {
                input.focus();
            } else {
                showPlaylistMessage(
                    "Add a playlist name input and Create Playlist button to your HTML."
                );
            }
        });

    renderSelectedTracks();
});
