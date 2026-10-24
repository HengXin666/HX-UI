import { useEffect, useState, type JSX } from "react";
import { GlobeIcon, TerminalIcon } from "lucide-react";
import {
  Button, DOC, TASK_STATUS, Trace, TraceLive, TraceSources, TraceStep, VARIANT,
  type TraceLiveItem, type TraceStatus,
} from "@hx/ui";
import { Callout, H2, P, Preview } from "../../components/DocKit";
import { Props, Usage } from "../../components/DocSpec";
import { useLiveTrace } from "../agent/use-live-trace";

/** 预先规划好的步骤: 开始就知道全部有几步. */
const PLANNED_STEPS: readonly string[] = [
  "读取仓库 AGENTS.md",
  "搜索 shadcn 组件清单",
  "生成组件与文档页",
  "运行质量门禁",
];

/** 播放时的换步间隔 (ms): 比进场动画长, 每一步的状态切换都看得清. */
const STEP_INTERVAL = 900;

/**
 * 播放位置: cursor 是"已经开始的步数", 前 cursor-1 步已完成, 第 cursor 步进行中, 其余等待.
 * 走完最后一步后停止播放, 不自动回到开头.
 */
function useStepPlayback(total: number): { cursor: number; playing: boolean; play: () => void } {
  const [cursor, setCursor] = useState(0);
  const [playing, setPlaying] = useState(false);
  useEffect(() => {
    if (!playing) {
      return undefined;
    }
    const timer = window.setInterval(() => {
      setCursor((value) => {
        const next = value + 1;
        if (next >= total) {
          setPlaying(false);
        }
        return next;
      });
    }, STEP_INTERVAL);
    return () => window.clearInterval(timer);
  }, [playing, total]);
  const play = (): void => {
    setCursor(0);
    setPlaying(true);
  };
  return { cursor, playing, play };
}

const PLANNED_CODE = `<Trace>
  <TraceStep status="done" title="读取仓库 AGENTS.md" />
  <TraceStep status="running" title="搜索 shadcn 组件清单" description="已完成 31 / 42">
    <pre>...</pre>
  </TraceStep>
  <TraceStep status="pending" title="生成组件与文档页" />
  <TraceStep status="pending" title="运行质量门禁" />
</Trace>`;

const LIVE_CODE = `// 步骤由运行时逐条追加: 前一步置 done, 新一步 running
const [items, setItems] = useState<TraceLiveItem[]>([]);

useEffect(() => {
  const es = new EventSource("/api/agent/trace");
  es.onmessage = (event) => {
    const step = JSON.parse(event.data) as TraceLiveItem;
    setItems((prev) => [
      ...prev.map((item) => ({ ...item, status: "done" })),
      { ...step, status: "running" },
    ]);
  };
  return () => es.close();
}, []);

<TraceLive items={items} streaming={!done} />`;

/**
 * 轨迹页: 预先规划的步骤与实时生成的步骤各一个示例.
 *
 * 两种用法的差别不在样式, 而在"谁知道下一步": 规划态开始就列全, 实时态一条条到达.
 * 组件层面用 Trace 与 TraceLive 区分, 于是调用方不需要自己拼"最后一步要不要展开".
 */
/**
 * .agents/notes/implemented/feature/2026-10-22-streaming-markdown-markstream.md
 */
