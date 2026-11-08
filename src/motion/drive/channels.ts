import { stepSpring, type SpringSpec } from "../../craft/spring";
import type { SpringIntegrator } from "../spring/step";

/**
 * 一组命名弹簧通道: 每路有自己的弹簧, 目标与起步延迟, 共用一次 step 推进.
 * 改目标时位置与速度原样保留, 中途反向不跳变. 不排帧, 由调用方的帧循环驱动.
 *
 * .agents/notes/implemented/feature/2026-11-08-motion-spring-frame.md
 */
interface Channel {
  x: number;
  v: number;
  target: number;
  spring: SpringSpec;
  /** 这个时间戳之前保持不动, 用来实现带延迟的弹簧. */
  startAt: number;
  resting: boolean;
}

export interface AimOptions {
  /** 当前时间戳, 与 delayMs 一起决定起步时刻. 不给按 0 计, 即立即起步. */
  readonly now?: number;
  readonly delayMs?: number;
  /** 从这个值出发 (速度清零), 不给则从当前值与当前速度出发. */
  readonly from?: number;
  /** 覆盖起步速度 (甩出时用). */
  readonly velocity?: number;
}

export class SpringChannels {
  private readonly map = new Map<string, Channel>();
  private readonly integrate: SpringIntegrator;

  /** @param integrate 积分器, 默认 craft 的半隐式 stepSpring. */
  constructor(integrate: SpringIntegrator = stepSpring) {
    this.integrate = integrate;
  }

  value(id: string, fallback = 0): number {
    return this.map.get(id)?.x ?? fallback;
  }

  velocity(id: string): number {
    return this.map.get(id)?.v ?? 0;
  }

  /** 立即写值, 不动画. 减弱动效和首帧用. */
  jump(id: string, x: number, spring: SpringSpec): void {
    this.map.set(id, { x, v: 0, target: x, spring, startAt: 0, resting: true });
  }

  /** 朝 target 弹. 起点与速度见 AimOptions. */
  aim(id: string, target: number, spring: SpringSpec, options: AimOptions = {}): void {
    const { now = 0, delayMs = 0, from, velocity } = options;
    const prev = this.map.get(id);
    const x = from ?? prev?.x ?? target;
    const v = velocity ?? (from === undefined ? (prev?.v ?? 0) : 0);
    this.map.set(id, { x, v, target, spring, startAt: now + delayMs, resting: false });
  }

  /** 换掉某路的弹簧, 位置, 速度与目标不动. */
  retune(id: string, spring: SpringSpec): void {
    const channel = this.map.get(id);
    if (channel) channel.spring = spring;
  }

  /** 推进一帧. 返回本帧开始时是否还有通道在动或在等延迟. */
  step(dtMs: number, now: number): boolean {
    let busy = false;
    for (const ch of this.map.values()) {
      if (ch.resting) continue;
      busy = true;
      if (now < ch.startAt) continue;
      const s = this.integrate(ch.x, ch.v, ch.target, ch.spring, dtMs);
      ch.x = s.current;
      ch.v = s.velocity;
      ch.resting = s.resting;
    }
    return busy;
  }

  /** 推进后是否还有通道没落定. */
  active(): boolean {
    for (const ch of this.map.values()) if (!ch.resting) return true;
    return false;
  }
}
