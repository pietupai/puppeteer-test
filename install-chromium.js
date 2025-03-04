const download = require('download');
const path = require('path');

const chromiumUrl = 'https://github.com/Sparticuz/chromium/releases/download/v132.0.0/chromium-v132.0.0-pack.tar';
const chromiumPath = path.join(__dirname, 'node_modules/@sparticuz/chromium/bin');

(async () => {
  try {
    console.log(`Downloading Chromium from ${chromiumUrl}...`);
    await download(chromiumUrl, chromiumPath, { extract: true });
    console.log(`Chromium downloaded and extracted to ${chromiumPath}`);
  } catch (error) {
    console.error('Failed to download Chromium:', error);
  }
})();
