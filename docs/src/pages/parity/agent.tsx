import { useEffect, useRef, useState, type JSX } from "react";
import { ALIGN, Bubble, Button, DOC, DOC_SAMPLE, Marker, MarkerContent, Message, MessageContent, MessageScroller, MessageScrollerButton, MessageScrollerContent, MessageScrollerItem, QUESTION_TYPE, Questionnaire, TONE_VARIANT, VARIANT, toast, type QuestionnaireQuestion } from "@hx/ui";
import { H2, P, Preview } from "../../components/DocKit";
import { Props, Usage } from "../../components/DocSpec";

/** 会话组合件文档页 (二): MessageScroller 与 Questionnaire. 轨迹页另见 pages/agent/TracePage. */
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
      <P>会话滚动容器. 打开时直接定位到底部; 停在底部时新消息与流式内容自动跟随; 用户往上翻时不跟随并出现 "回到最新"; 在顶部插入历史消息时保持当前可见内容不跳动. 滚轮, 触摸, 按键与拖动滚动条都会取消程序化滚动; scrollToItem 是一次性定位, 不会重新打开贴底跟随.</P>
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
              <Marker variant={TONE_VARIANT.separator}><MarkerContent>会话开始</MarkerContent></Marker>
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
      <P>多步问卷: 一次一题, 顶部进度条; 单选点选即前进 (最后一题只选中, 由 "提交" 按钮提交, onSubmit 只调用一次), 多选与文本题按 "下一步" 前进, skippable 的题可跳过. 切题时按方向左右滑入 (motion), 系统要求减弱动效时只淡入淡出. 数字键 1 到 9 选择对应选项.</P>
      <Usage names={["Questionnaire", "type QuestionnaireQuestion", "type QuestionnaireAnswers"]} deps={["motion"]} />
      <H2>示例</H2>
      <Preview code={`const QUESTIONS = [
  {
    id: "scope",
    title: "这次要覆盖哪些组件?",
    type: "single",
    choices: [
      { value: "every", label: "全部", description: "shadcn 清单里的每一个" },
      { value: "missing", label: "只补缺的" },
    ],
  },
  {
    id: "motion",
    title: "需要哪些动效?",
    description: "可多选",
    type: "multiple",
    choices: [
      { value: "enter", label: "弹层进出场" },
      { value: "ripple", label: "点按水波纹" },
      { value: "layout", label: "布局过渡" },
    ],
  },
  { id: "note", title: "还有什么要补充的?", type: "freeform", skippable: true, placeholder: "可以跳过" },
];

<Questionnaire
  className="max-w-md"
  questions={QUESTIONS}
  onSubmit={(answers) => toast.success("已提交: " + JSON.stringify(answers))}
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

