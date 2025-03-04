FROM node:18-slim

# Asenna tarvittavat kirjastot
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

# Luo työskentelyhakemisto
WORKDIR /usr/src/app

# Kopioi projektin tiedostot
COPY . .

# Asenna riippuvuudet
RUN npm install

# Lataa ja pura Chromium
RUN wget https://github.com/Sparticuz/chromium/releases/download/v132.0.0/chromium-v132.0.0-pack.tar -O /tmp/chromium.tar && \
    tar -xvf /tmp/chromium.tar -C /usr/src/app && \
    rm /tmp/chromium.tar

# Aseta ympäristömuuttuja
ENV CHROME_PATH="/usr/src/app/chromium/chromium"

# Käynnistä sovellus
CMD ["npm", "start"]
