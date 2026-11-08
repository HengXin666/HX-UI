"use client";

import { motion } from "motion/react";
import { useMemo, useRef, useState, type JSX, type KeyboardEvent } from "react";
import { useMergeRefs } from "../../hooks/dom/useMergeRefs";
import { useResizeObserver } from "../../hooks/dom/useResizeObserver";
import { cn } from "../../primitives/utils";
import { VIZ_CLASS, VIZ_PRESS, VIZ_PULSE_DASH, VIZ_PULSE_PASSES, VIZ_SHOT, VIZ_SPRING, VIZ_STATE, VIZ_TIME } from "../tokens";
import { useVizStage } from "../use-stage";
import { edgeLength, edgePath, layoutFlow, touching, walkOrder, type FlowEdge, type FlowNode } from "./flow-layout";

export interface FlowGraphProps {
  nodes: readonly FlowNode[];
  edges: readonly FlowEdge[];
  /** 读屏名称, 也是图注. */
  label: string;
  /** 受控的当前节点. */
  value?: string;
  defaultValue?: string;
  onValueChange?: (id: string) => void;
  /** 与当前节点相连的边上走脉冲. 默认开. */
  pulse?: boolean;
  /** 图区高度 (px). */
  height?: number;
  className?: string;
  classNames?: { root?: string; plot?: string; node?: string; panel?: string };
}

const DEFAULT_HEIGHT = 260;
const SPAN = 100;
const PULSE_PARTS = VIZ_PULSE_DASH.split(" ").map(Number);
const KEYS_BACK = new Set(["ArrowLeft", "ArrowUp"]);
const KEYS_FORWARD = new Set(["ArrowRight", "ArrowDown"]);
const NODE_FROM = 0.4;
const NODE_ORIGIN = { originX: 0, originY: 0.5 } as const;
const NODE_SPRING = { type: "spring" as const, ...VIZ_SPRING.node };

/**
 * 流程图. 节点按依赖深度分列自动布局, 是一组 roving tabindex 按钮, 方向键沿 "先列后行" 顺序移动.
 * 入场按 video-shotcraft canvas-materialize-moves 的级联生成: 列间 22f, 同列兄弟 5f, 连线先于子节点 10f 描出 (线牵出节点),
 * 节点从左侧端口用弹簧 (190 / 14) 拉出, 不从中心缩放 (中心缩放读作弹窗).
 * 当前节点的进出边换主色, 脉冲沿流向走两趟后停下, 之后真静止. 坐标按容器像素计算, 线宽不随容器拉伸. 说明区在 aria-live.
 */
