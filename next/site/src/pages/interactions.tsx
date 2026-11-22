import * as React from "react";
import { ArrowLeft } from "lucide-react";
import { INTERACTIONS } from "@/interactions/registry";
import { defaults } from "@/interactions/types";
import { Section } from "@sites/_blocks/marketing/section";
import { DocsHeader } from "./docs-header";
import { Controls } from "./playground";
import { Stage } from "./stage";
import { useRoute } from "../router";

const STAGE = "grid min-h-64 place-items-center bg-background p-8";

/** #/interactions 网格; #/interactions/<id> 单件 + 调参. */
export default function Interactions() {
  const route = useRoute();
  const id = route.split("/")[1];
  const entry = INTERACTIONS.find((e) => e.meta.id === id);
  return (
    <div>
      <DocsHeader />
      <main className="mx-auto max-w-6xl md:border-x">
        {entry ? <Detail key={entry.meta.id} entry={entry} /> : <Grid />}
      </main>
    </div>
  );
}

function Grid() {
  return (
    <Section eyebrow="L2 交互" title="一件交互，一个产品瞬间" description="每件都能直接玩，点进去可以调参。只动 transform 与 opacity，减弱动效下给静态版本。" align="left">
      <div className="grid border-t border-l md:grid-cols-2">
        {INTERACTIONS.map((e) => (
          <div key={e.meta.id} className="flex flex-col border-r border-b">
            <Stage entry={e} className={STAGE} />
            <a href={`#/interactions/${e.meta.id}`} className="flex items-baseline justify-between gap-4 border-t px-4 py-3 text-sm transition-colors hover:bg-muted/50">
              <span className="font-medium">{e.meta.title}</span>
              <span className="truncate text-xs text-muted-foreground">{e.meta.scene}</span>
            </a>
          </div>
        ))}
      </div>
    </Section>
  );
}

function Detail({ entry }: { entry: (typeof INTERACTIONS)[number] }) {
  const [values, setValues] = React.useState(() => defaults(entry.meta));
  const { meta } = entry;
  return (
    <div className="px-4 py-10 md:px-8">
      <a href="#/interactions" className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-3.5" /> 全部交互
      </a>
      <h1 className="mt-4 text-3xl font-medium tracking-tight">{meta.title}</h1>
      <p className="mt-2 max-w-xl text-sm text-muted-foreground">{meta.scene}</p>
      <div className="mt-8 grid overflow-hidden rounded-lg border md:grid-cols-[1fr_280px]">
        <Stage entry={entry} values={values} className={`${STAGE} min-h-96`} />
        <aside className="border-t bg-card md:border-t-0 md:border-l">
          <div className="border-b px-4 py-2.5 font-mono text-[11px] uppercase tracking-wider text-muted-foreground">参数</div>
          <Controls entry={entry} values={values} onChange={setValues} />
        </aside>
      </div>
      <dl className="mt-6 flex flex-wrap gap-x-8 gap-y-2 text-xs text-muted-foreground">
        <div><dt className="inline">体积预算 </dt><dd className="inline font-mono text-foreground">≤ {meta.budgetKb} KB gzip</dd></div>
        {meta.inspiredBy && <div><dt className="inline">思路参考 </dt><dd className="inline text-foreground">{meta.inspiredBy}</dd></div>}
        <div><dt className="inline">引入 </dt><dd className="inline font-mono text-foreground">@/interactions/{meta.id}</dd></div>
      </dl>
    </div>
  );
}
