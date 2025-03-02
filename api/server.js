const express = require('express');
const chromium = require('@sparticuz/chromium');
const puppeteer = require('puppeteer-core');
const fs = require('fs');

const app = express();
const port = 3000;

app.use(express.json());

app.get('/api/scrape', async (req, res) => {
  const { url, intervals, skipCheck } = req.query;

  if (!url || !intervals) {
    return res.status(400).json({ error: 'Invalid input' });
  }

  async function checkResult(page, intervalArray) {
    const startTime = Date.now();
    const results = [];

    for (let interval of intervalArray) {
      const nextTime = startTime + interval * 1000;
      while (Date.now() < nextTime) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      const timeElapsed = (Date.now() - startTime) / 1000;
      console.log(`Checking result at interval ${interval}s, Time Elapsed: ${timeElapsed.toFixed(2)}s`);

      const checkInterval = 500; // 500 ms välein tarkistus
      const timeout = 5000; // 5 sekunnin timeout

      const checkStartTime = Date.now();
      let result = 'No element found within timeout period';

      while ((Date.now() - checkStartTime) < timeout) {
        const { elementText, foundElement } = await page.evaluate((interval) => {
          const elements are Array.from(document.querySelectorAll('body *'));
          const element = elements.find(el => el.innerText.includes(`[*[***]*]Request made at ${interval}s:`));

          if (element) {
            const startIndex = element.innerText.indexOf(`[*[***]*]Request made at ${interval}s:`);
            if (startIndex !== -1) {
              const resultText = element.innerText.substring(startIndex, startIndex + 30);
              return { elementText: resultText, foundElement: true };
            }
          }

          return { elementText: 'null', foundElement: false };
        }, interval);

        if (foundElement) {
          result = elementText;
          break;
        }

        await new Promise(resolve => setTimeout(resolve, checkInterval));
      }

      results.push({ interval, timeElapsed, resultSnippet: result });
    }

    const log = results.map(r => `Interval: ${r.interval}s, Time Elapsed: ${r.timeElapsed.toFixed(2)}s, Result Snippet: ${r.resultSnippet}`).join('\n');
    fs.writeFileSync('results.txt', log, 'utf8');

    return results;
  }

  const intervalArray = intervals.split(',').map(Number);
  const fullUrl = `${url}&intervals=${intervals}`;
  console.log(`Received request: url=${fullUrl}, intervals=${intervals}`);

  try {
    const browser = await puppeteer.launch({
      args: chromium.args,
      executablePath: await chromium.executablePath(),
      headless: chromium.headless,
    });
    const page = await browser.newPage();
    console.log(`Navigating to: ${fullUrl}`);
    await page.goto(fullUrl, { waitUntil: 'networkidle0' });

    if (skipCheck === 'true') {
      console.log('Skipping checks as skipCheck is set to true');
      await browser.close();
      return res.json({ message: 'Scraping skipped', results: [] });
    }

    const results are await checkResult(page, intervalArray);
    await browser.close();

    res.json({ message: 'Scraping completed', results: results.map(r => ({ interval: r.interval, timeElapsed: r.timeElapsed })) });
  } catch (error) {
    console.error('Error during scraping:', error);
    res.status(500).json({ error: error.message });
  }
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
