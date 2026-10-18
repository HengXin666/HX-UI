import { useEffect, useRef, useState, type JSX } from "react";
import { GlobeIcon, TerminalIcon } from "lucide-react";
import { ALIGN, Bubble, Button, DOC, DOC_SAMPLE, Marker, MarkerContent, Message, MessageContent, MessageScroller, MessageScrollerButton, MessageScrollerContent, MessageScrollerItem, QUESTION_TYPE, Questionnaire, TASK_STATUS, Trace, TraceSources, TraceStep, VARIANT, toast, type QuestionnaireQuestion, type TraceStatus } from "@hx/ui";
import { Callout, H2, P, Preview } from "../../components/DocKit";
import { Props, Usage } from "../../components/DocSpec";

/** 会话组合件文档页 (二): MessageScroller, Questionnaire, Trace. */
const STREAM_TEXT = "贴底跟随: 停在底部时, 流式增长的内容会把视口一直带到底; 往上翻看历史时不再跟随, 并出现回到最新按钮.";

export function MessageScrollerPage(): JSX.Element {
  const [turns, setTurns] = useState(() => Array.from({ length: DOC_SAMPLE.turns }, (_, index) => `第 ${index + 1} 条历史消息`));
  const [stream, setStream] = useState("");
  const timer = useRef<number | undefined>(undefined);
  useEffect(() => () => window.clearInterval(timer.current), []);
  const play = (): void => {
    window.clearInterval(timer.current);
    setStream("");
    let index = 0;
    timer.current = window.setInterval(() => {
      index += DOC_SAMPLE.streamStep;
      setStream(STREAM_TEXT.slice(0, index));
      if (index >= STREAM_TEXT.length) window.clearInterval(timer.current);
    }, DOC_SAMPLE.streamInterval);
  };
  return (
    <>
      <P>会话滚动容器. 打开时直接定位到底部; 停在底部时新消息与流式内容自动跟随; 用户往上翻时不跟随并出现 "回到最新"; 在顶部插入历史消息时保持当前可见内容不跳动.</P>
      <Usage names={["MessageScroller", "MessageScrollerContent", "MessageScrollerItem", "MessageScrollerButton", "useMessageScroller"]} />
      <H2>示例</H2>
      <Preview code={`<MessageScroller className="h-72">
  <MessageScrollerContent>
    {messages.map((m) => (
      <MessageScrollerItem key={m.id} messageId={m.id}>...</MessageScrollerItem>
    ))}
  </MessageScrollerContent>
  <MessageScrollerButton />
</MessageScroller>`}>
        <div className={DOC.stack}>
          <div className={DOC.wrap}>
            <Button size={VARIANT.sm} onClick={() => setTurns((list) => [...list, `新消息 ${list.length + 1}`])}>追加一条</Button>
            <Button size={VARIANT.sm} onClick={() => setTurns((list) => [`更早的消息 ${list.length + 1}`, ...list])}>加载历史</Button>
            <Button size={VARIANT.sm} variant={VARIANT.primary} onClick={play}>模拟流式回复</Button>
          </div>
          <MessageScroller className="h-72 rounded-xl border border-border">
            <MessageScrollerContent>
              <Marker variant="separator"><MarkerContent>会话开始</MarkerContent></Marker>
              {turns.map((text, index) => (
                <MessageScrollerItem key={text} messageId={text}>
                  <Message align={index & 1 ? ALIGN.end : ALIGN.start}>
                    <MessageContent>
                      <Bubble variant={index & 1 ? VARIANT.primary : VARIANT.default} align={index & 1 ? ALIGN.end : ALIGN.start}>{text}</Bubble>
                    </MessageContent>
                  </Message>
                </MessageScrollerItem>
              ))}
              {stream && (
                <Message>
                  <MessageContent>
                    <Bubble>{stream}</Bubble>
                  </MessageContent>
                </Message>
              )}
            </MessageScrollerContent>
            <MessageScrollerButton />
          </MessageScroller>
        </div>
      </Preview>
    </>
  );
}

const QUESTIONS: readonly QuestionnaireQuestion[] = [
  {
    id: "scope",
    title: "这次要覆盖哪些组件?",
    type: QUESTION_TYPE.single,
    choices: [
      { value: "every", label: "全部", description: "shadcn 清单里的每一个" },
      { value: "missing", label: "只补缺的" },
    ],
  },
  {
    id: "motion",
    title: "需要哪些动效?",
    description: "可多选",
    type: QUESTION_TYPE.multiple,
    choices: [
      { value: "enter", label: "弹层进出场" },
      { value: "ripple", label: "点按水波纹" },
      { value: "layout", label: "布局过渡" },
    ],
  },
  { id: "note", title: "还有什么要补充的?", type: QUESTION_TYPE.freeform, skippable: true, placeholder: "可以跳过" },
];

