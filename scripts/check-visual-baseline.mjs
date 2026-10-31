#!/usr/bin/env node
/**
 * 视觉基线. 打开一份静态夹具, 读计算样式, 和提交里的 JSON 比对.
 * 不存整页截图: 字体和抗锯齿会让像素哈希在不同机器上对不上.
 * 这条守的是尺寸、不透明度和减弱动效时动画被关掉.
 */
import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

const ROOT = path.resolve(import.meta.dirname, "..");
const FIXTURE = path.join(ROOT, "scripts", "fixtures", "motion-bar.html");
const BASELINE = path.join(ROOT, "scripts", "gates", "baselines", "visual-bar.json");

function fail(message) {
  console.error(`check-visual-baseline: ${message}`);
  process.exit(1);
}

const expected = JSON.parse(fs.readFileSync(BASELINE, "utf8"));
const { chromium } = await import("playwright");
const browser = await chromium.launch();
try {
  const page = await browser.newPage({ viewport: { width: 400, height: 200 }, reducedMotion: "no-preference" });
  await page.goto(pathToFileURL(FIXTURE).href);
  const live = await page.locator("#bar").evaluate((el) => {
    const style = getComputedStyle(el);
    return { width: style.width, height: style.height, animationName: style.animationName };
  });
  for (const key of ["width", "height", "animationName"]) {
    if (live[key] !== expected[key]) fail(`${key} 是 ${live[key]}, 基线是 ${expected[key]}`);
  }
  await page.emulateMedia({ reducedMotion: "reduce" });
  const reduced = await page.locator("#bar").evaluate((el) => getComputedStyle(el).animationName);
  if (reduced !== expected.reducedAnimation) fail(`减弱动效时动画是 ${reduced}, 基线是 ${expected.reducedAnimation}`);
} finally {
  await browser.close();
}

console.log("check-visual-baseline: 通过 (尺寸 / 动画名 / 减弱动效)");
