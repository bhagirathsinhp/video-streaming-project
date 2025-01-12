const WATCHLIST_SERVICE_BASE_URL = "http://174.129.100.156:5006";
const VIDEO_SERVICE_BASE_URL = "http://174.129.100.156:5005";

document.addEventListener("DOMContentLoaded", () => {
  const username = localStorage.getItem("username");

  if (!username) {
    window.location.href = "../index.html";
    return;
  }

  loadWatchlist(username);

  // Handle logout
  document.getElementById("logoutBtn").addEventListener("click", () => {
    localStorage.removeItem("username");
    window.location.href = "../index.html";
  });

  // Stop video playback when modal is closed
  const videoModal = document.getElementById("videoModal");
  videoModal.addEventListener("hidden.bs.modal", () => {
    const videoPlayer = document.getElementById("videoPlayer");
    videoPlayer.pause(); // Pause video playback
    videoPlayer.currentTime = 0; // Reset video playback
    videoPlayer.removeAttribute("src"); // Remove the video source to avoid errors
  });
});

// Load watchlist for the user
async function loadWatchlist(username) {
  try {
    const response = await fetch(
      `${WATCHLIST_SERVICE_BASE_URL}/watchlist?username=${encodeURIComponent(
        username
      )}`
    );
    const watchlist = await response.json();

    const watchlistContainer = document.getElementById("watchlistContainer");
    const emptyWatchlist = document.getElementById("emptyWatchlist");

    if (response.ok) {
      if (watchlist.length === 0) {
        emptyWatchlist.classList.remove("d-none");
        watchlistContainer.innerHTML = ""; // Clear existing content
        return;
      }

      emptyWatchlist.classList.add("d-none");
      const watchlistWithDetails = await Promise.all(
        watchlist.map(async (item) => {
          const videoDetails = await fetchVideoDetails(item.videoId);
          return {
            ...item,
            ...videoDetails,
          };
        })
      );

      watchlistContainer.innerHTML = watchlistWithDetails
        .map(
          (item) => `
            <div class="col-md-4">
              <div class="card mb-3 shadow-sm">
                <img 
                  src="${
                    item.thumbnail || "../assets/images/video-placeholder.jpg"
                  }" 
                  class="card-img-top" 
                  alt="${item.title || "Video Thumbnail"}" 
                  style="height: 180px; object-fit: cover;"
                />
                <div class="card-body">
                  <h5 class="card-title">${item.title || "Untitled Video"}</h5>
                  <p class="card-text text-muted">${
                    item.description || "No description available."
                  }</p>
                  <button class="btn btn-success btn-sm me-2" onclick="playVideo('${
                    item.videoId
                  }')">
                    <i class="bi bi-play-circle"></i> Play
                  </button>
                  <button class="btn btn-danger btn-sm" onclick="confirmRemoveFromWatchlist('${
                    item.videoId
                  }', '${username}')">
                    <i class="bi bi-trash"></i> Remove
                  </button>
                </div>
              </div>
            </div>
          `
        )
        .join("");
    } else {
      showAlert("danger", "Failed to load watchlist.");
    }
  } catch (error) {
    showAlert("danger", "Server error. Please try again.");
  }
}

// Confirm removal of video
function confirmRemoveFromWatchlist(videoId, username) {
  if (
    confirm("Are you sure you want to remove this video from your watchlist?")
  ) {
    removeFromWatchlist(videoId, username);
  }
}

// Fetch video details from the Video Service
async function fetchVideoDetails(videoId) {
  try {
    const response = await fetch(`${VIDEO_SERVICE_BASE_URL}/videos/${videoId}`);
    if (response.ok) {
      return await response.json(); // Return video details
    }
    return {};
  } catch (error) {
    console.error("Failed to fetch video details:", error);
    return {};
  }
}

// Play video in a modal
async function playVideo(videoId) {
  try {
    const response = await fetch(
      `${VIDEO_SERVICE_BASE_URL}/videos/${videoId}/stream`
    );
    const { streamUrl } = await response.json();

    if (response.ok) {
      const videoPlayer = document.getElementById("videoPlayer");
      videoPlayer.src = streamUrl;
      const modal = new bootstrap.Modal(document.getElementById("videoModal"));
      modal.show();
    } else {
      showAlert("danger", "Failed to stream video.");
    }
  } catch (error) {
    showAlert("danger", "Server error. Please try again.");
  }
}

// Remove video from watchlist
async function removeFromWatchlist(videoId, username) {
  try {
    const response = await fetch(
      `${WATCHLIST_SERVICE_BASE_URL}/watchlist/${videoId}?username=${encodeURIComponent(
        username
      )}`,
      {
        method: "DELETE",
      }
    );

    if (response.ok) {
      showAlert("success", "Video removed from watchlist.");
      loadWatchlist(username); // Reload watchlist
    } else {
      showAlert("danger", "Failed to remove video from watchlist.");
    }
  } catch (error) {
    showAlert("danger", "Server error. Please try again.");
  }
}

// Utility function to display alerts
function showAlert(type, message) {
  const alertContainer = document.getElementById("alertContainer");
  alertContainer.innerHTML = `
    <div class="alert alert-${type} alert-dismissible fade show" role="alert">
      ${message}
      <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
    </div>
  `;
}
