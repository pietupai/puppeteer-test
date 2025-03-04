const download = require('download');
const path = require('path');
const unzipper = require('unzipper');

const chromiumUrl = 'https://github.com/Sparticuz/chromium/releases/download/v132.0.0/chromium-v132.0.0-pack.tar';
const chromiumPath = path.join(__dirname, 'chromium');

(async () => {
  try {
    console.log(`Downloading Chromium from ${chromiumUrl}...`);
    await download(chromiumUrl, chromiumPath, { extract: true });

    console.log(`Chromium downloaded and extracted to ${chromiumPath}`);
    process.env.CHROME_PATH = path.join(chromiumPath, 'chromium');
  } catch (error) {
    console.error('Failed to download Chromium:', error);
  }
})();
