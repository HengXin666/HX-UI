import { chromium } from 'playwright';
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1440, height: 1100 } });
const logs = [];
p.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') logs.push(m.type() + ': ' + m.text().slice(0, 160)); });
await p.goto('http://127.0.0.1:5600/#/templates-chat', { waitUntil: 'domcontentloaded' });
await p.waitForTimeout(3000);
const out = await p.evaluate(() => {
  const host = document.querySelector('[data-slot="streaming-markdown"]');
  const block = host?.querySelector('.code-block-container');
  const pre = block?.querySelector('pre');
  const spans = block ? [...block.querySelectorAll('span')].slice(0, 6).map(s => ({ cls: s.className.slice(0, 50), color: getComputedStyle(s).color })) : [];
  return { hostText: (host?.textContent || '').slice(0, 400), blockTextFull: (block?.textContent || '').slice(0, 300), headerBtns: block ? [...block.querySelectorAll('button')].map(b => b.getAttribute('aria-pressed')) : [], spanCount: block ? block.querySelectorAll('span').length : 0, colored: block ? [...block.querySelectorAll('span')].filter(s => getComputedStyle(s).color !== getComputedStyle(block).color).length : 0, blockBg: block ? getComputedStyle(block).backgroundColor : null, blockColor: block ? getComputedStyle(block).color : null, pre: pre ? { cls: pre.className.slice(0, 60), bg: getComputedStyle(pre).backgroundColor, color: getComputedStyle(pre).color, font: getComputedStyle(pre).fontFamily.slice(0, 30) } : null, spans };
});
console.log(JSON.stringify(out, null, 1));
console.log('logs:', logs.slice(0, 5));
await b.close();
