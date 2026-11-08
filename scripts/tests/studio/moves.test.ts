import assert from "node:assert/strict";
import test from "node:test";
import { dealDelay, SHOT_PACE } from "../../../src/motion/shots.ts";

/**
 * 发牌节奏的后段间隔比前段短.
 *
 * .agents/notes/implemented/feature/2026-11-06-studio-shot-language.md
 */
export function dealPaceTightens(): void {
  const count = 5;
  let prev = 0;
  let first = 0;
  let last = 0;
  for (let index = 1; index < count; index += 1) {
    const at = dealDelay(index, count, SHOT_PACE.deal);
    const gap = at - prev;
    if (index === 1) first = gap;
    last = gap;
    prev = at;
  }
  assert.ok(first > last);
}

/** 等间隔节奏随序号增加. */
export function evenPaceSteps(): void {
  const count = 4;
  const early = dealDelay(1, count, SHOT_PACE.even);
  const later = dealDelay(count - 1, count, SHOT_PACE.even);
  assert.ok(later > early);
}

test("deal pace tightens later gaps", dealPaceTightens);
test("even pace grows with index", evenPaceSteps);
