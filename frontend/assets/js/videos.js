const VIDEO_SERVICE_BASE_URL = "http://174.129.100.156:5005";
const PROGRESS_SERVICE_BASE_URL = "http://174.129.100.156:5004";

document.addEventListener("DOMContentLoaded", () => {
  const courseId = new URLSearchParams(window.location.search).get("courseId");
  const username = localStorage.getItem("username");

  if (!username) {
    window.location.href = "../index.html";
    return;
  }

  if (!courseId) {
    showAlert("danger", "No course selected.");
    return;
  }

  loadVideos(courseId, username);

  document.getElementById("logoutBtn").addEventListener("click", () => {
    localStorage.removeItem("username");
    window.location.href = "../index.html";
  });
});

// Load videos for the selected course
async function loadVideos(courseId, username) {
  try {
    const response = await fetch(`${VIDEO_SERVICE_BASE_URL}/videos`);
    const videos = await response.json();

    if (response.ok) {
      const videosContainer = document.getElementById("videosContainer");
      const courseVideos = videos.filter(
        (video) => video.courseId === courseId
      );

      if (courseVideos.length === 0) {
        videosContainer.innerHTML =
          '<div class="alert alert-warning">No videos found for this course.</div>';
        return;
      }

      videosContainer.innerHTML = courseVideos
        .map(
          (video) => `
                <div class="col-md-4 mb-3">
                    <div class="card">
                        <div class="card-body">
                            <h5 class="card-title">${video.title}</h5>
                            <p class="card-text">${video.description}</p>
                            <button class="btn btn-primary" onclick="streamVideo('${video.videoId}', '${courseId}', '${username}')">Watch</button>
                        </div>
                    </div>
                </div>
            `
        )
        .join("");
    } else {
      showAlert("danger", "Failed to load videos.");
    }
  } catch (error) {
    showAlert("danger", "Server error. Please try again.");
  }
}

// Stream video and update progress
async function streamVideo(videoId, courseId, username) {
  try {
    const response = await fetch(
      `${VIDEO_SERVICE_BASE_URL}/videos/${videoId}/stream`
    );
    const { streamUrl } = await response.json();

    if (response.ok) {
      window.open(streamUrl, "_blank");

      // Update progress after streaming
      await updateProgress(courseId, videoId, username);
    } else {
      showAlert("danger", "Failed to stream video.");
    }
  } catch (error) {
    showAlert("danger", "Server error. Please try again.");
  }
}

// Update progress after watching a video
async function updateProgress(courseId, videoId, username) {
  try {
    const response = await fetch(
      `${PROGRESS_SERVICE_BASE_URL}/progress/${username}`,
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          courseId,
          videosWatched: [videoId], // Add the video to the watched list
          progressPercentage: 0, // Placeholder, update with actual logic
        }),
      }
    );

    if (!response.ok) {
      console.error("Failed to update progress.");
    }
  } catch (error) {
    console.error("Server error while updating progress:", error);
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
