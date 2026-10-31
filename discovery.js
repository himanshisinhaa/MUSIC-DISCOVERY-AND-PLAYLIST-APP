
/* =========================================
   CADENCE STUDIO — MUSIC DISCOVERY
========================================= */

let lastSearchResults = [];


/* =========================================
   SEARCH SPOTIFY
========================================= */

async function performMusicSearch() {
    const input = document.getElementById("searchInput");
    const resultsContainer = document.getElementById("searchResults");

    if (!input || !resultsContainer) {
        console.error("Search input or results container is missing.");
        return;
    }

    const query = input.value.trim();

    if (!query) {
        resultsContainer.textContent =
            "Enter a song, artist, or album to discover music.";
        return;
    }

    resultsContainer.replaceChildren();

    const loading = document.createElement("p");
    loading.textContent = "Searching Spotify...";
    resultsContainer.appendChild(loading);

    const searchButton = document.getElementById("searchButton");

    if (searchButton) {
        searchButton.disabled = true;
    }

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

        resultsContainer.replaceChildren();

        const message = document.createElement("p");
        message.textContent = error.message;
        resultsContainer.appendChild(message);

    } finally {
        if (searchButton) {
            searchButton.disabled = false;
        }
    }
}


/* =========================================
   RENDER SEARCH RESULTS
========================================= */

function renderMusicSearchResults(data) {
    const container = document.getElementById("searchResults");

    if (!container) return;

    container.replaceChildren();

    const tracks = data.tracks?.items || [];
    const artists = data.artists?.items || [];
    const albums = data.albums?.items || [];

    if (
        tracks.length === 0 &&
        artists.length === 0 &&
        albums.length === 0
    ) {
        container.textContent = "No results found. Try another search.";
        return;
    }

    if (tracks.length > 0) {
        appendResultsHeading(container, "Songs");

        tracks.forEach(track => {
            container.appendChild(createTrackCard(track));
        });
    }

    if (artists.length > 0) {
        appendResultsHeading(container, "Artists");

        artists.forEach(artist => {
            container.appendChild(createArtistCard(artist));
        });
    }

    if (albums.length > 0) {
        appendResultsHeading(container, "Albums");

        albums.forEach(album => {
            container.appendChild(createAlbumCard(album));
        });
    }
}


/* =========================================
   SECTION HEADING
========================================= */

function appendResultsHeading(container, text) {
    const heading = document.createElement("h3");
    heading.className = "search-results-heading";
    heading.textContent = text;

    container.appendChild(heading);
}


/* =========================================
   TRACK CARD
========================================= */

function createTrackCard(track) {
    const card = document.createElement("article");
    card.className = "discovery-card track-card";

    const image = document.createElement("img");
    image.className = "discovery-image";
    image.alt = "";
    image.loading = "lazy";

    image.src =
        track.album?.images?.[0]?.url || "";

    if (!image.src) {
        image.hidden = true;
    }

    const title = document.createElement("h4");
    title.textContent = track.name;

    const artist = document.createElement("p");
    artist.textContent =
        track.artists?.map(item => item.name).join(", ") ||
        "Unknown artist";

    const album = document.createElement("p");
    album.className = "discovery-meta";
    album.textContent = track.album?.name || "Unknown album";

    const actions = document.createElement("div");
    actions.className = "discovery-actions";

    const selectButton = document.createElement("button");
    selectButton.type = "button";
    selectButton.textContent = "Add to selection";

    selectButton.addEventListener("click", () => {
        if (typeof addTrackToSelection !== "function") {
            console.error("Playlist selection function is unavailable.");
            return;
        }

        addTrackToSelection(track);
    });

    const existingPlaylistButton = document.createElement("button");
    existingPlaylistButton.type = "button";
    existingPlaylistButton.textContent = "Add to playlist";

    existingPlaylistButton.addEventListener("click", () => {
        if (typeof openPlaylistModal === "function") {
            openPlaylistModal(track);
        } else {
            console.error("Playlist modal function is unavailable.");
        }
    });

    actions.append(selectButton, existingPlaylistButton);
    card.append(image, title, artist, album, actions);

    return card;
}


/* =========================================
   ARTIST CARD
========================================= */

function createArtistCard(artist) {
    const card = document.createElement("article");
    card.className = "discovery-card artist-card";

    const image = document.createElement("img");
    image.className = "discovery-image artist-image";
    image.alt = "";
    image.loading = "lazy";

    image.src = artist.images?.[0]?.url || "";

    if (!image.src) {
        image.hidden = true;
    }

    const title = document.createElement("h4");
    title.textContent = artist.name;

    const followers = document.createElement("p");
    followers.textContent = artist.followers
        ? `${artist.followers.total.toLocaleString()} followers`
        : "Artist";

    const link = document.createElement("a");
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

    const image = document.createElement("img");
    image.className = "discovery-image";
    image.alt = "";
    image.loading = "lazy";

    image.src = album.images?.[0]?.url || "";

    if (!image.src) {
        image.hidden = true;
    }

    const title = document.createElement("h4");
    title.textContent = album.name;

    const artist = document.createElement("p");
    artist.textContent =
        album.artists?.map(item => item.name).join(", ") ||
        "Unknown artist";

    const release = document.createElement("p");
    release.className = "discovery-meta";
    release.textContent = album.release_date
        ? `Released ${album.release_date}`
        : "Album";

    const link = document.createElement("a");
    link.href = album.external_urls?.spotify || "#";
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.textContent = "Open album";

    card.append(image, title, artist, release, link);

    return card;
}


/* =========================================
   UPDATE DISCOVERY SECTION
========================================= */

function showDiscoveryMessage(message) {
    const container = document.getElementById("discoveryContainer");

    if (!container) return;

    container.replaceChildren();

    const text = document.createElement("p");
    text.textContent = message;

    container.appendChild(text);
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
