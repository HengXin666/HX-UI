/**
 * SiteHeader 的滚动状态: 是否已离开顶部, 以及 collapse="hide" 时是否因下滚而隐藏.
 * rAF 节流, passive 监听; 服务端与首帧均为 { scrolled: false, hidden: false }.
 */
import * as React from "react";
import { canUseDOM } from "../../constants/hooks";
import { SITE_COLLAPSE, SITE_SCROLL, SITE_SCROLL_EVENT } from "../../constants/site";
import type { SiteCollapse } from "../types";

export interface SiteScrollState {
	scrolled: boolean;
	hidden: boolean;
}

const TOP: SiteScrollState = { scrolled: false, hidden: false };

export function useSiteScroll(collapse: SiteCollapse, threshold: number = SITE_SCROLL.threshold): SiteScrollState {
	const [state, setState] = React.useState<SiteScrollState>(TOP);

	React.useEffect(() => {
		if (!canUseDOM()) return;
		let last = window.scrollY;
		let frame = 0;
		const update = (): void => {
			frame = 0;
			const y = window.scrollY;
			const delta = y - last;
			const scrolled = y > threshold;
			setState((prev) => {
				let hidden = prev.hidden;
				if (collapse !== SITE_COLLAPSE.hide || !scrolled) hidden = false;
				else if (delta > SITE_SCROLL.delta) hidden = true;
				else if (delta < -SITE_SCROLL.delta) hidden = false;
				return prev.scrolled === scrolled && prev.hidden === hidden ? prev : { scrolled, hidden };
			});
			if (Math.abs(delta) > SITE_SCROLL.delta) last = y;
		};
		const onScroll = (): void => {
			if (!frame) frame = window.requestAnimationFrame(update);
		};
		update();
		window.addEventListener(SITE_SCROLL_EVENT, onScroll, { passive: true });
		return () => {
			window.removeEventListener(SITE_SCROLL_EVENT, onScroll);
			if (frame) window.cancelAnimationFrame(frame);
		};
	}, [collapse, threshold]);

	return state;
}
