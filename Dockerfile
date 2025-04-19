FROM node:18

# Set working directory
WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install

# Copy the rest of your app
COPY . .

# Optional: Build Tailwind CSS
RUN npm run watch & sleep 5

# Expose the port your server uses
EXPOSE 3000

# Start the server
CMD ["npx", "nodemon", "server.js"]
