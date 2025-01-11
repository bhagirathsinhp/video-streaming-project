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

// Load progress for the user
async function loadProgress() {
  const progressContainer = document.getElementById("progress-container");
  const username = localStorage.getItem("username");

  if (!username) {
    progressContainer.innerHTML = `<p class="text-danger">Please log in to view your progress.</p>`;
    return;
  }

  const progressData = await apiCall(`/progress/${username}`);

  if (progressData.error) {
    progressContainer.innerHTML = `<p class="text-danger">Failed to load progress: ${progressData.error}</p>`;
    return;
  }

  if (progressData.length === 0) {
    progressContainer.innerHTML = `<p class="text-muted">No progress data found. Start a course to track your progress!</p>`;
    return;
  }

  progressData.forEach((item) => {
    const progressCard = `
      <div class="col-md-6 mb-4">
        <div class="card">
          <div class="card-body">
            <h5 class="card-title">${item.courseId}</h5>
            <p class="text-muted">Videos Watched: ${item.videosWatched.length}</p>
            <p class="text-muted">Progress: ${item.progressPercentage}%</p>
            <div class="progress">
              <div 
                class="progress-bar" 
                role="progressbar" 
                style="width: ${item.progressPercentage}%" 
                aria-valuenow="${item.progressPercentage}" 
                aria-valuemin="0" 
                aria-valuemax="100">
                ${item.progressPercentage}%
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
    progressContainer.insertAdjacentHTML("beforeend", progressCard);
  });
}

// Initialize the page
document.addEventListener("DOMContentLoaded", () => {
  loadProgress();
});
