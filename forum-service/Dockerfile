# Use Python base image
FROM python:3.12-slim

# Set the working directory
WORKDIR /app

# Copy the application files
COPY . .

# Install dependencies
RUN pip install -r requirements.txt

# Expose the service port
EXPOSE 5000

# Command to run the application
CMD ["python", "app.py"]
