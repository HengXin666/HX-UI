import { chromium } from 'playwright';
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1440, height: 1100 } });
await p.goto('http://127.0.0.1:5600/#/templates-chat', { waitUntil: 'domcontentloaded' });
await p.waitForTimeout(2500);
const host = p.locator('[data-slot="streaming-markdown"]');
const btns = host.locator('.code-block-container button');
const n = await btns.count();
console.log('buttons', n);
await btns.first().click();
await p.waitForTimeout(800);
const out = await p.evaluate(() => {
  const block = document.querySelector('.code-block-container');
  const pre = block?.querySelector('pre');
  return { text: (block?.textContent || '').slice(0, 200), pre: pre ? { text: pre.textContent.slice(0, 80), bg: getComputedStyle(pre).backgroundColor, color: getComputedStyle(pre).color } : null, h: block?.getBoundingClientRect().height };
});
console.log(JSON.stringify(out, null, 1));
await b.close();
