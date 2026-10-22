import { chromium } from 'playwright';
const b = await chromium.launch();
const p = await b.newPage();
await p.goto('http://127.0.0.1:5600/#/templates-chat', { waitUntil: 'domcontentloaded' });
await p.waitForTimeout(3000);
const out = await p.evaluate(() => {
  const root = getComputedStyle(document.documentElement);
  const th = document.querySelector('[data-slot="streaming-markdown"] th');
  const pre = document.querySelector('[data-slot="streaming-markdown"] pre');
  return {
    codeOdpBg: root.getPropertyValue('--code-odp-background').trim(),
    border: root.getPropertyValue('--border').trim(),
    thMatched: th ? th.matches('[data-slot="streaming-markdown"] th') : null,
    thBorder: th ? getComputedStyle(th).borderBottom : null,
    preBg: pre ? getComputedStyle(pre).backgroundColor : null,
    preBorder: pre ? getComputedStyle(pre).borderTopWidth : null,
  };
});
console.log(JSON.stringify(out, null, 1));
await b.close();
