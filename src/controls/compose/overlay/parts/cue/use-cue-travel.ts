/** CueTip 气泡的两路弹簧层: 热切换时从上一个气泡位置滑过来, 以及倾斜角. 每帧直接写 DOM. */
import { useLayoutEffect, useMemo, type RefObject } from "react";
import { springFromDuration, useSpringChannels, type SpringChannels } from "../../../kinetics";
import { CUE, PX } from "../../../tokens";
import { warmth } from "./cue-warmth";

const AXIS_X = "x";
const AXIS_Y = "y";

interface CueTravelOptions {
  readonly travelRef: RefObject<HTMLSpanElement | null>;
  readonly leanRef: RefObject<HTMLSpanElement | null>;
  readonly bubbleRef: RefObject<HTMLSpanElement | null>;
  /** 热切换滑行时长 (ms). */
  readonly travel: number;
  readonly open: boolean;
  readonly warmOpen: boolean;
  readonly reduced: boolean;
}

export function useCueTravel({ travelRef, leanRef, bubbleRef, travel, open, warmOpen, reduced }: CueTravelOptions): SpringChannels<"lean" | "x" | "y"> {
  const specs = useMemo(() => {
    const glide = springFromDuration(travel, CUE.travelBounce);
    return { lean: CUE.leanSpring, x: glide, y: glide };
  }, [travel]);
  const channels = useSpringChannels(
    { lean: 0, x: 0, y: 0 },
    specs,
    (v) => {
      if (travelRef.current) travelRef.current.style.transform = `translate(${v.x}${PX}, ${v.y}${PX})`;
      if (leanRef.current) leanRef.current.style.transform = `rotate(${v.lean}deg)`;
    },
    reduced,
  );

  // 热切换: 弹出后量新位置, 从旧气泡处滑过来.
  useLayoutEffect(() => {
    if (!open) return;
    const from = warmth.rect;
    const to = bubbleRef.current?.getBoundingClientRect();
    if (!warmOpen || !from || !to || reduced) {
      channels.jump(AXIS_X, 0);
      channels.jump(AXIS_Y, 0);
      return;
    }
    channels.jump(AXIS_X, from.left - to.left);
    channels.jump(AXIS_Y, from.top - to.top);
    channels.to(AXIS_X, 0);
    channels.to(AXIS_Y, 0);
  }, [open, warmOpen, reduced, channels, bubbleRef]);

  return channels;
}
