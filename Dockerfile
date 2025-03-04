FROM node:18-slim

# Install necessary libraries
RUN apt-get update && apt-get install -y \
  libnss3 \
  libnspr4 \
  libatk1.0-0 \
  libatk-bridge2.0-0 \
  libgdk-pixbuf2.0-0 \
  libgtk-3-0 \
  libxss1 \
  libasound2 \
  wget \
  tar

# Set working directory
WORKDIR /usr/src/app

# Copy project files
COPY . .

# Install dependencies
RUN npm install

# Download and unpack Chromium
RUN wget https://storage.googleapis.com/chromium-browser-snapshots/Linux_x64/901912/chrome-linux.zip -O /tmp/chromium.zip && \
    mkdir /usr/src/app/chromium && \
    unzip /tmp/chromium.zip -d /usr/src/app/chromium && \
    mv /usr/src/app/chromium/chrome-linux/* /usr/src/app/chromium/ && \
    rm /tmp/chromium.zip

# Set environment variable for Puppeteer
ENV PUPPETEER_EXECUTABLE_PATH="/usr/src/app/chromium/chrome"

# Start the application
CMD ["npm", "start"]
