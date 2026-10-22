import { chromium } from 'playwright';
const b = await chromium.launch();
const p = await b.newPage();
await p.goto('http://127.0.0.1:5600/#/templates-chat', { waitUntil: 'domcontentloaded' });
await p.waitForTimeout(3000);
const out = await p.evaluate(() => {
  const pre = document.querySelector('[data-slot="streaming-markdown"] pre');
  const th = document.querySelector('[data-slot="streaming-markdown"] th');
  return {
    pre: pre ? { cls: pre.className, style: pre.getAttribute('style'), parentCls: pre.parentElement?.className } : null,
    th: th ? { cls: th.className, style: th.getAttribute('style'), tableCls: th.closest('table')?.className } : null,
  };
});
console.log(JSON.stringify(out, null, 1));
await b.close();