export function QuestionnairePage(): JSX.Element {
  return (
    <>
      <P>多步问卷: 一次一题, 顶部进度条; 单选点选即前进, 多选与文本题按 "下一步" 前进, skippable 的题可跳过. 切题时按方向左右滑入 (motion), 系统要求减弱动效时只淡入淡出. 数字键 1 到 9 选择对应选项.</P>
      <Usage names={["Questionnaire", "type QuestionnaireQuestion", "type QuestionnaireAnswers"]} deps={["motion"]} />
      <H2>示例</H2>
      <Preview code={`<Questionnaire
  questions={[
    { id: "scope", title: "这次要覆盖哪些组件?", type: "single", choices: [...] },
    { id: "motion", title: "需要哪些动效?", type: "multiple", choices: [...] },
    { id: "note", title: "还有什么要补充的?", type: QUESTION_TYPE.freeform, skippable: true },
  ]}
  onSubmit={(answers) => console.log(answers)}
/>`}>
        <Questionnaire className="max-w-md" questions={QUESTIONS} onSubmit={(answers) => toast.success(`已提交: ${JSON.stringify(answers)}`)} />
      </Preview>
      <H2>属性</H2>
      <Props spec={`
questions ~ QuestionnaireQuestion[] ~ - ~ id, title, description, type, choices, skippable, placeholder
defaultAnswers ~ QuestionnaireAnswers ~ - ~ 初始答案
onSubmit ~ (answers) => void ~ - ~ 最后一题提交
labels ~ Partial<QuestionnaireLabels> ~ - ~ 覆盖按钮与进度文案
`} />
    </>
  );
}

const STEPS: ReadonlyArray<{ title: string; status: TraceStatus }> = [
  { title: "读取仓库 AGENTS.md", status: TASK_STATUS.done },
  { title: "搜索 shadcn 组件清单", status: TASK_STATUS.done },
  { title: "生成组件与文档页", status: TASK_STATUS.running },
  { title: "运行质量门禁", status: "pending" },
];

export function TracePage(): JSX.Element {
  const [failed, setFailed] = useState(false);
  return (
    <>
      <P>推理 / 工具调用轨迹: 一条竖向时间线, 每步有状态图标, 标题, 说明与可折叠详情 (工具入参与输出, 思考过程, 引用来源). 运行中的标题带扫光, 状态切换时图标缩放进场; 默认展开进行中与失败的步骤.</P>
      <Usage names={["Trace", "TraceStep", "TraceSources"]} />
      <H2>示例</H2>
      <Preview code={`<Trace>
  <TraceStep status="done" title="读取仓库 AGENTS.md" />
  <TraceStep status="running" title="生成组件与文档页" description="已完成 31 / 42">
    <pre>...</pre>
  </TraceStep>
  <TraceStep status="pending" title="运行质量门禁" />
</Trace>`}>
        <div className={DOC.stackMd}>
          <Trace>
            {STEPS.map((step) => {
              const running = step.status === TASK_STATUS.running;
              return (
              <TraceStep key={step.title} status={failed && running ? TASK_STATUS.error : step.status} title={step.title}>
                {running ? <pre className="font-mono text-[11.5px] whitespace-pre-wrap">{`src/primitives/sheet.tsx\nsrc/primitives/command.tsx`}</pre> : null}
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
          <Button size={VARIANT.sm} className="self-start" onClick={() => setFailed((value) => !value)}>{failed ? "恢复运行中" : "模拟失败"}</Button>
        </div>
      </Preview>
      <H2>属性</H2>
      <Props spec={`
TraceStep.status ~ "pending" | "running" | "done" | "error" ~ "done" ~ 状态图标与默认展开
TraceStep.title / description ~ ReactNode ~ - ~ 标题与说明
TraceStep.icon ~ ReactNode ~ - ~ 覆盖默认状态图标 (例如工具自己的图标)
TraceStep.defaultOpen ~ boolean ~ - ~ 覆盖默认展开规则
`} />
      <Callout title="与 Stepper 的区别">Stepper 是预先知道全部步骤的流程条; Trace 是 Agent 运行时一步步追加的轨迹.</Callout>
    </>
  );
}
