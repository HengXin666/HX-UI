import { useCallback, useRef, useState, type JSX } from "react";
import {
  Stepper, StepContent, StepDots, LogViewer, networkLogLine, Spin, toast,
  Button, Card, Input, Switch, Badge,
  type LogLine, type StepItem, type StepStatus,
} from "@hx/ui";
import { H2, P, Preview, PropsTable, Callout, Code } from "../components/DocKit";

/** 一次连接的步骤。真实场景里它们分别对应 HTTP 探测 → 鉴权 → 建通道 → 握手。 */
const STEPS: readonly StepItem[] = [
  { id: "probe", title: "探测端点", description: "HTTP HEAD" },
  { id: "auth", title: "获取凭据", description: "POST /token" },
  { id: "connect", title: "建立连接", description: "WebSocket" },
  { id: "handshake", title: "握手", description: "subprotocol" },
  { id: "ready", title: "就绪" },
];

/**
 * 联动示例。
 *
 * 这个组件要演示的是「接口怎么设计」而不是「组件长什么样」:
 *   步骤条的状态、日志的内容、提醒的弹出, 三者都由**同一份流程状态**驱动。
 *   流程本身是一个 async 函数, 每推进一步就同时更新步骤与日志 —— 而不是各写各的。
 */
function ConnectionFlow(): JSX.Element {
  const [current, setCurrent] = useState(-1);
  const [statuses, setStatuses] = useState<Record<string, StepStatus>>({});
  const [lines, setLines] = useState<LogLine[]>([]);
  const [running, setRunning] = useState(false);
  // 用来在演示中途取消 —— 真实场景里对应 AbortController
  const cancelled = useRef(false);

  const log = useCallback((dir: "send" | "recv" | "system", msg: string) => {
    setLines((prev) => [...prev, networkLogLine(dir, msg)]);
  }, []);

  const setStep = useCallback((id: string, status: StepStatus) => {
    setStatuses((prev) => ({ ...prev, [id]: status }));
  }, []);

  const run = useCallback(async () => {
    cancelled.current = false;
    setRunning(true);
    setLines([]);
    setStatuses({});
    setCurrent(-1);
    log("system", "开始连接流程");

    // 步骤与日志在同一处推进 —— 这是关键。分开写迟早会不同步。
    const steps: Array<{ id: string; run: () => Promise<void> }> = [
      {
        id: "probe",
        run: async () => {
          log("send", "HEAD /api/health");
          await new Promise((r) => setTimeout(r, 500));
          log("recv", "200 OK · 43ms");
        },
      },
      {
        id: "auth",
        run: async () => {
          log("send", 'POST /api/token {"grant":"ws"}');
          await new Promise((r) => setTimeout(r, 650));
          log("recv", "201 · token expires in 3600s");
        },
      },
      {
        id: "connect",
        run: async () => {
          log("send", "CONNECT wss://app.example.com/stream");
          await new Promise((r) => setTimeout(r, 700));
          log("recv", "101 Switching Protocols");
        },
      },
      {
        id: "handshake",
        run: async () => {
          log("send", 'SEC-WEBSOCKET-PROTOCOL: vetta.v1');
          await new Promise((r) => setTimeout(r, 450));
          log("recv", "subprotocol accepted");
        },
      },
      {
        id: "ready",
        run: async () => {
          log("system", "通道就绪, 开始接收消息");
          await new Promise((r) => setTimeout(r, 300));
          log("recv", '{"type":"hello","session":"s_8f2a"}');
        },
      },
    ];

    for (let i = 0; i < steps.length; i++) {
      if (cancelled.current) {
        log("system", "已取消");
        setStep(steps[i].id, "error");
        toast.warning("连接已取消");
        setRunning(false);
        return;
      }
      setCurrent(i);
      setStep(steps[i].id, "active");
      try {
        await steps[i].run();
        setStep(steps[i].id, "done");
      } catch (e) {
        setStep(steps[i].id, "error");
        const msg = e instanceof Error ? e.message : "未知错误";
        log("system", `失败: ${msg}`);
        toast.error(msg, { title: "连接失败", action: { label: "重试", onClick: () => void run() } });
        setRunning(false);
        return;
      }
    }
    setCurrent(steps.length);
    toast.success("连接已建立", { title: "就绪" });
    setRunning(false);
  }, [log, setStep]);

  // 步骤状态由外部传入 —— Stepper 自己不记 current
  const stepsView = STEPS.map((s) => ({ ...s, status: statuses[s.id] }));

  return (
    <div className="flex w-full flex-col gap-5">
      <Stepper steps={stepsView} current={current < 0 ? 0 : Math.min(current, STEPS.length - 1)} />

      <div className="flex items-center gap-2">
        <Button variant="primary" size="sm" onClick={() => void run()} disabled={running}>
          {running ? <><Spin size={14} variant="dotPulse" /> 连接中</> : "开始连接"}
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => { cancelled.current = true; }}
          disabled={!running}
        >
          取消
        </Button>
        {current >= STEPS.length ? <Badge variant="success">已就绪</Badge> : null}
      </div>

      <LogViewer lines={lines} height={240} emptyText="点「开始连接」看日志" />
    </div>
  );
}

