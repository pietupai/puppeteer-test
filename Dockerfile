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
  libasound2

# Luo työskentelyhakemisto
WORKDIR /usr/src/app

# Kopioi projektin tiedostot
COPY . .

# Asenna riippuvuudet
RUN npm install

# Käynnistä sovellus
CMD ["npm", "start"]
