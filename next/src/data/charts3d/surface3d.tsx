import { lazy } from "react";
import { Frame3D } from "./frame";

const Scene = lazy(() => import("./impl/surface-scene"));

export interface Surface3DProps {
  /** values[行][列], 行沿 Y 轴, 列沿 X 轴; 至少 2 x 2 */
  values: number[][];
  xRange?: [number, number];
  yRange?: [number, number];
  xLabel?: string;
  yLabel?: string;
  zLabel?: string;
  format?: (v: number) => string;
  /** 叠一层细网格线 */
  wireframe?: boolean;
  autoRotate?: boolean;
  height?: number;
  label?: string;
  className?: string;
}

/**
 * 3D 曲面图: 两个变量一起变时结果怎么走, 比如定价 × 折扣 → 利润, 一眼找到峰值区.
 * 颜色按高度渐变 (主题色), 标出峰值; 悬停显示三个值并落一条到地面的垂线. 换数据时曲面平滑变形.
 */
export function Surface3D(props: Surface3DProps) {
  const { values, xRange = [0, 1], yRange = [0, 1], xLabel = "X", yLabel = "Y", zLabel = "Z", format = (v: number) => v.toFixed(2), height = 440, label = "3D 曲面图", className } = props;
  const flat = values.flat();
  const hi = Math.max(...flat), lo = Math.min(...flat);
  const rows = values.length, cols = values[0]?.length ?? 0;
  const pi = flat.indexOf(hi);
  const at = (r: number, c: number) => [xRange[0] + (c / (cols - 1)) * (xRange[1] - xRange[0]), yRange[0] + (r / (rows - 1)) * (yRange[1] - yRange[0])];
  const [px, py] = at(Math.floor(pi / cols), pi % cols);
  return (
    <Frame3D
      label={label}
      height={height}
      className={className}
      fallback={
        <p>
          {label}：{rows} × {cols} 个采样点，{zLabel}范围 {format(lo)} 至 {format(hi)}；峰值 {format(hi)} 出现在 {xLabel} {px.toFixed(2)}、{yLabel} {py.toFixed(2)}。
        </p>
      }
    >
      {(api) => <Scene {...props} api={api} />}
    </Frame3D>
  );
}
