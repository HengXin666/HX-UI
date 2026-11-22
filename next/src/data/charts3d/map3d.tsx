import { lazy } from "react";
import { Frame3D } from "./frame";

const Scene = lazy(() => import("./impl/map3d-scene"));

export interface Map3DDatum {
  /** 省份名, 全称或简称 ("广东" / "广东省") */
  name: string;
  value: number;
}

export interface Map3DProps {
  data: Map3DDatum[];
  /** 指标名, 写进提示和读屏 */
  metric?: string;
  format?: (v: number) => string;
  /** 标出前 N 名的名字 */
  labelTop?: number;
  autoRotate?: boolean;
  height?: number;
  label?: string;
  className?: string;
}

/**
 * 3D 地图: 省份按数值挤出成柱体, 高度和颜色都表示量 (GMV, 门店数, 用户数). 地图数据和 three.js 都按需加载.
 * 省份按名字配对: 新增数据的省份从地面升起, 去掉数据的落回地面变灰, 数值变化时高度和颜色过渡; 前几名的名字跟着柱顶走.
 * 悬停高亮并显示读数; 拖动旋转, 滚轮缩放, 方向键转视角.
 */
export function Map3D(props: Map3DProps) {
  const { data, metric = "数值", format = (v: number) => v.toLocaleString("zh-CN"), height = 460, label = "3D 地图", className } = props;
  const sorted = [...data].sort((a, b) => b.value - a.value);
  return (
    <Frame3D
      label={label}
      height={height}
      className={className}
      fallback={
        <table className="w-full text-xs">
          <caption className="sr-only">{label}，{data.length} 个省份有{metric}数据</caption>
          <thead><tr><th scope="col">省份</th><th scope="col">{metric}</th></tr></thead>
          <tbody>{sorted.map((d) => <tr key={d.name}><th scope="row" className="text-left font-medium">{d.name}</th><td className="tabular-nums">{format(d.value)}</td></tr>)}</tbody>
        </table>
      }
    >
      {(api) => <Scene {...props} api={api} />}
    </Frame3D>
  );
}
