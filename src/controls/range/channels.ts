import type { SpringSpec } from "../../craft/spring";
import { stepSpringFine } from "./motion";

interface Channel {
	x: number;
	v: number;
	target: number;
	spring: SpringSpec;
	/** 这个时间戳之前保持不动, 用来实现带 delay 的弹簧. */
	startAt: number;
	resting: boolean;
}

/*
 * ENGINE-GAP: 一组带延迟的命名弹簧通道. L1 的 stepSpring 只推进一个标量, 没有 "目标 + 延迟 + 保留速度" 的调度.
 * 改目标时 x 与 v 原样保留, 所以中途反向不跳变.
 */
export class SpringChannels {
	private readonly map = new Map<string, Channel>();

	value(id: string, fallback = 0): number {
		return this.map.get(id)?.x ?? fallback;
	}

	/** 立即写值, 不动画. 减弱动效和首帧用. */
	jump(id: string, x: number, spring: SpringSpec): void {
		this.map.set(id, { x, v: 0, target: x, spring, startAt: 0, resting: true });
	}

	/** 从当前值与速度出发, delayMs 后朝 target 弹. */
	aim(id: string, target: number, spring: SpringSpec, now: number, delayMs = 0, from?: number): void {
		const prev = this.map.get(id);
		const x = from ?? prev?.x ?? target;
		this.map.set(id, { x, v: from === undefined ? (prev?.v ?? 0) : 0, target, spring, startAt: now + delayMs, resting: false });
	}

	/** 推进一帧, 返回是否还有通道在动或在等延迟. */
	step(dtMs: number, now: number): boolean {
		let busy = false;
		for (const ch of this.map.values()) {
			if (ch.resting) continue;
			busy = true;
			if (now < ch.startAt) continue;
			const s = stepSpringFine(ch.x, ch.v, ch.target, ch.spring, dtMs);
			ch.x = s.current;
			ch.v = s.velocity;
			ch.resting = s.resting;
		}
		return busy;
	}
}
