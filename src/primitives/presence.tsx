"use client";

import { useLayoutEffect, useRef, useState, type JSX, type ReactNode } from "react";
import { prefersReducedMotion } from "./motion";
import { presenceDuration } from "./motion-math";

/**
 * 进场淡入, 离场淡出后再卸下. 减弱动效时不播, 直接出现或消失.
 */
export function MotionPresence({
	present,
	children,
}: {
	present: boolean;
	children: ReactNode;
}): JSX.Element | null {
	const ref = useRef<HTMLDivElement>(null);
	const [shown, setShown] = useState(present);

	useLayoutEffect(() => {
		const el = ref.current;
		if (present) {
			setShown(true);
			if (!el || prefersReducedMotion()) return;
			el.animate?.([{ opacity: 0 }, { opacity: 1 }], { duration: presenceDuration(false) });
			return;
		}
		if (!shown || !el) return;
		const ms = presenceDuration(prefersReducedMotion());
		if (ms === 0) {
			setShown(false);
			return;
		}
		const animation = el.animate?.([{ opacity: 1 }, { opacity: 0 }], { duration: ms });
		const hide = (): void => setShown(false);
		if (!animation) {
			hide();
			return;
		}
		animation.addEventListener("finish", hide, { once: true });
	}, [present, shown]);

	if (!present && !shown) return null;
	return <div ref={ref}>{children}</div>;
}
