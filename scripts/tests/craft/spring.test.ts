import assert from "node:assert/strict";
import test from "node:test";
import { dealCue, heroPose, stepSpring } from "../../../src/craft/spring.ts";
import { MS, PX, SCALE, SPRING } from "../../../src/craft/tokens.ts";

/**
 * 发牌后段更短, 主角句会落下再停住, 弹簧改目标时速度还在.
 *
 * .agents/notes/implemented/feature/2026-11-07-craft-controls.md
 */
export function craftMotionHolds(): void {
  const count = MS.dealStart / MS.dealEnd;
  let prev = 0;
  let first = 0;
  let last = 0;
  for (let index = 1; index < count; index += 1) {
    const at = dealCue(index, count);
    const gap = at - prev;
    if (index === 1) first = gap;
    last = gap;
    prev = at;
  }
  assert.ok(first > last);
  assert.equal(dealCue(0, count), 0);

  const hidden = heroPose(0);
  assert.equal(hidden.opacity, 0);
  const prep = heroPose(MS.quiet + MS.prep);
  assert.ok(prep.y > PX.prep * SCALE.velDamp);
  const held = heroPose(MS.quiet + MS.still);
  assert.equal(held.y, 0);
  assert.equal(held.scale, SCALE.rest);

  const state = { x: 0, v: 0 };
  stepSpring(state, 1, SPRING.press, PX.travel);
  assert.ok(state.v > 0);
  const traveled = state.x;
  stepSpring(state, 0, SPRING.press, PX.travel);
  assert.ok(state.v > 0);
  assert.ok(state.x !== traveled);
}
test("craft motion holds a deal, a pose, and velocity", craftMotionHolds);
