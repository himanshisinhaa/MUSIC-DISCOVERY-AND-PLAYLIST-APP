
/* =========================================
   CADENCE STUDIO — OCEANIC MUSIC DISCOVERY
   Horizontal Songs, Artists and Albums
========================================= */

let lastSearchResults = [];

/* =========================================
   SEARCH SPOTIFY
========================================= */

async function performMusicSearch() {
    const input = document.getElementById("searchInput");
    const container = document.getElementById("searchResults");
    const button = document.getElementById("searchButton");

    if (!input || !container) {
        console.error("Search input or results container is missing.");
        return;
    }

    const query = input.value.trim();

    if (!query) {
        container.replaceChildren();

        const message = document.createElement("p");
        message.className = "search-message";
        message.textContent = "Enter a song, artist, or album to discover music.";

        container.appendChild(message);
        return;
    }

    container.replaceChildren();

    const loading = document.createElement("p");
    loading.className = "search-message";
    loading.textContent = "🌊 Discovering music...";
    container.appendChild(loading);

    if (button) button.disabled = true;

    try {
        const data = await searchSpotify(query);

        lastSearchResults = [
            ...(data.tracks?.items || []),
            ...(data.artists?.items || []),
            ...(data.albums?.items || [])
        ];

        renderMusicSearchResults(data);

    } catch (error) {
        console.error("Music search failed:", error);

        container.replaceChildren();

        const message = document.createElement("p");
        message.className = "search-message";
        message.textContent = error.message || "Unable to search Spotify.";

        container.appendChild(message);

    } finally {
        if (button) button.disabled = false;
    }
}

/* =========================================
   RENDER THREE SEPARATE HORIZONTAL ROWS
========================================= */

function renderMusicSearchResults(data) {
    const container = document.getElementById("searchResults");
    if (!container) return;

    container.replaceChildren();

    const tracks = data.tracks?.items || [];
    const artists = data.artists?.items || [];
    const albums = data.albums?.items || [];

    if (!tracks.length && !artists.length && !albums.length) {
        const message = document.createElement("p");
        message.className = "search-message";
        message.textContent = "No results found. Try another search.";
        container.appendChild(message);
        return;
    }

    if (tracks.length) {
        createCategorySection(
            container,
            "songs-section",
            "fa-music",
            "Songs",
            tracks,
            createTrackCard
        );
    }

    if (artists.length) {
        createCategorySection(
            container,
            "artists-section",
            "fa-microphone",
            "Artists",
            artists,
            createArtistCard
        );
    }

    if (albums.length) {
        createCategorySection(
            container,
            "albums-section",
            "fa-compact-disc",
            "Albums",
            albums,
            createAlbumCard
        );
    }
}

/* =========================================
   CATEGORY SECTION AND HEADING
========================================= */

function createCategorySection(
    parent,
    sectionClass,
    iconClass,
    headingText,
    items,
    cardCreator
) {
    const section = document.createElement("section");
    section.className = `music-category ${sectionClass}`;

    const heading = document.createElement("h3");
    heading.className = `${sectionClass.replace("-section", "")}-heading`;

    const icon = document.createElement("i");
    icon.className = `fa-solid ${iconClass}`;
    icon.setAttribute("aria-hidden", "true");

    const label = document.createElement("span");
    label.textContent = headingText;

    heading.append(icon, label);

    const grid = document.createElement("div");
    grid.className = "results-grid";

    items.forEach(item => {
        grid.appendChild(cardCreator(item));
    });

    section.append(heading, grid);
    parent.appendChild(section);
}

/* =========================================
   IMAGE HELPER
========================================= */

function createDiscoveryImage(url, altText = "") {
    const image = document.createElement("img");

    image.className = "discovery-image";
    image.alt = altText;
    image.loading = "lazy";

    if (url) {
        image.src = url;
    } else {
        image.classList.add("image-placeholder");
        image.alt = "Artwork unavailable";
        image.hidden = true;
    }

    image.addEventListener("error", () => {
        image.hidden = true;
    });

    return image;
}

