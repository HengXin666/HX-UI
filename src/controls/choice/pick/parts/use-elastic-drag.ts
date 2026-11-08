/** ElasticSegment 的拇指拖动: 过 slop 才起拖, 采样松手速度, 越界阻尼, 松手按甩动或最近槽位落定. */
import { useRef, useState, type PointerEvent, type RefObject } from "react";
import { ELASTIC_DEADZONE, ELASTIC_SLOP, elasticRelease, elasticRubber, type ElasticSlot } from "./elastic-spec";
import type { ElasticEdges } from "./elastic-edges";

const HALF = 2;
const MS_PER_S = 1000;

interface Drag {
	readonly startX: number;
	readonly startLeft: number;
	readonly width: number;
	lastX: number;
	lastT: number;
	velocity: number;
	active: boolean;
}

interface ElasticDragOptions {
	readonly edges: RefObject<ElasticEdges | null>;
	readonly track: RefObject<HTMLDivElement | null>;
	readonly enabled: boolean;
	readonly count: number;
	readonly index: number;
	readonly slot: (i: number) => ElasticSlot;
	readonly nearest: (centre: number) => number;
	readonly select: (i: number, velocity: number | null) => void;
}

export interface ElasticDrag {
	readonly pressed: boolean;
	/** 拖动中的标记, select 用它判断同值也要重新落位. */
	readonly dragging: RefObject<Drag | null>;
	/** 刚结束一次拖动, 下一次 click 要吞掉. */
	readonly swallowClick: RefObject<boolean>;
	readonly onPointerDown: (event: PointerEvent<HTMLDivElement>) => void;
	readonly onPointerMove: (event: PointerEvent<HTMLDivElement>) => void;
	readonly endDrag: (cancelled: boolean) => void;
}

export function useElasticDrag({ edges, track, enabled, count, index, slot, nearest, select }: ElasticDragOptions): ElasticDrag {
	const drag = useRef<Drag | null>(null);
	const swallowClick = useRef(false);
	const [pressed, setPressed] = useState(false);

	const onPointerDown = (event: PointerEvent<HTMLDivElement>): void => {
		const e = edges.current;
		swallowClick.current = false;
		if (!enabled || !e || event.button !== 0) return;
		const left = Math.min(e.left.value, e.right.value);
		const right = Math.max(e.left.value, e.right.value);
		const rect = track.current?.getBoundingClientRect();
		const x = event.clientX - (rect?.left ?? 0);
		if (x < left || x > right) return;
		drag.current = { startX: event.clientX, startLeft: left, width: right - left, lastX: event.clientX, lastT: event.timeStamp, velocity: 0, active: false };
		setPressed(true);
	};

	const onPointerMove = (event: PointerEvent<HTMLDivElement>): void => {
		const e = edges.current;
		const g = drag.current;
		if (!e || !g) return;
		const dx = event.clientX - g.startX;
		if (!g.active) {
			if (Math.abs(dx) < ELASTIC_SLOP) return;
			g.active = true;
			event.currentTarget.setPointerCapture?.(event.pointerId);
		}
		const step = event.clientX - g.lastX;
		const dt = event.timeStamp - g.lastT;
		if (Math.abs(step) >= ELASTIC_DEADZONE && dt > 0) {
			g.velocity = (step / dt) * MS_PER_S;
			g.lastX = event.clientX;
			g.lastT = event.timeStamp;
		}
		const first = slot(0).left;
		const last = slot(count - 1).right - g.width;
		const left = elasticRubber(g.startLeft + dx, first, last);
		e.left.jump(left);
		e.right.jump(left + g.width);
	};

	const endDrag = (cancelled: boolean): void => {
		const g = drag.current;
		const e = edges.current;
		setPressed(false);
		if (!g || !e || !g.active) {
			drag.current = null;
			return;
		}
		swallowClick.current = true;
		const release = elasticRelease(cancelled ? 0 : g.velocity);
		const centre = (e.left.value + e.right.value) / HALF;
		const target = cancelled ? index : nearest(centre + (release.flick ? Math.sign(release.velocity) * (g.width / HALF) : 0));
		select(target, release.flick ? release.velocity : null);
		drag.current = null;
	};

	return { pressed, dragging: drag, swallowClick, onPointerDown, onPointerMove, endDrag };
}
