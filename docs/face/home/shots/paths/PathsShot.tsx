import type { JSX } from "react";
import { BUTTON_TYPE } from "@hx/ui";
import { usePress } from "../../../../../src/craft";
import { DOCS, type DocEntry } from "../../../../src/nav";
import { STAGE_CLASS, Stage } from "../stage";
import { PATHS_END_MS, headCue, itemPose, rowCue } from "./shot-paths";

/** 三条路, 每条四页. id 都在导航里, 标签和说明从导航数据取, 不另写. */
const ROUTES = [
  { index: "A", title: "第一次使用", ids: ["install", "tokens", "skins", "button"] },
  { index: "B", title: "搭一整页", ids: ["blocks-hero", "blocks-features", "templates-dashboard", "page-saas"] },
  { index: "C", title: "AI 交互", ids: ["agent-overview", "agent-toolcall", "agent-stream", "agent-process"] },
] as const;

function entries(ids: readonly string[]): DocEntry[] {
  return ids.map((id) => DOCS.find((entry) => entry.id === id)).filter((entry): entry is DocEntry => Boolean(entry));
}

function style(k: number, ms: number): { opacity: number; transform: string } {
  const pose = itemPose(k, ms);
  return { opacity: pose.opacity, transform: `translate3d(0, ${pose.y}px, 0)` };
}

/** 一行: 走按钮的按下合同 (0.97, 松开 1.012 再回 1). */
function Row({ entry, onGo }: { readonly entry: DocEntry; readonly onGo: (id: string) => void }): JSX.Element {
  const press = usePress(true);
  return (
    <button
      type={BUTTON_TYPE}
      onClick={() => onGo(entry.id)}
      onPointerDown={press.onPointerDown}
      onPointerUp={press.onPointerUp}
      onPointerCancel={press.onPointerCancel}
      onKeyDown={press.onKeyDown}
      onKeyUp={press.onKeyUp}
      style={press.style}
      className="group grid min-h-12 w-full content-center grid-cols-[minmax(0,1fr)_auto] gap-x-2 gap-y-1 border-b border-border px-3 py-3 text-left hover:bg-muted focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring md:min-h-[5.25rem] md:gap-x-4 md:px-5 md:py-4"
    >
      <span className="text-xs font-semibold text-foreground md:text-sm">{entry.label}</span>
      <small className="col-start-1 hidden text-xs leading-[1.55] text-muted-foreground md:line-clamp-1">{entry.desc}</small>
      <b aria-hidden className="col-start-2 row-span-2 row-start-1 self-center text-sm font-normal text-muted-foreground group-hover:text-foreground">↗</b>
    </button>
  );
}

/** 镜 7: 选一条路读. open-vetta 的三栏路径索引, 分组名先发, 行跟着发. */
export function PathsShot({ onGo }: { readonly onGo: (id: string) => void }): JSX.Element {
  return (
    <Stage id="7" total={PATHS_END_MS} label="选一条路读" className="flex items-center py-8 md:py-10">
      {({ ms }) => (
        <div className={`${STAGE_CLASS.wrap}`}>
          <div className="mb-8 grid grid-cols-1 md:mb-10 md:grid-cols-[minmax(10rem,0.7fr)_1.3fr] md:items-end md:gap-x-12">
            <p className={STAGE_CLASS.kicker}>07 / 路径</p>
            <h2 className={`${STAGE_CLASS.title} md:mt-0`}>选一条路读.</h2>
          </div>
          <div className="grid grid-cols-3 border-t border-border">
            {ROUTES.map((route, column) => (
              <div key={route.title} className="min-w-0 border-r border-border first:border-l">
                <div data-shot-part={`head-${column}`} className="flex items-baseline gap-2 border-b border-border bg-card px-3 py-3 md:gap-4 md:px-5 md:py-4" style={style(headCue(column), ms)}>
                  <span className="font-mono text-[0.65rem] tracking-[0.08em] text-muted-foreground">{route.index}</span>
                  <h3 className="m-0 text-sm font-semibold text-foreground md:text-lg">{route.title}</h3>
                </div>
                {entries(route.ids).map((entry, row) => (
                  <div key={entry.id} data-shot-part={`row-${column}-${row}`} style={style(rowCue(column, row), ms)}>
                    <Row entry={entry} onGo={onGo} />
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      )}
    </Stage>
  );
}