/* =========================================
   TRACK / SONG CARD
========================================= */

function createTrackCard(track) {
    const card = document.createElement("article");
    card.className = "discovery-card track-card";

    const image = createDiscoveryImage(
        track.album?.images?.[0]?.url,
        `${track.name} cover`
    );

    const title = document.createElement("h4");
    title.textContent = track.name || "Unknown song";
    title.title = title.textContent;

    const artist = document.createElement("p");
    artist.textContent =
        track.artists?.map(item => item.name).join(", ") ||
        "Unknown artist";

    artist.title = artist.textContent;

    const album = document.createElement("p");
    album.className = "discovery-meta";
    album.textContent = track.album?.name || "Unknown album";
    album.title = album.textContent;

    const actions = document.createElement("div");
    actions.className = "discovery-actions";

    const selectButton = document.createElement("button");
    selectButton.type = "button";
    selectButton.textContent = "Add to selection";

    selectButton.addEventListener("click", () => {
        if (typeof addTrackToSelection === "function") {
            addTrackToSelection(track);
        } else {
            showDiscoveryMessage("Playlist selection is unavailable.");
        }
    });

    const playlistButton = document.createElement("button");
    playlistButton.type = "button";
    playlistButton.textContent = "Add to playlist";

    playlistButton.addEventListener("click", () => {
        if (typeof openPlaylistModal === "function") {
            openPlaylistModal(track);
        } else {
            showDiscoveryMessage("Playlist window is unavailable.");
        }
    });

actions.append(selectButton, playlistButton);
card.append(image, title, artist, album, actions);

// Double-click the song cover to open Spotify
image.style.cursor = "pointer";
image.title = "Double-click to open this song on Spotify";

image.addEventListener("dblclick", function (event) {
    event.preventDefault();
    event.stopPropagation();

    const spotifyUrl = track.external_urls?.spotify;

    if (spotifyUrl) {
        window.open(spotifyUrl, "_blank", "noopener,noreferrer");
    } else {
        alert("Spotify link is unavailable for this song.");
    }
});

return card;
}

/* =========================================
   ARTIST CARD
========================================= */

function createArtistCard(artist) {
    const card = document.createElement("article");
    card.className = "discovery-card artist-card";

    const image = createDiscoveryImage(
        artist.images?.[0]?.url,
        `${artist.name} artwork`
    );

    const title = document.createElement("h4");
    title.textContent = artist.name || "Unknown artist";
    title.title = title.textContent;

    const followers = document.createElement("p");
    followers.textContent = artist.followers?.total != null
        ? `${artist.followers.total.toLocaleString()} followers`
        : "Spotify artist";

    const link = document.createElement("a");
    link.className = "discovery-link";
    link.href = artist.external_urls?.spotify || "#";
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.textContent = "View artist";

    card.append(image, title, followers, link);

    return card;
}

/* =========================================
   ALBUM CARD
========================================= */

function createAlbumCard(album) {
    const card = document.createElement("article");
    card.className = "discovery-card album-card";

    const image = createDiscoveryImage(
        album.images?.[0]?.url,
        `${album.name} cover`
    );

    const title = document.createElement("h4");
    title.textContent = album.name || "Unknown album";
    title.title = title.textContent;

    const artist = document.createElement("p");
    artist.textContent =
        album.artists?.map(item => item.name).join(", ") ||
        "Unknown artist";

    artist.title = artist.textContent;

    const release = document.createElement("p");
    release.className = "discovery-meta";
    release.textContent = album.release_date
        ? `Released ${album.release_date}`
        : "Album";

    const link = document.createElement("a");
    link.className = "discovery-link";
    link.href = album.external_urls?.spotify || "#";
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.textContent = "Open album";

    card.append(image, title, artist, release, link);

    return card;
}

/* =========================================
   DISCOVERY MESSAGE
========================================= */

function showDiscoveryMessage(message) {
    const container = document.getElementById("discoveryContainer");

    if (!container) {
        console.warn(message);
        return;
    }

    const text = document.createElement("p");
    text.className = "search-message";
    text.textContent = message;

    container.replaceChildren(text);
}

