# Use a specific Node.js version to ensure compatibility
FROM node:16

# Set the working directory in the container
WORKDIR /app

# Copy package.json and package-lock.json (or yarn.lock)
COPY package*.json ./

# Install dependencies
RUN npm install --production

# Rebuild bcrypt from source
RUN npm rebuild bcrypt --build-from-source

# Install other dependencies like curl or wget if necessary
RUN sudo apt-get update && sudo apt-get install -y --no-install-recommends curl wget

# Copy the rest of the application
COPY . .

# Expose the application port (e.g., 3000 for your app)
EXPOSE 3000

# Start the app
CMD ["npm", "run", "start"]
