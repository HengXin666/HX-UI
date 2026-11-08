// RipStub 的打孔缝: 一排圆孔 (撕下后消失) 与两端半圆缺口.
import type { JSX } from "react";
import { ripNotch, ripSeam } from "./rip-shape";

const TWO = 2;
const ARIA_TRUE = "true";
const NOTCH_CLASS = "absolute z-10 rounded-full bg-background";

interface RipPerforationProps {
	readonly bodySize: number;
	readonly holes: number;
	readonly holeSize: number;
	readonly notchSize: number;
	readonly vertical: boolean;
	readonly torn: boolean;
}

export function RipPerforation({ bodySize, holes, holeSize, notchSize, vertical, torn }: RipPerforationProps): JSX.Element {
	return (
		<>
			<div aria-hidden={ARIA_TRUE} className="absolute flex justify-between" style={{ ...ripSeam(bodySize, vertical), flexDirection: vertical ? "row" : "column", padding: notchSize }}>
				{Array.from({ length: torn ? 0 : holes }, (_, i) => (
					<span key={i} className="rounded-full bg-background" style={{ width: holeSize, height: holeSize, margin: -holeSize / TWO }} />
				))}
			</div>
			<span aria-hidden={ARIA_TRUE} className={NOTCH_CLASS} style={ripNotch("a", bodySize, notchSize, vertical)} />
			<span aria-hidden={ARIA_TRUE} className={NOTCH_CLASS} style={ripNotch("b", bodySize, notchSize, vertical)} />
		</>
	);
}
