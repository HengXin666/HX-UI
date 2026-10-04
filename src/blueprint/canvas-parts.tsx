import type { JSX, ReactNode } from "react";
import { cn } from "../primitives/utils";
import type { BlueprintComment } from "./types";
import type { Viewport } from "./BlueprintCanvas";
export * from "./canvas-helpers";
export { CommentLayer } from "./CommentLayer";

/**
 * 画布的两块纯展示件。
 *
 * 单独成文件是因为 BlueprintCanvas.tsx 已被行预算**冻结且只许降** ——
 * 而这两块 (区间注释层、左上角工具条) 与画布的主逻辑 (拖拽/连线/缩放)
 * 没有任何纠缠, 搬出来既降行数也更清楚。
 */

/** 注释的语义色。只允许这四种 —— 放开任意颜色换肤时又会失效。 */
/**
 * 注释的语义色。
 *
 * ⚠️ 必须同时给 **背景** 与 **边框** —— 之前每组只有 border-* 与 text-*,
 * 没有任何 bg, 于是整个框体是**透明的**: 看起来就是"一个悬空的标题条 +
 * 一片空白", 完全不像一个框。注释框的意义是把一片节点**圈出来**,
 * 没有底色就圈不住任何东西。
 *
 * 用 /12 ~ /20 的低透明度: 要能透出下面的节点与连线, 又要有足够的色块
 * 让人一眼看出"这一片属于这个注释"。
 */
/** 右下角 resize 热区边长 (图坐标)。 */
export const COMMENT_HANDLE = 14;

export const COMMENT_TONE: Record<string, string> = {
  /**
   * 透明度用 Tailwind 的标准档位 (10/20/25)。
   *
   * 别写 bg-primary/[0.14] 这种任意值 —— 实测它在本工程的 Tailwind 版本下
   * **不生成规则**, 而类名静默失效 (不报错, 但背景就没了)。这正是"框体
   * 看起来是空的"的另一种成因, 所以这里只用标准档。
   */
  default: "border-border bg-muted/25 text-muted-foreground",
  neutral: "border-border bg-muted/40 text-foreground/80",
  primary: "border-primary/50 bg-primary/10 text-primary",
  success: "border-emerald-500/50 bg-emerald-500/10 text-emerald-400",
  warning: "border-amber-500/50 bg-amber-500/10 text-amber-400",
  danger: "border-red-500/50 bg-red-500/10 text-red-400",
};

/**
 * 可选的注释底色。
 *
 * UE5 的 Comment Color 是任意 RGB + Alpha, 这里刻意只给**语义色板** ——
 * 任意值会让换肤失效 (本库第一条硬约定: 颜色只有 tokens.css 一个来源),
 * 而且注释是给人看的分组标记, 语义色比自由调色更清楚地表达"这块是什么"。
 *
 * 色板刻意只有六档, 且全部落在本库允许的三条语义原色 (emerald/amber/red)
 * 与两个 token 上 —— 门禁 check-ui-rules 会拦住任何调色盘色 (sky/violet/...),
 * 那是换肤失效的根源。
 */
export const COMMENT_TONES = ["default", "neutral", "primary", "success", "warning", "danger"] as const;
export type CommentToneId = (typeof COMMENT_TONES)[number];

/**
 * 一个小按钮。
 *
 * 给 `href` 时渲染成原生锚点 (target=_blank) 而不是按钮 + window.open。
 *
 * 为什么: window.open 会被弹窗拦截器拦掉 (实测: 调了 window.open 但标签页
 * 数没变 —— 用户点"独立页面"毫无反应)。而点击链接是浏览器的原生导航意图,
 * 不会被拦。这是"打开新页面"唯一可靠的做法。
 */
export function CanvasButton({
  onClick, title, children, href, rel,
}: {
  readonly onClick?: () => void;
  readonly title?: string;
  readonly children: ReactNode;
  readonly href?: string;
  readonly rel?: string;
}): JSX.Element {
  const cls =
    "inline-flex items-center rounded border border-border bg-card/80 px-1.5 py-0.5 text-[11px] text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground";
  if (href) {
    return (
      <a href={href} target="_blank" rel={rel ?? "noopener noreferrer"} title={title} className={cls}>
        {children}
      </a>
    );
  }
  return (
    <button type="button" onClick={onClick} title={title} className={cls}>
      {children}
    </button>
  );
}


