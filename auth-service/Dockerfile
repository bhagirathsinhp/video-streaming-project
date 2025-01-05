# Base Image
FROM python:3.12

# Set Working Directory
WORKDIR /app

# Copy Project Files
COPY . .

# Install Dependencies
RUN pip install -r requirements.txt

# Expose Port
EXPOSE 5000

# Run the Application
CMD ["python", "app.py"]
