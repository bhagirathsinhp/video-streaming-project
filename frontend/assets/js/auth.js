const AUTH0_DOMAIN = "https://dev-jvzjqeroel1nngi8.us.auth0.com";
const CLIENT_ID = "solVyougrEENkv0uJ6GypSyFxKikpyEj";
const REDIRECT_URI = "http://127.0.0.1:5500/index.html";
const API_AUDIENCE = "https://dev-jvzjqeroel1nngi8.us.auth0.com/api/v2/";

/**
 * Redirects the user to Auth0's hosted login page for authentication.
 */
function login() {
  const authUrl = `${AUTH0_DOMAIN}/authorize?response_type=token&client_id=${CLIENT_ID}&redirect_uri=${REDIRECT_URI}&scope=openid%20profile%20email&audience=${API_AUDIENCE}`;
  window.location.href = authUrl;
}

/**
 * Extracts the access token from the URL fragment after successful login.
 */
function extractToken() {
  const hash = window.location.hash.substring(1);
  const params = new URLSearchParams(hash);
  const token = params.get("access_token");

  if (token) {
    localStorage.setItem("token", token); // Store the token in localStorage
    alert("Login successful!");
    window.location.hash = ""; // Clear the URL fragment
  }
}

/**
 * Checks if a valid token exists in localStorage.
 * @returns {boolean} True if a token exists, false otherwise.
 */
function isLoggedIn() {
  const token = localStorage.getItem("token");
  return token !== null;
}

/**
 * Logs the user out by removing the token from localStorage.
 */
function logout() {
  localStorage.removeItem("token");
  alert("You have been logged out.");
  window.location.href = "index.html";
}

/**
 * Fetches the user's profile from Auth0's userinfo endpoint.
 */
async function fetchUserProfile() {
  const token = localStorage.getItem("token");
  if (!token) {
    alert("You are not logged in.");
    return;
  }

  try {
    const response = await fetch(`${AUTH0_DOMAIN}/userinfo`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (response.ok) {
      const profile = await response.json();
      console.log("User Profile:", profile);
      const profileElement = document.getElementById("userProfile");
      if (profileElement) {
        profileElement.innerHTML = `Welcome, ${profile.name || "User"}!`;
      }
    } else {
      throw new Error("Failed to fetch profile.");
    }
  } catch (error) {
    console.error("Error fetching profile:", error);
  }
}

/**
 * Initializes authentication logic on page load.
 */
function initAuth() {
  if (!isLoggedIn()) {
    extractToken(); // Extract token if redirected from Auth0
  }

  if (isLoggedIn()) {
    fetchUserProfile(); // Fetch and display the user profile
  }
}
