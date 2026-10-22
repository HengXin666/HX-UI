import { chromium } from 'playwright';
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1440, height: 1100 } });
const logs = [];
p.on('console', (m) => { if (m.type() === 'error') logs.push(m.text().slice(0, 200)); });
await p.goto('http://127.0.0.1:5600/#/templates-chat', { waitUntil: 'domcontentloaded' });
await p.waitForTimeout(3500);
const out = await p.evaluate(() => {
  const host = document.querySelector('[data-slot="streaming-markdown"]');
  const pre = host?.querySelector('pre');
  const code = host?.querySelector('pre code, pre');
  const colored = code ? [...code.querySelectorAll('span')].filter(s => getComputedStyle(s).color !== getComputedStyle(code).color).length : 0;
  return {
    hasCodeBlock: !!host?.querySelector('[data-slot="code-block"], .code-block, pre'),
    pre: pre ? { len: pre.textContent.length, bg: getComputedStyle(pre).backgroundColor, color: getComputedStyle(pre).color, font: getComputedStyle(pre).fontFamily.slice(0, 26) } : null,
    coloredSpans: colored,
    hostTextTail: (host?.textContent || '').slice(-80),
  };
});
console.log(JSON.stringify(out, null, 1));
console.log('errors', logs.slice(0, 3));
await b.close();
