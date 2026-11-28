import * as React from "react";
import "katex/dist/katex.min.css";
import { Markdown, type CodeTheme } from "@/agent";
import { mermaidFences } from "@/agent/fences/mermaid-entry";
import { math, mathFences } from "@/agent/fences/math-entry";
import type { DemoProps } from "../types";
import { SAMPLE_MARKDOWN } from "./agent/samples";
import { ReplayBar } from "./agent/replay-bar";
import { useTypewriter } from "./agent/use-replay";

const FENCES = { ...mermaidFences, ...mathFences };
const PLUGINS = { math };

export default function AgentMarkdownDemo({ values }: DemoProps) {
  const [playing, setPlaying] = React.useState(true);
  const tw = useTypewriter(SAMPLE_MARKDOWN, { cps: Number(values.cps), playing });
  return (
    <div className="flex h-full w-full flex-col">
      <ReplayBar playing={playing && !tw.done} done={tw.done} onToggle={() => setPlaying((p) => !p)} onRestart={() => (tw.restart(), setPlaying(true))} progress={tw.text.length / SAMPLE_MARKDOWN.length} label={`${tw.text.length} / ${SAMPLE_MARKDOWN.length} 字`} />
      <div className="min-h-0 flex-1 overflow-auto scrollbar-thin">
        <div className="mx-auto max-w-3xl px-6 py-6">
          <Markdown streaming={!tw.done} animated={Boolean(values.animated)} codeTheme={values.codeTheme as CodeTheme} fences={FENCES} plugins={PLUGINS}>
            {tw.text}
          </Markdown>
        </div>
      </div>
    </div>
  );
}
