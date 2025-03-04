const express = require('express');
const { Cluster } = require('puppeteer-cluster');
const chromium = require('@sparticuz/chromium');
const puppeteer = require('puppeteer-core');

const app = express();
const port = 3000;

app.use(express.json());

let clusterInitialized = false;

async function initCluster() {
  return await Cluster.launch({
    concurrency: Cluster.CONCURRENCY_PAGE,
    maxConcurrency: 2,
    puppeteer,
    puppeteerOptions: {
      args: [...chromium.args, '--hide-scrollbars', '--disable-web-security'],
      defaultViewport: chromium.defaultViewport,
      executablePath: await chromium.executablePath(),
      headless: chromium.headless,
    },
  });
}

app.get('/api/scrape', async (req, res) => {
  const { url, intervals, skipCheck } = req.query;

  if (!url || !intervals) {
    return res.status(400).json({ error: 'Invalid input' });
  }

  const intervalArray = intervals.split(',').map(Number);
  const fullUrl = `${url}&intervals=${intervals}`;
  console.log(`Received request: url=${fullUrl}, intervals=${intervals}`);

  try {
    if (!clusterInitialized) {
      global.cluster = await initCluster();
      clusterInitialized = true;
    }

    const results = [];
    await global.cluster.task(async ({ page }) => {
      console.log(`Navigating to: ${fullUrl}`);
      await page.goto(fullUrl, { waitUntil: 'networkidle0' });

      const htmlContent = await page.content();
      console.log(htmlContent);

      if (skipCheck === 'true') {
        console.log('Skipping checks as skipCheck is set to true');
        return res.json({ message: 'Scraping skipped', results: [] });
      }

      const startTime = Date.now();
      for (let interval of intervalArray) {
        const nextTime = startTime + interval * 1000;

        await page.waitForTimeout(nextTime - Date.now());

        const timeElapsed = (Date.now() - startTime) / 1000;
        console.log(`Checking result at interval ${interval}s, Time Elapsed: ${timeElapsed.toFixed(2)}s`);

        const checkInterval = 500;
        const timeout = 5000;

        const checkStartTime = Date.now();
        let result = 'No element found within timeout period';

        while ((Date.now() - checkStartTime) < timeout) {
          const { elementText, foundElement } = await page.evaluate((interval) => {
            const elements = Array.from(document.querySelectorAll('body *'));
            const element = elements.find(el => el.innerText.includes(`[*[***]*]Request made at ${interval}s:`));

            if (element) {
              const startIndex = element.innerText.indexOf(`[*[***]*]Request made at ${interval}s:`);
              if (startIndex !== -1) {
                const resultText = element.innerText.substring(startIndex, startIndex + 50);
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
    });

    res.json({ message: 'Scraping completed', results });
  } catch (error) {
    console.error('Error during scraping:', error);
    res.status(500).json({ error: error.message });
  }
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
