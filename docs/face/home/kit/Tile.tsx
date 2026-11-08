import { type CSSProperties, type JSX, type ReactNode } from "react";
import { BUTTON_TYPE, SectionHeading } from "@hx/ui";
import { OUT, TILE, TYPE } from "./layout";
import { useBox } from "./use-box";
import { useNear } from "./use-loop";

/** 页面预览的排版宽度: 整页按桌面宽排完, 再整体缩到卡宽. */
const DESIGN_W = 1280;
/** 离视口这么远才挂载整页, 首屏不为下面的整页付钱. */
const MOUNT_AHEAD = "900px";

export interface TileProps {
  readonly art: ReactNode;
  /** 图区高度 (px). */
  readonly artHeight: number;
  readonly title: string;
  readonly desc?: string;
  /** 右侧小字 (分类), 跟着 ↗. */
  readonly tag?: string;
  readonly onOpen?: () => void;
  readonly className?: string;
  readonly artClassName?: string;
}

/**
 * 一张卡: 上图区, 下标题. 有 desc 时标题下一段说明 (What's inside / 模板 / 工具);
 * 没有 desc 时标题与分类同一行 (See them in action). ↗ 是真按钮, 进对应文档页.
 */
export function Tile({ art, artHeight, title, desc, tag, onOpen, className, artClassName }: TileProps): JSX.Element {
  const open = onOpen ? (
    <button
      type={BUTTON_TYPE}
      onClick={onOpen}
      aria-label={`${title} ${OUT}`}
      className="ml-auto inline-flex shrink-0 items-center gap-2 rounded-md text-[12px] text-muted-foreground transition-[color] hover:text-foreground focus-visible:outline-1 focus-visible:outline-offset-2 focus-visible:outline-ring"
    >
      {tag}
      <span aria-hidden className="text-[11px]">{OUT}</span>
    </button>
  ) : null;
  return (
    <article className={`${TILE.frame} ${className ?? ""}`}>
      <div className={`${TILE.art} ${artClassName ?? ""}`} style={{ height: artHeight }}>{art}</div>
      {desc === undefined ? (
        <div className="flex h-[49px] items-center gap-3 px-3">
          <h3 className={`${TYPE.title} truncate text-[14px]`}>{title}</h3>
          {open}
        </div>
      ) : (
        <div className={TILE.body}>
          <div className="flex items-center gap-3">
            <h3 className={TYPE.title}>{title}</h3>
            {open}
          </div>
          <p className={`${TYPE.desc} max-w-[34rem]`}>{desc}</p>
        </div>
      )}
    </article>
  );
}

/**
 * 整页缩略: 子树按 1280 宽排版, 缩到容器宽; 只读 (inert), 不进 Tab 序.
 * 进视口附近才挂载, 首屏不为下面的整页付钱. offset (设计像素) 把整页往上推, 让矮卡露出页里最有辨识度的那一截.
 */
export function PagePreview({ children, className, offset = 0 }: { readonly children: ReactNode; readonly className?: string; readonly offset?: number }): JSX.Element {
  const [box, attach, rect] = useBox<HTMLDivElement>();
  const near = useNear(box, MOUNT_AHEAD, true);
  const scale = rect.width > 0 ? rect.width / DESIGN_W : 0;
  const style: CSSProperties = { width: DESIGN_W, transform: `translateY(${-offset * scale}px) scale(${scale})`, transformOrigin: "0 0" };
  return (
    <div ref={attach} className={`absolute isolate overflow-hidden [contain:paint] ${className ?? "inset-0"}`}>
      {near && scale > 0 ? (
        <div inert aria-hidden className="pointer-events-none bg-background text-foreground" style={style}>
          {children}
        </div>
      ) : null}
    </div>
  );
}

/** 段落标题行: 库 SectionHeading (标题 + 导语 + 动作), 排版改成左标题右动作, 字号按 1:1 实拍. */
export function SectionHead({ title, sub, action, className }: { readonly title: ReactNode; readonly sub?: string; readonly action?: ReactNode; readonly className?: string }): JSX.Element {
  return (
    <SectionHeading
      title={title}
      description={sub}
      level={2}
      className={className}
      classNames={{
        root: "mb-0 flex-row flex-wrap items-end justify-between gap-6",
        text: "gap-0",
        title: TYPE.h2,
        description: `${TYPE.lede} mt-3 max-w-none`,
        actions: "mt-0",
      }}
    >
      {action}
    </SectionHeading>
  );
}
