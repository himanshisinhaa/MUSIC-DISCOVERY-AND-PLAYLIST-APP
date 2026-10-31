// ==========================================
// SPOTIFY PKCE AUTHENTICATION
// ==========================================

function generateRandomString(length) {
    const characters =
        "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

    let result = "";

    for (let i = 0; i < length; i++) {
        result += characters.charAt(
            Math.floor(Math.random() * characters.length)
        );
    }

    return result;
}


async function generateCodeChallenge(codeVerifier) {

    const data = new TextEncoder().encode(codeVerifier);

    const digest = await crypto.subtle.digest(
        "SHA-256",
        data
    );

    return btoa(
        String.fromCharCode(...new Uint8Array(digest))
    )
        .replace(/\+/g, "-")
        .replace(/\//g, "_")
        .replace(/=+$/, "");
}


// ==========================================
// LOGIN
// ==========================================

async function loginWithSpotify() {

    const codeVerifier = generateRandomString(128);

    const codeChallenge =
        await generateCodeChallenge(codeVerifier);

    localStorage.setItem(
        "spotify_code_verifier",
        codeVerifier
    );

    const state = generateRandomString(16);

    localStorage.setItem(
        "spotify_auth_state",
        state
    );

    const params = new URLSearchParams({
        response_type: "code",
        client_id: SPOTIFY_CONFIG.clientId,
        scope: SPOTIFY_CONFIG.scopes.join(" "),
        redirect_uri: SPOTIFY_CONFIG.redirectUri,
        state: state,
        code_challenge_method: "S256",
        code_challenge: codeChallenge
    });

    window.location.href =
        `${SPOTIFY_AUTH_URL}?${params.toString()}`;
}
async function loginWithSpotify() {

    const codeVerifier =
        generateRandomString(128);

    const codeChallenge =
        await generateCodeChallenge(codeVerifier);

    localStorage.setItem(
        "spotify_code_verifier",
        codeVerifier
    );

    const state =
        generateRandomString(16);

    localStorage.setItem(
        "spotify_auth_state",
        state
    );

    const params = new URLSearchParams({

        response_type: "code",

        client_id:
            SPOTIFY_CONFIG.clientId,

        scope:
            SPOTIFY_CONFIG.scopes.join(" "),

        redirect_uri:
            SPOTIFY_CONFIG.redirectUri,

        state: state,

        code_challenge_method: "S256",

        code_challenge: codeChallenge
    });

    window.location.href =
        `${SPOTIFY_AUTH_URL}?${params.toString()}`;
}


// ==========================================
// GET ACCESS TOKEN
// ==========================================

async function getSpotifyToken(code) {

    const codeVerifier =
        localStorage.getItem("spotify_code_verifier");

    const response = await fetch(
        SPOTIFY_TOKEN_URL,
        {
            method: "POST",

            headers: {
                "Content-Type":
                    "application/x-www-form-urlencoded"
            },

            body: new URLSearchParams({
                client_id: SPOTIFY_CONFIG.clientId,
                grant_type: "authorization_code",
                code: code,
                redirect_uri:
                    SPOTIFY_CONFIG.redirectUri,
                code_verifier: codeVerifier
            })
        }
    );

    if (!response.ok) {
        throw new Error(
            "Spotify token request failed"
        );
    }

    const data = await response.json();

    localStorage.setItem(
        "spotify_access_token",
        data.access_token
    );

    if (data.refresh_token) {
        localStorage.setItem(
            "spotify_refresh_token",
            data.refresh_token
        );
    }

    localStorage.setItem(
        "spotify_expires_at",
        Date.now() +
        data.expires_in * 1000
    );

    return data.access_token;
}


// ==========================================
// REFRESH TOKEN
// ==========================================

async function refreshSpotifyToken() {

    const refreshToken =
        localStorage.getItem(
            "spotify_refresh_token"
        );

    if (!refreshToken) {
        return null;
    }

    const response = await fetch(
        SPOTIFY_TOKEN_URL,
        {
            method: "POST",

            headers: {
                "Content-Type":
                    "application/x-www-form-urlencoded"
            },

            body: new URLSearchParams({
                client_id: SPOTIFY_CONFIG.clientId,
                grant_type: "refresh_token",
                refresh_token: refreshToken
            })
        }
    );

    if (!response.ok) {
        return null;
    }

    const data = await response.json();

    localStorage.setItem(
        "spotify_access_token",
        data.access_token
    );

    localStorage.setItem(
        "spotify_expires_at",
        Date.now() +
        data.expires_in * 1000
    );

    if (data.refresh_token) {
        localStorage.setItem(
            "spotify_refresh_token",
            data.refresh_token
        );
    }

    return data.access_token;
}


// ==========================================
// GET VALID TOKEN
// ==========================================

async function getValidSpotifyToken() {

    const token =
        localStorage.getItem(
            "spotify_access_token"
        );

    const expiresAt =
        Number(
            localStorage.getItem(
                "spotify_expires_at"
            )
        );

    if (
        token &&
        expiresAt &&
        Date.now() < expiresAt - 60000
    ) {
        return token;
    }

    return await refreshSpotifyToken();
}


// ==========================================
// HANDLE CALLBACK
// ==========================================

async function handleSpotifyCallback() {

    const params =
        new URLSearchParams(
            window.location.search
        );

    const code = params.get("code");
    const state = params.get("state");
    const error = params.get("error");

    if (error) {
        console.error(
            "Spotify login error:",
            error
        );
        return;
    }

    if (!code) {
        return;
    }

    const savedState =
        localStorage.getItem(
            "spotify_auth_state"
        );

    if (state !== savedState) {
        console.error(
            "Spotify state mismatch"
        );
        return;
    }

    try {

        await getSpotifyToken(code);

        localStorage.removeItem(
            "spotify_code_verifier"
        );

        localStorage.removeItem(
            "spotify_auth_state"
        );

        // Remove ?code=... from URL
        window.history.replaceState(
            {},
            document.title,
            window.location.pathname
        );

        console.log(
            "Spotify successfully connected!"
        );

        if (typeof loadSpotifyData === "function") {
            loadSpotifyData();
        }

    } catch (error) {

        console.error(
            "Spotify authentication failed:",
            error
        );
    }
}


document.addEventListener(
    "DOMContentLoaded",
    handleSpotifyCallback
);