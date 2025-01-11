const PROGRESS_SERVICE_BASE_URL = "http://174.129.100.156:5004";

document.addEventListener("DOMContentLoaded", () => {
  const username = localStorage.getItem("username");
  const courseId = new URLSearchParams(window.location.search).get("courseId");

  if (!username) {
    window.location.href = "../index.html";
    return;
  }

  loadProgressDetails(username, courseId);

  document.getElementById("logoutBtn").addEventListener("click", () => {
    localStorage.removeItem("username");
    window.location.href = "../index.html";
  });
});

// Load progress details for a specific course
async function loadProgressDetails(username, courseId) {
  try {
    const response = await fetch(
      `${PROGRESS_SERVICE_BASE_URL}/progress/${username}`
    );
    const progressData = await response.json();

    if (response.ok) {
      const courseProgress = progressData.find((p) => p.courseId === courseId);

      if (!courseProgress) {
        document.getElementById("progressDetailsContainer").innerHTML = `
                    <div class="alert alert-warning">No progress found for this course.</div>
                `;
        return;
      }

      // Render progress details
      document.getElementById("progressDetailsContainer").innerHTML = `
                <h5>Course: ${courseId}</h5>
                <p><strong>Progress:</strong> ${
                  courseProgress.progressPercentage
                }%</p>
                <ul>
                    ${courseProgress.videosWatched
                      .map((video) => `<li>${video}</li>`)
                      .join("")}
                </ul>
            `;
    } else {
      showAlert("danger", "Failed to load progress.");
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
