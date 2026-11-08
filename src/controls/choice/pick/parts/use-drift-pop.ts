/** DriftSelect 菜单的弹出与收起动画: 关闭途中再打开时原地倒放, 收完才卸载. */
import { useLayoutEffect, useRef, type RefObject } from "react";
import { EASE_PLAIN, PX, SPEC_EASE_OUT } from "../../tone";
import { DRIFT_MS, DRIFT_NONE, DRIFT_POP_FROM_SCALE, DRIFT_SHIFT_PX } from "./drift-spec";

interface DriftPopOptions {
	readonly menu: RefObject<HTMLDivElement | null>;
	readonly root: RefObject<HTMLDivElement | null>;
	readonly open: boolean;
	readonly mounted: boolean;
	readonly setMounted: (mounted: boolean) => void;
	readonly placement: "bottom" | "top";
	readonly reduced: boolean;
	readonly popDuration: number;
}

export function useDriftPop({ menu, root, open, mounted, setMounted, placement, reduced, popDuration }: DriftPopOptions): void {
	const pop = useRef<Animation[]>([]);
	const openRef = useRef(open);
	openRef.current = open;

	useLayoutEffect(() => {
		const el = menu.current;
		if (!mounted || !el?.animate) {
			if (!open) setMounted(false);
			return;
		}
		if (pop.current.length > 0 && pop.current.every((a) => a.playState === "running")) {
			pop.current.forEach((a) => a.reverse());
		} else if (open) {
			const shift = (placement === "bottom" ? DRIFT_NONE : 1) * DRIFT_SHIFT_PX;
			pop.current = reduced
				? []
				: [
						el.animate([{ transform: "translateY(" + shift + PX + ") scale(" + DRIFT_POP_FROM_SCALE + ")" }, { transform: "none" }], { duration: popDuration, easing: SPEC_EASE_OUT }),
						el.animate([{ opacity: 0 }, { opacity: 1 }], { duration: DRIFT_MS.menuFade, easing: EASE_PLAIN }),
					];
		} else {
			const fade = reduced ? null : el.animate([{ opacity: 1 }, { opacity: 0 }], { duration: DRIFT_MS.menuFade, easing: EASE_PLAIN });
			pop.current = fade ? [fade] : [];
			if (!fade) setMounted(false);
		}
		const list = pop.current;
		const done = (): void => {
			if (!root.current) return;
			pop.current = [];
			if (!openRef.current) setMounted(false);
		};
		list[0]?.addEventListener("finish", done, { once: true });
		return () => list[0]?.removeEventListener("finish", done);
		// 只跟开合走
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [open]);
}
