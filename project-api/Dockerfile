# Use the official Bun image
FROM oven/bun:1

# Set the working directory inside the container
WORKDIR /app

# Copy package.json and bun.lock (if present)
COPY package*.json bun.lock* ./

# Install dependencies
RUN bun install --frozen-lockfile

# Copy the rest of the application code
COPY . .

# Expose the port your app runs on (change if needed)
EXPOSE 45231

# Command to run the compiled app
CMD ["bun", "run", "dev.api"]