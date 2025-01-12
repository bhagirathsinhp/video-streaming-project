# Use an NGINX base image
FROM nginx:alpine

# Copy the frontend build files to the NGINX HTML folder
COPY . /usr/share/nginx/html

# Expose the port NGINX uses
EXPOSE 80

# Start NGINX
CMD ["nginx", "-g", "daemon off;"]