export function FlowGraph({
  nodes,
  edges,
  label,
  value,
  defaultValue,
  onValueChange,
  pulse = true,
  height = DEFAULT_HEIGHT,
  className,
  classNames,
}: FlowGraphProps): JSX.Element {
  const layout = useMemo(() => layoutFlow(nodes, edges), [nodes, edges]);
  const order = useMemo(() => walkOrder(layout), [layout]);
  const stage = useVizStage<HTMLDivElement>(layout.columns);
  const [sizeRef, rect] = useResizeObserver<HTMLDivElement>();
  const plotRef = useMergeRefs<HTMLDivElement>(sizeRef, stage.ref);
  const [inner, setInner] = useState(defaultValue ?? order[0] ?? "");
  const current = value ?? inner;
  const lit = useMemo(() => touching(layout, current), [layout, current]);
  const buttons = useRef(new Map<string, HTMLButtonElement | null>());
  const width = rect.width;
  const px = (x: number): number => (x / SPAN) * width;
  const py = (y: number): number => (y / SPAN) * height;
  const active = layout.nodes.find((node) => node.id === current);
  const nodeDelay = (column: number, row: number): number => column * VIZ_SHOT.levelGap + row * VIZ_SHOT.sibling;
  const first = stage.entering();
  const cascadeEnd = Math.max(0, ...layout.nodes.map((node) => nodeDelay(node.column, node.row))) + VIZ_SHOT.edge;

  const select = (id: string): void => {
    setInner(id);
    onValueChange?.(id);
    buttons.current.get(id)?.focus();
  };

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>): void => {
    const at = Math.max(0, order.indexOf(current));
    if (KEYS_BACK.has(event.key)) {
      event.preventDefault();
      select(order[at <= 0 ? order.length - 1 : at - 1]);
    } else if (KEYS_FORWARD.has(event.key)) {
      event.preventDefault();
      select(order[at >= order.length - 1 ? 0 : at + 1]);
    }
  };

  return (
    <figure data-slot="hx-flow-graph" className={cn(VIZ_CLASS.figure, className, classNames?.root)}>
      <figcaption className={VIZ_CLASS.caption}>{label}</figcaption>
      <div ref={plotRef} className={cn(VIZ_CLASS.plot, classNames?.plot)} style={{ height }}>
        {width > 0 ? (
          <svg aria-hidden viewBox={`0 0 ${width} ${height}`} className="pointer-events-none absolute inset-0 size-full">
            {layout.edges.map((edge) => {
              const source = layout.nodes.find((node) => node.id === edge.from);
              const target = layout.nodes.find((node) => node.id === edge.to);
              if (!source || !target) return null;
              const a = { x: px(source.x), y: py(source.y) };
              const b = { x: px(target.x), y: py(target.y) };
              const d = edgePath(a, b);
              const on = lit.has(`${edge.from}>${edge.to}`);
              const length = edgeLength(a, b);
              return (
                <g key={`${edge.from}>${edge.to}`} className={on ? "text-primary" : "text-border"}>
                  <motion.path
                    d={d}
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={1}
                    initial={stage.reduced ? false : { pathLength: 0 }}
                    animate={{ pathLength: stage.shown ? 1 : 0 }}
                    transition={
                      stage.reduced
                        ? stage.update
                        : { duration: VIZ_SHOT.edge, ease: stage.ease, delay: first ? Math.max(0, nodeDelay(target.column, target.row) - VIZ_SHOT.lead) : 0 }
                    }
                  />
                  {pulse && on && !stage.reduced && stage.shown ? (
                    <motion.path
                      key={current}
                      d={d}
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={1}
                      strokeLinecap="round"
                      strokeDasharray={`${PULSE_PARTS[0] * length} ${length}`}
                      initial={{ strokeDashoffset: PULSE_PARTS[0] * length }}
                      animate={{ strokeDashoffset: -length }}
                      transition={{ duration: VIZ_TIME.pulse, ease: "linear", repeat: VIZ_PULSE_PASSES - 1, delay: first ? cascadeEnd : 0 }}
                    />
                  ) : null}
                </g>
              );
            })}
          </svg>
        ) : null}
        <div role="group" aria-label={label} onKeyDown={onKeyDown}>
          {layout.nodes.map((node) => {
            const on = node.id === current;
            return (
              <motion.button
                key={node.id}
                type="button"
                ref={(element: HTMLButtonElement | null) => {
                  buttons.current.set(node.id, element);
                }}
                tabIndex={on ? 0 : -1}
                aria-pressed={on}
                data-state={on ? VIZ_STATE.on : VIZ_STATE.off}
                className={cn(VIZ_CLASS.node, VIZ_CLASS.focus, "transition-colors duration-150", on ? VIZ_CLASS.nodeOn : VIZ_CLASS.nodeIdle, classNames?.node)}
                style={{ left: `${node.x}%`, top: `${node.y}%`, ...NODE_ORIGIN }}
                initial={stage.reduced ? false : { opacity: 0, scale: NODE_FROM }}
                animate={stage.shown ? { opacity: 1, scale: 1 } : { opacity: 0, scale: NODE_FROM }}
                whileTap={stage.reduced ? undefined : { scale: VIZ_PRESS }}
                transition={stage.reduced ? stage.update : { ...NODE_SPRING, delay: first ? nodeDelay(node.column, node.row) : 0 }}
                onClick={() => select(node.id)}
              >
                {node.label}
              </motion.button>
            );
          })}
        </div>
      </div>
      <p aria-live="polite" className={cn(VIZ_CLASS.panel, classNames?.panel)}>
        {active ? active.detail ?? active.label : null}
      </p>
    </figure>
  );
}
