const express = require('express');
const { chromium } = require('playwright');
const app = express();
const port = 3000;

app.use(express.json());

let browser;

(async () => {
  browser = await chromium.launch({
    args: ['--hide-scrollbars', '--disable-web-security'],
    headless: true,
  });
})();

app.get('/api/scrape', async (req, res) => {
  const { url, intervals, skipCheck } = req.query;

  if (!url || !intervals) {
    return res.status(400).json({ error: 'Invalid input' });
  }

  const intervalArray = intervals.split(',').map(Number);
  const fullUrl = `${url}&intervals=${intervals}`;
  console.log(`Received request: url=${fullUrl}, intervals=${intervals}`);

  try {
    const context = await browser.newContext();
    const page = await context.newPage();
    console.log(`Navigating to: ${fullUrl}`);
    await page.goto(fullUrl, { waitUntil: 'networkidle' });

    // Log the HTML content of the page
    const htmlContent = await page.content();
    console.log(htmlContent);

    if (skipCheck === 'true') {
      console.log('Skipping checks as skipCheck is set to true');
      await context.close();
      return res.json({ message: 'Scraping skipped', results: [] });
    }

    const startTime = Date.now();
    const results = [];
    for (let interval of intervalArray) {
      const nextTime = startTime + interval * 1000;

      // Wait until the next interval
      await page.waitForTimeout(nextTime - Date.now());

      const timeElapsed = (Date.now() - startTime) / 1000;
      console.log(`Checking result at interval ${interval}s, Time Elapsed: ${timeElapsed.toFixed(2)}s`);

      const checkInterval = 500; // Check every 500 ms
      const timeout = 5000; // Timeout after 5 seconds

      const checkStartTime = Date.now();
      let result = 'No element found within timeout period';

      while ((Date.now() - checkStartTime) < timeout) {
        const { elementText, foundElement } = await page.evaluate((interval) => {
          const elements = Array.from(document.querySelectorAll('body *'));
          const element = elements.find(el => el.innerText.includes(`[*[***]*]Request made at ${interval}s:`));

          if (element) {
            const startIndex = element.innerText.indexOf(`[*[***]*]Request made at ${interval}s:`);
            if (startIndex !== -1) {
              const resultText = element.innerText.substring(startIndex, startIndex + 50); // Keep it short but include time
              return { elementText: resultText, foundElement: true };
            }
          }

          return { elementText: 'null', foundElement: false };
        }, interval);

        if (foundElement) {
          result = elementText;
          break;
        }

        await page.waitForTimeout(checkInterval);
      }

      results.push({ interval, timeElapsed, resultSnippet: result });
    }

    await context.close();
    res.json({ message: 'Scraping completed', results });
  } catch (error) {
    console.error('Error during scraping:', error);
    res.status(500).json({ error: error.message });
  }
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
