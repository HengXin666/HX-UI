import { chromium } from 'playwright';
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1440, height: 1100 } });
await p.goto('http://127.0.0.1:5600/#/templates-chat', { waitUntil: 'domcontentloaded' });
await p.waitForTimeout(3000);
const info = await p.evaluate(() => {
  const host = document.querySelector('[data-slot="streaming-markdown"]');
  const cs = (el) => el ? { tag: el.tagName, cls: String(el.className).slice(0, 110), bg: getComputedStyle(el).backgroundColor, color: getComputedStyle(el).color, pad: getComputedStyle(el).padding, radius: getComputedStyle(el).borderRadius, font: getComputedStyle(el).fontFamily.slice(0, 30) } : null;
  const pre = host?.querySelector('pre');
  const codeBlock = host?.querySelector('.code-block-node, [class*="code-block"]');
  const table = host?.querySelector('table');
  const h2 = host?.querySelector('h2');
  return { html: (host?.innerHTML || '').slice(0, 600), pre: cs(pre), codeBlock: cs(codeBlock), table: cs(table), h2: cs(h2), theme: document.documentElement.getAttribute('data-mode') };
});
console.log(JSON.stringify(info, null, 1));
await b.close();
