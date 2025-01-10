const API_URL = "http://174.129.100.156:5001"; // Replace with your EC2 IP

// Function to fetch and display courses
async function fetchCourses() {
  const container = document.getElementById("courses-container");
  container.innerHTML = '<div class="text-center">Loading courses...</div>';

  try {
    const response = await fetch(`${API_URL}/courses`);
    if (!response.ok) {
      throw new Error(`Error fetching courses: ${response.statusText}`);
    }

    const courses = await response.json();

    if (courses.length === 0) {
      container.innerHTML =
        '<div class="text-center">No courses available.</div>';
      return;
    }

    // Render courses
    container.innerHTML = courses
      .map(
        (course) => `
            <div class="col-md-4">
                <div class="card shadow-sm">
                    <div class="card-body">
                        <h5 class="card-title">${course.title}</h5>
                        <p class="card-text">${course.description}</p>
                        <a href="video.html?courseId=${course.courseId}" class="btn btn-primary">View Course</a>
                    </div>
                </div>
            </div>
        `
      )
      .join("");
  } catch (error) {
    console.error(error);
    container.innerHTML =
      '<div class="text-center text-danger">Failed to load courses. Please try again later.</div>';
  }
}

// Initialize
fetchCourses();
