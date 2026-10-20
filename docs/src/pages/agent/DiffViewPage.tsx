import { useState, type JSX } from "react";
import { Button, DiffView, type DiffLine } from "@hx/ui";
import { Code, H2, P, Preview, PropsTable } from "../../components/DocKit";

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

/** DiffView 页 */
export function DiffViewPage(): JSX.Element {
  const [showExtra, setShowExtra] = useState(true);
  const hunks = showExtra ? DIFF_SAMPLE : DIFF_SAMPLE.slice(0, 5);

  return (
    <>
      <P>逐行展示代码变更, 新增行绿底, 删除行红底, 上下文行灰字, 行首带符号</P>

      <H2>DiffView</H2>
      <P>变更数据可以由本地状态驱动, 适合展示 agent 生成的文件修改预览</P>
      <Preview
        align="stretch"
        code={`const [hunks, setHunks] = useState(initialHunks);

<DiffView hunks={hunks} filename="src/format-quota.ts" />`}
      >
        <div className="flex w-full max-w-2xl flex-col gap-3">
          <DiffView hunks={hunks} filename="src/format-quota.ts" />
          <Button variant="outline" size="sm" onClick={() => setShowExtra((value) => !value)}>
            {showExtra ? "收起新增内容" : "展开新增内容"}
          </Button>
        </div>
      </Preview>

      <H2>属性</H2>
      <PropsTable
        rows={[
          { name: "hunks", type: 'Array<{ type: "add" | "del" | "ctx", text: string }>', desc: "逐行变更数据" },
          { name: "filename", type: "string", default: "-", desc: "顶部文件名与增删行数, 省略时不出表头" },
        ]}
      />
      <P>组件源码在 <Code>src/agent/usage-meter.tsx</Code></P>
    </>
  );
}
