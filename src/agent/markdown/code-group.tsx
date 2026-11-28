"use client";
/**
 * 组合代码块 (力扣 / 博客风格选项卡). 由 remarkCodeGroups 生成的 <hx-code-group> 渲染到这里,
 * 子元素是一个个围栏, 标签取自各自 meta 里的 [组名-标签].
 * 流式中新出现的选项卡会自动切过去, 用户点过选项卡后就不再自动跳.
 */
import * as React from "react";
import { cn } from "@/lib/utils";
import { CopyIconButton } from "../parts/copy";
import { StreamdownContext } from "streamdown";
import { InCodeGroupContext, useMarkdownSettings } from "./context";

interface HastEl {
  tagName?: string;
  properties?: { metastring?: string; className?: string[] | string };
  children?: HastEl[];
}
interface FenceChildProps {
  node?: HastEl;
  className?: string;
  children?: React.ReactNode;
}

/** 子元素可能是 pre (Streamdown 还没把它换成 code) 或 code 本身: 找到 hast 里的 code 节点 */
function codeNodeOf(n?: HastEl): HastEl | undefined {
  if (!n) return undefined;
  if (n.tagName === "code") return n;
  return n.children?.find((c) => c.tagName === "code");
}

const GROUP = /\[([^\]-]+)-([^\]]+)\]/;

function textOf(n: React.ReactNode): string {
  if (typeof n === "string") return n;
  if (Array.isArray(n)) return n.map(textOf).join("");
  if (React.isValidElement<{ children?: React.ReactNode }>(n)) return textOf(n.props.children);
  return "";
}

export function CodeGroup({ children }: { children?: React.ReactNode }) {
  const { codeTheme } = useMarkdownSettings();
  const items = React.Children.toArray(children).filter((c): c is React.ReactElement<FenceChildProps> => React.isValidElement(c));
  const tabs = items.map((el, i) => {
    const code = codeNodeOf(el.props.node);
    const meta = code?.properties?.metastring ?? "";
    const cls = code?.properties?.className;
    const lang = (Array.isArray(cls) ? cls.join(" ") : (cls ?? el.props.className ?? "")).match(/language-([^\s]+)/)?.[1] ?? "";
    return { label: meta.match(GROUP)?.[2]?.trim() || lang || `#${i + 1}`, lang, code: textOf(el.props.children).replace(/\n$/, "") };
  });
  const { isAnimating } = React.useContext(StreamdownContext);
  const [picked, setPicked] = React.useState<number | null>(null);
  const [follow, setFollow] = React.useState(0);
  const count = tabs.length;
  React.useEffect(() => {
    if (isAnimating) setFollow(Math.max(0, count - 1));
  }, [isAnimating, count]);
  const active = Math.max(0, Math.min(picked ?? follow, count - 1));
  const id = React.useId();
  if (!tabs.length) return null;
  return (
    <div data-slot="code-group" data-code-theme={codeTheme} className="hx-code group/code my-4 overflow-hidden rounded-lg border border-[var(--hx-code-border)] bg-[var(--hx-code-bg)] text-[var(--hx-code-fg)]">
      <div className="flex h-9 items-stretch border-b border-[var(--hx-code-border)] bg-[color-mix(in_oklch,var(--hx-code-fg)_5%,var(--hx-code-bg))] pr-1.5">
        <div role="tablist" aria-label="代码" className="flex min-w-0 flex-1 items-stretch overflow-x-auto scrollbar-thin px-1.5">
          {tabs.map((t, i) => (
            <button
              key={i}
              type="button"
              role="tab"
              id={`${id}-t${i}`}
              aria-selected={i === active}
              aria-controls={`${id}-p`}
              onClick={() => setPicked(i)}
              className={cn(
                "relative shrink-0 px-3 font-mono text-[13px] text-[var(--hx-code-muted)] transition-colors duration-150 hover:text-[var(--hx-code-fg)] aria-selected:text-[var(--hx-code-fg)]",
                "after:absolute after:right-0 after:top-1/2 after:h-3.5 after:w-px after:-translate-y-1/2 after:bg-[var(--hx-code-border)] last:after:hidden",
                "before:absolute before:inset-x-3 before:bottom-0 before:h-px before:origin-center before:scale-x-0 before:bg-[var(--hx-code-hl-bar)] before:transition-transform before:duration-200 aria-selected:before:scale-x-100",
              )}
            >
              {t.label}
            </button>
          ))}
        </div>
        <span className="self-center px-1.5 font-mono text-xs text-[var(--hx-code-muted)]">{tabs[active].lang}</span>
        <CopyIconButton text={tabs[active].code} className="self-center text-[var(--hx-code-fg)] opacity-60 hover:opacity-100" />
      </div>
      <div role="tabpanel" id={`${id}-p`} aria-labelledby={`${id}-t${active}`}>
        <InCodeGroupContext.Provider value>{items[active]}</InCodeGroupContext.Provider>
      </div>
    </div>
  );
}
