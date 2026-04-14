FROM node:20-slim

WORKDIR /app

# Copy package files first for better caching
COPY package*.json ./

RUN npm install

# Copy the rest of the application
COPY . .

# Build step (assuming TypeScript)
RUN npm run build

EXPOSE 4000

# Start command
CMD ["npm", "start"]
