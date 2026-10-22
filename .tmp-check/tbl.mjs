import { chromium } from 'playwright';
const b = await chromium.launch();
const p = await b.newPage();
await p.goto('http://127.0.0.1:5600/#/templates-chat', { waitUntil: 'domcontentloaded' });
await p.waitForTimeout(3000);
const out = await p.evaluate(() => {
  const t = document.querySelector('[data-slot="streaming-markdown"] table');
  const th = t?.querySelector('th');
  const td = t?.querySelector('td');
  const cs = (el) => el ? { borderTop: getComputedStyle(el).borderTopWidth + ' ' + getComputedStyle(el).borderTopStyle, borderBottom: getComputedStyle(el).borderBottomWidth, bg: getComputedStyle(el).backgroundColor } : null;
  return { table: cs(t), th: cs(th), td: cs(td) };
});
console.log(JSON.stringify(out, null, 1));
await b.close();
