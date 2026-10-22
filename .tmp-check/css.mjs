import { chromium } from 'playwright';
const b = await chromium.launch();
const p = await b.newPage();
await p.goto('http://127.0.0.1:5600/#/templates-chat', { waitUntil: 'domcontentloaded' });
await p.waitForTimeout(2500);
const out = await p.evaluate(() => {
  const found = [];
  for (const sheet of document.styleSheets) {
    let rules; try { rules = sheet.cssRules; } catch { continue; }
    const walk = (list) => { for (const r of list) { if (r.cssRules) walk(r.cssRules); else if (r.selectorText && r.selectorText.includes('streaming-markdown')) found.push(r.selectorText.slice(0, 90)); } };
    walk(rules);
  }
  const th = document.querySelector('[data-slot="streaming-markdown"] th');
  return { ourRules: found.slice(0, 10), thBorder: th ? getComputedStyle(th).borderBottomWidth + ' ' + getComputedStyle(th).borderBottomColor : null, thBg: th ? getComputedStyle(th).backgroundColor : null };
});
console.log(JSON.stringify(out, null, 1));
await b.close();
