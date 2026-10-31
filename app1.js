// ==========================================
// APP1.JS
// Cadence Studio - Main Application Logic
// ==========================================

document.addEventListener("DOMContentLoaded", () => {

    console.log("Cadence Studio started");

    // ------------------------------------------
    // ELEMENTS
    // ------------------------------------------

    const playButton =
        document.getElementById("playButton");

    const trackProgress =
        document.getElementById("trackProgress");

    const currentTrack =
        document.getElementById("currentTrack");

    const currentArtist =
        document.getElementById("currentArtist");

    const nowPlayingTitle =
        document.getElementById("nowPlayingTitle");

    const startProjectBtn =
        document.getElementById("startProjectBtn");

    const browseBtn =
        document.getElementById("browseBtn");

    const newPlaylistBtn =
        document.getElementById("newPlaylistBtn");

    const modal =
        document.getElementById("playlistModal");

    const modalClose =
        document.getElementById("modalClose");


    // ------------------------------------------
    // PLAYER
    // ------------------------------------------

    let isPlaying = false;
    let progress = 0;
    let progressTimer = null;


    if (playButton) {

        playButton.addEventListener("click", () => {

            isPlaying = !isPlaying;

            if (isPlaying) {

                playButton.textContent = "❚❚";

                playButton.setAttribute(
                    "aria-label",
                    "Pause music"
                );

                playButton.setAttribute(
                    "aria-pressed",
                    "true"
                );

                startProgress();

            } else {

                playButton.textContent = "▶";

                playButton.setAttribute(
                    "aria-label",
                    "Play music"
                );

                playButton.setAttribute(
                    "aria-pressed",
                    "false"
                );

                stopProgress();
            }
        });
    }


    function startProgress() {

        stopProgress();

        progressTimer = setInterval(() => {

            progress += 0.5;

            if (progress >= 100) {

                progress = 0;

                isPlaying = false;

                playButton.textContent = "▶";

                playButton.setAttribute(
                    "aria-pressed",
                    "false"
                );

                stopProgress();
            }

            if (trackProgress) {
                trackProgress.style.width =
                    `${progress}%`;
            }

        }, 500);
    }


    function stopProgress() {

        if (progressTimer) {

            clearInterval(progressTimer);

            progressTimer = null;
        }
    }


    // ------------------------------------------
    // START PROJECT BUTTON
    // ------------------------------------------

    if (startProjectBtn) {

        startProjectBtn.addEventListener(
            "click",
            () => {

                const playlistSection =
                    document.getElementById(
                        "playlists"
                    );

                if (playlistSection) {

                    playlistSection.scrollIntoView({
                        behavior: "smooth"
                    });
                }

                if (newPlaylistBtn) {
                    setTimeout(() => {
                        newPlaylistBtn.focus();
                    }, 600);
                }
            }
        );
    }


    // ------------------------------------------
    // BROWSE LIBRARY
    // ------------------------------------------

    if (browseBtn) {

        browseBtn.addEventListener(
            "click",
            () => {

                const library =
                    document.getElementById(
                        "library"
                    );

                if (library) {

                    library.scrollIntoView({
                        behavior: "smooth"
                    });
                }
            }
        );
    }


    // ------------------------------------------
    // NAVIGATION LINKS
    // ------------------------------------------

    const navLinks =
        document.querySelectorAll(
            ".nav-link"
        );

    navLinks.forEach(link => {

        link.addEventListener(
            "click",
            () => {

                navLinks.forEach(item => {
                    item.classList.remove("active");
                });

                link.classList.add("active");
            }
        );
    });


    // ------------------------------------------
    // NEW PLAYLIST
    // ------------------------------------------

    if (newPlaylistBtn) {

        newPlaylistBtn.addEventListener(
            "click",
            async () => {

                const playlistName =
                    prompt(
                        "Enter playlist name:"
                    );

                if (!playlistName) {
                    return;
                }

                const token =
                    localStorage.getItem(
                        "spotify_access_token"
                    );

                // Spotify connected
                if (token &&
                    typeof createSpotifyPlaylist ===
                    "function") {

                    try {

                        const playlist =
                            await createSpotifyPlaylist(
                                playlistName,
                                "Created using Cadence Studio"
                            );

                        alert(
                            `Playlist "${playlist.name}" created successfully!`
                        );

                        if (
                            typeof loadSpotifyData ===
                            "function"
                        ) {
                            await loadSpotifyData();
                        }

                    } catch (error) {

                        console.error(error);

                        alert(
                            "Could not create Spotify playlist."
                        );
                    }

                } else {

                    // Spotify not connected
                    alert(
                        "Please connect your Spotify account first."
                    );
                }
            }
        );
    }


    // ------------------------------------------
    // PLAYLIST MODAL
    // ------------------------------------------

    function closePlaylistModal() {

        if (modal) {
            modal.classList.remove("open");
        }
    }


    if (modalClose) {

        modalClose.addEventListener(
            "click",
            closePlaylistModal
        );
    }


    if (modal) {

        modal.addEventListener(
            "click",
            event => {

                if (event.target === modal) {
                    closePlaylistModal();
                }
            }
        );
    }


    // ------------------------------------------
    // ESCAPE KEY
    // ------------------------------------------

    document.addEventListener(
        "keydown",
        event => {

            if (event.key === "Escape") {

                closePlaylistModal();
            }
        }
    );


    // ------------------------------------------
    // PLAYLIST CARD CLICK
    // ------------------------------------------

    const playlistCards =
        document.querySelectorAll(
            ".playlist-card"
        );

    playlistCards.forEach(card => {

        card.addEventListener(
            "click",
            event => {

                // Don't trigger when clicking
                // a more-options button
                if (
                    event.target.closest(
                        ".more-button"
                    )
                ) {
                    return;
                }

                const playlistName =
                    card.dataset.playlist ||
                    card.querySelector("h3")?.textContent;

                if (playlistName) {

                    console.log(
                        "Selected playlist:",
                        playlistName
                    );
                }
            }
        );
    });


    // ------------------------------------------
    // MORE BUTTONS
    // ------------------------------------------

    const moreButtons =
        document.querySelectorAll(
            ".more-button"
        );

    moreButtons.forEach(button => {

        button.addEventListener(
            "click",
            event => {

                event.stopPropagation();

                const card =
                    button.closest(
                        ".playlist-card"
                    );

                const playlistName =
                    card?.dataset.playlist ||
                    "Playlist";

                alert(
                    `Options for ${playlistName}`
                );
            }
        );
    });


    // ------------------------------------------
    // UPDATE NOW PLAYING
    // ------------------------------------------

    window.updateNowPlaying =
        function (
            title,
            artist
        ) {

            if (currentTrack) {
                currentTrack.textContent =
                    title;
            }

            if (nowPlayingTitle) {
                nowPlayingTitle.textContent =
                    title;
            }

            if (currentArtist) {
                currentArtist.textContent =
                    artist;
            }
        };


    // ------------------------------------------
    // CHECK SPOTIFY LOGIN
    // ------------------------------------------

    const spotifyToken =
        localStorage.getItem(
            "spotify_access_token"
        );

    const spotifyButton =
        document.getElementById(
            "spotifyLoginButton"
        );


    if (spotifyToken) {

        if (spotifyButton) {

            spotifyButton.textContent =
                "SPOTIFY CONNECTED";

            spotifyButton.classList.add(
                "connected"
            );
        }

        // Load Spotify information
        if (
            typeof loadSpotifyData ===
            "function"
        ) {

            loadSpotifyData();
        }

    } else {

        console.log(
            "Spotify account not connected."
        );
    }


    // ------------------------------------------
    // SMOOTH SCROLL
    // ------------------------------------------

    document
        .querySelectorAll(
            'a[href^="#"]'
        )
        .forEach(link => {

            link.addEventListener(
                "click",
                event => {

                    const targetId =
                        link.getAttribute("href");

                    if (
                        targetId === "#" ||
                        !targetId
                    ) {
                        return;
                    }

                    const target =
                        document.querySelector(
                            targetId
                        );

                    if (target) {

                        event.preventDefault();

                        target.scrollIntoView({
                            behavior: "smooth"
                        });
                    }
                }
            );
        });


    // ------------------------------------------
    // CONSOLE MESSAGE
    // ------------------------------------------

    console.log(
        "Cadence Studio is ready."
    );

});