import { stepSpring, type SpringSpec, type SpringStep } from "../../craft/spring";
import type { SpringIntegrator } from "../spring/step";

/**
 * 一条可中断的弹簧轴: 当前值, 速度 (单位/秒) 与目标. 改目标不清速度, 中途反向不跳变.
 * 调用方自己排帧 (通常配 useFrameLoop), 适合一帧里要同时推进好几条轴, 再一起写 DOM 的场合.
 *
 * .agents/notes/implemented/feature/2026-11-08-motion-spring-frame.md
 */
export interface Axis {
  current: number;
  velocity: number;
  target: number;
}

export function makeAxis(value = 0): Axis {
  return { current: value, velocity: 0, target: value };
}

/**
 * 把轴推进一帧, 写回当前值与速度.
 *
 * @param axis 被推进的轴.
 * @param spec 弹簧参数.
 * @param dtMs 帧长, 毫秒.
 * @param integrate 积分器, 默认 craft 的半隐式 stepSpring.
 */
export function stepAxis(axis: Axis, spec: SpringSpec, dtMs: number, integrate: SpringIntegrator = stepSpring): SpringStep {
  const step = integrate(axis.current, axis.velocity, axis.target, spec, dtMs);
  axis.current = step.current;
  axis.velocity = step.velocity;
  return step;
}

/** 直接落到某值, 不留速度. 减弱动效, 键盘触发与拖拽跟手用. */
export function snapAxis(axis: Axis, value: number): void {
  axis.current = value;
  axis.target = value;
  axis.velocity = 0;
}
