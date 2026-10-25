import type { JSX } from "react";
import { BUTTON_TYPE, Button, SIDE, TONE_VARIANT, TooltipHint, VARIANT, cn } from "@hx/ui";
import { BRAND_LOGO_SIZE, EXTERNAL_LINK } from "../constants/shell";
import { BrandLogo } from "./BrandLogo";
import { REPO_LABEL, REPO_URL, TEMPLATE_ENTRY } from "./site";

/**
 * 文档站顶栏: 一条 36px 的细栏, 只放两件"站外"的事.
 *
 * 为什么要有它: 侧栏里全是组件页, 而"源码在哪"和"整页模板在哪"不属于任何一组.
 * 塞进侧栏底部会被 96 个条目淹没, 塞进正文会被当成某一页的内容. 顶栏是唯一
 * 位置固定, 又不必和导航分组争地方的地方.
 *
 * 样式只用语义 token: 底色透明, 靠一条 1px 的 border 与正文分层, 于是亮暗两套
 * 皮肤都不用改这里. 链接用 Button 的 ghost/outline 变体而不是手写 <a> 样式,
 * 点按反馈与焦点环跟着库走.
 *
 * 接线: App.tsx 的 <main> 内, 内容滚动区之上放一行
 * `<TopBar onGo={go} />`, go 是已有的切页函数.
 */
/**
 * .agents/notes/implemented/feature/2026-10-22-docs-nav-groups-and-templates.md
 */
export function TopBar({
  onGo,
  className,
}: {
  /** 切页. 顶栏的 "模板" 入口走它, 与侧栏点击同一条路径. */
  onGo: (id: string) => void;
  className?: string;
}): JSX.Element {
  return (
    <div
      className={cn(
        "flex h-9 shrink-0 items-center gap-2 border-b border-border/40 px-3",
        className,
      )}
    >
      <BrandLogo size={BRAND_LOGO_SIZE.topBar} className="hidden md:block" />
      <span className="hidden text-[12px] font-semibold text-foreground md:inline">HX UI</span>
      <span className="hidden text-[11px] text-muted-foreground md:inline">组件文档</span>

      <div className="ml-auto flex items-center gap-1">
        <Button
          type={BUTTON_TYPE}
          variant={VARIANT.ghost}
          size={VARIANT.sm}
          onClick={() => onGo(TEMPLATE_ENTRY)}
          className="gap-1.5"
        >
          <span aria-hidden className="icon-[solar--layers-minimalistic-linear] size-3.5 bg-current" />
          模板
        </Button>
        <TooltipHint label={"源码仓库: " + REPO_LABEL} side={SIDE.bottom}>
          <Button asChild variant={TONE_VARIANT.outline} size={VARIANT.sm} className="gap-1.5">
            <a href={REPO_URL} target={EXTERNAL_LINK.target} rel={EXTERNAL_LINK.rel}>
              <span aria-hidden className="icon-[mdi--github] size-3.5 bg-current" />
              GitHub
            </a>
          </Button>
        </TooltipHint>
      </div>
    </div>
  );
}
