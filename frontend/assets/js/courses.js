const COURSE_SERVICE_BASE_URL = "http://174.129.100.156:5001";
const VIDEO_SERVICE_BASE_URL = "http://174.129.100.156:5005";
const WATCHLIST_SERVICE_BASE_URL = "http://174.129.100.156:5006";
const PROGRESS_SERVICE_BASE_URL = "http://174.129.100.156:5004";

document.addEventListener("DOMContentLoaded", () => {
  loadCourses();

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
    videoPlayer.src = ""; // Clear the video source
  });
});

// Load all courses
async function loadCourses() {
  try {
    const response = await fetch(`${COURSE_SERVICE_BASE_URL}/courses`);
    const courses = await response.json();

    if (response.ok) {
      const coursesContainer = document.getElementById("coursesContainer");
      coursesContainer.innerHTML = courses
        .map(
          (course) => `
            <div class="col-md-4">
              <div class="card mb-3 shadow-sm">
                <div class="card-body">
                  <h5 class="card-title">${course.title}</h5>
                  <p class="card-text">${course.description}</p>
                  <button class="btn btn-primary" onclick="viewCourseDetails('${course.courseId}')">View Details</button>
                </div>
              </div>
            </div>
          `
        )
        .join("");
    } else {
      showAlert("danger", "Failed to load courses.");
    }
  } catch (error) {
    showAlert("danger", "Server error. Please try again.");
  }
}

// View course details on the same page
async function viewCourseDetails(courseId) {
  try {
    const response = await fetch(
      `${COURSE_SERVICE_BASE_URL}/courses/${courseId}`
    );
    const course = await response.json();

    if (response.ok) {
      const courseDetailsContainer = document.getElementById(
        "courseDetailsContainer"
      );
      courseDetailsContainer.innerHTML = `
        <h3 class="mt-4">${course.title}</h3>
        <p>${course.description}</p>
        <p><strong>Category:</strong> ${course.category || "N/A"}</p>
        <h5>Videos</h5>
        <div class="row mt-4" id="videosContainer">
          ${course.videos
            .map(
              (video) => `
              <div class="col-md-4">
                <div class="card mb-3 shadow-sm">
                  <div class="card-body">
                    <h6>${video}</h6>
                    <button class="btn btn-sm btn-success me-2" onclick="playVideo('${video}', '${courseId}')">Play</button>
                    <button class="btn btn-sm btn-warning" onclick="addToWatchlist('${video}', '${courseId}')">Watch Later</button>
                  </div>
                </div>
              </div>
            `
            )
            .join("")}
        </div>
        <div id="courseProgress" class="mt-3"></div>
      `;
      await loadProgress(courseId);
    } else {
      showAlert("danger", "Failed to fetch course details.");
    }
  } catch (error) {
    showAlert("danger", "Server error. Please try again.");
  }
}

// Play video in a modal and update progress
async function playVideo(videoId, courseId) {
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

      // Update progress after video starts
      await updateProgress(courseId, videoId);
    } else {
      showAlert("danger", "Failed to stream video.");
    }
  } catch (error) {
    showAlert("danger", "Server error. Please try again.");
  }
}

// Add video to watchlist
async function addToWatchlist(videoId, courseId) {
  const username = localStorage.getItem("username");
  if (!username) return;

  try {
    const response = await fetch(`${WATCHLIST_SERVICE_BASE_URL}/watchlist`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, videoId, courseId }),
    });

    if (response.ok) {
      showAlert("success", "Video added to watchlist.");
    } else {
      showAlert("danger", "Failed to add video to watchlist.");
    }
  } catch (error) {
    showAlert("danger", "Server error. Please try again.");
  }
}

// Update progress after watching a video
async function updateProgress(courseId, videoId) {
  const username = localStorage.getItem("username");
  if (!username) return;

  try {
    const response = await fetch(
      `${PROGRESS_SERVICE_BASE_URL}/progress/${username}`,
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          courseId,
          videosWatched: [videoId], // Add the video to the watched list
          progressPercentage: 0, // Placeholder; update with actual logic
        }),
      }
    );

    if (response.ok) {
      // Reload progress bar dynamically
      await loadProgress(courseId);
    } else {
      console.error("Failed to update progress.");
    }
  } catch (error) {
    console.error("Server error while updating progress:", error);
  }
}

// Load progress for the course
async function loadProgress(courseId) {
  const username = localStorage.getItem("username");
  if (!username) return;

  try {
    const response = await fetch(
      `${PROGRESS_SERVICE_BASE_URL}/progress/${username}`
    );
    const progress = await response.json();

    if (response.ok) {
      const courseProgress = progress.find((p) => p.courseId === courseId);
      document.getElementById("courseProgress").innerHTML = `
        <strong>Progress:</strong> ${
          courseProgress ? courseProgress.progressPercentage : 0
        }% completed
      `;
    } else {
      document.getElementById("courseProgress").innerHTML =
        "<strong>Progress:</strong> 0% completed";
    }
  } catch (error) {
    document.getElementById("courseProgress").innerHTML =
      "<strong>Progress:</strong> Unable to fetch progress";
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
