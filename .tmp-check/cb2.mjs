import { chromium } from 'playwright';
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1440, height: 1100 } });
const logs = [];
p.on('console', (m) => { if (m.type() !== 'debug') logs.push(m.type() + ': ' + m.text().slice(0, 200)); });
p.on('pageerror', (e) => logs.push('pageerror: ' + e.message.slice(0, 200)));
await p.goto('http://127.0.0.1:5600/#/templates-chat', { waitUntil: 'domcontentloaded' });
await p.waitForTimeout(4000);
const out = await p.evaluate(() => {
  const block = document.querySelector('.code-block-container');
  return { htmlTail: (block?.outerHTML || '').slice(-800), text: (block?.textContent || '').slice(0, 120), h: block?.getBoundingClientRect().height };
});
console.log(JSON.stringify(out, null, 1));
console.log('logs', logs.slice(0, 6));
await b.close();
