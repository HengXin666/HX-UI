import { AGENT_STREAMING_LABEL } from "@hx/ui";
import type { JSX } from "react";
import { Button, StreamingMarkdown, StreamingText, VARIANT } from "@hx/ui";
import { Callout, Code, H2, P, Preview, PropsTable } from "../../components/DocKit";
import { DOC, DOC_STREAMING_PROPS } from "@hx/ui";
import { STREAMING_MARKDOWN_SAMPLE } from "./streaming-markdown-sample";
import { useTypewriter } from "./use-typewriter";

/** 页内示例代码: 与下面真实渲染的那份保持一致. */
const MARKDOWN_CODE = `import { StreamingMarkdown } from "@hx/ui";
// 样式必须显式引入一次, 漏了不会报错, 表现是"内容在但没有排版"
import "markstream-react/index.css";

const [content, setContent] = useState("");
const streaming = !done;

<StreamingMarkdown
  content={content}
  streaming={streaming}
  customId="chat-1"
/>`;

const TEXT_CODE = `<StreamingText text={text} streaming={streaming} />
<StreamingText text={text} streaming cursor={false} />`;

/** StreamingText 页: 逐字纯文本与流式 Markdown 两个入口. */
/**
 * .agents/notes/implemented/feature/2026-10-22-streaming-markdown-markstream.md
 */
export function StreamingTextPage(): JSX.Element {
  const md = useTypewriter(STREAMING_MARKDOWN_SAMPLE);
  const plain = useTypewriter(AGENT_STREAMING_LABEL + ", 光标在 streaming 为 true 时闪烁");

  return (
    <>
      <P>
        <Code>StreamingMarkdown</Code> 渲染逐字到达的 Markdown: 标题, 列表, 表格, 代码块与链接在半成品状态下也能保持排版,
        流结束后收尾. <Code>StreamingText</Code> 是不解析 Markdown 的纯文本版本, 两者都保留.
      </P>

      <Callout title="必须显式引入样式">
        markstream 的 JS 入口不注入样式, 使用方要在应用入口引入一次 <Code>import "markstream-react/index.css"</Code>.
        漏了这一行不会报错, 表现是"内容渲染出来了但完全没有排版".
      </Callout>

      <H2>流式 Markdown</H2>
      <P>点开始逐字追加整段 Markdown, 中断停在当前长度, 重置清空. 代码块与表格在围栏闭合前就按块渲染</P>
      <Preview code={MARKDOWN_CODE}>
        <div className={DOC.stackMd}>
          <div className="min-h-40 w-full overflow-x-auto rounded-xl border border-border/60 bg-card/40 p-3.5">
            <StreamingMarkdown content={md.text} streaming={md.streaming} customId="docs-streaming-markdown" />
          </div>
          <div className={DOC.wrap}>
            <Button size={VARIANT.sm} variant={VARIANT.primary} onClick={md.start}>
              开始追加
            </Button>
            <Button size={VARIANT.sm} onClick={md.stop} disabled={!md.streaming}>
              中断
            </Button>
            <Button size={VARIANT.sm} variant={VARIANT.ghost} onClick={md.reset}>
              重置
            </Button>
          </div>
        </div>
      </Preview>

      <H2>流式纯文本</H2>
      <P>不解析 Markdown 时用 StreamingText: 原样保留空白与换行, streaming 为 true 时末尾出现闪烁光标</P>
      <Preview code={TEXT_CODE}>
        <div className={DOC.stackMd}>
          <div className="min-h-16 w-full rounded-xl border border-border/60 bg-card/40 p-3.5">
            <StreamingText text={plain.text} streaming={plain.streaming} />
          </div>
          <div className={DOC.wrap}>
            <Button size={VARIANT.sm} variant={VARIANT.primary} onClick={plain.start}>
              开始追加
            </Button>
            <Button size={VARIANT.sm} variant={VARIANT.ghost} onClick={plain.reset}>
              重置
            </Button>
          </div>
          <StreamingText text={AGENT_STREAMING_LABEL} streaming cursor={false} />
        </div>
      </Preview>

      <H2>属性</H2>
      <P>StreamingMarkdown</P>
      <PropsTable rows={DOC_STREAMING_PROPS.markdown} />
      <P>StreamingText</P>
      <PropsTable rows={DOC_STREAMING_PROPS.text} />
    </>
  );
}
