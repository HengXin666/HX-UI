/** ElasticSegment 头尾两边的弹簧编排: 头边先走, 尾边延迟起步并继承部分速度, 落定时压过再回弹. */
import type { SpringSpec } from "../../../../craft/spring";
import type { SpringDriver } from "../../../../motion/drive/driver";
import { springFromDuration } from "../../../../motion/spring/fit";
import { CHOICE_FIT, toMs } from "../../tone";
import { ELASTIC_HANDOFF, ELASTIC_PERCENT, ELASTIC_SPRING_MOMENTUM, ELASTIC_SPRING_RELAX, ELASTIC_SPRING_UI, elasticTime, type ElasticSlot } from "./elastic-spec";

const HALF = 2;
const BACK = -1;

export interface ElasticEdges {
	readonly left: SpringDriver;
	readonly right: SpringDriver;
}

export interface EdgeMotion {
	/** 甩动松手时的速度, null 为普通切换. */
	readonly velocity: number | null;
	readonly speed: number;
	readonly stretch: number;
	readonly squash: number;
	readonly glide: number;
}

/** 常规滑动弹簧 (按 speed 缩放). */
export function elasticUiSpring(speed: number): SpringSpec {
	return springFromDuration(elasticTime(ELASTIC_SPRING_UI.duration, speed), ELASTIC_SPRING_UI.bounce, CHOICE_FIT);
}

/** 把两边送到目标槽位. 方向由目标中心相对当前中心决定. */
export function glideEdges(e: ElasticEdges, to: ElasticSlot, { velocity, speed, stretch, squash, glide }: EdgeMotion): void {
	const centre = (e.left.value + e.right.value) / HALF;
	const dir = (to.left + to.right) / HALF >= centre ? 1 : BACK;
	const lead = dir > 0 ? e.right : e.left;
	const trail = dir > 0 ? e.left : e.right;
	const leadTo = dir > 0 ? to.right : to.left;
	const trailTo = dir > 0 ? to.left : to.right;
	const flick = velocity !== null;
	const shape = flick ? ELASTIC_SPRING_MOMENTUM : ELASTIC_SPRING_UI;
	lead.to(leadTo, springFromDuration(elasticTime(shape.duration, speed), shape.bounce, CHOICE_FIT), flick ? { velocity } : {});
	const amount = stretch / ELASTIC_PERCENT;
	const trailVelocity = lead.velocity * (glide / ELASTIC_PERCENT);
	const ui = elasticUiSpring(speed);
	const relax = springFromDuration(elasticTime(ELASTIC_SPRING_RELAX.duration, speed), ELASTIC_SPRING_RELAX.bounce, CHOICE_FIT);
	const delayMs = toMs(elasticTime(ELASTIC_HANDOFF, speed)) * amount;
	if (squash > 0) trail.to(trailTo + dir * squash, ui, { velocity: trailVelocity, delayMs, onRest: () => trail.to(trailTo, relax) });
	else trail.to(trailTo, ui, { velocity: trailVelocity, delayMs });
}
