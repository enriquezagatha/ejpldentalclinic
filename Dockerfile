# Use a specific Node.js version to ensure compatibility
FROM node:16

# Set the working directory in the container
WORKDIR /app

# Copy package.json and package-lock.json (or yarn.lock)
COPY package*.json ./

# Install dependencies
RUN npm install --production

# Install nodemon globally (if needed)
RUN npm install -g nodemon

# Copy the rest of the application
COPY . .

# Rebuild bcrypt if necessary
RUN npm rebuild bcrypt --build-from-source

# Expose the application port (e.g., 3000 for your app)
EXPOSE 3000

# Start the app
CMD ["npm", "run", "start"]
