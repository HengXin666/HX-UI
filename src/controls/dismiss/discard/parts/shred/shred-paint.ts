// ShredBin 的绘制: 把卡片模拟值与送入纸张, 碎条的位置卷曲直接写到 DOM.
import { clamp } from "../../../feel";
import type { CardSim, Feed } from "./shred-sim";

/** 规格的 curl 是倍数; 碎条最大卷曲角的基数规格未给, 这里取 12 度. */
const CURL_DEG = 12;

export function paintCard(el: HTMLDivElement | undefined, sim: CardSim): void {
	if (!el) return;
	el.style.transform = `translate3d(${sim.dx}px, ${sim.y.current + sim.dy}px, 0) rotate(${sim.tilt}deg) scale(${sim.lift})`;
}

export function paintFeed<T>(f: Feed<T>, feedEl: HTMLDivElement | null, stripEls: ReadonlyArray<HTMLDivElement | null>, curl: number): void {
	if (feedEl) feedEl.style.transform = `translate3d(${f.x}px, ${f.y + f.fed - f.tug}px, 0)`;
	const shown = Math.min(f.fed, f.h);
	f.strips.forEach((strip, i) => {
		const el = stripEls[i];
		if (!el) return;
		const turn = curl * strip.splay * clamp(f.fed / f.h, 0, 1) * CURL_DEG;
		el.style.height = `${shown}px`;
		el.style.transform = `translate3d(${f.x + strip.left + strip.x}px, ${strip.y}px, 0) rotate(${turn}deg)`;
		const inner = el.firstElementChild as HTMLElement | null;
		if (inner) inner.style.transform = `translate3d(0, ${shown - f.h}px, 0)`;
	});
}
