import { useState, type JSX } from "react";
import { Button } from "../../../../src/primitives/button";
import { TOOL_CALL_STATUS, ToolCallCard, type ToolCallStatus } from "@hx/ui";
import { H2, P, Preview, PropsTable } from "../../components/DocKit";

interface Sample {
  name: string;
  args: unknown;
  result?: unknown;
  durationMs: number;
  initialStatus: ToolCallStatus;
}

const SAMPLES: readonly Sample[] = [
  {
    name: "read_file",
    args: { path: "src/agent/tool-call-card.tsx", offset: 1, limit: 80 },
    durationMs: 320,
    initialStatus: TOOL_CALL_STATUS.running,
  },
  {
    name: "search_docs",
    args: { query: "tool call card", limit: 3 },
    result: {
      total: 3,
      hits: [
        { path: "src/agent/tool-call-card.tsx", line: 1 },
        { path: "docs/src/pages/agent/ToolCallCardPage.tsx", line: 1 },
        { path: "src/chat/trace.tsx", line: 30 },
      ],
    },
    durationMs: 86,
    initialStatus: TOOL_CALL_STATUS.ok,
  },
  {
    name: "run_command",
    args: { command: "npm run build" },
    result: "Command failed with exit code 1, see logs for details",
    durationMs: 1530,
    initialStatus: TOOL_CALL_STATUS.error,
  },
];

const NEXT_STATUS: Record<ToolCallStatus, ToolCallStatus> = {
  [TOOL_CALL_STATUS.running]: TOOL_CALL_STATUS.ok,
  [TOOL_CALL_STATUS.ok]: TOOL_CALL_STATUS.error,
  [TOOL_CALL_STATUS.error]: TOOL_CALL_STATUS.running,
};

const SAMPLE_CODE = `const [status, setStatus] = useState("running");

<ToolCallCard
  name="read_file"
  args={{ path: "src/agent/tool-call-card.tsx" }}
  status={status}
  durationMs={86}
  defaultOpen
/>`;

function DemoCard({ sample }: { sample: Sample }): JSX.Element {
  const [status, setStatus] = useState<ToolCallStatus>(sample.initialStatus);
  return (
    <div className="flex min-w-0 flex-col gap-2">
      <ToolCallCard
        name={sample.name}
        args={sample.args}
        result={sample.result}
        status={status}
        durationMs={sample.durationMs}
        defaultOpen={sample.initialStatus === TOOL_CALL_STATUS.error}
      />
      <Button
        type="button"
        size="xs"
        variant="outline"
        className="self-start"
        onClick={() => setStatus(NEXT_STATUS[status])}
      >
        切换状态
      </Button>
    </div>
  );
}

export function ToolCallCardPage(): JSX.Element {
  return (
    <>
      <P>工具调用卡把一次工具调用收成一行, 展开后分成入参与出参两段, error 态用红色边框并直接显示错误文本</P>
      <H2>三种状态</H2>
      <P>三个实例分别从运行中, 成功与失败开始, 点击切换状态按钮会改变真实 state</P>
      <Preview align="stretch" code={SAMPLE_CODE}>
        <div className="grid w-full gap-3 md:grid-cols-3">
          {SAMPLES.map((sample) => (
            <DemoCard key={sample.name} sample={sample} />
          ))}
        </div>
      </Preview>
      <H2>属性</H2>
      <PropsTable
        rows={[
          { name: "name", type: "string", desc: "工具名, 显示在头部" },
          { name: "args", type: "unknown", desc: "入参, 展开后按格式化 JSON 显示" },
          { name: "result", type: "unknown", desc: "出参, 字符串按文本显示, 其它值按 JSON 显示" },
          { name: "status", type: '"running" | "ok" | "error"', desc: "运行中, 成功或失败" },
          { name: "durationMs", type: "number", desc: "耗时, 毫秒, 大于等于 1000 时按秒显示" },
          { name: "defaultOpen", type: "boolean", default: "false", desc: "首次渲染是否展开" },
        ]}
      />
    </>
  );
}
