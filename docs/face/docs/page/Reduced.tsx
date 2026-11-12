import { useLayoutEffect, useRef, useState, type JSX } from "react";
import { cn, useReducedMotion } from "@hx/ui";
import { FACE_REDUCED } from "../../router";
import { CARD, INSET, SECTION_DESC, SECTION_TITLE, STAGE_FIT } from "../constants";
import type { ComponentSpec, Values } from "../specs/types";

const PANE = cn(INSET, "m-0 flex min-w-0 flex-col overflow-hidden");
const CAPTION = "border-b border-border/60 px-3 py-2 text-left font-mono text-[11.5px] text-muted-foreground";

/**
 * control 页型的 "减少动效对照": 左格是本页的演示 (按本机设置), 右格是同一演示在 prefers-reduced-motion: reduce 下的样子.
 * 右格是一个 iframe, 指向对照台 #/reduced/<id>/<调参值>, 那份文档里减弱动效查询恒答 reduce, 两格用的是同一组调参值.
 * 左格高度随演示内容收缩 (夹在 STAGE_FIT.reducedMin 与 reduced.height 或 reducedMax 之间), 右格 iframe 跟着左格量出的高度走.
 */
export function ReducedMotion({ spec, props, values }: { readonly spec: ComponentSpec; readonly props: Record<string, unknown>; readonly values: Values }): JSX.Element {
  const host = useReducedMotion();
  const max = Math.max(STAGE_FIT.reducedMin, spec.reduced?.height ?? STAGE_FIT.reducedMax);
  const paneRef = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState<number>(STAGE_FIT.reducedMin);
  useLayoutEffect(() => {
    const pane = paneRef.current;
    if (!pane) return undefined;
    const measure = (): void => setHeight(Math.round(pane.getBoundingClientRect().height));
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(pane);
    return () => observer.disconnect();
  }, []);
  const key = JSON.stringify(values);
  const src = `${window.location.pathname}${window.location.search}#/${FACE_REDUCED}/${spec.id}/${encodeURIComponent(key)}`;
  return (
    <section aria-labelledby="reduced-motion" className={CARD}>
      <div className="px-[18px] pt-[18px] pb-3">
        <h2 id="reduced-motion" className={SECTION_TITLE}>
          Reduced motion 减少动效对照
        </h2>
        <p className={SECTION_DESC}>{spec.reduced?.desc ?? "同一组调参值, 左边按本机设置, 右边按 prefers-reduced-motion: reduce 渲染; 两边都能直接操作."}</p>
      </div>
      <div className="grid gap-1.5 px-1.5 md:grid-cols-2">
        <div className={PANE}>
          <p className={CAPTION}>{host ? "本机已开减少动效" : "常规动效"}</p>
          <div ref={paneRef} data-demo className="grid min-w-0 place-items-center overflow-hidden p-4 text-center" style={{ minHeight: STAGE_FIT.reducedMin, maxHeight: max }}>
            <div key={key} className="max-w-full">
              {spec.render(props)}
            </div>
          </div>
        </div>
        <div className={PANE}>
          <p className={CAPTION}>prefers-reduced-motion: reduce</p>
          <iframe title={`${spec.importName} 在减少动效下的演示`} src={src} className="block w-full border-0 bg-background" style={{ height }} />
        </div>
      </div>
      {spec.reduced && spec.reduced.notes.length > 0 ? (
        <ul className="flex list-disc flex-col gap-1.5 px-[18px] pt-3 pb-[18px] pl-9 text-[13px] leading-relaxed text-foreground/85">
          {spec.reduced.notes.map((note) => (
            <li key={note}>{note}</li>
          ))}
        </ul>
      ) : (
        <div className="h-1.5" />
      )}
    </section>
  );
}
