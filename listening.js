
/* =========================================
   CADENCE STUDIO — LISTENING STORY
========================================= */

function storyElement(id) {
    return document.getElementById(id);
}

function storyMessage(container, message) {
    if (!container) return;

    const p = document.createElement("p");
    p.className = "story-empty";
    p.textContent = message;
    container.replaceChildren(p);
}

function createStoryItem(item, type = "track") {
    const card = document.createElement("a");
    card.className = "story-item";
    card.target = "_blank";
    card.rel = "noopener noreferrer";

    const isTrack = type === "track";
    const imageUrl = isTrack
        ? item.album?.images?.[0]?.url
        : item.images?.[0]?.url;

    const spotifyUrl = item.external_urls?.spotify || "";

    if (spotifyUrl) {
        card.href = spotifyUrl;
    } else {
        card.removeAttribute("href");
    }

    const image = document.createElement("img");
    image.alt = "";
    image.loading = "lazy";

    if (imageUrl) {
        image.src = imageUrl;
    } else {
        image.hidden = true;
    }

    image.addEventListener("error", () => {
        image.hidden = true;
    });

    const details = document.createElement("div");
    details.className = "story-item-details";

    const title = document.createElement("strong");
    title.textContent = item.name || "Unknown";

    const subtitle = document.createElement("span");

    if (isTrack) {
        subtitle.textContent =
            item.artists?.map(a => a.name).join(", ") || "Unknown artist";
    } else {
        subtitle.textContent = item.genres?.slice(0, 2).join(" · ")
            || "Spotify artist";
    }

    details.append(title, subtitle);
    card.append(image, details);

    return card;
}

function renderStoryList(containerId, items, type = "track") {
    const container = storyElement(containerId);
    if (!container) return;

    container.replaceChildren();

    if (!items?.length) {
        storyMessage(container, "No listening data available yet.");
        return;
    }

    items.forEach(item => {
        container.appendChild(createStoryItem(item, type));
    });
}

function buildListeningSummary(recentItems, artists, tracks) {
    const summary = storyElement("storySummary");
    if (!summary) return;

    summary.replaceChildren();

    const uniqueArtists = new Set();

    (recentItems || []).forEach(entry => {
        (entry.track?.artists || []).forEach(artist => {
            uniqueArtists.add(artist.name);
        });
    });

    const cards = [
        {
            label: "Recent plays returned",
            value: String(recentItems?.length || 0)
        },
        {
            label: "Top artists",
            value: String(artists?.length || 0)
        },
        {
            label: "Top tracks",
            value: String(tracks?.length || 0)
        }
    ];

    cards.forEach(data => {
        const card = document.createElement("div");
        card.className = "story-stat";

        const value = document.createElement("strong");
        value.textContent = data.value;

        const label = document.createElement("span");
        label.textContent = data.label;

        card.append(value, label);
        summary.appendChild(card);
    });

    const subtitle = storyElement("storySubtitle");

    if (subtitle) {
        const favorite = artists?.[0]?.name;

        subtitle.textContent = favorite
            ? `Your current top artist is ${favorite}. Explore the music you have been returning to.`
            : "Explore your recent plays and personalized music picks.";
    }
}

async function refreshListeningStory() {
    const status = storyElement("storyStatus");
    const button = storyElement("refreshStoryButton");
    const timeRange = storyElement("storyTimeRange")?.value || "medium_term";

    if (status) status.textContent = "Updating your Listening Story...";
    if (button) button.disabled = true;

    try {
        const results = await Promise.allSettled([
            getRecentlyPlayedTracks(),
            getTopArtists(timeRange),
            getTopTracks(timeRange)
        ]);

        const [recentResult, artistsResult, tracksResult] = results;

        const recent = recentResult.status === "fulfilled"
            ? recentResult.value.items || []
            : [];

        const artists = artistsResult.status === "fulfilled"
            ? artistsResult.value.items || []
            : [];

        const tracks = tracksResult.status === "fulfilled"
            ? tracksResult.value.items || []
            : [];

        renderStoryList(
            "recentlyPlayedStory",
            recent.map(entry => ({
                ...entry.track,
                played_at: entry.played_at
            }))
        );

        renderStoryList("topArtistsStory", artists, "artist");
        renderStoryList("topTracksStory", tracks);

        buildListeningSummary(recent, artists, tracks);

        const failures = results.filter(result => result.status === "rejected");

        if (status) {
            if (failures.length === 3) {
                status.textContent =
                    "Could not load listening data. Reconnect Spotify and check your permissions.";
            } else if (failures.length) {
                status.textContent =
                    "Your story was partly updated. Some Spotify permissions may be missing.";
            } else {
                status.textContent =
                    `Listening Story updated successfully · ${new Date().toLocaleTimeString()}`;
            }
        }

        failures.forEach(result => console.error(
            "Listening Story request failed:",
            result.reason
        ));

    } catch (error) {
        console.error("Listening Story error:", error);

        if (status) {
            status.textContent = error.message || "Unable to update your story.";
        }
    } finally {
        if (button) button.disabled = false;
    }
}

document.addEventListener("DOMContentLoaded", () => {
    storyElement("refreshStoryButton")
        ?.addEventListener("click", refreshListeningStory);

    storyElement("storyTimeRange")
        ?.addEventListener("change", refreshListeningStory);

    // Load automatically if the user already has a Spotify token.
    if (localStorage.getItem("spotify_access_token")) {
        refreshListeningStory();
    }
});

window.refreshListeningStory = refreshListeningStory;
