import { useState, type JSX } from "react";
import { Slider, UsageMeter } from "@hx/ui";
import { Code, H2, P, Preview, PropsTable } from "../../components/DocKit";

const LIMIT = 200000;

export function UsageMeterPage(): JSX.Element {
  const [used, setUsed] = useState(118000);

  return (
    <>
      <P>AI 交互组件的额度用量条, 组件源码在 <Code>src/agent/usage-meter.tsx</Code>, 变更对比见同名分组下的变更对比页</P>

      <H2>UsageMeter</H2>
      <P>
        显示已用与上限的比值, 超过 80% 进度条转黄, 超过 95% 转红, 传入 <Code>rate</Code> 时在底部显示每秒速率
      </P>
      <Preview
        align="stretch"
        code={`const [used, setUsed] = useState(118000);

<UsageMeter used={used} limit={200000} unit="tokens" rate={1250} />
<Slider
  value={[used]}
  min={0}
  max={200000}
  step={1000}
  onValueChange={(next) => setUsed(next[0])}
  aria-label="调整已用额度"
/>`}
      >
        <div className="flex w-full max-w-md flex-col gap-4">
          <UsageMeter used={used} limit={LIMIT} unit="tokens" rate={1250} />
          <Slider
            value={[used]}
            min={0}
            max={LIMIT}
            step={1000}
            onValueChange={(next) => setUsed(next[0])}
            aria-label="调整已用额度"
          />
          <div className="flex items-baseline justify-between gap-3 text-[length:var(--fs-xs)] text-muted-foreground">
            <span>拖动滑块调整已用额度</span>
            <span className="tabular-nums">{used.toLocaleString()} / {LIMIT.toLocaleString()}</span>
          </div>
        </div>
      </Preview>

      <H2>阈值</H2>
      <P>三档语义色分别对应正常, 接近上限, 超出安全线</P>
      <Preview
        align="center"
        code={`<UsageMeter used={64} limit={100} unit="req" />
<UsageMeter used={86} limit={100} unit="req" rate={12.4} />
<UsageMeter used={98} limit={100} unit="req" rate={12.4} />`}
      >
        <div className="w-64"><UsageMeter used={64} limit={100} unit="req" /></div>
        <div className="w-64"><UsageMeter used={86} limit={100} unit="req" rate={12.4} /></div>
        <div className="w-64"><UsageMeter used={98} limit={100} unit="req" rate={12.4} /></div>
      </Preview>

      <H2>UsageMeter 属性</H2>
      <PropsTable
        rows={[
          { name: "used", type: "number", desc: "已用数量, 负数按 0 处理" },
          { name: "limit", type: "number", desc: "额度上限, 小于等于 0 时百分比按 0" },
          { name: "unit", type: "string", default: "-", desc: "数值后缀, 例如 tokens" },
          { name: "rate", type: "number", default: "-", desc: "每秒消耗速率, 省略时不显示" },
        ]}
      />
    </>
  );
}
