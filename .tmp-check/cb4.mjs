import { chromium } from 'playwright';
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1440, height: 1100 } });
await p.goto('http://127.0.0.1:5600/#/templates-chat', { waitUntil: 'domcontentloaded' });
await p.waitForTimeout(3500);
const out = await p.evaluate(() => {
  const host = document.querySelector('[data-slot="streaming-markdown"]');
  const pre = host?.querySelector('pre');
  const spans = pre ? [...pre.querySelectorAll('span')] : [];
  const base = pre ? getComputedStyle(pre).color : null;
  const colors = [...new Set(spans.map(s => getComputedStyle(s).color))];
  return {
    codeText: pre?.textContent?.trim().slice(0, 60),
    codeLen: pre?.textContent?.length ?? 0,
    preBg: pre ? getComputedStyle(pre).backgroundColor : null,
    preColor: base,
    spanCount: spans.length,
    distinctColors: colors.length,
    sampleColors: colors.slice(0, 5),
    table: (() => { const t = host?.querySelector('table'); return t ? { border: getComputedStyle(t).borderTopWidth + ' ' + getComputedStyle(t).borderTopStyle } : null; })(),
  };
});
console.log(JSON.stringify(out, null, 1));
await b.close();