export function TracePage(): JSX.Element {
  const [failed, setFailed] = useState(false);
  const { cursor, playing, play } = useStepPlayback(PLANNED_STEPS.length);
  const live = useLiveTrace();
  /** 已经走过的步全部 done, 当前这一步 running (失败态时 error), 其余等待. */
  const statusOf = (index: number): TraceStatus => {
    if (cursor >= PLANNED_STEPS.length || index < cursor - 1) {
      return TASK_STATUS.done;
    }
    if (index === cursor - 1) {
      return failed ? TASK_STATUS.error : TASK_STATUS.running;
    }
    return TASK_STATUS.pending;
  };

  return (
    <>
      <P>
        推理 / 工具调用轨迹: 一条竖向时间线, 每步有状态图标, 标题, 说明与可折叠详情 (工具入参与输出, 思考过程, 引用来源).
        步骤逐条错开进场, 连接线随状态生长 (完成填满, 进行中填一半并呼吸), 运行中的标题带扫光, 状态切换时图标缩放进场.
        系统要求减弱动效时这些动画全部停用, 状态仍然可读.
      </P>
      <Usage names={["Trace", "TraceStep", "TraceSources", "TraceLive", "type TraceLiveItem"]} />

      <H2>一, 预先规划的步骤</H2>
      <P>
        开始就知道有几步: 直接列出 TraceStep, 用 status 表达 "等待 / 进行中 / 完成 / 失败".
        适合部署流程, 表单提交这类步骤固定的场景. 点播放看逐步推进.
      </P>
      <Preview code={PLANNED_CODE}>
        <div className={DOC.stackMd}>
          <Trace>
            {PLANNED_STEPS.map((title, index) => {
              const status = statusOf(index);
              return (
                <TraceStep key={title} status={status} title={title}>
                  {status === TASK_STATUS.running || status === TASK_STATUS.error ? (
                    <pre className="font-mono text-[11.5px] whitespace-pre-wrap">{"src/primitives/sheet.tsx\nsrc/primitives/command.tsx"}</pre>
                  ) : null}
                </TraceStep>
              );
            })}
            <TraceStep status={TASK_STATUS.done} icon={<GlobeIcon />} title="引用来源" description="2 个网页">
              <TraceSources>
                <li><a href="https://ui.shadcn.com/docs/components" target={DOC.newTab} rel="noreferrer">ui.shadcn.com/docs/components</a></li>
                <li><a href="https://github.com/HengXin666/HX-UI" target={DOC.newTab} rel="noreferrer">github.com/HengXin666/HX-UI</a></li>
              </TraceSources>
            </TraceStep>
            <TraceStep icon={<TerminalIcon />} title="npm run typecheck" description="退出码 0" />
          </Trace>
          <div className={DOC.wrap}>
            <Button size={VARIANT.sm} variant={VARIANT.primary} onClick={play} disabled={playing}>
              {playing ? "播放中" : "播放轨迹"}
            </Button>
            <Button size={VARIANT.sm} onClick={() => setFailed((value) => !value)} disabled={cursor === 0}>
              {failed ? "恢复运行中" : "模拟失败"}
            </Button>
          </div>
        </div>
      </Preview>

      <H2>二, 实时生成的步骤</H2>
      <P>
        步骤由 Agent 运行时决定, 调用一次工具才知道下一步是什么: 用 TraceLive 把已到达的步骤喂进去.
        它与规划态的三点差别是 <strong>完成即自动收起</strong>, <strong>最后一步自动展开</strong>, 以及
        streaming 为 true 时末尾挂一条 "仍在生成" 的占位行 -- 轨迹会越来越长, 全程展开会把正在跑的那一步挤出视口.
      </P>
      <Preview code={LIVE_CODE}>
        <div className={DOC.stackMd}>
          <TraceLive items={live.items} streaming={live.streaming} />
          {live.items.length === 0 && <P>点 "开始生成" 看步骤一条条到达</P>}
          <div className={DOC.wrap}>
            <Button size={VARIANT.sm} variant={VARIANT.primary} onClick={live.start}>
              开始生成
            </Button>
            <Button size={VARIANT.sm} variant={VARIANT.ghost} onClick={live.reset} disabled={live.items.length === 0}>
              重置
            </Button>
          </div>
        </div>
      </Preview>

      <H2>属性</H2>
      <P>Trace / TraceStep</P>
      <Props spec={[
        "TraceStep.status ~ \"pending\" | \"running\" | \"done\" | \"error\" ~ \"done\" ~ 状态图标与默认展开",
        "TraceStep.title / description ~ ReactNode ~ - ~ 标题与说明",
        "TraceStep.icon ~ ReactNode ~ - ~ 覆盖默认状态图标 (例如工具自己的图标)",
        "TraceStep.defaultOpen ~ boolean ~ - ~ 覆盖默认展开规则",
        "TraceStep.collapseWhenDone ~ boolean ~ false ~ 完成后自动收起 (实时态用)",
      ].join(DOC.newline)} />
      <P>TraceLive</P>
      <Props spec={[
        "items ~ readonly TraceLiveItem[] ~ - ~ 已到达的步骤, 按到达顺序",
        "items[].id ~ string ~ - ~ 稳定 key",
        "items[].status ~ 同 TraceStep.status ~ \"done\" ~ 省略时按已完成处理",
        "streaming ~ boolean ~ false ~ 末尾显示 \"正在生成下一步\" 占位行",
        "",
      ].join(DOC.newline)} />
      <Callout title="与 Stepper 的区别">
        Stepper 是预先知道全部步骤的流程条; Trace 是 Agent 运行时逐步推进的轨迹, TraceLive 是"连有几步都还不知道"的那种.
      </Callout>
    </>
  );
}
