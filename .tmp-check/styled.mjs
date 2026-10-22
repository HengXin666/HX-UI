import { chromium } from 'playwright';
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1440, height: 1100 } });
await p.goto('http://127.0.0.1:5600/#/agent-stream', { waitUntil: 'domcontentloaded' });
await p.waitForTimeout(2500);
// 点第一个 "开始追加"
await p.getByRole('button', { name: '开始追加' }).first().click();
await p.waitForTimeout(16000);
const info = await p.evaluate(() => {
  const host = document.querySelector('[data-slot="streaming-markdown"]');
  const pre = host?.querySelector('pre');
  const code = host?.querySelector('code');
  const table = host?.querySelector('table');
  const th = host?.querySelector('th');
  const cs = (el) => el ? { tag: el.tagName, cls: String(el.className).slice(0, 90), bg: getComputedStyle(el).backgroundColor, color: getComputedStyle(el).color, pad: getComputedStyle(el).padding, border: getComputedStyle(el).borderTopWidth + ' ' + getComputedStyle(el).borderTopColor, fs: getComputedStyle(el).fontSize } : null;
  return { textLen: host?.textContent?.length ?? 0, html: (host?.innerHTML || '').slice(0, 300), pre: cs(pre), code: cs(code), table: cs(table), th: cs(th) };
});
console.log(JSON.stringify(info, null, 1));
await b.close();
