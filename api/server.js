const express = require('express');
const puppeteer = require('puppeteer-core');
const fs = require('fs');
const chromium = require('@sparticuz/chromium');

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
          const elements = Array.from(document.querySelectorAll('body *'));
          const element = elements.find(el => el.innerText.includes(`[*[***]*]Request made at ${interval}s:`));

          if (element) {
            const startIndex = element.innerText.indexOf(`[*[***]*]Request made at ${interval}s:`);
            if (startIndex !== -1) {
              const resultText = element.inner
