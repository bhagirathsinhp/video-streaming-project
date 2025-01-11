// courses.js

// Base URL for API calls
const BASE_URL = "http://174.129.100.156:5001";

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

// Handle Courses Page
async function loadCourses() {
  const coursesContainer = document.getElementById("courses-container");

  const courses = await apiCall("/courses");

  if (courses.error) {
    coursesContainer.innerHTML = `<p class="text-danger">Failed to load courses: ${courses.error}</p>`;
    return;
  }

  courses.forEach((course) => {
    const courseCard = `
      <div class="col-md-4">
        <div class="card mb-4">
          <div class="card-body">
            <h5 class="card-title">${course.title}</h5>
            <p class="card-text">${course.description}</p>
            <p class="text-muted">Category: ${course.category}</p>
            <a href="/courses/course-details.html?courseId=${course.courseId}" class="btn btn-primary">View Details</a>
          </div>
        </div>
      </div>
    `;
    coursesContainer.insertAdjacentHTML("beforeend", courseCard);
  });
}

// Handle Course Details Page
async function loadCourseDetails() {
  const params = new URLSearchParams(window.location.search);
  const courseId = params.get("courseId");

  if (!courseId) {
    document.body.innerHTML = `<p class="text-danger">Invalid Course ID</p>`;
    return;
  }

  const courseDetails = await apiCall(`/courses/${courseId}`);

  if (courseDetails.error) {
    document.body.innerHTML = `<p class="text-danger">Failed to load course details: ${courseDetails.error}</p>`;
    return;
  }

  // Populate course details
  document.getElementById("course-title").textContent = courseDetails.title;
  document.getElementById("course-description").textContent =
    courseDetails.description;

  // Populate videos list
  const videosList = document.getElementById("videos-list");
  courseDetails.videos.forEach((video) => {
    const videoItem = `
      <li class="list-group-item">
        ${video.title}
        <a href="/videos/stream.html?videoId=${video.videoId}" class="btn btn-primary btn-sm float-end">Watch</a>
      </li>
    `;
    videosList.insertAdjacentHTML("beforeend", videoItem);
  });
}

// Check which page is loaded and execute the relevant function
document.addEventListener("DOMContentLoaded", () => {
  if (document.getElementById("courses-container")) {
    loadCourses(); // Load Courses Page
  } else if (document.getElementById("course-title")) {
    loadCourseDetails(); // Load Course Details Page
  }
});
