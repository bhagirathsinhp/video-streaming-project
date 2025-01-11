// Base URL for API calls
const BASE_URL = "http://174.129.100.156:5006";

// Utility function to make API calls
async function apiCall(endpoint, method = "GET", data = null) {
  const headers = { "Content-Type": "application/json" };
  const token = localStorage.getItem("token");
  if (token) headers["Authorization"] = `Bearer ${token}`;

  try {
    const response = await fetch(`${BASE_URL}${endpoint}`, {
      method,
      headers,
      body: data ? JSON.stringify(data) : null,
    });

    if (!response.ok) {
      throw new Error(`HTTP Error ${response.status}: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error("API Call Failed:", error);
    return { error: error.message };
  }
}

// Load user's watchlist
async function loadWatchlist() {
  const watchlistContainer = document.getElementById("watchlist-container");
  const username = localStorage.getItem("username");

  if (!username) {
    watchlistContainer.innerHTML = `<p class="text-danger">Please log in to view your watchlist.</p>`;
    return;
  }

  // Fetch watchlist from the API
  const watchlist = await apiCall(`/watchlist?username=${username}`);

  if (watchlist.error) {
    watchlistContainer.innerHTML = `<p class="text-danger">Failed to load watchlist: ${watchlist.error}</p>`;
    return;
  }

  // Display watchlist items
  if (watchlist.length === 0) {
    watchlistContainer.innerHTML = `<p class="text-muted">Your watchlist is empty. Add videos from the <a href="/videos/video-library.html">Video Library</a>.</p>`;
    return;
  }

  watchlist.forEach((item) => {
    const watchlistCard = `
      <div class="col-md-4">
        <div class="card mb-4">
          <div class="card-body">
            <h5 class="card-title">${item.videoId}</h5>
            <p class="text-muted">Added: ${new Date(
              item.addedAt
            ).toLocaleString()}</p>
            <div class="d-flex justify-content-between">
              <a href="/videos/stream.html?videoId=${
                item.videoId
              }" class="btn btn-primary btn-sm">Watch</a>
              <button class="btn btn-danger btn-sm" onclick="removeFromWatchlist('${
                item.videoId
              }')">Remove</button>
            </div>
          </div>
        </div>
      </div>
    `;
    watchlistContainer.insertAdjacentHTML("beforeend", watchlistCard);
  });
}

// Remove a video from the watchlist
async function removeFromWatchlist(videoId) {
  const username = localStorage.getItem("username");
  if (!username) {
    alert("Please log in to manage your watchlist.");
    return;
  }

  const result = await apiCall(
    `/watchlist/${videoId}?username=${username}`,
    "DELETE"
  );

  if (result.error) {
    alert(`Error removing from watchlist: ${result.error}`);
  } else {
    alert("Video removed from watchlist!");
    loadWatchlist(); // Reload watchlist after removal
  }
}

// Load the watchlist on page load
document.addEventListener("DOMContentLoaded", () => {
  loadWatchlist();
});
