
/* =========================================
   1. SPOTIFY API REQUEST HELPER
========================================= */

async function spotifyRequest(endpoint, options = {}) {
    const token = await getValidSpotifyToken();

    if (!token) {
        throw new Error(
            "Spotify is not connected. Please connect again."
        );
    }

    const cleanEndpoint = endpoint.startsWith("/")
        ? endpoint
        : `/${endpoint}`;

    const response = await fetch(
        `${SPOTIFY_API_URL}${cleanEndpoint}`,
        {
            ...options,
            headers: {
                Authorization: `Bearer ${token}`,
                ...(options.body
                    ? { "Content-Type": "application/json" }
                    : {}),
                ...(options.headers || {})
            }
        }
    );

    const text = await response.text();
    let data = {};

    try {
        data = text ? JSON.parse(text) : {};
    } catch {
        data = { message: text };
    }

    if (!response.ok) {
        const message =
            data?.error?.message ||
            data?.error_description ||
            data?.message ||
            `HTTP ${response.status}`;

        console.error("Spotify API error details:", {
            status: response.status,
            message,
            endpoint
        });

        if (response.status === 400) {
            throw new Error(
                `Spotify API error (400): ${message}. ` +
                "Check the search limit, query parameters, and request body."
            );
        }

        if (response.status === 401) {
            localStorage.removeItem("spotify_access_token");
            localStorage.removeItem("spotify_expires_at");

            throw new Error(
                `Spotify authentication failed: ${message}. Reconnect Spotify.`
            );
        }

        if (response.status === 403) {
            throw new Error(
                `Spotify permission denied (403): ${message}`
            );
        }

        if (response.status === 404) {
            throw new Error(
                `Spotify resource not found (404): ${message}`
            );
        }

        if (response.status === 429) {
            throw new Error(
                "Spotify rate limit reached. Please wait and retry."
            );
        }

        throw new Error(
            `Spotify API error (${response.status}): ${message}`
        );
    }

    return data;
}


/* =========================================
   2. GET CURRENT USER
========================================= */

async function getCurrentUser() {
    return spotifyRequest("/me");
}


/* =========================================
   3. SEARCH SPOTIFY
   FIX: Search limit is 10, not 20.
========================================= */

async function searchSpotify(query) {
    if (!query || !query.trim()) {
        throw new Error(
            "Please enter a song, artist, or album."
        );
    }

    const params = new URLSearchParams({
        q: query.trim(),
        type: "track,artist,album",
        limit: "10"
    });

    return spotifyRequest(`/search?${params.toString()}`);
}


/* =========================================
   4. GET USER PLAYLISTS
========================================= */

async function getUserPlaylists() {
    return spotifyRequest("/me/playlists?limit=50");
}


/* =========================================
   5. GET CURRENT PLAYBACK
========================================= */

async function getCurrentPlayback() {
    return spotifyRequest("/me/player");
}


/* =========================================
   6. ADD TRACK TO A PLAYLIST
========================================= */

async function addTrackToPlaylist(playlistId, trackUri) {
    if (!playlistId || !trackUri) {
        throw new Error(
            "Playlist ID and track URI are required."
        );
    }

    return spotifyRequest(
        `/playlists/${encodeURIComponent(playlistId)}/items`,
        {
            method: "POST",
            body: JSON.stringify({
                uris: [trackUri]
            })
        }
    );
}


/* =========================================
   7. CREATE A SPOTIFY PLAYLIST
========================================= */

async function createSpotifyPlaylist(name, description = "") {
    if (!name || !name.trim()) {
        throw new Error("Please enter a playlist name.");
    }

    return spotifyRequest("/me/playlists", {
        method: "POST",
        body: JSON.stringify({
            name: name.trim(),
            description,
            public: false
        })
    });
}


/* =========================================
   8. DISPLAY SPOTIFY PROFILE
========================================= */

