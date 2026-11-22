import { lazy } from "react";
import { Frame3D } from "./frame";

const Scene = lazy(() => import("./impl/globe-scene"));

export interface GlobeArc {
  /** [纬度, 经度] */
  from: [number, number];
  to: [number, number];
  fromName?: string;
  toName?: string;
  /** 决定飞线粗细 */
  value?: number;
  label?: string;
}

export interface GlobeArcsProps {
  arcs: GlobeArc[];
  /** 额外的城市点 */
  points?: { at: [number, number]; name: string }[];
  format?: (v: number) => string;
  valueLabel?: string;
  /** 飞线上的流光 */
  flow?: boolean;
  autoRotate?: boolean;
  /** 初始朝向 [纬度, 经度], 默认第一条线的起点 */
  focus?: [number, number];
  height?: number;
  label?: string;
  className?: string;
}

/**
 * 地球飞线: 跨境订单、CDN 回源、航线这类 "从哪到哪" 的流向. 陆地是点阵, 飞线粗细按量, 流光从起点跑到终点,
 * 端点有脉冲环; 悬停一条线高亮它并显示读数. 减弱动效时不转、不流动, 线直接画满.
 */
export function GlobeArcs(props: GlobeArcsProps) {
  const { arcs, format = (v: number) => v.toLocaleString("zh-CN"), valueLabel = "数值", height = 460, label = "地球飞线", className } = props;
  return (
    <Frame3D
      label={label}
      height={height}
      className={className}
      hint="拖动旋转 · 滚轮缩放 · 悬停飞线看读数"
      fallback={
        <ul className="grid gap-1 text-xs">
          {arcs.map((a, i) => (
            <li key={i}>{a.fromName ?? a.from.join(", ")} → {a.toName ?? a.to.join(", ")}{a.value != null ? `：${valueLabel} ${format(a.value)}` : ""}</li>
          ))}
        </ul>
      }
    >
      {(api) => <Scene {...props} api={api} />}
    </Frame3D>
  );
}
