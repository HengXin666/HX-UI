import { useCallback, useEffect, useRef, useState } from "react";
import { TASK_STATUS, type TraceLiveItem } from "@hx/ui";

/** 实时轨迹的示例步骤: 由"运行时"逐条决定, 不是一开始就全部知道. */
const LIVE_STEPS: readonly { title: string; description?: string; detail?: string }[] = [
  { title: "读取仓库结构", description: "扫描 512 个文件", detail: "src/**: 512 files" },
  { title: "定位要改的组件", description: "命中文档站 3 处", detail: "docs/src/nav.ts\ndocs/src/App.tsx" },
  { title: "生成文档页", description: "新增 4 个模板页", detail: "templates/{chat,settings,dashboard,console}.tsx" },
  { title: "运行类型检查", description: "tsc --noEmit", detail: "退出码 0" },
];

const TICK_MS = 800;

/**
 * 模拟"步骤一条条到达"的运行时.
 *
 * 真实场景里这一步是 SSE/WS 推过来的事件; 这里用定时器把它变成可点的示例,
 * 但状态机与真实一致: 新的一步进来时上一步置 done, 最后一步 keep running,
 * 全部走完后 streaming 变 false (轨迹不再显示"仍在生成").
 */
export function useLiveTrace(): {
  readonly items: readonly TraceLiveItem[];
  readonly streaming: boolean;
  readonly start: () => void;
  readonly reset: () => void;
} {
  const [items, setItems] = useState<readonly TraceLiveItem[]>([]);
  const [streaming, setStreaming] = useState(false);
  const timer = useRef<number | undefined>(undefined);
  const run = useRef(0);

  const stop = useCallback(() => {
    window.clearInterval(timer.current);
    timer.current = undefined;
  }, []);

  useEffect(() => () => stop(), [stop]);

  const start = useCallback(() => {
    stop();
    run.current += 1;
    const id = run.current;
    setItems([{
      id: "live-0",
      title: LIVE_STEPS[0].title,
      status: TASK_STATUS.running,
      ...(LIVE_STEPS[0].description ? { description: LIVE_STEPS[0].description } : {}),
      detail: LIVE_STEPS[0].detail,
    }]);
    setStreaming(true);
    let index = 0;
    timer.current = window.setInterval(() => {
      if (id !== run.current) {
        return;
      }
      index += 1;
      if (index >= LIVE_STEPS.length) {
        stop();
        setStreaming(false);
        setItems((prev) => prev.map((item, i) => (i === prev.length - 1 ? { ...item, status: TASK_STATUS.done } : item)));
        return;
      }
      const step = LIVE_STEPS[index];
      setItems((prev) => [
        ...prev.map((item) => ({ ...item, status: TASK_STATUS.done })),
        {
          id: "live-" + index,
          title: step.title,
          status: TASK_STATUS.running,
          ...(step.description ? { description: step.description } : {}),
          detail: step.detail,
        },
      ]);
    }, TICK_MS);
  }, [stop]);

  const reset = useCallback(() => {
    stop();
    run.current += 1;
    setItems([]);
    setStreaming(false);
  }, [stop]);

  return { items, streaming, start, reset };
}
