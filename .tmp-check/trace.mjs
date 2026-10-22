import { chromium } from 'playwright';
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1440, height: 1200 } });
const errs = [];
p.on('pageerror', (e) => errs.push(e.message.slice(0, 120)));
await p.goto('http://127.0.0.1:5600/#/trace', { waitUntil: 'domcontentloaded' });
await p.waitForTimeout(3000);
const before = await p.evaluate(() => ({
  h1: document.querySelector('h1')?.textContent,
  h2s: [...document.querySelectorAll('h2')].map((h) => h.textContent),
  steps: document.querySelectorAll('[data-slot="trace-step"]').length,
}));
await p.getByRole('button', { name: '开始生成' }).click();
await p.waitForTimeout(1200);
const mid = await p.evaluate(() => {
  const steps = [...document.querySelectorAll('[data-slot="trace-step"]')];
  return {
    count: steps.length,
    statuses: steps.map((s) => s.getAttribute('data-status')),
    titles: steps.map((s) => s.querySelector('[data-slot="trace-title"]')?.textContent?.slice(0, 20)),
    openStates: steps.map((s) => s.querySelector('[data-slot^="collapsible"], .radix-collapsible-content') ? 'x' : '-'),
  };
});
await p.waitForTimeout(3200);
const after = await p.evaluate(() => {
  const steps = [...document.querySelectorAll('[data-slot="trace-step"]')];
  return {
    count: steps.length,
    statuses: steps.map((s) => s.getAttribute('data-status')),
    hasPlaceholder: [...steps].some((s) => (s.textContent || '').includes('正在生成')),
    expanded: steps.filter((s) => s.querySelector('[data-slot="trace-content"]')).length,
  };
});
console.log(JSON.stringify({ before, mid, after, errs: errs.slice(0, 3) }, null, 1));
await b.close();
