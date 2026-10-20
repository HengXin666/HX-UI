import { useEffect, useRef, useState, type JSX } from "react";
import { Button, StreamingText } from "@hx/ui";
import { H2, P, Preview, PropsTable } from "../../components/DocKit";

const SAMPLE =
  "我先读取仓库结构, 然后生成 StreamingText 与文档页, 最后跑一次类型检查\n" +
  "光标在 streaming 为 true 时闪烁, 中断或结束后消失";

const STEP = 1;
const INTERVAL = 40;

/** StreamingText 页 */
export function StreamingTextPage(): JSX.Element {
  const [text, setText] = useState("");
  const [streaming, setStreaming] = useState(false);
  const timer = useRef<number | undefined>(undefined);

  useEffect(() => () => window.clearInterval(timer.current), []);

  const stop = (): void => {
    window.clearInterval(timer.current);
    timer.current = undefined;
    setStreaming(false);
  };

  const start = (): void => {
    stop();
    setText("");
    setStreaming(true);
    let index = 0;
    timer.current = window.setInterval(() => {
      index += STEP;
      setText(SAMPLE.slice(0, index));
      if (index >= SAMPLE.length) {
        stop();
      }
    }, INTERVAL);
  };

  const reset = (): void => {
    stop();
    setText("");
  };

  return (
    <>
      <P>
        StreamingText 渲染逐字到达的模型输出, streaming 为 true 时末尾出现闪烁光标,
        文本保留空白与换行, 部分输出不会重排
      </P>

      <H2>流式追加</H2>
      <P>点开始逐字追加, 点中断停在当前长度, 点重置清空</P>
      <Preview
        code={`const [text, setText] = useState("");
const [streaming, setStreaming] = useState(false);
const timer = useRef<number | undefined>(undefined);

useEffect(() => () => window.clearInterval(timer.current), []);

const stop = (): void => {
  window.clearInterval(timer.current);
  timer.current = undefined;
  setStreaming(false);
};

const start = (): void => {
  stop();
  setText("");
  setStreaming(true);
  let index = 0;
  timer.current = window.setInterval(() => {
    index += 1;
    setText(SAMPLE.slice(0, index));
    if (index >= SAMPLE.length) stop();
  }, 40);
};

<StreamingText text={text} streaming={streaming} />`}
      >
        <div className="flex w-full max-w-md flex-col gap-3">
          <div className="min-h-24 w-full rounded-xl border border-border/60 bg-card/40 p-3.5">
            <StreamingText text={text} streaming={streaming} />
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="primary" size="sm" onClick={start}>
              开始追加
            </Button>
            <Button variant="outline" size="sm" onClick={stop} disabled={!streaming}>
              中断
            </Button>
            <Button variant="ghost" size="sm" onClick={reset}>
              重置
            </Button>
          </div>
        </div>
      </Preview>

      <H2>光标控制</H2>
      <P>cursor 为 false 时保留流式状态但不显示光标, 用于已有独立状态指示的场景</P>
      <Preview
        code={`<StreamingText text="正在生成" streaming />
<StreamingText text="正在生成" streaming cursor={false} />`}
      >
        <div className="flex w-full max-w-md flex-col gap-3">
          <StreamingText text="正在生成" streaming />
          <StreamingText text="正在生成" streaming cursor={false} />
        </div>
      </Preview>

      <H2>属性</H2>
      <PropsTable
        rows={[
          { name: "text", type: "string", desc: "当前已到达的文本, 原样渲染" },
          { name: "streaming", type: "boolean", desc: "为 true 时显示光标, 表示仍在生成" },
          { name: "cursor", type: "boolean", default: "true", desc: "是否显示光标, 只在 streaming 为 true 时生效" },
          { name: "className", type: "string", desc: "追加到文本容器的类名" },
        ]}
      />
    </>
  );
}