/* =========================================
   EVENT LISTENERS
========================================= */

document.addEventListener("DOMContentLoaded", () => {
    const searchButton = document.getElementById("searchButton");
    const searchInput = document.getElementById("searchInput");
    const browseButton = document.getElementById("browseBtn");

    searchButton?.addEventListener("click", performMusicSearch);

    searchInput?.addEventListener("keydown", event => {
        if (event.key === "Enter") {
            performMusicSearch();
        }
    });

    browseButton?.addEventListener("click", () => {
        document.getElementById("library")?.scrollIntoView({
            behavior: "smooth",
            block: "start"
        });
    });
});
// Make the song cover open Spotify on double-click
image.style.cursor = "pointer";
image.title = "Double-click to open on Spotify";

image.addEventListener("dblclick", (event) => {
    event.stopPropagation();

    const spotifyUrl = track.external_urls?.spotify;

    if (spotifyUrl) {
        window.open(spotifyUrl, "_blank", "noopener,noreferrer");
    } else {
        console.warn("Spotify link is unavailable for this song.");
    }
});
function updateCurrentSongName(track) {
    const songName = document.getElementById("currentSongName");

    if (songName && track) {
        songName.textContent = track.name || "Unknown song";
    }
}

const actions = document.createElement("div");
actions.className = "cadence-result-actions";

const selectionButton = document.createElement("button");
selectionButton.type = "button";
selectionButton.className = "add-selection-btn";
selectionButton.innerHTML =
    '<i class="fa-solid fa-plus"></i><span>Add to selection</span>';
selectionButton.setAttribute("aria-pressed", "false");

selectionButton.addEventListener("click", () => {
    // Reuse the selection array if your project already has one.
    if (!Array.isArray(window.selectedTracks)) {
        window.selectedTracks = [];
    }

    const alreadySelected = window.selectedTracks.some(
        item => item.id === track.id
    );

    if (alreadySelected) {
        window.selectedTracks = window.selectedTracks.filter(
            item => item.id !== track.id
        );

        selectionButton.classList.remove("is-selected");
        selectionButton.setAttribute("aria-pressed", "false");
        selectionButton.innerHTML =
            '<i class="fa-solid fa-plus"></i><span>Add to selection</span>';
    } else {
        window.selectedTracks.push(track);

        selectionButton.classList.add("is-selected");
        selectionButton.setAttribute("aria-pressed", "true");
        selectionButton.innerHTML =
            '<i class="fa-solid fa-check"></i><span>Selected</span>';
    }
});

const playlistButton = document.createElement("button");
playlistButton.type = "button";
playlistButton.className = "add-playlist-btn";
playlistButton.innerHTML =
    '<i class="fa-solid fa-list-music"></i><span>Add to playlist</span>';

playlistButton.addEventListener("click", () => {
    // Keep compatibility with the playlist modal in your HTML.
    const modal = document.getElementById("playlistModal");
    const selectedTrack = document.getElementById("selectedTrack");
    const playlistList = document.getElementById("modalPlaylistList");

    if (selectedTrack) {
        selectedTrack.replaceChildren();

        const trackInfo = document.createElement("div");
        trackInfo.className = "selected-track-preview";

        const title = document.createElement("strong");
        title.textContent = track.name || "Selected track";

        const artist = document.createElement("p");
        artist.textContent =
            track.artists?.map(item => item.name).join(", ") || "Unknown artist";

        trackInfo.append(title, artist);
        selectedTrack.appendChild(trackInfo);
    }

    if (modal) {
        modal.setAttribute("aria-hidden", "false");
    }

    // Let your existing playlist-modal code populate the playlist options.
    if (playlistList && !playlistList.children.length) {
        const message = document.createElement("p");
        message.textContent =
            "Choose a playlist to add this track to.";
        playlistList.appendChild(message);
    }

    // Store the track for the existing playlist selection handler.
    window.currentTrackForPlaylist = track;
});
actions.append(selectionButton, playlistButton);

