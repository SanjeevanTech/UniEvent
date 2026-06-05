# Pull base image
FROM node:22-alpine

# Set working directory
WORKDIR /app

# Install dependencies
COPY package.json package-lock.json ./
RUN npm install

# Copy source
COPY . .

# Expose port (default for Expo web is 8081)
EXPOSE 8081

# Start execution
CMD ["npx", "expo", "start"]