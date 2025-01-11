document.addEventListener("DOMContentLoaded", () => {
  // Retrieve username from localStorage
  const username = localStorage.getItem("username");
  const usernameDisplay = document.getElementById("usernameDisplay");

  if (!username) {
    // Redirect to login if no username found
    window.location.href = "index.html";
  } else {
    usernameDisplay.textContent = username;
  }

  // Logout functionality
  document.getElementById("logoutBtn").addEventListener("click", () => {
    localStorage.removeItem("username");
    window.location.href = "index.html";
  });
});
