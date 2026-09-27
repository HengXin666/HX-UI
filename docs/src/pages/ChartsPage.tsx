import { useEffect, useRef, useState, type JSX } from "react";
import {
  HxLineChart, HxAreaChart, HxBarChart, HxPieChart, HxRadarChart, HxRadialChart,
  Button, Card, Badge, type SeriesDef,
} from "@hx/ui";
import { H2, P, Preview, PropsTable, Callout, Code } from "../components/DocKit";

type Point = { name: string; [k: string]: string | number };

const MONTHS: Point[] = [
  { name: "1月", 请求: 320, 错误: 12 },
  { name: "2月", 请求: 412, 错误: 9 },
  { name: "3月", 请求: 380, 错误: 21 },
  { name: "4月", 请求: 520, 错误: 14 },
  { name: "5月", 请求: 486, 错误: 8 },
  { name: "6月", 请求: 610, 错误: 17 },
  { name: "7月", 请求: 720, 错误: 11 },
];

const SERIES: SeriesDef<Point>[] = [
  { dataKey: "请求", name: "请求量" },
  { dataKey: "错误", name: "错误数" },
];

/** 增量追加的实时折线。切换 match 模式看差别。 */
function StreamingChart({ mode }: { mode: "index" | "append" }): JSX.Element {
  const [data, setData] = useState<Point[]>(() =>
    Array.from({ length: 12 }, (_, i) => ({ name: `t${i}`, 值: 40 + Math.round(Math.sin(i / 2) * 18 + Math.random() * 8) })),
  );
  const [running, setRunning] = useState(false);
  const n = useRef(12);

  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => {
      n.current += 1;
      setData((prev) => {
        const next = [...prev, { name: `t${n.current}`, 值: 40 + Math.round(Math.sin(n.current / 2) * 18 + Math.random() * 8) }];
        return next.length > 20 ? next.slice(next.length - 20) : next;
      });
    }, 700);
    return () => clearInterval(id);
  }, [running]);

  return (
    <div className="flex w-full flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <Button variant={running ? "outline" : "primary"} size="sm" onClick={() => setRunning((r) => !r)}>
          {running ? "暂停" : "开始推送数据"}
        </Button>
        <Button variant="ghost" size="sm" onClick={() => { n.current = 12; setData([]); }}>清空</Button>
        <Badge variant={mode === "append" ? "success" : "warning"}>
          {mode === "append" ? "matchAppend：旧点不动" : "matchByIndex：整条重排"}
        </Badge>
        <span className="text-[12px] text-muted-foreground">{data.length} 点</span>
      </div>
      <HxLineChart
        data={data}
        series={[{ dataKey: "值", name: "QPS" }]}
        height={200}
        animation={{ match: mode, duration: 300 }}
      />
    </div>
  );
}

