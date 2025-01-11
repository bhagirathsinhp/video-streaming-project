const FORUM_SERVICE_BASE_URL = "http://174.129.100.156:5002";
const COURSE_SERVICE_BASE_URL = "http://174.129.100.156:5001";

let discussionsCache = []; // Cache discussions for the selected course

document.addEventListener("DOMContentLoaded", () => {
  loadCourses();

  // Handle logout
  document.getElementById("logoutBtn").addEventListener("click", () => {
    localStorage.removeItem("username");
    window.location.href = "../index.html";
  });

  // Handle course selection
  document.getElementById("selectedCourse").addEventListener("change", (e) => {
    loadDiscussions(e.target.value);
  });

  // Handle starting a new discussion
  document
    .getElementById("discussionForm")
    .addEventListener("submit", async (e) => {
      e.preventDefault();
      await startDiscussion();
    });

  // Ensure modal backdrop is cleared on closure
  document
    .getElementById("threadDetailsModal")
    .addEventListener("hidden.bs.modal", () => {
      const modalBackdrop = document.querySelector(".modal-backdrop");
      if (modalBackdrop) {
        modalBackdrop.remove(); // Remove lingering backdrop
      }
    });
});

// Load all courses into the dropdown
async function loadCourses() {
  try {
    const response = await fetch(`${COURSE_SERVICE_BASE_URL}/courses`);
    const courses = await response.json();

    if (response.ok) {
      const courseSelector = document.getElementById("selectedCourse");
      courseSelector.innerHTML = `<option value="">Select a Course</option>`;
      courses.forEach((course) => {
        courseSelector.innerHTML += `<option value="${course.courseId}">${course.title}</option>`;
      });
    } else {
      showAlert("danger", "Failed to load courses.");
    }
  } catch (error) {
    showAlert("danger", "Server error. Please try again.");
  }
}

// Load discussions for a specific course
async function loadDiscussions(courseId) {
  if (!courseId) {
    document.getElementById("discussionsContainer").innerHTML = "";
    discussionsCache = [];
    return;
  }

  try {
    const response = await fetch(`${FORUM_SERVICE_BASE_URL}/forum/${courseId}`);
    const discussions = await response.json();

    if (response.ok) {
      discussionsCache = discussions; // Cache discussions for this course
      const discussionsContainer = document.getElementById(
        "discussionsContainer"
      );
      discussionsContainer.innerHTML = discussions
        .map(
          (discussion) => `
                <div class="col-md-4">
                    <div class="card mb-3">
                        <div class="card-body">
                            <h5 class="card-title">${discussion.title}</h5>
                            <p class="card-text">${discussion.content}</p>
                            <button class="btn btn-primary" onclick="viewThread('${discussion.discussionId}')">View Thread</button>
                        </div>
                    </div>
                </div>
            `
        )
        .join("");
    } else {
      showAlert("danger", "Failed to load discussions.");
    }
  } catch (error) {
    showAlert("danger", "Server error. Please try again.");
  }
}

// View thread details from cached discussions
function viewThread(discussionId) {
  const discussion = discussionsCache.find(
    (d) => d.discussionId === discussionId
  );

  if (!discussion) {
    showAlert("danger", "Discussion not found.");
    return;
  }

  // Display thread details
  document.getElementById("threadTitle").textContent = discussion.title;
  document.getElementById("threadContent").textContent = discussion.content;
  renderReplies(discussion);

  // Properly reference the `postReply` function
  document.getElementById("replyForm").onsubmit = (e) => {
    e.preventDefault();
    postReply(discussionId); // Pass the discussionId to postReply
  };

  const modal = new bootstrap.Modal(
    document.getElementById("threadDetailsModal")
  );
  modal.show();
}

// Helper function to render replies in the modal
function renderReplies(discussion) {
  document.getElementById("threadReplies").innerHTML = (
    discussion.replies || []
  )
    .map(
      (reply) => `
        <li>${reply.content} - <strong>${reply.author}</strong></li>
    `
    )
    .join("");
}

// Start a new discussion
async function startDiscussion() {
  const courseId = document.getElementById("selectedCourse").value;
  const username = localStorage.getItem("username");
  const title = document.getElementById("discussionTitle").value;
  const content = document.getElementById("discussionContent").value;

  if (!courseId || !username) {
    showAlert("danger", "Please select a course and ensure you are logged in.");
    return;
  }

  try {
    const response = await fetch(
      `${FORUM_SERVICE_BASE_URL}/forum/${courseId}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          discussionId: `${Date.now()}`, // Unique ID based on timestamp
          title,
          content,
          author: username,
        }),
      }
    );

    if (response.ok) {
      showAlert("success", "Discussion started successfully.");
      document.getElementById("discussionForm").reset();
      bootstrap.Modal.getInstance(
        document.getElementById("startDiscussionModal")
      ).hide();
      loadDiscussions(courseId); // Refresh discussions
    } else {
      showAlert("danger", "Failed to start discussion. Please try again.");
    }
  } catch (error) {
    showAlert("danger", "Server error. Please try again.");
  }
}

// Post a reply to a thread
async function postReply(discussionId) {
  const username = localStorage.getItem("username");
  const content = document.getElementById("replyContent").value;

  if (!username || !content) {
    showAlert("danger", "All fields are required.");
    return;
  }

  const courseId = document.getElementById("selectedCourse").value;

  try {
    const response = await fetch(
      `${FORUM_SERVICE_BASE_URL}/forum/${courseId}/${discussionId}/reply`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          replyId: `${Date.now()}`, // Unique ID
          content,
          author: username,
        }),
      }
    );

    if (response.ok) {
      showAlert("success", "Reply posted successfully.");

      // Update the discussion cache with the new reply
      const discussion = discussionsCache.find(
        (d) => d.discussionId === discussionId
      );
      if (discussion) {
        discussion.replies.push({
          replyId: `${Date.now()}`,
          content,
          author: username,
          createdAt: new Date().toISOString(),
        });
      }

      // Refresh the replies in the modal
      renderReplies(discussion);

      // Clear the reply input field
      document.getElementById("replyContent").value = "";
    } else {
      showAlert("danger", "Failed to post reply.");
    }
  } catch (error) {
    showAlert("danger", "Server error. Please try again.");
  }
}

// Utility function to display alerts
function showAlert(type, message) {
  const alertContainer = document.getElementById("alertContainer");
  alertContainer.innerHTML = `
        <div class="alert alert-${type} alert-dismissible fade show" role="alert">
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
        </div>
    `;
}
