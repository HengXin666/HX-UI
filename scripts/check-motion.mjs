#!/usr/bin/env node
/**
 * 动效契约. 向量是固定的, 不打开浏览器.
 * 布局位移、拖动手势、滚动进度、出场时长、还在场上的 id, 五条都要和这里的数一致.
 */
import { gestureDelta, layoutDelta, presenceDuration, retainedIds, scrollProgress } from "../src/primitives/motion-math.ts";

function fail(message) {
  console.error(`check-motion: ${message}`);
  process.exit(1);
}

const layout = layoutDelta({ x: 10, y: 4 }, { x: 2, y: 9 });
if (layout.x !== 8 || layout.y !== -5) fail(`layoutDelta 得到 ${layout.x},${layout.y}`);

const drag = gestureDelta({ x: 3, y: 3 }, { x: 8, y: 1 });
if (drag.x !== 5 || drag.y !== -2) fail(`gestureDelta 得到 ${drag.x},${drag.y}`);

if (scrollProgress(0, 80) !== 0) fail("滚动起点不是 0");
if (scrollProgress(40, 80) !== 0.5) fail("滚动中点不是 0.5");
if (scrollProgress(100, 80) !== 1) fail("滚过尽头没有夹到 1");
if (scrollProgress(0, 0) !== 1) fail("没有可滚距离时应当视为到底");

if (presenceDuration(false) !== 180) fail("出场时长变了");
if (presenceDuration(true) !== 0) fail("减弱动效时出场仍在播");

const kept = retainedIds(["a", "b"], ["b", "c"]);
if (kept.length !== 1 || kept[0] !== "b") fail(`retainedIds 得到 ${kept.join(",")}`);

console.log("check-motion: 通过 (布局 / 手势 / 滚动 / 出场 / 身份)");
