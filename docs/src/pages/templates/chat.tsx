import type { JSX } from "react";
import { useState } from "react";
import {
  ALIGN, Bubble, Button, Message, MessageContent, MessageScroller, MessageScrollerButton,
  MessageScrollerContent, MessageScrollerItem, StreamingMarkdown, TASK_STATUS, Textarea,
  Trace, TraceStep, UI_CLASSES, VARIANT,
} from "@hx/ui";
import { H2, P, Preview } from "../../components/DocKit";
import { ApplySteps, TemplateFiles, TemplateFrame } from "../../components/TemplateKit";
import { TEMPLATE_PAGE } from "../../constants/templates";

/** 示例会话: 一条用户消息, 一条流式回答, 一段工具轨迹. */
const USER_TEXT = "把 settings 页的三级布局改成左右两栏, 顺便跑一次类型检查";
const STEPS = [
  { status: TASK_STATUS.done, title: "读取 docs/src/pages/templates/settings.tsx" },
  { status: TASK_STATUS.done, title: "拆分布局为左右两栏" },
  { status: TASK_STATUS.running, title: "npm run typecheck" },
];

const CODE = `import { MessageScroller, StreamingMarkdown, Trace } from "@hx/ui";

export function ChatWorkbench() {
  return (
    <div className="flex h-[calc(100vh-3rem)] flex-col">
      <MessageScroller className="min-h-0 flex-1">
        <MessageScrollerContent>
          <MessageScrollerItem messageId="u1">
            <Message align="end">
              <MessageContent>
                <Bubble variant="primary">把设置页改成左右两栏</Bubble>
              </MessageContent>
            </Message>
          </MessageScrollerItem>
          <MessageScrollerItem messageId="a1">
            <Message>
              <MessageContent>
                <StreamingMarkdown content={answer} streaming={streaming} />
                <Trace>
                  {steps.map((s) => <TraceStep key={s.title} status={s.status} title={s.title} />)}
                </Trace>
              </MessageContent>
            </Message>
          </MessageScrollerItem>
        </MessageScrollerContent>
        <MessageScrollerButton />
      </MessageScroller>
      <div className="border-t border-border p-2">
        <Textarea placeholder="继续追问..." />
      </div>
    </div>
  );
}`;

const ANSWER = `## 已完成的改动

- 把 \`SettingsTemplate\` 的三级布局收成两栏
- 侧栏保留分组标题, 内容区按卡片堆叠

| 区域 | 改动 |
| --- | --- |
| 左栏 | 分组标题 + 条目 |
| 右栏 | 表单卡片 |

\`\`\`ts
export const layout = "two-column" as const;
\`\`\``;

/**
 * AI 对话工作台模板.
 *
 * 这一页不是组件文档, 是一份**能直接搬走的整页骨架**: 左侧会话流 (含流式回答与
 * 工具轨迹) 加底部输入框. 组件页讲单个 API, 模板页讲它们怎么拼在一起.
 */
export function TemplateChatPage(): JSX.Element {
  const [draft, setDraft] = useState("");
  return (
    <>
      <P>整页骨架: 会话流贴底跟随, 回答用流式 Markdown 渲染 (代码块与表格在流式中途就能正确显示), 工具调用轨迹默认展开进行中的那一步, 底部输入框常驻。</P>
      <ApplySteps steps={[
        "安装 @hx/ui, 并在入口引一次 @hx/ui/styles.css 与 markstream-react/index.css",
        "把下面这段复制进 src/pages/ChatWorkbench.tsx, 按你的数据源替换 messages 与 steps",
        "路由里挂上它, 外层给一个固定高度 (侧栏/顶栏之外剩下的空间)",
      ]} />
      <H2>整页预览</H2>
      <TemplateFrame>
        <div className="flex h-full flex-col">
          <div className="min-h-0 flex-1">
            <MessageScroller className="h-full">
              <MessageScrollerContent>
                <MessageScrollerItem messageId="u1">
                  <Message align={ALIGN.end}>
                    <MessageContent>
                      <Bubble variant={VARIANT.primary} align={ALIGN.end}>{USER_TEXT}</Bubble>
                    </MessageContent>
                  </Message>
                </MessageScrollerItem>
                <MessageScrollerItem messageId="a1">
                  <MessageContent>
                    <StreamingMarkdown content={ANSWER} streaming={false} />
                    <Trace className="mt-2">
                      {STEPS.map((step) => (
                        <TraceStep key={step.title} status={step.status} title={step.title} />
                      ))}
                    </Trace>
                  </MessageContent>
                </MessageScrollerItem>
              </MessageScrollerContent>
              <MessageScrollerButton />
            </MessageScroller>
          </div>
          <div className="flex items-end gap-2 border-t border-border p-2">
            <Textarea value={draft} onChange={(event) => setDraft(event.target.value)} placeholder="继续追问..." className="min-h-9 flex-1" />
            <Button size={VARIANT.sm} variant={VARIANT.primary}>发送</Button>
          </div>
        </div>
      </TemplateFrame>
      <H2>完整代码</H2>
      <TemplateFiles files={["src/pages/ChatWorkbench.tsx"]} />
      <Preview code={CODE} lang={TEMPLATE_PAGE.lang}>
        <div className={UI_CLASSES.mutedHalf}>上面就是这一页的完整结构, 复制即用。</div>
      </Preview>
    </>
  );
}