/** 失败分支: 第二步抛错, 看步骤条怎么表达。 */
function FailureFlow(): JSX.Element {
  const [statuses, setStatuses] = useState<Record<string, StepStatus>>({});
  const [current, setCurrent] = useState(1);

  const fail = (): void => {
    setStatuses({ probe: "done", auth: "error" });
    setCurrent(1);
    toast.error("token 端点返回 401, 凭据已过期", {
      title: "鉴权失败",
      action: { label: "重新登录", onClick: () => toast.info("跳转登录页") },
    });
  };

  const stepsView = STEPS.map((s, i) => ({ ...s, status: statuses[s.id] ?? (i < 1 ? "done" : undefined) }));
  return (
    <div className="flex w-full flex-col gap-4">
      <Stepper steps={stepsView} current={current} />
      <Button variant="destructive" size="sm" onClick={fail} className="self-start">
        模拟第二步失败
      </Button>
    </div>
  );
}

export function StepperPage(): JSX.Element {
  const [cur, setCur] = useState(1);
  const [curV, setCurV] = useState(1);

  return (
    <>
      <P>
        步骤条与日志框。重点不在两个组件长什么样，而在**它们怎么被同一份流程状态驱动** ——
        真实场景里步骤的推进条件是「HTTP 探测成功」「token 拿到」「WebSocket 101」这些外部事实，
        组件自己记 <Code>current</Code> 的话，这些事实就要再同步一遍，迟早不同步。
      </P>

      <Callout title="交互式联动示例">
        下面这个是真的在跑：点「开始连接」会依次走五步，每一步同时推进步骤条、往日志框写请求与响应、
        并在成功或失败时弹提醒。可以中途点「取消」看步骤条怎么表达失败。
      </Callout>

      <H2>步骤条 + 日志框联动</H2>
      <Preview align="stretch" code={`// 流程本身是一个 async 函数, 每推进一步就同时更新步骤与日志
const steps = [
  { id: "probe",  run: async () => { log("send", "HEAD /api/health"); ... } },
  { id: "auth",   run: async () => { ... } },
  { id: "connect", run: async () => { ... } },
];

for (let i = 0; i < steps.length; i++) {
  setCurrent(i);
  setStep(steps[i].id, "active");
  try {
    await steps[i].run();
    setStep(steps[i].id, "done");
  } catch (e) {
    setStep(steps[i].id, "error");       // 步骤标红
    toast.error(e.message);              // 同时弹提醒
    return;
  }
}

// 步骤状态由外部传入 —— Stepper 自己不记 current
<Stepper steps={steps.map(s => ({ ...s, status: statuses[s.id] }))} current={current} />
<LogViewer lines={lines} height={240} />`}>
        <ConnectionFlow />
      </Preview>

      <H2>失败分支</H2>
      <P>
        某一步失败时把它的状态设成 <Code>error</Code>，步骤条会标红**并且停在那里** ——
        失败必须能一眼看到，否则用户会卡在第二步不知道为什么。已经完成的步骤保持 <Code>done</Code>。
      </P>
      <Preview align="stretch" code={`setStep("auth", "error");   // 这一步标红
toast.error("token 端点返回 401", { title: "鉴权失败" });`}>
        <FailureFlow />
      </Preview>

      <H2>状态由外部控制</H2>
      <P>
        <Code>Stepper</Code> 只收 <Code>steps</Code> 与 <Code>current</Code>，不自己记状态。
        每一步的 <Code>status</Code> 可以显式覆盖（用于「前面失败但后面仍可点」这类场景）。
      </P>
      <Preview
        align="stretch"
        code={`<Stepper steps={steps} current={current} />
<Stepper steps={steps} current={current} onStepClick={(i, s) => go(i)} clickable="done" />`}
      >
        <div className="flex w-full flex-col gap-5">
          <Stepper steps={STEPS} current={cur} />
          <div className="flex gap-2">
            <Button variant="outline" size="xs" onClick={() => setCur(Math.max(0, cur - 1))}>上一步</Button>
            <Button variant="outline" size="xs" onClick={() => setCur(Math.min(STEPS.length, cur + 1))}>下一步</Button>
            <span className="self-center text-[12px] text-muted-foreground">当前 {cur} / {STEPS.length}</span>
          </div>
        </div>
      </Preview>

      <H2>可点击回看</H2>
      <P>
        默认只能点已完成的步骤（<Code>clickable="done"</Code>）。允许往前跳会绕过前置校验，
        那是要显式开启的行为 —— 传 <Code>clickable="all"</Code> 或自定义 <Code>onStepClick</Code>。
      </P>
      <Preview
        align="stretch"
        code={`<Stepper steps={steps} current={cur} clickable="done"
         onStepClick={(i) => setCur(i)} />`}
      >
        <Stepper steps={STEPS} current={cur} clickable="done" onStepClick={(i) => setCur(i)} />
      </Preview>

      <H2>紧凑圆点</H2>
      <P>
        只要「走到哪了」、不需要文字时用 <Code>StepDots</Code>。当前那个是一条短横条，
        用 <Code>layoutId</Code> 在位置之间滑动 —— 两个点各自淡入淡出看不出移动，一个横条滑过去才有方向感。
      </P>
      <Preview
        align="center"
        code={`<StepDots total={5} current={cur} />`}
      >
        <div className="flex flex-col items-center gap-3">
          <StepDots total={5} current={curV} />
          <div className="flex gap-2">
            <Button variant="outline" size="xs" onClick={() => setCurV(Math.max(0, curV - 1))}>上一步</Button>
            <Button variant="outline" size="xs" onClick={() => setCurV(Math.min(4, curV + 1))}>下一步</Button>
          </div>
        </div>
      </Preview>

      <H2>纵向</H2>
      <Preview
        align="stretch"
        code={`<Stepper steps={steps} current={cur} orientation="vertical" />`}
      >
        <Stepper steps={STEPS} current={3} orientation="vertical" className="max-w-sm" />
      </Preview>

      <H2>日志框</H2>
      <P>
        三个它必须解决的问题，也是它与「一个滚动 div」的区别：
        <br />
        <b className="text-foreground">一、自动滚动要「粘底但不锁死」</b>：新行进来时若用户已在底部就跟着滚；
        若用户往上翻了在看历史就**不要动** —— 强行滚动会把正在读的内容顶走。判定留了 24px 容差，
        用等值判会因为亚像素误差在临界点抖动。
        <br />
        <b className="text-foreground">二、等宽对齐与折行</b>：<Code>whitespace-pre-wrap</Code> 保留前导空格做列对齐，
        <Code>break-words</Code> 让长行折行而不是撑出横向滚动条（后者会破坏列对齐的观感）。
        <br />
        <b className="text-foreground">三、级别过滤带计数</b>：出错时第一件事就是「只看 error」，
        过滤后仍要能看出总共出了几条错。
      </P>
      <Preview
        align="stretch"
        code={`<LogViewer lines={lines} height={280} />

// HTTP / WebSocket 场景: 用方向标记区分一来一回
networkLogLine("send", "POST /api/token");
networkLogLine("recv", "201 · token expires in 3600s");
networkLogLine("system", "通道就绪");`}
      >
        <LogViewer
          height={280}
          lines={[
            networkLogLine("system", "开始连接流程"),
            networkLogLine("send", "HEAD /api/health"),
            networkLogLine("recv", "200 OK · 43ms"),
            { id: "a1", level: "debug", time: Date.now(), message: "DNS 解析: app.example.com → 104.18.x.x" },
            networkLogLine("send", 'POST /api/token {"grant":"ws"}'),
            { id: "a2", level: "warn", time: Date.now(), message: "token 将在 300s 后过期, 已安排续期", detail: "exp=1759000000" },
            networkLogLine("recv", "201 · token expires in 3600s"),
            networkLogLine("send", "CONNECT wss://app.example.com/stream"),
            networkLogLine("recv", "101 Switching Protocols"),
            { id: "a3", level: "error", time: Date.now(), message: "心跳超时: 未在 30s 内收到 pong", detail: "code=1006 retry=1" },
            networkLogLine("system", "重连中 (第 1 次)"),
            networkLogLine("recv", '{"type":"hello","session":"s_8f2a"}'),
          ]}
        />
      </Preview>

      <H2>Stepper 属性</H2>
      <PropsTable
        rows={[
          { name: "steps", type: "readonly StepItem[]", default: "-", desc: "步骤定义。每项可带 status 覆盖。" },
          { name: "current", type: "number", default: "-", desc: "当前步骤下标（从 0 开始）。由外部控制。" },
          { name: "onStepClick", type: "(index, step) => void", desc: "传了才让步骤可点。" },
          { name: "clickable", type: '"none" | "done" | "all"', default: '"done"', desc: "可点击范围。默认只能回看已完成。" },
          { name: "orientation", type: '"horizontal" | "vertical"', default: '"horizontal"', desc: "排列方向。" },
          { name: "StepItem.status", type: '"pending" | "active" | "done" | "error"', desc: "显式覆盖某一步的状态。" },
        ]}
      />

      <H2>LogViewer 属性</H2>
      <PropsTable
        rows={[
          { name: "lines", type: "readonly LogLine[]", default: "-", desc: "日志行。组件不自己订阅，由使用方提供。" },
          { name: "height", type: "number | string", default: "320", desc: "最大高度。用 max-h 而不是固定高，行数少时不留空白。" },
          { name: "showFilter", type: "boolean", default: "true", desc: "是否显示级别过滤条。" },
          { name: "showTime", type: "boolean", default: "true", desc: "是否显示时间列。" },
          { name: "LogLine.level", type: '"debug" | "info" | "warn" | "error" | "success"', default: "-", desc: "级别。决定颜色与过滤分组。" },
          { name: "LogLine.detail", type: "string", desc: "附加内容，展开显示在正文下方。" },
        ]}
      />
    </>
  );
}
