const PROFILE_SERVICE_BASE_URL = "http://174.129.100.156:5003";

document.addEventListener("DOMContentLoaded", async () => {
  const username = localStorage.getItem("username");
  if (!username) {
    window.location.href = "index.html";
    return;
  }

  // Logout functionality
  document.getElementById("logoutBtn").addEventListener("click", () => {
    localStorage.removeItem("username");
    window.location.href = "index.html";
  });

  // Fetch and display profile details
  try {
    const response = await fetch(
      `${PROFILE_SERVICE_BASE_URL}/profile/${username}`
    );
    const profile = await response.json();

    if (response.ok) {
      document.getElementById("profileName").value = profile.name || "";
      document.getElementById("profileEmail").value = profile.email || "";
      document.getElementById("profilePreferences").value =
        JSON.stringify(profile.preferences, null, 2) || "";
    } else {
      showAlert("danger", profile.error || "Failed to load profile.");
    }
  } catch (error) {
    showAlert("danger", "Server error. Please try again.");
  }

  // Handle profile update
  document
    .getElementById("profileForm")
    .addEventListener("submit", async (e) => {
      e.preventDefault();
      const name = document.getElementById("profileName").value;
      const email = document.getElementById("profileEmail").value;
      const preferences = document.getElementById("profilePreferences").value;

      try {
        const response = await fetch(
          `${PROFILE_SERVICE_BASE_URL}/profile/${username}`,
          {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              name,
              email,
              preferences: JSON.parse(preferences || "{}"),
            }),
          }
        );
        const data = await response.json();

        if (response.ok) {
          showAlert("success", data.message || "Profile updated successfully.");
        } else {
          showAlert("danger", data.error || "Failed to update profile.");
        }
      } catch (error) {
        showAlert("danger", "Server error. Please try again.");
      }
    });
});

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
