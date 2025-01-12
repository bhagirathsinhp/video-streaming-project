const AUTH_SERVICE_BASE_URL = "http://174.129.100.156:5000";

// Login Form Submission
document.getElementById("loginForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const username = document.getElementById("loginUsername").value;
  const password = document.getElementById("loginPassword").value;

  try {
    const response = await fetch(`${AUTH_SERVICE_BASE_URL}/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });
    const data = await response.json();
    if (response.ok) {
      localStorage.setItem("username", username);
      window.location.href = "dashboard.html";
    } else {
      showAlert("danger", data.error || "Login failed!");
    }
  } catch (error) {
    showAlert("danger", "Server error. Please try again.");
  }
});

// Signup Form Submission
document.getElementById("signupForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const username = document.getElementById("signupUsername").value;
  const password = document.getElementById("signupPassword").value;

  try {
    const response = await fetch(`${AUTH_SERVICE_BASE_URL}/signup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });
    const data = await response.json();
    if (response.ok) {
      showAlert("success", "Sign up successful! Please log in.");
    } else {
      showAlert("danger", data.error || "Sign up failed!");
    }
  } catch (error) {
    showAlert("danger", "Server error. Please try again.");
  }
});

// Utility to Show Alerts
function showAlert(type, message) {
  const alertContainer = document.getElementById("alertContainer");
  alertContainer.innerHTML = `
    <div class="alert alert-${type} alert-dismissible fade show" role="alert">
      ${message}
      <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
    </div>
  `;
}
