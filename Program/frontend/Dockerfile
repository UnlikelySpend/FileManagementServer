FROM node:18-alpine

WORKDIR /app

# Copy package files from root
COPY package*.json ./
RUN npm install

# Copy only the frontend source code
COPY frontend/ .

# Expose port
EXPOSE 5173

# Use npm run dev for Vite
CMD ["npm", "run", "dev"] 