const PROGRESS_SERVICE_BASE_URL = "http://174.129.100.156:5004";

document.addEventListener("DOMContentLoaded", () => {
  // Retrieve username from localStorage
  const username = localStorage.getItem("username");
  const usernameDisplay = document.getElementById("usernameDisplay");

  if (!username) {
    // Redirect to login if no username found
    window.location.href = "index.html";
  } else {
    usernameDisplay.textContent = username;
    loadProgressOverview(username);
  }

  // Logout functionality
  document.getElementById("logoutBtn").addEventListener("click", () => {
    localStorage.removeItem("username");
    window.location.href = "index.html";
  });
});

// Load progress overview for the dashboard
async function loadProgressOverview(username) {
  try {
    const response = await fetch(
      `${PROGRESS_SERVICE_BASE_URL}/progress/${username}`
    );
    const progressData = await response.json();

    if (response.ok) {
      const progressContainer = document.getElementById(
        "progressOverviewContainer"
      );

      if (progressData.length === 0) {
        progressContainer.innerHTML =
          '<div class="alert alert-warning">No progress to show.</div>';
        return;
      }

      progressContainer.innerHTML = progressData
        .map(
          (progress) => `
        <div class="col-md-6 mb-3">
          <div class="card">
            <div class="card-body">
              <h5 class="card-title">${progress.courseId}</h5>
              <div class="progress">
                <div class="progress-bar" role="progressbar" style="width: ${progress.progressPercentage}%;" 
                  aria-valuenow="${progress.progressPercentage}" aria-valuemin="0" aria-valuemax="100">
                  ${progress.progressPercentage}%
                </div>
              </div>
            </div>
          </div>
        </div>
      `
        )
        .join("");
    } else {
      showAlert("danger", "Failed to load progress overview.");
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
