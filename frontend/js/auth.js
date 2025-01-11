const BASE_URL = "http://174.129.100.156:5000";

// Utility function to make API calls
async function apiCall(endpoint, method = "GET", data = null) {
  const headers = { "Content-Type": "application/json" };

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

// Handle Signup and Login Form Submissions
document.addEventListener("DOMContentLoaded", () => {
  // Handle Sign-Up
  const signupForm = document.getElementById("signup-form");
  if (signupForm) {
    signupForm.addEventListener("submit", async (e) => {
      e.preventDefault();

      const username = document.getElementById("username").value;
      const password = document.getElementById("password").value;
      const confirmPassword = document.getElementById("confirm-password").value;

      const errorMessageDiv = document.getElementById("error-message");
      errorMessageDiv.textContent = "";

      if (password !== confirmPassword) {
        errorMessageDiv.textContent = "Passwords do not match!";
        return;
      }

      const result = await apiCall("/signup", "POST", { username, password });

      if (result.error) {
        errorMessageDiv.textContent = `Error: ${result.error}`;
      } else {
        alert("Account created successfully! Please log in.");
        window.location.href = "../auth/login.html";
      }
    });
  }

  // Handle Login
  const loginForm = document.getElementById("login-form");
  if (loginForm) {
    loginForm.addEventListener("submit", async (e) => {
      e.preventDefault();

      const username = document.getElementById("username").value;
      const password = document.getElementById("password").value;

      const errorMessageDiv = document.getElementById("error-message");
      errorMessageDiv.textContent = "";

      const result = await apiCall("/login", "POST", { username, password });

      if (result.error) {
        errorMessageDiv.textContent = `Error: ${result.error}`;
      } else {
        localStorage.setItem("username", username);
        alert("Login successful!");
        window.location.href = "../index.html";
      }
    });
  }

  // Prefill username if redirected from Sign-Up
  const urlParams = new URLSearchParams(window.location.search);
  const prefillUsername = urlParams.get("username");
  if (prefillUsername) {
    const usernameField = document.getElementById("username");
    if (usernameField) usernameField.value = prefillUsername;
  }
});
