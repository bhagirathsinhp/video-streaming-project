const COURSE_SERVICE_BASE_URL = "http://174.129.100.156:5001";
const VIDEO_SERVICE_BASE_URL = "http://174.129.100.156:5005";
const PROGRESS_SERVICE_BASE_URL = "http://174.129.100.156:5004";

document.addEventListener("DOMContentLoaded", () => {
  loadCourses();

  // Handle logout
  document.getElementById("logoutBtn").addEventListener("click", () => {
    localStorage.removeItem("username");
    window.location.href = "../index.html";
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
                    <div class="card mb-3">
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

// View course details
async function viewCourseDetails(courseId) {
  try {
    const response = await fetch(
      `${COURSE_SERVICE_BASE_URL}/courses/${courseId}`
    );
    const course = await response.json();

    if (response.ok) {
      document.getElementById("courseTitle").textContent =
        course.title || "N/A";
      document.getElementById("courseDescription").textContent =
        course.description || "N/A";
      document.getElementById("courseCategory").textContent =
        course.category || "N/A";
      document.getElementById("courseVideos").innerHTML = course.videos
        .map(
          (video) => `
                <li>${video} <button class="btn btn-sm btn-success" onclick="playVideo('${video}')">Play</button></li>
            `
        )
        .join("");
      await loadProgress(courseId);
      const modal = new bootstrap.Modal(
        document.getElementById("courseDetailsModal")
      );
      modal.show();
    } else {
      showAlert("danger", "Failed to fetch course details.");
    }
  } catch (error) {
    showAlert("danger", "Server error. Please try again.");
  }
}

// Play video
function playVideo(videoId) {
  const videoUrl = `${VIDEO_SERVICE_BASE_URL}/videos/${videoId}/stream`;
  window.open(videoUrl, "_blank");
}

// Load progress
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
