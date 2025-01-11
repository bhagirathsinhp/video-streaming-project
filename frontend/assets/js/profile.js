const AUTH_SERVICE_BASE_URL = "http://174.129.100.156:5000";
const PROFILE_SERVICE_BASE_URL = "http://174.129.100.156:5003";

document.addEventListener("DOMContentLoaded", () => {
  const username = localStorage.getItem("username");
  if (!username) {
    window.location.href = "../index.html";
    return;
  }

  // Logout functionality
  document.getElementById("logoutBtn").addEventListener("click", () => {
    localStorage.removeItem("username");
    window.location.href = "../index.html";
  });

  // Fetch and display profile details
  fetchProfile(username);

  // Handle profile update
  document
    .getElementById("profileForm")
    .addEventListener("submit", async (e) => {
      e.preventDefault();
      updateProfile(username);
    });

  // Handle profile deletion
  document
    .getElementById("confirmDeleteBtn")
    .addEventListener("click", async () => {
      const password = document.getElementById("deletePassword").value;
      if (!password) {
        showDeleteAlert(
          "danger",
          "Password is required to delete your profile."
        );
        return;
      }
      await deleteProfile(username, password);
    });
});

async function fetchProfile(username) {
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
      document.getElementById("profileNotifications").checked =
        profile.notifications || false;
    } else {
      showAlert("danger", profile.error || "Failed to load profile.");
    }
  } catch (error) {
    showAlert("danger", "Server error. Please try again.");
  }
}

async function updateProfile(username) {
  const name = document.getElementById("profileName").value;
  const email = document.getElementById("profileEmail").value;
  const preferences = document.getElementById("profilePreferences").value;
  const notifications = document.getElementById("profileNotifications").checked;

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
          notifications,
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
}

async function deleteProfile(username, password) {
  try {
    // Step 1: Validate the password with the Auth Service
    const authResponse = await fetch(`${AUTH_SERVICE_BASE_URL}/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });

    if (!authResponse.ok) {
      showDeleteAlert("danger", "Invalid password. Please try again.");
      return;
    }

    // Step 2: Delete the profile
    const deleteResponse = await fetch(
      `${PROFILE_SERVICE_BASE_URL}/profile/${username}`,
      {
        method: "DELETE",
      }
    );

    if (deleteResponse.ok) {
      showDeleteAlert("success", "Profile deleted successfully.");
      localStorage.removeItem("username");
      setTimeout(() => {
        window.location.href = "../index.html";
      }, 2000);
    } else {
      showDeleteAlert("danger", "Failed to delete profile. Please try again.");
    }
  } catch (error) {
    showDeleteAlert("danger", "Server error. Please try again.");
  }
}

function showAlert(type, message) {
  const alertContainer = document.getElementById("alertContainer");
  alertContainer.innerHTML = `
        <div class="alert alert-${type} alert-dismissible fade show" role="alert">
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
        </div>
    `;
}

function showDeleteAlert(type, message) {
  const alertContainer = document.getElementById("deleteAlertContainer");
  alertContainer.innerHTML = `
        <div class="alert alert-${type} alert-dismissible fade show" role="alert">
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
        </div>
    `;
}
