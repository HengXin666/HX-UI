import { lazy } from "react";
import { Frame3D } from "./frame";

const Scene = lazy(() => import("./impl/scatter-scene"));

export interface Scatter3DPoint {
  /** 稳定 id, 增删改按它配对 */
  id: string;
  x: number;
  y: number;
  z: number;
  /** 分组, 决定颜色和图例 */
  group?: string;
  /** 气泡大小的量, 不给就一样大 */
  size?: number;
  label?: string;
}

export interface Scatter3DProps {
  points: Scatter3DPoint[];
  xLabel?: string;
  yLabel?: string;
  zLabel?: string;
  format?: (v: number, axis: "x" | "y" | "z") => string;
  autoRotate?: boolean;
  /** 每个点往地面落一条细线, 看清高度 */
  stems?: boolean;
  height?: number;
  label?: string;
  className?: string;
}

/**
 * 3D 散点 / 气泡: 三个指标一起看 (价格 × 销量 × 评分, 延迟 × 吞吐 × 错误率), 分组上色, 大小可编码第四个量.
 * 点按 id 配对: 新点从原地放大出现, 删掉的缩小消失, 数值变化时滑到新位置; 坐标轴随数据范围平滑调整.
 * 悬停高亮当前点、显示读数; 拖动旋转, 滚轮缩放, 方向键转视角.
 */
export function Scatter3D(props: Scatter3DProps) {
  const { points, xLabel = "X", yLabel = "Y", zLabel = "Z", format = (v: number) => v.toLocaleString("zh-CN", { maximumFractionDigits: 2 }), height = 440, label = "3D 散点图", className } = props;
  const groups = [...new Set(points.map((p) => p.group ?? ""))];
  return (
    <Frame3D
      label={label}
      height={height}
      className={className}
      fallback={
        <table className="w-full text-xs">
          <caption className="sr-only">{label}，{points.length} 个点{groups.length > 1 ? `，${groups.length} 组` : ""}</caption>
          <thead><tr><th scope="col">名称</th>{groups.length > 1 && <th scope="col">分组</th>}<th scope="col">{xLabel}</th><th scope="col">{yLabel}</th><th scope="col">{zLabel}</th></tr></thead>
          <tbody>{points.map((p) => (
            <tr key={p.id}><th scope="row" className="text-left font-medium">{p.label ?? p.id}</th>{groups.length > 1 && <td>{p.group}</td>}<td>{format(p.x, "x")}</td><td>{format(p.y, "y")}</td><td>{format(p.z, "z")}</td></tr>
          ))}</tbody>
        </table>
      }
    >
      {(api) => <Scene {...props} api={api} />}
    </Frame3D>
  );
}
