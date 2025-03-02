const express = require('express');
const chromium = require('chrome-aws-lambda');
const puppeteer = require('puppeteer-core');

const app = express();
const port = 3000;

app.use(express.json());

app.get('/api/scrape', async (req, res) => {
  const { url, intervals, skipCheck } = req.query;

  if (!url || !intervals) {
    return res.status(400).json({ error: 'Invalid input' });
  }

  const intervalArray = intervals.split(',').map(Number);
  const fullUrl = `${url}&intervals=${intervals}`;
  console.log(`Received request: url=${fullUrl}, intervals=${intervals}`);

  try {
    const browser = await puppeteer.launch({
      args: chromium.args,
      executablePath: await chromium.executablePath,
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

    const results = [];
    for (let interval of intervalArray) {
      const result = await page.evaluate((interval) => {
        const elements = Array.from(document.querySelectorAll('body *'));
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

      results.push({ interval, resultSnippet: result.elementText });
    }

    await browser.close();
    res.json({ message: 'Scraping completed', results });
  } catch (error) {
    console.error('Error during scraping:', error);
    res.status(500).json({ error: error.message });
  }
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
