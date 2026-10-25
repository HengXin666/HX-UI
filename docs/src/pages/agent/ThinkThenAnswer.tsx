import { useEffect, useRef, useState, type JSX } from "react";
import { AGENT_NEWLINE, Button, DOC, StreamingMarkdown, THINK_DEMO, TODO_STATUS, Thinking, VARIANT } from "@hx/ui";
import { STREAMING_MARKDOWN_SAMPLE } from "./streaming-markdown-sample";
import { useTypewriter } from "./use-typewriter";

const NL = AGENT_NEWLINE;

/** 演示用的思考原文: 粗体行是小节标题, Thinking 会把最新一节提成摘要. */
const THOUGHT = [
  "**理解问题**",
  "要一段带表格和代码块的说明, 读者边读边等后半段.",
  "",
  "**规划结构**",
  "先给结论, 再列步骤, 最后附代码.",
  "",
  "**检查边界**",
  "围栏未闭合时也按块渲染, 不能闪烁.",
].join(NL);

/** 发出请求到首个思考 token 的空窗: 这段时间里也要让读者看到"在想". */
const { firstTokenDelayMs: FIRST_TOKEN_DELAY, phase: PHASE } = THINK_DEMO;

type Phase = (typeof PHASE)[keyof typeof PHASE];

export const THINK_THEN_ANSWER_CODE = [
  'const thinking = phase === "waiting" || phase === "thinking";',
  "",
  "<Thinking",
  "  content={reasoning}",
  '  status={thinking ? "running" : "done"}',
  "  startedAt={sentAt}",
  "  endedAt={firstAnswerTokenAt}",
  "/>",
  "{answer && <StreamingMarkdown content={answer} streaming={!final} />}",
].join(NL);

/**
 * 先思考, 再回复: 请求发出即进入思考态 (空内容也显示计时),
 * 思考流结束后定格耗时并收起, 回复以流式 Markdown 接上.
 */
export function ThinkThenAnswer(): JSX.Element {
  const thought = useTypewriter(THOUGHT);
  const answer = useTypewriter(STREAMING_MARKDOWN_SAMPLE);
  const [phase, setPhase] = useState<Phase>(PHASE.idle);
  const [startedAt, setStartedAt] = useState<number | undefined>(undefined);
  const [endedAt, setEndedAt] = useState<number | undefined>(undefined);
  const timer = useRef<number | undefined>(undefined);
  const startAnswer = answer.start;

  useEffect(() => () => window.clearTimeout(timer.current), []);

  useEffect(() => {
    if (phase !== PHASE.thinking || thought.streaming || thought.text.length < THOUGHT.length) {
      return;
    }
    setEndedAt(Date.now());
    setPhase(PHASE.answering);
    startAnswer();
  }, [phase, thought.streaming, thought.text.length, startAnswer]);

  useEffect(() => {
    if (phase === PHASE.answering && answer.text.length >= STREAMING_MARKDOWN_SAMPLE.length) {
      setPhase(PHASE.done);
    }
  }, [phase, answer.text.length]);

  const reset = (): void => {
    window.clearTimeout(timer.current);
    thought.reset();
    answer.reset();
    setStartedAt(undefined);
    setEndedAt(undefined);
    setPhase(PHASE.idle);
  };

  const start = (): void => {
    reset();
    setStartedAt(Date.now());
    setPhase(PHASE.waiting);
    timer.current = window.setTimeout(() => {
      setPhase(PHASE.thinking);
      thought.start();
    }, FIRST_TOKEN_DELAY);
  };

  const thinking = phase === PHASE.waiting || phase === PHASE.thinking;
  const answering = phase === PHASE.answering || phase === PHASE.done;

  return (
    <div className={DOC.stackMd}>
      <div className="flex min-h-40 w-full flex-col gap-3 overflow-x-auto rounded-xl border border-border/60 bg-card/40 p-3.5">
        {phase === PHASE.idle ? (
          <span className="text-[13px] text-muted-foreground">点开始: 先出现思考与计时, 再接上流式回复</span>
        ) : (
          <>
            <Thinking content={thought.text} status={thinking ? TODO_STATUS.running : TODO_STATUS.done} startedAt={startedAt} endedAt={endedAt} />
            {answering && <StreamingMarkdown content={answer.text} streaming={phase === PHASE.answering} customId="docs-think-then-answer" />}
          </>
        )}
      </div>
      <div className={DOC.wrap}>
        <Button size={VARIANT.sm} variant={VARIANT.primary} onClick={start} disabled={thinking || phase === PHASE.answering}>
          开始
        </Button>
        <Button size={VARIANT.sm} variant={VARIANT.ghost} onClick={reset}>
          重置
        </Button>
      </div>
    </div>
  );
}
