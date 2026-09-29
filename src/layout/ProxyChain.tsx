import { type JSX, type ReactNode } from "react";
import { cn } from "../primitives/utils";
import { Badge } from "./Badge";

/**
 * 代理服务链路件。
 *
 * ## 为什么需要它 (语义, 不是装饰)
 *
 * 代理系统有**三层**, 而这三层经常被混为一个词 "节点" —— 那会导致沟通与代码
 * 双双出错 (实测: 有人把"入口数"当成"节点数"报了 17 个, 而真实节点是 200 个,
 * 且删除入口会连带断掉所有出口)。
 *
 * ```text
 *   listener  入口    对外端口 + 协议, 绑定一个 group
 *   group     策略    虚拟选择器 (url-test / manual / round-robin), **本身不含服务器**
 *   node      实体    真实上游服务器 (协议 / 指纹 / 加密配置)
 *   关系:  listener  ->  group  ->  (按策略筛出的)  node
 * ```
 *
 * 本组件把这层关系**画出来**, 而不是让使用方自己拼 `<div>`:
 * 每一层有固定位置、固定含义, 看的人不会再把它们搞混。
 *
 * ## 视觉约定 (沿用本库其它版式件)
 * ```text
 *   1. 普通面板零阴影 —— 层级靠 1px 边框 + 半透明底
 *   2. 层与层之间用一条竖直的细线 + 圆点连起来, 表示"上下级"而不是"并列"
 *   3. 全线条 1px; 状态色只出现在 Badge 上, 不染整行
 * ```
 */

/** 链路的一层。`kind` 决定它画在哪个位置、用什么措辞。 */
export interface ProxyLayer {
  /** `listener` 入口 / `group` 策略 / `node` 实体 —— 决定语义与图标色。 */
  readonly kind: "listener" | "group" | "node";
  /** 层标题 (如 "hx-shared-inbound-standard-mixed")。 */
  readonly title: string;
  /** 次要信息 (端口 / 策略 / 协议)。 */
  readonly meta?: string;
  /** 右侧状态角标。 */
  readonly status?: string;
  /** 角标语义色。 */
  readonly tone?: "success" | "warning" | "destructive" | "secondary" | "outline";
  /** 补充说明 (可多行)。 */
  readonly detail?: ReactNode;
}

export interface ProxyChainProps {
  readonly layers: readonly ProxyLayer[];
  readonly className?: string;
  /** 每层左边的连接线是否显示 (单层使用时关掉更干净)。 */
  readonly showConnector?: boolean;
}

const KIND_META: Record<ProxyLayer["kind"], { label: string; hint: string; dot: string }> = {
  listener: {
    label: "入口",
    hint: "对外端口 + 协议, 绑定一个策略组",
    dot: "bg-primary",
  },
  group: {
    label: "策略",
    hint: "虚拟选择器 —— 本身不持有服务器",
    dot: "bg-amber-400",
  },
  node: {
    label: "实体",
    hint: "真实上游服务器",
    dot: "bg-emerald-400",
  },
};

/**
 * 一层。左侧是"层"标记 + 连接线, 右侧是标题/次要信息/状态。
 *
 * 为什么层标记用 `KIND_META` 而不是让使用方传:
 * 这三层的名字与含义是**协议事实**, 不是样式选择 —— 写死在组件里才能保证
 * 每个使用方说同一件事 (这正是这个组件要解决的问题)。
 */
function Layer({ layer, last, showConnector }: {
  layer: ProxyLayer;
  last: boolean;
  showConnector: boolean;
}): JSX.Element {
  const meta = KIND_META[layer.kind];
  return (
    <div className="relative flex gap-3">
      {/* 左列: 圆点 + 竖线。竖线表示"上下级", 画到最后一层为止 */}
      {showConnector && (
        <div className="relative flex w-3 shrink-0 justify-center">
          <span className={cn("mt-[7px] size-1.5 shrink-0 rounded-full", meta.dot)} aria-hidden />
          {!last && <span className="absolute top-3 bottom-0 w-px bg-border/60" aria-hidden />}
        </div>
      )}
      <div className={cn("min-w-0 flex-1", !last && "pb-3")}>
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          {/* 层名 (入口/策略/实体) —— 这个词就是要让人不再混概念 */}
          <span className="shrink-0 rounded border border-border/60 px-1 py-px text-[10px] font-medium text-muted-foreground">
            {meta.label}
          </span>
          <span
            className="min-w-0 truncate font-mono text-[12px] text-foreground"
            title={layer.title}
          >
            {layer.title}
          </span>
          {layer.status && (
            <Badge variant={layer.tone ?? "secondary"} className="shrink-0">
              {layer.status}
            </Badge>
          )}
          {layer.meta && (
            <span className="shrink-0 text-[11px] text-muted-foreground">{layer.meta}</span>
          )}
        </div>
        {layer.detail && (
          <div className="mt-0.5 pl-0 text-[11px] text-muted-foreground/85">{layer.detail}</div>
        )}
      </div>
    </div>
  );
}

/**
 * 代理服务链路。把 listener → group → node 三层按顺序画出来。
 *
 * ```tsx
 * <ProxyChain layers={[
 *   { kind: "listener", title: "hx-shared-inbound-standard-mixed", meta: "mixed · 7890", status: "启用", tone: "success" },
 *   { kind: "group",    title: "良心云", meta: "url-test · 41 候选", status: "url-test" },
 *   { kind: "node",     title: "lxyus1.777078.xyz", meta: "hysteria2", status: "healthy", tone: "success" },
 * ]} />
 * ```
 *
 * 层数不固定 (一个策略组后面可能跟多个实体), 但 `kind` 的顺序应当符合 `listener → group → node` ——
 * 组件不强制校验, 因为真实系统里也可能只想看其中两段。
 */
export function ProxyChain({ layers, className, showConnector = true }: ProxyChainProps): JSX.Element {
  return (
    <div className={cn("rounded-lg border border-border/50 bg-card/40 px-3 py-2.5", className)}>
      {layers.map((layer, index) => (
        <Layer
          key={`${layer.kind}-${layer.title}-${index}`}
          layer={layer}
          last={index === layers.length - 1}
          showConnector={showConnector}
        />
      ))}
    </div>
  );
}

/**
 * 三层的**图例** —— 放在列表页顶部, 一句话说清谁是谁。
 *
 * 单独做成一个件而不是让使用方写文案, 理由同上: 这三句是协议事实,
 * 每个页面都该说同一遍。
 */
export function ProxyLayerLegend({ className }: { className?: string }): JSX.Element {
  return (
    <div className={cn("flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-muted-foreground", className)}>
      {(Object.keys(KIND_META) as ProxyLayer["kind"][]).map((k) => (
        <span key={k} className="inline-flex items-center gap-1.5">
          <span className={cn("size-1.5 shrink-0 rounded-full", KIND_META[k].dot)} aria-hidden />
          <span className="font-medium text-foreground">{KIND_META[k].label}</span>
          <span>{KIND_META[k].hint}</span>
        </span>
      ))}
    </div>
  );
}

export { KIND_META as PROXY_LAYER_META };
