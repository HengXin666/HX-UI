import type { JSX } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle, Button, StatCard, StatGrid, Switch } from "@hx/ui";
import { H2, P, Preview, PropsTable, Callout, Code } from "../components/DocKit";
import { API_DEFAULT_FALSE, API_DEFAULT_QUOTED_DEFAULT, API_PROP, API_TYPE_BOOLEAN, DEMO_ALIGN, DEMO_CLASS, DEMO_SIZES, DEMO_STAT_COLUMNS, DEMO_STAT_SERIES, DEMO_STAT_TREND, DEMO_VARIANT } from "../../../src/constants/docs-legacy";

/**
 * Card 页, 含可选变体 (elevated / glass / lift) 与 StatCard 趋势的演示.
 * .agents/notes/implemented/feature/2026-11-01-opt-in-polish-variants.md
 */
export function CardPage(): JSX.Element {
  return (
    <>
      <P>
        上游**没有** Card 组件  它用的是一条约定: 所有卡片都是 <Code>rounded-xl border border-border bg-card</Code> 这一族类串,
        在上百个文件里手写。复刻时把那族类串收成一个组件, 免得每个使用方各自记一遍边界的写法。
      </P>
      <Callout title="三条硬约定">
        普通卡片<b className={DEMO_CLASS.foreground}>零阴影</b>, 层级靠 1px 边框加半透明底叠出来;
        hover 只换边框色与背景透明度, 不加阴影不放大; 线条全局 1px。
      </Callout>

      <H2>四种变体</H2>
      <P>按容器角色选: 普通卡片用 default, 浮层或需要压住背景时用 solid, 次级容器用 muted, 只要一圈边用 outline。</P>
      <Preview
        align={DEMO_ALIGN.stretch}
        code={`<Card variant="default">默认: 半透明底 + 模糊</Card>
<Card variant="solid">实底: 不透明卡片面</Card>
<Card variant="muted">低对比: 次级容器</Card>
<Card variant="outline">描边: 只留一圈边</Card>

{/* hover 反馈: 只换边框色与背景透明度 */}
<Card interactive>可悬停的卡片</Card>`}
      >
        <Card variant={DEMO_VARIANT.default} className={DEMO_CLASS.cardSwatch}>默认 (半透明底 + 模糊)</Card>
        <Card variant={DEMO_VARIANT.solid} className={DEMO_CLASS.cardSwatch}>实底</Card>
        <Card variant={DEMO_VARIANT.muted} className={DEMO_CLASS.cardSwatch}>低对比</Card>
        <Card variant={DEMO_VARIANT.outline} className={DEMO_CLASS.cardSwatch}>描边</Card>
        <Card variant={DEMO_VARIANT.default} interactive className={DEMO_CLASS.cardSwatch}>悬停看看</Card>
      </Preview>

      <H2>可选: 抬升, 玻璃与悬浮</H2>
      <P>
        三个后加的可选项, 不传就不生效, 默认外观不变。elevated 用不透明的抬升表面加双层阴影, 给需要从页面里浮起来的重点卡片;
        glass 是半透明加强模糊, 只在有图案或渐变的背景上才看得出; lift 让卡片悬停时上移 2px 并加深阴影, 可与任何 variant 叠加。
      </P>
      <Preview
        align={DEMO_ALIGN.stretch}
        code={`<Card variant="elevated" lift>抬升 + 悬浮</Card>
<Card variant="glass">玻璃: 放在有底纹的背景上</Card>
<Card variant="solid" lift interactive>任何 variant 都能叠 lift</Card>`}
      >
        <Card variant="elevated" lift className="w-48 p-3 text-[12.5px]">
          抬升 + 悬浮, 悬停看看
        </Card>
        <div className="relative w-56 overflow-hidden rounded-xl bg-(image:--gradient-brand) p-3">
          <div aria-hidden className="absolute -top-6 -left-4 size-20 rounded-full bg-accent-2/70" />
          <div aria-hidden className="absolute -right-6 -bottom-8 size-24 rounded-full bg-(--primary-glow)" />
          <Card variant="glass" className="relative p-3 text-[12.5px]">
            玻璃: 底纹透过来但被模糊
          </Card>
        </div>
        <Card variant={DEMO_VARIANT.solid} lift interactive className="w-48 p-3 text-[12.5px]">
          solid + lift + interactive
        </Card>
      </Preview>

      <H2>统计卡: 趋势与迷你折线</H2>
      <P>
        StatCard 的 trend 与 sparkline 也是可选项。trend 传百分数, 正负决定箭头; 越低越好的指标 (延迟, 错误率) 传
        better: "down", 颜色才说对好坏。sparkline 传按时间排列的数列, 线宽 1px, 颜色跟随趋势。
      </P>
      <Preview
        align={DEMO_ALIGN.stretch}
        code={`<StatCard label="活跃会话" value="1,284" trend={12.4} sparkline={[8, 9, 7, 11, 12, 10, 14]} />
<StatCard
  label="P95 延迟"
  value="182 ms"
  trend={{ value: 6.1, better: "down", label: "较上周" }}
  sparkline={[150, 160, 158, 171, 168, 182]}
/>
<StatCard label="队列长度" value="37" trend={0} sparkline={[37, 36, 38, 37]} />`}
      >
        <StatGrid columns={DEMO_STAT_COLUMNS} className={DEMO_CLASS.fullWidth}>
          <StatCard label="活跃会话" value="1,284" trend={DEMO_STAT_TREND.active} sparkline={DEMO_STAT_SERIES.active} />
          <StatCard
            label="P95 延迟"
            value="182 ms"
            trend={DEMO_STAT_TREND.latency}
            sparkline={DEMO_STAT_SERIES.latency}
          />
          <StatCard label="队列长度" value="37" trend={0} sparkline={DEMO_STAT_SERIES.queue} />
        </StatGrid>
      </Preview>

      <H2>带分区的卡片</H2>
      <P>Header / Title / Description / Content / Footer 五段。padding 按上游"标准卡片"档给死, 不用自己调。</P>
      <Preview
        code={`<Card variant="solid" className="w-80">
  <CardHeader>
    <CardTitle>系统通知</CardTitle>
    <CardDescription>agent 完成一轮回答时发系统通知</CardDescription>
  </CardHeader>
  <CardContent>内容区。padding 是 px-3.5 pb-3 pt-2.5。</CardContent>
  <CardFooter>
    <Button variant="outline" size="sm">取消</Button>
    <Button variant="primary" size="sm">保存</Button>
  </CardFooter>
</Card>`}
      >
        <Card variant={DEMO_VARIANT.solid} className="w-80">
          <CardHeader>
            <CardTitle>系统通知</CardTitle>
            <CardDescription>agent 完成一轮回答时发系统通知</CardDescription>
          </CardHeader>
          <CardContent className="flex items-center justify-between gap-3">
            <span className={DEMO_CLASS.caption}>启用</span>
            <Switch defaultChecked />
          </CardContent>
          <CardFooter>
            <Button variant={DEMO_VARIANT.outline} size={DEMO_SIZES.sm}>取消</Button>
            <Button variant={DEMO_VARIANT.primary} size={DEMO_SIZES.sm}>保存</Button>
          </CardFooter>
        </Card>
      </Preview>

      <H2>属性</H2>
      <PropsTable
        rows={[
          { name: API_PROP.variant, type: '"default" | "solid" | "muted" | "outline" | "elevated" | "glass"', default: API_DEFAULT_QUOTED_DEFAULT, desc: "按容器角色选底色与边框深度。elevated / glass 为可选的强调外观。" },
          { name: "interactive", type: API_TYPE_BOOLEAN, default: API_DEFAULT_FALSE, desc: "加上 hover 反馈。只换边框色与背景透明度。" },
          { name: "lift", type: API_TYPE_BOOLEAN, default: API_DEFAULT_FALSE, desc: "悬停上移 2px 并加深阴影; 减弱动效时只换阴影。" },
          { name: "StatCard.trend", type: 'number | { value: number; better?: "up" | "down" | "neutral"; label?: ReactNode }', desc: "相对变化的百分数; 数字是 { value } 的简写, 涨视为好事。" },
          { name: "StatCard.sparkline", type: "number[]", desc: "迷你折线的数据点, 至少两个才画。" },
        ]}
      />
    </>
  );
}
