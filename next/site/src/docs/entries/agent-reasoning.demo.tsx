import * as React from "react";
import { Reasoning } from "@/agent";
import type { DemoProps } from "../types";
import { ReplayBar } from "./agent/replay-bar";
import { useTypewriter } from "./agent/use-replay";

const THOUGHT = `用户问的是**为什么 useEffect 会执行两次**。

1. 先确认是不是开发模式: React 18+ 的 StrictMode 会在开发环境故意挂载 -> 卸载 -> 再挂载一次, 用来暴露没有清理的副作用。
2. 如果是生产环境也执行两次, 那就是依赖数组的问题, 比如每次渲染都新建的对象。

回答时给一个清理函数的例子, 再说明生产环境不会重复。`;

export default function AgentReasoningDemo({ values }: DemoProps) {
  const [playing, setPlaying] = React.useState(true);
  const tw = useTypewriter(THOUGHT, { cps: Number(values.cps), playing });
  const [t] = React.useState(() => ({ start: Date.now() }));
  const [run, setRun] = React.useState(0);
  const start = React.useMemo(() => Date.now(), [run]); // eslint-disable-line react-hooks/exhaustive-deps
  const end = React.useMemo(() => (tw.done ? Date.now() : undefined), [tw.done]);
  return (
    <div className="flex h-full w-full flex-col">
      <ReplayBar playing={playing && !tw.done} done={tw.done} onToggle={() => setPlaying((p) => !p)} onRestart={() => (tw.restart(), setRun((r) => r + 1), setPlaying(true))} progress={tw.text.length / THOUGHT.length} />
      <div className="mx-auto w-full max-w-2xl space-y-4 px-6 py-6">
        <Reasoning key={run} text={tw.text} streaming={!tw.done} startedAt={start} endedAt={end} openWhileStreaming={Boolean(values.open)} />
        <div className="border-t pt-4">
          <div className="mb-1 text-xs text-muted-foreground">已经结束的一段</div>
          <Reasoning text={THOUGHT} startedAt={t.start - 12_400} endedAt={t.start} />
        </div>
      </div>
    </div>
  );
}
