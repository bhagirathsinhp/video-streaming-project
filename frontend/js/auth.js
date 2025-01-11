// Base URL for API calls
const BASE_URL = "http://174.129.100.156";

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

// Handle Signup Form Submission
document.addEventListener("DOMContentLoaded", () => {
  const signupForm = document.getElementById("signup-form");
  if (signupForm) {
    signupForm.addEventListener("submit", async (e) => {
      e.preventDefault();

      const username = document.getElementById("username").value;
      const password = document.getElementById("password").value;
      const confirmPassword = document.getElementById("confirm-password").value;

      if (password !== confirmPassword) {
        alert("Passwords do not match!");
        return;
      }

      const result = await apiCall("/signup", "POST", { username, password });

      if (result.error) {
        alert(`Error: ${result.error}`);
      } else {
        alert("Account created successfully! Please log in.");
        window.location.href = "/auth/login.html"; // Redirect to login page
      }
    });
  }

  // Handle Login Form Submission (existing functionality)
  const loginForm = document.getElementById("login-form");
  if (loginForm) {
    loginForm.addEventListener("submit", async (e) => {
      e.preventDefault();

      const username = document.getElementById("username").value;
      const password = document.getElementById("password").value;

      const result = await apiCall("/login", "POST", { username, password });

      if (result.error) {
        alert(`Error: ${result.error}`);
      } else {
        localStorage.setItem("username", username);
        localStorage.setItem("token", result.token); // Store token
        alert("Login successful!");
        window.location.href = "/index.html"; // Redirect to home page
      }
    });
  }
});
