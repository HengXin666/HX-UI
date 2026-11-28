import { lazy } from "react";
import { Frame3D } from "./frame";

const Scene = lazy(() => import("./impl/bar3d-scene"));

export interface Bar3DProps {
  /** values[行][列], 行 = yLabels (纵深), 列 = xLabels */
  values: number[][];
  xLabels: string[];
  yLabels: string[];
  format?: (v: number) => string;
  /** value = 按数值深浅渐变, row = 每行一种颜色 */
  colorMode?: "value" | "row";
  /** 柱间空隙, 0..0.8 */
  gap?: number;
  valueLabel?: string;
  autoRotate?: boolean;
  height?: number;
  /** 读屏标题 */
  label?: string;
  className?: string;
}

/**
 * 3D 柱状图: 两个维度交叉 (地区 × 月份) 的量一眼看出高低. three.js 按需加载, 首屏不受影响.
 * 柱子从地面依次长出, 换数据时平滑过渡; 悬停高亮当前柱、其余变暗并显示读数; 拖动旋转, 滚轮缩放.
 */
export function Bar3D(props: Bar3DProps) {
  const { values, xLabels, yLabels, format = (v: number) => v.toLocaleString("zh-CN"), height = 420, label = "3D 柱状图", className } = props;
  return (
    <Frame3D
      label={label}
      height={height}
      className={className}
      fallback={
        <table className="w-full text-xs">
          <caption className="sr-only">{label}</caption>
          <thead><tr><th scope="col"><span className="sr-only">维度</span></th>{xLabels.map((x) => <th key={x} scope="col" className="px-1 text-right font-medium">{x}</th>)}</tr></thead>
          <tbody>{values.map((row, r) => (
            <tr key={yLabels[r]}><th scope="row" className="pr-2 text-left font-medium">{yLabels[r]}</th>{row.map((v, c) => <td key={c} className="px-1 text-right tabular-nums">{format(v)}</td>)}</tr>
          ))}</tbody>
        </table>
      }
    >
      {(api) => <Scene {...props} api={api} />}
    </Frame3D>
  );
}
