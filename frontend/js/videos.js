// Base URL for API calls
const BASE_URL = "http://174.129.100.156";

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

// Load all videos for the Video Library Page
async function loadVideos() {
  const videoContainer = document.getElementById("video-container");

  // Fetch all videos from the API
  const videos = await apiCall("/videos");

  if (videos.error) {
    videoContainer.innerHTML = `<p class="text-danger">Failed to load videos: ${videos.error}</p>`;
    return;
  }

  // Generate video cards
  videos.forEach((video) => {
    const videoCard = `
      <div class="col-md-4">
        <div class="card mb-4">
          <div class="card-body">
            <h5 class="card-title">${video.title}</h5>
            <p class="text-muted">${video.category}</p>
            <div class="d-flex justify-content-between">
              <a href="/videos/stream.html?videoId=${video.videoId}" class="btn btn-primary btn-sm">Watch</a>
              <button class="btn btn-secondary btn-sm" onclick="addToWatchlist('${video.videoId}')">Add to Watchlist</button>
            </div>
          </div>
        </div>
      </div>
    `;
    videoContainer.insertAdjacentHTML("beforeend", videoCard);
  });
}

// Add a video to the watchlist
async function addToWatchlist(videoId) {
  const username = localStorage.getItem("username");
  if (!username) {
    alert("Please log in to add videos to your watchlist.");
    return;
  }

  const result = await apiCall("/watchlist", "POST", { username, videoId });
  if (result.error) {
    alert(`Error adding to watchlist: ${result.error}`);
  } else {
    alert("Video added to watchlist!");
  }
}

// Load video details and stream for the Video Streaming Page
async function loadVideo() {
  const params = new URLSearchParams(window.location.search);
  const videoId = params.get("videoId");

  if (!videoId) {
    document.body.innerHTML = `<p class="text-danger">Invalid Video ID</p>`;
    return;
  }

  // Fetch video details
  const videoDetails = await apiCall(`/videos/${videoId}`);

  if (videoDetails.error) {
    document.body.innerHTML = `<p class="text-danger">Failed to load video details: ${videoDetails.error}</p>`;
    return;
  }

  // Fetch the stream URL
  const streamUrlResponse = await apiCall(`/videos/${videoId}/stream`);
  if (streamUrlResponse.error) {
    document.body.innerHTML = `<p class="text-danger">Failed to stream video: ${streamUrlResponse.error}</p>`;
    return;
  }

  // Populate video title and streaming URL
  document.getElementById("video-title").textContent = videoDetails.title;
  document.getElementById("video-player").src = streamUrlResponse.streamUrl;
}

// Determine which page is loaded and execute the relevant function
document.addEventListener("DOMContentLoaded", () => {
  if (document.getElementById("video-container")) {
    loadVideos(); // Load Video Library Page
  } else if (document.getElementById("video-player")) {
    loadVideo(); // Load Video Streaming Page
  }
});
