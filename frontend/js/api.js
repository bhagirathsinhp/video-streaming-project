const BASE_URL = "http://174.129.100.156";

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
