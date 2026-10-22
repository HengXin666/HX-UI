import { chromium } from 'playwright';
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1440, height: 1000 } });
const errs = [];
p.on('console', (m) => { if (m.type() === 'error') errs.push(m.text()); });
await p.goto('http://127.0.0.1:5600/#/agent-stream', { waitUntil: 'domcontentloaded' });
await p.waitForTimeout(4000);
const info = await p.evaluate(() => {
  const host = document.querySelector('[data-slot="streaming-markdown"]') || document.body;
  const pre = host.querySelector('pre');
  const code = host.querySelector('code');
  const table = host.querySelector('table');
  const h2 = host.querySelector('h2');
  const cs = (el) => el ? { tag: el.tagName, cls: (el.className || '').toString().slice(0, 80), bg: getComputedStyle(el).backgroundColor, color: getComputedStyle(el).color, font: getComputedStyle(el).fontFamily.slice(0, 40), pad: getComputedStyle(el).padding, border: getComputedStyle(el).borderTopWidth } : null;
  return { hasHost: !!document.querySelector('[data-slot="streaming-markdown"]'), pre: cs(pre), code: cs(code), table: cs(table), h2: cs(h2), html: (host.innerHTML || '').slice(0, 400) };
});
console.log(JSON.stringify(info, null, 1));
console.log('errors', errs.slice(0, 4));
await b.close();
