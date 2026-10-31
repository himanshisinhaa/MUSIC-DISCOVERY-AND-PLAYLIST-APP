const SPOTIFY_API_URL = "https://api.spotify.com/v1";
const SPOTIFY_CONFIG = {
    clientId: "ef1fe1d2a6f84e55a54c40f95c53c163",
    redirectUri: "http://127.0.0.1:5500/index1.html",

    scopes: [
        "user-read-private",
        "user-read-email",
        "playlist-read-private",
        "playlist-modify-public",
        "playlist-modify-private"
    ]
};

const SPOTIFY_AUTH_URL =
    "https://accounts.spotify.com/authorize";

const SPOTIFY_TOKEN_URL =
    "https://accounts.spotify.com/api/token";

