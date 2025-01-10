const auth0 = await createAuth0Client({
  domain: "dev-jvzjqeroel1nngi8.us.auth0.com",
  clientId: "YOUR_CLIENT_ID",
  audience: "https://dev-jvzjqeroel1nngi8.us.auth0.com/api/v2/",
});

document.getElementById("loginButton").addEventListener("click", async () => {
  try {
    // Redirect to Auth0 login
    await auth0.loginWithRedirect();
  } catch (error) {
    displayError(error.message);
  }
});

// Check for tokens after redirection
window.addEventListener("load", async () => {
  const query = window.location.search;
  if (query.includes("code=") && query.includes("state=")) {
    try {
      // Handle Auth0 token and extract the JWT
      await auth0.handleRedirectCallback();
      const token = await auth0.getTokenSilently();
      sessionStorage.setItem("token", token);

      // Validate the token with backend
      const validateResponse = await fetch("http://localhost:5000/validate", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!validateResponse.ok) {
        throw new Error("Token validation failed.");
      }

      // Redirect to dashboard
      window.location.href = "dashboard.html";
    } catch (error) {
      displayError(error.message);
    }
  }
});

// Display errors
function displayError(message) {
  const errorMessage = document.getElementById("errorMessage");
  errorMessage.textContent = message;
  errorMessage.classList.remove("d-none");
}