function displaySpotifyUser(user) {
    if (!user) return;

    const avatar = document.getElementById("profileAvatar");

    if (!avatar) {
        console.warn(
            "Profile avatar #profileAvatar was not found."
        );
        return;
    }

    const name = user.display_name || "Spotify User";

    avatar.textContent = name.substring(0, 2).toUpperCase();
    avatar.title = name;
}


/* =========================================
   9. DISPLAY SPOTIFY PLAYLISTS
========================================= */

function displaySpotifyPlaylists(playlists) {
    const container = document.getElementById("spotifyPlaylists");

    if (!container) {
        console.error(
            "Playlist container #spotifyPlaylists was not found."
        );
        return;
    }

    container.replaceChildren();

    if (!playlists || playlists.length === 0) {
        const emptyMessage = document.createElement("p");
        emptyMessage.textContent = "No Spotify playlists found.";
        container.appendChild(emptyMessage);
        return;
    }

    playlists.forEach(playlist => {
        const card = document.createElement("a");

        card.className = "spotify-playlist-card";
        card.href = playlist.external_urls?.spotify || "#";
        card.target = "_blank";
        card.rel = "noopener noreferrer";

        const image = document.createElement("img");
        image.className = "playlist-cover";
        image.alt = "";
        image.loading = "lazy";

        if (playlist.images?.length) {
            image.src = playlist.images[0].url;
        } else {
            image.hidden = true;
        }

        const title = document.createElement("h3");
        title.textContent = playlist.name || "Untitled playlist";

        const details = document.createElement("p");
        details.textContent =
            `${playlist.tracks?.total ?? 0} tracks`;

        card.append(image, title, details);
        container.appendChild(card);
    });
}


/* =========================================
   10. LOAD SPOTIFY DATA
========================================= */

async function loadSpotifyData() {
    console.log("Loading Spotify data...");

    try {
        const user = await getCurrentUser();

        console.log("Connected Spotify user:", user.display_name);
        displaySpotifyUser(user);

        const playlistData = await getUserPlaylists();
        const playlists = playlistData.items || [];

        console.log("Spotify playlists:", playlists);
        displaySpotifyPlaylists(playlists);

        const button = document.getElementById("spotifyLoginButton");

        if (button) {
            button.textContent = "SPOTIFY CONNECTED";
            button.classList.add("connected");
        }

        console.log("Spotify data loaded successfully.");

        return { user, playlists };

    } catch (error) {
        console.error(
            "Could not load Spotify data:",
            error.message
        );

        throw error;
    }
}


/* =========================================
   11. TEST SPOTIFY CONNECTION
========================================= */

async function testSpotifyConnection() {
    try {
        const user = await getCurrentUser();

        console.log("Spotify connection successful!");
        console.log("Display name:", user.display_name);
        console.log("User ID:", user.id);

        return true;

    } catch (error) {
        console.error(
            "Spotify connection failed:",
            error.message
        );

        return false;
    }
}


/* =========================================
   12. REFRESH PLAYLISTS BUTTON
========================================= */

document.getElementById("refreshPlaylists")
    ?.addEventListener("click", async () => {
        const container =
            document.getElementById("spotifyPlaylists");

        if (container) {
            container.textContent = "Loading playlists...";
        }

        try {
            const data = await getUserPlaylists();
            displaySpotifyPlaylists(data.items || []);

        } catch (error) {
            if (container) {
                container.textContent = error.message;
            }

            console.error(error);
        }
    });

/* =========================================
   13. LISTENING STORY — REAL SPOTIFY DATA
========================================= */

// Get recently played songs
async function getRecentlyPlayedTracks() {
    return spotifyRequest("/me/player/recently-played?limit=10");
}

// Get top artists over a selected period
async function getTopArtists(timeRange = "medium_term") {
    const params = new URLSearchParams({
        time_range: timeRange,
        limit: "10"
    });

    return spotifyRequest(`/me/top/artists?${params.toString()}`);
}

// Get top tracks over a selected period
async function getTopTracks(timeRange = "medium_term") {
    const params = new URLSearchParams({
        time_range: timeRange,
        limit: "10"
    });

    return spotifyRequest(`/me/top/tracks?${params.toString()}`);
}

