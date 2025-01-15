# Video Streaming Platform - DREAD

Welcome to the DREAD (Dundee Research and Educational Authority for Domination) video streaming platform project! This repository contains the source code for a scalable and secure video streaming platform built using microservices, AWS cloud infrastructure, and CI/CD principles.

---

## **Project Overview**
The DREAD video streaming platform is designed to provide a seamless user experience for:
- **Video Streaming**: Securely stream videos from AWS S3.
- **Course Management**: View and manage courses and associated videos.
- **User Authentication**: Register and log in securely.
- **Watchlist**: Add and manage favorite videos.
- **Forum Discussions**: Collaborate through course-specific discussion threads.
- **Progress Tracking**: Monitor video viewing progress.

### **Technologies Used**
- **Frontend**: HTML, CSS, JavaScript, Bootstrap, hosted using NGINX.
- **Backend**: Python (Flask) microservices with REST APIs.
- **Database**: AWS DynamoDB for metadata storage.
- **Video Storage**: AWS S3 for secure video streaming.
- **Containerization**: Docker for deploying services.
- **CI/CD**: GitHub Actions for automated build, test, and deploy workflows.
- **Cloud Hosting**: AWS EC2 for hosting services.
- **Image Hosting**: AWS ECR for storing Docker images.

---

## **Repository Structure**
```
project/
├── auth-service/          # Authentication microservice
├── course-service/        # Course management microservice
├── forum-service/         # Forum discussion microservice
├── profile-service/       # User profile microservice
├── progress-service/      # Progress tracking microservice
├── video-service/         # Video management microservice
├── watchlist-service/     # Watchlist microservice
├── frontend/              # Frontend application
├── ci-cd/                 # CI/CD workflow files
└── docker-compose.yml     # Docker Compose file for deployment
```

---

## **Features**
### **1. User Authentication**
- Secure user login and registration using the `auth-service`.
- Credentials stored in AWS DynamoDB.

### **2. Course Management**
- Add, update, delete and view course details using the `course-service`.

### **3. Video Streaming**
- Videos securely streamed from AWS S3 using pre-signed URLs.
- Video metadata stored in DynamoDB.

### **4. Watchlist**
- Add or remove videos from a personalized watchlist.
- Watchlist data managed by the `watchlist-service`.

### **5. Forum Discussions**
- Create threads and reply to discussions for specific courses.
- Data stored in the `forum-service`.

### **6. Progress Tracking**
- Tracks user progress for each course and video.
- Progress data stored in DynamoDB.

---

## **Future Enhancements**
- Add a load balancer for high availability.
- Integrate monitoring with Prometheus and Grafana.
- Implement personalized course recommendations.

---