export function ChartsPage(): JSX.Element {
  const [mode, setMode] = useState<"index" | "append">("append");

  const pie = [
    { name: "已完成", value: 42 },
    { name: "进行中", value: 18 },
    { name: "已暂停", value: 7 },
    { name: "失败", value: 3 },
  ];
  const radar: Point[] = [
    { name: "延迟", 本月: 82, 上月: 64 },
    { name: "吞吐", 本月: 71, 上月: 78 },
    { name: "可用性", 本月: 94, 上月: 88 },
    { name: "成本", 本月: 58, 上月: 72 },
    { name: "错误率", 本月: 88, 上月: 69 },
  ];

  return (
    <>
      <P>
        图表基于 <Code>Recharts 3</Code> 套一层。响应式、配色走 token、统一好看的提示面板，
        并且**区分「首次加载」与「后续增量」的动画** —— 后者是这个包与直接用 Recharts 最不同的地方。
      </P>

      <Callout title="首次加载有动效, 新增只新增">
        Recharts 默认按下标配对新旧数据，数量变化时按比例拉伸 ——
        5 个点变 15 个点时每个旧点「覆盖」约 3 个新点，结果是整条线从头重排一遍。
        实时图表每秒加一个点，就会每秒抖一次。
        <br /><br />
        这里的做法：首次渲染用 <Code>matchByIndex</Code> 播完整绘制动画；
        之后增量用 <Code>matchAppend</Code>（或 <Code>matchByDataKey</Code>），
        <b className="text-foreground">已存在的点留在原位，只有新点自己淡入</b>。
      </Callout>

      <H2>增量动画对比</H2>
      <P>
        下面两个图数据完全一样、推送节奏一样，只有动画策略不同。
        切换标签看差别 —— 左边那种每来一个点整条线都会重排，右边只有新点从右侧淡入、旧点纹丝不动。
      </P>
      <Preview
        align="stretch"
        code={`// 首次渲染自动用 matchByIndex (播完整绘制动画)
// 之后每次数据变化按 match 走
<HxLineChart data={data} series={series}
             animation={{ match: "append", duration: 300 }} />

// 滑动窗口 (新的进来、旧的出去) 最该按业务键配对:
// 让同一个 id 的点平滑移到新位置, 而不是所有点按新下标重排
<HxLineChart animation={{ match: { dataKey: "t" } }} ... />`}
      >
        <div className="flex w-full flex-col gap-4">
          <div className="flex gap-2">
            <Button variant={mode === "index" ? "primary" : "outline"} size="xs" onClick={() => setMode("index")}>
              matchByIndex（默认）
            </Button>
            <Button variant={mode === "append" ? "primary" : "outline"} size="xs" onClick={() => setMode("append")}>
              matchAppend（推荐）
            </Button>
          </div>
          <StreamingChart mode={mode} key={mode} />
        </div>
      </Preview>

      <H2>折线图</H2>
      <Preview
        align="stretch"
        code={`<HxLineChart data={data} series={[
  { dataKey: "请求", name: "请求量" },
  { dataKey: "错误", name: "错误数", color: "var(--destructive)" },
]} height={260} />`}
      >
        <HxLineChart data={MONTHS} series={SERIES} height={260} className="w-full" />
      </Preview>

      <H2>面积图</H2>
      <P>渐变从该系列的颜色生成，上浓下淡、底部几乎透明。堆叠时传 <Code>stacked</Code>。</P>
      <Preview align="stretch" code={`<HxAreaChart data={data} series={series} height={240} stacked />`}>
        <HxAreaChart data={MONTHS} series={SERIES} height={240} stacked className="w-full" />
      </Preview>

      <H2>柱状图</H2>
      <P>圆角只给顶边 —— 底边也圆会让柱子看起来浮着。</P>
      <Preview
        align="stretch"
        code={`<HxBarChart data={data} series={series} height={240} />
<HxBarChart data={data} series={series} height={240} stacked />`}
      >
        <div className="flex w-full flex-col gap-4">
          <HxBarChart data={MONTHS} series={SERIES} height={220} />
          <HxBarChart data={MONTHS} series={SERIES} height={220} stacked />
        </div>
      </Preview>

      <H2>饼图 / 环形图</H2>
      <P>扇区之间留 2° 缝：贴着会看不出边界，尤其相邻色相接近时。</P>
      <Preview align="stretch" code={`<HxPieChart data={pie} height={260} innerRadius={56} />`}>
        <HxPieChart data={pie} height={260} className="w-full" />
      </Preview>

      <H2>雷达图</H2>
      <Preview
        align="stretch"
        code={`<HxRadarChart data={radar} series={[{ dataKey: "本月" }, { dataKey: "上月" }]} height={280} />`}
      >
        <HxRadarChart data={radar} series={[{ dataKey: "本月" }, { dataKey: "上月" }]} height={280} className="w-full" />
      </Preview>

      <H2>径向条形</H2>
      <Preview
        align="stretch"
        code={`<HxRadialChart data={[
  { name: "CPU", value: 62 },
  { name: "内存", value: 78 },
  { name: "磁盘", value: 41 },
]} max={100} height={240} />`}
      >
        <HxRadialChart
          data={[{ name: "CPU", value: 62 }, { name: "内存", value: 78 }, { name: "磁盘", value: 41 }]}
          height={240}
          className="w-full"
        />
      </Preview>

      <H2>自定义组合</H2>
      <P>
        需要 Recharts 的完整能力时用 <Code>ChartFrame</Code> + <Code>ChartChrome</Code> 自己拼 ——
        它们给出统一的容器、网格、坐标轴与提示面板，图表类型由你选。
      </P>
      <Preview
        align="stretch"
        code={`import { LineChart, Line } from "recharts";
import { ChartFrame, ChartChrome } from "@hx/ui";

<ChartFrame height={240}>
  <LineChart data={data}>
    <ChartChrome xKey="name" />
    <Line dataKey="v" stroke="var(--primary)" vectorEffect="non-scaling-stroke" />
  </LineChart>
</ChartFrame>`}
      >
        <Card variant="muted" className="w-full p-3 text-[12.5px] text-muted-foreground">
          <Code>ChartChrome</Code> 展开后是 <Code>CartesianGrid</Code> + <Code>XAxis</Code> +{" "}
          <Code>YAxis</Code> + <Code>Tooltip</Code> 四件，已配好主题与提示面板。
        </Card>
      </Preview>

      <H2>动画属性</H2>
      <PropsTable
        rows={[
          { name: "animation.match", type: '"index" | "append" | { dataKey }', default: '"append"', desc: "增量时的匹配方式。首次渲染总是用 index。" },
          { name: "animation.duration", type: "number", default: "320", desc: "动效毫秒数。" },
          { name: "animation.easing", type: "string", default: '"ease-out"', desc: "缓动。数据变化该快到位置再停。" },
          { name: "animation.disabled", type: "boolean", default: "false", desc: "关掉动画。数据量大时建议开。" },
          { name: "（自动）", type: "-", default: "-", desc: "超过 800 个点时自动关掉动画 —— 每帧对所有点插值会掉帧。" },
        ]}
      />

      <H2>图表属性（共性）</H2>
      <PropsTable
        rows={[
          { name: "data", type: "readonly T[]", default: "-", desc: "数据数组。每条记录一个对象。" },
          { name: "series", type: "readonly SeriesDef[]", default: "-", desc: "系列定义：dataKey / name / color。" },
          { name: "xKey", type: "string", default: '"name"', desc: "横轴取哪个字段。" },
          { name: "height", type: "number", default: "260", desc: "高度。必须给 —— 响应式容器只接管宽度。" },
          { name: "className", type: "string", desc: "外层类名。宽度由父元素决定。" },
        ]}
      />

      <H2>响应式</H2>
      <P>
        所有图表都包在 <Code>ResponsiveContainer</Code> 里，宽度跟随父元素。
        <b className="text-foreground">不要给图表设固定宽度</b> ——
        那是最常见的错误，它会撑破容器或被裁掉。高度必须由外层给，因为容器只接管宽度。
      </P>
      <P>
        线宽用了 <Code>vectorEffect="non-scaling-stroke"</Code> —— 响应式拉伸时描边不跟着变形，
        否则线宽会被拉扁。
      </P>
    </>
  );
}
