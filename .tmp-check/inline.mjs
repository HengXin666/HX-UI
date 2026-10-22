import { chromium } from 'playwright';
const b = await chromium.launch();
const p = await b.newPage();
await p.goto('http://127.0.0.1:5600/#/templates-chat', { waitUntil: 'domcontentloaded' });
await p.waitForTimeout(3500);
const out = await p.evaluate(() => {
  const styles = [...document.querySelectorAll('style')];
  const hits = styles.filter(s => s.textContent.includes('code-odp-background'));
  const linkSheets = [...document.querySelectorAll('link[rel=stylesheet]')].map(l => l.href);
  return { styleCount: styles.length, hits: hits.length, sample: hits[0] ? hits[0].textContent.slice(0, 200) : null, links: linkSheets.slice(0, 5), totalCssLen: styles.reduce((n, s) => n + s.textContent.length, 0) };
});
console.log(JSON.stringify(out, null, 1));
await b.close();
