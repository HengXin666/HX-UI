import { chromium } from 'playwright';
const b = await chromium.launch();
const p = await b.newPage();
p.on('console', (m) => console.log(m.type() + ': ' + m.text().slice(0, 300)));
p.on('pageerror', (e) => console.log('pageerror: ' + e.message.slice(0, 300)));
p.on('requestfailed', (r) => console.log('reqfail: ' + r.url().slice(-70) + ' ' + (r.failure()?.errorText || '')));
await p.goto('http://127.0.0.1:5600/#/templates-chat', { waitUntil: 'domcontentloaded' });
await p.waitForTimeout(3000);
const res = await p.evaluate(async () => {
  try {
    const m = await import('/node_modules/.vite/deps/stream-diffs_markstream.js');
    return { ok: true, keys: Object.keys(m).slice(0, 8) };
  } catch (e) { return { err: String(e).slice(0, 300) }; }
});
console.log('direct import:', JSON.stringify(res));
const has = await p.evaluate(() => !!customElements.get('diffs-container'));
console.log('diffs-container defined:', has);
await b.close();