/** 左上角工具条。单独成组件: 画布文件冻结只许降行数, 这块是纯展示。 */

/**
 * "独立页面"链接。
 *
 * ## 为什么不只是 <a target="_blank">
 *
 * 上一版只有一个 `<a target="_blank">`, 实测在文档站里**点了没反应**:
 * 文档站是 SPA, 而某些嵌入场景下 target=_blank 不生效, 于是用户点一下
 * 什么都没发生 —— 最坏的一类失败。
 *
 * ## 为什么又不能只用 window.open
 *
 * 单独用 window.open 会被弹窗拦截器拦掉 (仓库注释里记着这次实测:
 * "调了 window.open 但标签页数没变")。
 *
 * ## 所以两个都要, 各管一段
 *
 *   - `<a href target=_blank>`: 负责**语义** —— 中键、Ctrl+点、右键菜单里
 *     的"在新标签页打开"都靠它, 那是浏览器原生行为, 最可靠。
 *   - 左键点击时**同步**调 window.open: 它处在用户手势的调用栈里, 不会被拦。
 *     (被拦的从来都是 setTimeout / await 之后脱离手势上下文的调用。)
 *     开成功了就 preventDefault, 免得当前页也被导航带走。
 */
function StandaloneLink({ href }: { readonly href: string }): JSX.Element {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      title="在新标签页里打开整页画布 (带上当前图, 改动实时同步)"
      /**
       * 不做 onClick、不调 window.open —— 全部交给原生 <a target="_blank">。
       *
       * 实测过一轮"两者都要": 在 onClick 里同步 window.open, 成功才
       * preventDefault。结果在部分环境里 window.open 返回一个窗口对象
       * (看着成功了), 于是 preventDefault 掐掉了原生导航, 而那个窗口
       * 实际是被拦的空壳 —— 最后**两个都没开成**。
       *
       * 纯 <a target="_blank"> 反而全对: 左键开新标签、中键开背景标签、
       * Ctrl+点、右键菜单"在新标签页打开"全都由浏览器保证, 且不会被
       * 弹窗拦截器拦 (链接是导航意图, window.open 才是弹窗)。
       */
      className="inline-flex items-center rounded border border-border bg-card/80 px-1.5 py-0.5 text-[11px] text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
    >
      独立页面
    </a>
  );
}

export function CanvasToolbar({
  toolbar, zoom, onFit, onReset, allowFullscreen, expanded, standaloneHref, expandHref, onToggleFullscreen,
}: {
  readonly toolbar?: ReactNode;
  readonly zoom: number;
  readonly onFit: () => void;
  readonly onReset: () => void;
  readonly allowFullscreen: boolean;
  readonly expanded: boolean;
  /** 独立页面的 URL。给了就渲染成链接 (不会被弹窗拦截器拦)。 */
  readonly standaloneHref?: string;
  /** 由画布算出的"带当前图的整页链接"。优先于 standaloneHref。 */
  readonly expandHref?: string | null;
  readonly onToggleFullscreen: () => void;
}): JSX.Element {
  return (
    <div className="absolute left-2 top-2 flex items-center gap-1">
      {toolbar ?? (
        <>
          <CanvasButton onClick={onFit} title="缩放到适应">适应</CanvasButton>
          <CanvasButton onClick={onReset} title="重置视图">1:1</CanvasButton>
          <span className="px-1 text-[11px] tabular-nums text-muted-foreground">{Math.round(zoom * 100)}%</span>
          {allowFullscreen && (
            standaloneHref || expandHref ? (
              <StandaloneLink href={standaloneHref ?? expandHref ?? ""} />
            ) : (
              <CanvasButton onClick={onToggleFullscreen} title={expanded ? "退出全屏 (Esc)" : "全屏"}>
                {expanded ? "退出全屏" : "全屏"}
              </CanvasButton>
            )
          )}
        </>
      )}
    </div>
  );
}

/**
 * 画布的辅助函数。
 *
 * 单独成文件是因为 BlueprintCanvas.tsx 已被行预算冻结且只许降 ——
 * 这些是独立的小函数, 与主流程没有纠缠。
 */
