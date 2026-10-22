import { chromium } from 'playwright';
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1440, height: 1100 } });
await p.goto('http://127.0.0.1:5600/#/templates-chat', { waitUntil: 'domcontentloaded' });
await p.waitForTimeout(3500);
const out = await p.evaluate(() => {
  const host = document.querySelector('[data-slot="streaming-markdown"]');
  return {
    childTags: [...(host?.children || [])].map(c => c.tagName + '.' + String(c.className).slice(0, 40)),
    htmlHead: (host?.innerHTML || '').slice(0, 500),
  };
});
console.log(JSON.stringify(out, null, 1));
await b.close();
