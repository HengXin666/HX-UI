import { chromium } from 'playwright';
const b = await chromium.launch();
for (const mode of ['dark','light']) {
  const p = await b.newPage({ viewport: { width: 1400, height: 850 } });
  await p.addInitScript(m => localStorage.setItem('hx-ui-docs-theme', m), mode);
  await p.goto('http://127.0.0.1:5600/blueprint.html#src=demo', { waitUntil:'networkidle' });
  await p.waitForTimeout(1500);
  const before = await p.evaluate(()=>document.documentElement.getAttribute('data-mode'));
  await p.locator('[data-node-kind]').first().locator('xpath=child::div[1]').click();
  await p.waitForTimeout(300);
  const n = await p.evaluate(() => {
    const token = getComputedStyle(document.documentElement).getPropertyValue('--bp-selected').trim();
    const probe=document.createElement('div'); probe.style.color=token; document.body.appendChild(probe);
    const rgb=getComputedStyle(probe).color; probe.remove();
    return [...document.querySelectorAll('[data-node-kind]')].filter(e=>getComputedStyle(e).boxShadow.includes(rgb)).length;
  });
  console.log(mode, '->', before, 'selected =', n);
  await p.close();
}
await b.close();
