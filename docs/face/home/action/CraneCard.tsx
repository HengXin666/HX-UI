import { useLayoutEffect, useRef, useState, type CSSProperties, type JSX } from "react";
import { FieldPage } from "../../../../src/studio";
import { CRANE_END_MS, CRANE_FROM, cranePose, type Point } from "../shots/crane/shot-crane";
import { useLoopMs, useNear } from "../kit/use-loop";

const DESIGN_W = 1280;
const TRACK_ROW = "[data-slot=field-page] ol > li:nth-child(2)";
const EDGE_PX = 16;
const HALF = 2;
const DIM_VAR = "--crane-dim";
const REST_MS = 1400;

/**
 * 卡内版的镜 5 整页拉升: FieldPage 按桌面宽排版, 相机从第二条决定的 3 倍特写拉到整页.
 * 坐标系是 1280 宽的整页, 外面再缩到卡宽, cranePose 原样用.
 */
export function CraneCard(): JSX.Element {
  const [box, setBox] = useState<HTMLDivElement | null>(null);
  const page = useRef<HTMLDivElement>(null);
  const [view, setView] = useState({ s: 0, h: 0 });
  const [track, setTrack] = useState<{ focus: Point; start: Point }>({ focus: { x: 0, y: 0 }, start: { x: 0, y: 0 } });
  const mounted = useNear(box, "900px", true);
  const ms = useLoopMs(box, CRANE_END_MS, REST_MS);
  const pose = cranePose(ms, track.focus, track.start);

  useLayoutEffect(() => {
    if (!box || !mounted) return;
    const read = (): void => {
      const s = box.clientWidth / DESIGN_W;
      const h = box.clientHeight / s;
      setView({ s, h });
      const row = page.current?.querySelector(TRACK_ROW) as HTMLElement | null;
      if (!row || !page.current) return;
      let left = 0;
      let top = 0;
      for (let node: HTMLElement | null = row; node && node !== page.current; node = node.offsetParent as HTMLElement | null) {
        left += node.offsetLeft;
        top += node.offsetTop;
      }
      const width = row.offsetWidth;
      const fits = width * CRANE_FROM + EDGE_PX * HALF <= DESIGN_W;
      setTrack({
        focus: { x: fits ? left + width / HALF : left, y: top + row.offsetHeight / HALF },
        start: { x: fits ? DESIGN_W / HALF : EDGE_PX, y: h / HALF },
      });
    };
    read();
    const timer = window.setTimeout(read, 1200);
    const ro = new ResizeObserver(read);
    ro.observe(box);
    return () => {
      ro.disconnect();
      window.clearTimeout(timer);
    };
  }, [box, mounted]);

  return (
    <div ref={setBox} className="absolute inset-0 overflow-hidden bg-background">
      {mounted && view.s > 0 ? (
        <div style={{ width: DESIGN_W, height: view.h, transform: `scale(${view.s})`, transformOrigin: "0 0" }} className="relative overflow-hidden">
          <div
            ref={page}
            inert
            className="absolute left-0 top-0 origin-top-left [&_ol>li:not(:nth-child(2))]:opacity-(--crane-dim)"
            style={{ width: DESIGN_W, transform: `translate3d(${pose.x}px, ${pose.y}px, 0) scale(${pose.scale})`, [DIM_VAR]: pose.dim } as CSSProperties}
          >
            <FieldPage heading="h3" />
          </div>
        </div>
      ) : null}
    </div>
  );
}
