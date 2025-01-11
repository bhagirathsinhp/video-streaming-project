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

// Load user profile
async function loadProfile() {
  const username = localStorage.getItem("username");
  if (!username) {
    alert("Please log in to view your profile.");
    return;
  }

  const profile = await apiCall(`/profile/${username}`);

  if (profile.error) {
    alert(`Error loading profile: ${profile.error}`);
    return;
  }

  // Populate form fields
  document.getElementById("name").value = profile.name || "";
  document.getElementById("email").value = profile.email || "";
  document.getElementById("preferences").value = JSON.stringify(
    profile.preferences || {},
    null,
    2
  );
  document.getElementById("notifications").checked =
    profile.notifications || false;
}

// Save profile changes
async function saveProfile(e) {
  e.preventDefault();

  const username = localStorage.getItem("username");
  if (!username) {
    alert("Please log in to update your profile.");
    return;
  }

  const name = document.getElementById("name").value;
  const email = document.getElementById("email").value;
  const preferences = document.getElementById("preferences").value;
  const notifications = document.getElementById("notifications").checked;

  const result = await apiCall(`/profile/${username}`, "PUT", {
    name,
    email,
    preferences: JSON.parse(preferences || "{}"),
    notifications,
  });

  if (result.error) {
    alert(`Error saving profile: ${result.error}`);
  } else {
    alert("Profile updated successfully!");
  }
}

// Delete user profile
async function deleteProfile() {
  const username = localStorage.getItem("username");
  if (!username) {
    alert("Please log in to delete your profile.");
    return;
  }

  const confirmation = confirm(
    "Are you sure you want to delete your profile? This action cannot be undone."
  );
  if (!confirmation) return;

  const result = await apiCall(`/profile/${username}`, "DELETE");

  if (result.error) {
    alert(`Error deleting profile: ${result.error}`);
  } else {
    alert("Profile deleted successfully. Logging you out...");
    localStorage.clear();
    window.location.href = "/auth/login.html";
  }
}

// Initialize the page
document.addEventListener("DOMContentLoaded", () => {
  loadProfile();
  document
    .getElementById("profile-form")
    .addEventListener("submit", saveProfile);
});
