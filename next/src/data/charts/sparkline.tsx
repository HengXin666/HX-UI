"use client";

import { Area, AreaChart, ResponsiveContainer } from "recharts";
import { useId } from "react";
import { useChartAnimation } from "./animation";

export interface SparklineProps {
  values: number[];
  color?: string;
  height?: number;
  /**
   * values[0] 的序号. 滑动窗口 (末尾追加, 开头丢弃) 时每次加 1,
   * 点按序号配对, 整条线平滑左移而不是原地变形.
   */
  offset?: number;
  /** 是否动画, 默认 true. 首次绘制一次, 之后只动增量 */
  animate?: boolean;
}

/** 迷你折线: 指标卡里用, 无轴无提示. */
export function Sparkline({ values, color = "var(--brand)", height = 36, offset = 0, animate = true }: SparklineProps) {
  const id = useId().replace(/:/g, "");
  const data = values.map((v, i) => ({ i: offset + i, v }));
  const anim = useChartAnimation({ match: { dataKey: "i" }, duration: 240, disabled: !animate }, data.length);
  return (
    <div style={{ height }} className="w-full">
      <ResponsiveContainer>
        <AreaChart data={data} margin={{ top: 2, bottom: 2, left: 0, right: 0 }}>
          <defs>
            <linearGradient id={`sp-${id}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.3} />
              <stop offset="100%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <Area dataKey="v" type="monotone" stroke={color} strokeWidth={1.75} fill={`url(#sp-${id})`} {...anim} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
