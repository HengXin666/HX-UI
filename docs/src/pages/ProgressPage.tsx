import type { JSX } from "react";
import { useState } from "react";
import { BUTTON_TYPE, DOC, DOC_SAMPLE, Progress, ProgressMeter, TONE_VARIANT, VARIANT } from "@hx/ui";
import { Callout, Code, H2, P, Preview } from "../components/DocKit";
import { Props } from "../components/DocSpec";

/** Progress / ProgressMeter 页 */
export function ProgressPage(): JSX.Element {
  const [pct, setPct] = useState(37);

  return (
    <>
      <H2>Progress</H2>
      <P>
        用 radix 的 Root 而不是一个 div, 因为它把 <Code>role="progressbar"</Code> 与
        aria-valuenow / min / max 一起给齐了。手写 div 的进度条在读屏软件里是**静默**的 
        视觉上有条, 无障碍上什么都没有, 而且不写 aria 不会有任何报错提示。
      </P>
      <Preview
        code={`<Progress value={37} className="w-64" />
<Progress value={100} tone="success" className="w-64" />
<Progress value={62} tone="warning" className="w-64" />
<Progress value={18} tone="destructive" className="w-64" />

{/* 不定长: radix 在 value=null 时不给宽度, 由关键帧自己扫 */}
<Progress indeterminate className="w-64" />`}
      >
        <Progress value={37} className={DOC.barWidth} aria-label="常规" />
        <Progress value={DOC_SAMPLE.full} tone={TONE_VARIANT.success} className={DOC.barWidth} aria-label="完成" />
        <Progress value={62} tone={VARIANT.warning} className={DOC.barWidth} aria-label="警告" />
        <Progress value={DOC_SAMPLE.progressFail} tone={TONE_VARIANT.destructive} className={DOC.barWidth} aria-label="失败" />
        <Progress indeterminate className={DOC.barWidth} aria-label="不定长" />
      </Preview>

      <H2>ProgressMeter</H2>
      <P>
        抓取 / 导出这类"跑起来要盯着"的场景, 三样缺一都别扭: 光有条不知道在跑什么,
        只有条没有数值不知道还差多少。
      </P>
      <Preview
        code={`const [pct, setPct] = useState(37);

<ProgressMeter
  label="抓取账号"
  value={pct}
  max={100}
  hint={"已处理 " + pct + " / 100"}
  className="w-72"
/>
<button onClick={() => setPct((p) => Math.min(100, p + 13))}>推进 13%</button>`}
      >
        <ProgressMeter
          label="抓取账号"
          value={pct}
          max={DOC_SAMPLE.full}
          hint={"已处理 " + pct + " / " + DOC_SAMPLE.full}
          className={DOC.barWidthWide}
        />
        <button
          type={BUTTON_TYPE}
          onClick={() => setPct((p) => Math.min(DOC_SAMPLE.full, p + 13))}
          className="self-end rounded-lg border border-border px-2.5 py-1 text-[11.5px] text-foreground transition-colors hover:bg-accent/50"
        >
          推进 13%
        </button>
      </Preview>

      <Callout title="不定长进度只改 transform">
        关键帧只动 translateX, 走合成器不触发重排。进度条是高频更新的组件
        (抓取进度可能每秒几十次), 用 width 表达会让整页反复重排。
      </Callout>

      <H2>属性</H2>
      <Props spec={`
Progress.value ~ number ~ 0 ~ 0-100, 越界会被夹紧
Progress.indeterminate ~ boolean ~ false ~ 不定长滚动, 此时 radix 收到 value=null
Progress.tone ~ "primary" | "success" | "warning" | "destructive" ~ "primary" ~ 语义色
ProgressMeter.label / hint ~ ReactNode ~ - ~ 标题与下方补充
ProgressMeter.max ~ number ~ 100 ~ 分母, 内部换算成百分比
`} />
    </>
  );
}
