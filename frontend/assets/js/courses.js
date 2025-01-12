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
    videoPlayer.removeAttribute("src"); // Remove the video source to avoid errors
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

// View course details with per-video progress bars
async function viewCourseDetails(courseId) {
  try {
    const response = await fetch(
      `${COURSE_SERVICE_BASE_URL}/courses/${courseId}`
    );
    const course = await response.json();

    if (response.ok) {
      // Fetch video metadata dynamically
      const videosWithDetails = await Promise.all(
        course.videos.map(async (videoId) => {
          const videoDetails = await fetchVideoDetails(videoId);
          return {
            videoId,
            title: videoDetails.title || "Untitled Video",
            description:
              videoDetails.description || "No description available.",
          };
        })
      );

      const progressData = await fetchCourseProgress(courseId);

      const courseDetailsContainer = document.getElementById(
        "courseDetailsContainer"
      );
      courseDetailsContainer.innerHTML = `
        <h3 class="mt-4">${course.title}</h3>
        <p>${course.description}</p>
        <p><strong>Category:</strong> ${course.category || "N/A"}</p>
        <h5>Videos</h5>
        <div class="row mt-4" id="videosContainer">
          ${videosWithDetails
            .map(
              (video) => `
              <div class="col-md-6">
                <div class="card mb-3 shadow-sm">
                  <div class="card-body">
                    <h6>${video.title}</h6>
                    <p>${video.description}</p>
                    <div class="progress mb-2">
                      <div 
                        class="progress-bar" 
                        role="progressbar" 
                        style="width: ${
                          progressData.videosWatched.includes(video.videoId)
                            ? "100%"
                            : "0%"
                        };" 
                        aria-valuenow="${
                          progressData.videosWatched.includes(video.videoId)
                            ? "100"
                            : "0"
                        }" 
                        aria-valuemin="0" 
                        aria-valuemax="100">
                        ${
                          progressData.videosWatched.includes(video.videoId)
                            ? "Watched"
                            : "Not Watched"
                        }
                      </div>
                    </div>
                    <button class="btn btn-sm btn-success me-2" onclick="playVideo('${
                      video.videoId
                    }', '${courseId}')">Play</button>
                    <button class="btn btn-sm btn-warning" onclick="addToWatchlist('${
                      video.videoId
                    }', '${courseId}')">Watch Later</button>
                  </div>
                </div>
              </div>
            `
            )
            .join("")}
        </div>
      `;
    } else {
      showAlert("danger", "Failed to fetch course details.");
    }
  } catch (error) {
    showAlert("danger", "Server error. Please try again.");
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

// Fetch course progress
async function fetchCourseProgress(courseId) {
  const username = localStorage.getItem("username");
  if (!username) return { videosWatched: [] };

  try {
    const response = await fetch(
      `${PROGRESS_SERVICE_BASE_URL}/progress/${username}`
    );
    const progress = await response.json();

    if (response.ok) {
      return (
        progress.find((p) => p.courseId === courseId) || { videosWatched: [] }
      );
    }
    return { videosWatched: [] };
  } catch (error) {
    console.error("Failed to fetch progress:", error);
    return { videosWatched: [] };
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
      await viewCourseDetails(courseId); // Refresh course details to update progress bars
    } else {
      showAlert("danger", "Failed to stream video.");
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
    await fetch(`${PROGRESS_SERVICE_BASE_URL}/progress/${username}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        courseId,
        videosWatched: [videoId],
      }),
    });
  } catch (error) {
    console.error("Failed to update progress:", error);
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
