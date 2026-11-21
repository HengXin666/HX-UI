import { Area, AreaChart, ResponsiveContainer } from "recharts";
import { useId } from "react";

/** 迷你折线: 指标卡里用, 无轴无提示. */
export function Sparkline({ values, color = "var(--brand)", height = 36 }: { values: number[]; color?: string; height?: number }) {
  const id = useId().replace(/:/g, "");
  const data = values.map((v, i) => ({ i, v }));
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
          <Area dataKey="v" type="monotone" stroke={color} strokeWidth={1.75} fill={`url(#sp-${id})`} isAnimationActive={false} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
