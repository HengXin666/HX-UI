import { useLayoutEffect, useRef, useState, type CSSProperties, type JSX } from "react";
import { NumberRoll } from "../../../../../src/craft";
import { FieldPage } from "../../../../../src/studio";
import { FACTS } from "../../site-facts";
import { STAGE_CLASS, Stage, Warm } from "../stage";
import { CRANE_END_MS, CRANE_FROM, cranePose, type Point } from "./shot-crane";

/** 被追踪的那一行: 田野决定记录里的第二条. */
const TRACK_ROW = "[data-slot=field-page] ol > li:nth-child(2)";
/** 起点特写里那一行放大 3 倍后两侧至少留这么多, 放不下时左对齐, 只露行首. */
const EDGE_PX = 16;
const HALF = 2;
const DIM_VAR = "--crane-dim";

interface Track {
  /** 那一行在整页里的锚点 (页面坐标). */
  readonly focus: Point;
  /** 起点特写里锚点落在画面的位置. */
  readonly start: Point;
}

/** 镜 5: 整页拉升. FieldPage 全幅, 从一行的 3 倍特写拉到整页. */
export function CraneShot(): JSX.Element {
  const [view, setView] = useState<HTMLDivElement | null>(null);
  const layer = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ width: 0, height: 0 });
  const [track, setTrack] = useState<Track>({ focus: { x: 0, y: 0 }, start: { x: 0, y: 0 } });
  const scaleRef = useRef(1);

  const measure = (): void => {
    const page = layer.current;
    if (!view || !page) return;
    const row = page.querySelector(TRACK_ROW);
    if (!row) return;
    const a = row.getBoundingClientRect();
    const b = page.getBoundingClientRect();
    const s = scaleRef.current;
    const left = (a.left - b.left) / s;
    const top = (a.top - b.top) / s;
    const width = a.width / s;
    const height = a.height / s;
    const wide = width * CRANE_FROM;
    const fits = wide + EDGE_PX * HALF <= view.clientWidth;
    // 放得下: 整行居中; 放不下: 行首贴左边距. 纵向都放在画面正中, 整行在视口里.
    const focus = { x: fits ? left + width / HALF : left, y: top + height / HALF };
    const start = { x: fits ? view.clientWidth / HALF : EDGE_PX, y: view.clientHeight / HALF };
    setTrack({ focus, start });
  };

  useLayoutEffect(() => {
    if (!view) return;
    const read = (): void => {
      setSize({ width: view.clientWidth, height: view.clientHeight });
      measure();
    };
    read();
    const observer = new ResizeObserver(read);
    observer.observe(view);
    return () => observer.disconnect();
    // measure 读 ref 与 view, view 变了才重登记.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view]);

  return (
    <Stage id="5" total={CRANE_END_MS} label="整页拉升" className="flex flex-col">
      {({ ms }) => {
        const pose = cranePose(ms, track.focus, track.start);
        scaleRef.current = pose.scale;
        return (
          <>
            <div className="flex items-center justify-between gap-4 border-b border-border px-5 py-3 md:px-8">
              <p className={STAGE_CLASS.kicker}>05 / 整页 · FieldPage</p>
              <p className="flex items-baseline gap-2 text-sm text-foreground">
                <span data-shot-part="kpi" className="font-mono text-base font-semibold">
                  <NumberRoll value={FACTS.templates} progress={pose.count} />
                </span>
                <span className="text-muted-foreground">套整页模板<span className="hidden md:inline">, 拿去就是一页</span></span>
              </p>
            </div>
            <div
              ref={setView}
              className="relative min-h-0 flex-1 overflow-hidden [&_ol>li:not(:nth-child(2))]:opacity-(--crane-dim)"
              style={{ [DIM_VAR]: pose.dim } as CSSProperties}
              data-shot-part="crane-view"
            >
              {size.width > 0 ? (
                <Warm
                  width={size.width}
                  part="crane-layer"
                  className="absolute left-0 top-0 origin-top-left bg-background"
                  style={{ transform: `translate3d(${pose.x}px, ${pose.y}px, 0) scale(${pose.scale})` }}
                  onReady={measure}
                >
                  <div ref={layer}>
                    <FieldPage heading="h2" />
                  </div>
                </Warm>
              ) : null}
            </div>
          </>
        );
      }}
    </Stage>
  );
}
