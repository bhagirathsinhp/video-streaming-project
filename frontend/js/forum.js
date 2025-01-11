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

// Load all discussions for the course
async function loadDiscussions() {
  const discussionsContainer = document.getElementById("discussions-container");
  const params = new URLSearchParams(window.location.search);
  const courseId = params.get("courseId");

  if (!courseId) {
    discussionsContainer.innerHTML = `<p class="text-danger">Invalid Course ID</p>`;
    return;
  }

  const discussions = await apiCall(`/forum/${courseId}`);

  if (discussions.error) {
    discussionsContainer.innerHTML = `<p class="text-danger">Failed to load discussions: ${discussions.error}</p>`;
    return;
  }

  if (discussions.length === 0) {
    discussionsContainer.innerHTML = `<p class="text-muted">No discussions found. Be the first to start a discussion!</p>`;
    return;
  }

  discussions.forEach((discussion) => {
    const discussionCard = `
      <div class="card mb-4">
        <div class="card-body">
          <h5 class="card-title">${discussion.title}</h5>
          <p>${discussion.content}</p>
          <p class="text-muted">By: ${discussion.author} | ${new Date(
      discussion.createdAt
    ).toLocaleString()}</p>
          <button class="btn btn-secondary btn-sm" onclick="replyToDiscussion('${courseId}', '${
      discussion.discussionId
    }')">Reply</button>
        </div>
        <ul class="list-group list-group-flush" id="replies-${
          discussion.discussionId
        }">
          <!-- Replies will be dynamically loaded here -->
        </ul>
      </div>
    `;
    discussionsContainer.insertAdjacentHTML("beforeend", discussionCard);

    // Load replies for each discussion
    loadReplies(courseId, discussion.discussionId);
  });
}

// Start a new discussion
async function startDiscussion(e) {
  e.preventDefault();

  const params = new URLSearchParams(window.location.search);
  const courseId = params.get("courseId");

  if (!courseId) {
    alert("Invalid Course ID.");
    return;
  }

  const title = document.getElementById("title").value;
  const content = document.getElementById("content").value;
  const author = localStorage.getItem("username");

  if (!author) {
    alert("Please log in to start a discussion.");
    return;
  }

  const result = await apiCall(`/forum/${courseId}`, "POST", {
    discussionId: `discussion-${Date.now()}`,
    title,
    content,
    author,
  });

  if (result.error) {
    alert(`Error starting discussion: ${result.error}`);
  } else {
    alert("Discussion posted successfully!");
    document.getElementById("new-discussion-form").reset();
    loadDiscussions(); // Reload discussions
  }
}

// Load replies for a discussion
async function loadReplies(courseId, discussionId) {
  const repliesContainer = document.getElementById(`replies-${discussionId}`);
  const discussion = await apiCall(`/forum/${courseId}`);

  if (!discussion || !discussion.replies) return;

  discussion.replies.forEach((reply) => {
    const replyItem = `
      <li class="list-group-item">
        <p>${reply.content}</p>
        <p class="text-muted">By: ${reply.author} | ${new Date(
      reply.createdAt
    ).toLocaleString()}</p>
      </li>
    `;
    repliesContainer.insertAdjacentHTML("beforeend", replyItem);
  });
}

// Add a reply to a discussion
async function replyToDiscussion(courseId, discussionId) {
  const replyContent = prompt("Enter your reply:");
  if (!replyContent) return;

  const author = localStorage.getItem("username");
  if (!author) {
    alert("Please log in to reply.");
    return;
  }

  const result = await apiCall(
    `/forum/${courseId}/${discussionId}/reply`,
    "POST",
    {
      replyId: `reply-${Date.now()}`,
      content: replyContent,
      author,
    }
  );

  if (result.error) {
    alert(`Error posting reply: ${result.error}`);
  } else {
    alert("Reply posted successfully!");
    loadDiscussions(); // Reload discussions
  }
}

// Initialize the page
document.addEventListener("DOMContentLoaded", () => {
  loadDiscussions();
  document
    .getElementById("new-discussion-form")
    .addEventListener("submit", startDiscussion);
});
