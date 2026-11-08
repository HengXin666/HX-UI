/** CueTip 气泡的摆放几何: 贴边位置, 收起时的回缩位移, 小三角的位置与朝向. */
import type { CSSProperties } from "react";
import { CUE, CUE_SIDE, HALF, PX, type CueSide } from "../../../tokens";

const ARROW_PX = 8;
/** 右下两条边朝外: 各朝向的旋转角. */
const ARROW_TURN: Record<CueSide, number> = { top: 45, bottom: 225, left: -45, right: 135 };
const CENTER = "50%";

/** 气泡相对触发件的摆放: 贴在 side 一侧, 另一轴居中. */
export function placement(side: CueSide, gap: number): CSSProperties {
  const away = `calc(100% + ${gap}${PX})`;
  switch (side) {
    case CUE_SIDE.bottom:
      return { top: away, left: CENTER };
    case CUE_SIDE.left:
      return { right: away, top: CENTER };
    case CUE_SIDE.right:
      return { left: away, top: CENTER };
    default:
      return { bottom: away, left: CENTER };
  }
}

/** 收起态向触发件缩回 rise 像素; 开着时为 0. */
export function riseOffset(side: CueSide, open: boolean): string {
  const d = open ? 0 : CUE.risePx;
  const center = `-${CENTER}`;
  switch (side) {
    case CUE_SIDE.bottom:
      return `translate(${center}, ${-d}${PX})`;
    case CUE_SIDE.left:
      return `translate(${d}${PX}, ${center})`;
    case CUE_SIDE.right:
      return `translate(${-d}${PX}, ${center})`;
    default:
      return `translate(${center}, ${d}${PX})`;
  }
}

/** 小三角: 1px 描边的方块转 45 度, 一半压在气泡下. */
export function arrowStyle(side: CueSide): CSSProperties {
  const half = -ARROW_PX / HALF;
  const middle = `calc(${CENTER} - ${ARROW_PX / HALF}${PX})`;
  const base: CSSProperties = { width: ARROW_PX, height: ARROW_PX, transform: `rotate(${ARROW_TURN[side]}deg)` };
  switch (side) {
    case CUE_SIDE.bottom:
      return { ...base, top: half, left: middle };
    case CUE_SIDE.left:
      return { ...base, right: half, top: middle };
    case CUE_SIDE.right:
      return { ...base, left: half, top: middle };
    default:
      return { ...base, bottom: half, left: middle };
  }
}
