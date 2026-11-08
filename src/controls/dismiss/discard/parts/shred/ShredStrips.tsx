// ShredBin 刀口下方吐出的碎条: 每条是整张卡片的一段窄窗, 位置与卷曲由逐帧绘制写入.
import type { JSX, ReactNode, RefObject } from "react";
import { SHRED } from "../../../tokens";
import type { Feed } from "./shred-sim";

interface ShredStripsProps<T> {
	readonly feed: Feed<T> | null;
	readonly stripEls: RefObject<Array<HTMLDivElement | null>>;
	readonly top: number;
	readonly height: number;
	readonly renderItem: (item: T) => ReactNode;
}

export function ShredStrips<T>({ feed, stripEls, top, height, renderItem }: ShredStripsProps<T>): JSX.Element {
	return (
		<div className="absolute inset-x-0 overflow-hidden" style={{ top, height }} aria-hidden="true">
			{feed?.strips.map((strip, i) => (
				<div
					key={strip.ax}
					ref={(el) => {
						stripEls.current[i] = el;
					}}
					className="absolute left-0 top-0 overflow-hidden"
					style={{
						width: strip.width,
						opacity: feed.fadeAt ? 0 : 1,
						transition: `opacity ${SHRED.fadeMs}ms ease`,
					}}
				>
					<div style={{ width: feed.w, marginLeft: -strip.left }}>{renderItem(feed.item)}</div>
				</div>
			))}
		</div>
	);
}
