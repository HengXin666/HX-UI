import { chromium } from 'playwright';
const b = await chromium.launch();
const p = await b.newPage();
await p.goto('http://127.0.0.1:5600/#/templates-chat', { waitUntil: 'domcontentloaded' });
await p.waitForTimeout(2500);
const out = await p.evaluate(() => {
  const before = (() => { const t = document.querySelector('[data-slot="streaming-markdown"] table'); return getComputedStyle(t).borderTopWidth; })();
  const s = document.createElement('style');
  s.textContent = '[data-slot="streaming-markdown"] table { border: 3px solid red; }';
  document.head.appendChild(s);
  const after = (() => { const t = document.querySelector('[data-slot="streaming-markdown"] table'); return getComputedStyle(t).borderTopWidth + ' ' + getComputedStyle(t).borderTopStyle; })();
  // 再看我们已有的规则是否在样式表里可见
  let found = 0;
  for (const sheet of document.styleSheets) {
    let rules; try { rules = sheet.cssRules; } catch { continue; }
    for (const r of rules) if (r.selectorText && r.selectorText.includes('streaming-markdown')) found++;
  }
  return { before, after, foundTopLevel: found };
});
console.log(JSON.stringify(out, null, 1));
await b.close();
