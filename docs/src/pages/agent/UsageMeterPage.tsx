import type { JSX } from "react";
import { useState } from "react";
import { DiffView, UsageMeter, type DiffLine } from "../../../../src/agent/usage-meter";
import { Slider } from "../../../../src/primitives/slider";
import { Code, H2, P, Preview, PropsTable } from "../../components/DocKit";

const LIMIT = 200000;

const DIFF_SAMPLE: DiffLine[] = [
  { type: "ctx", text: "export function formatQuota(value: number, unit = 'tokens') {" },
  { type: "del", text: "  const safe = Math.max(0, value);" },
  { type: "add", text: "  const safe = Number.isFinite(value) ? Math.max(0, value) : 0;" },
  { type: "ctx", text: "  return safe + ' ' + unit;" },
  { type: "ctx", text: "}" },
  { type: "ctx", text: "" },
  { type: "add", text: "export function percentOf(used: number, limit: number): number {" },
  { type: "add", text: "  return limit > 0 ? (used / limit) * 100 : 0;" },
  { type: "add", text: "}" },
];

export function UsageMeterPage(): JSX.Element {
  const [used, setUsed] = useState(118000);

  return (
    <>
      <P>AI 交互组件的额度与变更视图, 组件源码在 <Code>src/agent/usage-meter.tsx</Code></P>

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

      <H2>DiffView</H2>
      <P>逐行渲染变更, 新增行绿底, 删除行红底, 上下文行灰字, 行首给符号, 整体等宽字体</P>
      <Preview
        align="stretch"
        code={`const hunks = [
  { type: "ctx", text: "export function formatQuota(value: number, unit = 'tokens') {" },
  { type: "del", text: "  const safe = Math.max(0, value);" },
  { type: "add", text: "  const safe = Number.isFinite(value) ? Math.max(0, value) : 0;" },
  { type: "ctx", text: "  return safe + ' ' + unit;" },
  { type: "ctx", text: "}" },
];

<DiffView hunks={hunks} filename="src/format-quota.ts" />`}
      >
        <div className="w-full max-w-2xl">
          <DiffView hunks={DIFF_SAMPLE} filename="src/format-quota.ts" />
        </div>
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

      <H2>DiffView 属性</H2>
      <PropsTable
        rows={[
          { name: "hunks", type: 'Array<{ type: "add" | "del" | "ctx", text: string }>', desc: "逐行变更数据" },
          { name: "filename", type: "string", default: "-", desc: "顶部文件名与增删行数, 省略时不出表头" },
        ]}
      />
    </>
  );
}
