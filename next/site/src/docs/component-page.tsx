import * as React from "react";
import { toast } from "sonner";
import { ArrowLeft, ArrowRight, Code2, Eye, Monitor, RotateCw, Smartphone, Sparkles } from "lucide-react";
import { AnimatePresence, m } from "motion/react";
import { cn } from "@/lib/utils";
import { ease, spring } from "@/motion/presets";
import { sectionOf } from "./sections";
import { CodeBlock, CopyButton } from "./code";
import { ControlsPanel } from "./controls";
import { entriesOf } from "./registry";
import { href } from "./router";
import type { DocEntry, Values } from "./types";

function fmt(v: Values[string]) {
  return typeof v === "string" ? JSON.stringify(v) : `{${String(v)}}`;
}

/** 用法代码: 只写和组件默认值不同的属性 */
export function usageOf(e: DocEntry, values: Values) {
  if (e.usage) return e.usage(values);
  const attrs = Object.entries(values)
    .filter(([k, v]) => !e.demoOnly?.includes(k) && (!(k in e.componentDefaults) || e.componentDefaults[k] !== v))
    .map(([k, v]) => (v === true ? `  ${k}` : `  ${k}=${fmt(v)}`));
  const open = attrs.length ? `<${e.name}\n${attrs.map((a) => "    " + a).join("\n")}\n    ` : `<${e.name}`;
  const body = e.usageChildren ? `${open}>\n${e.usageChildren.split("\n").map((l) => "      " + l).join("\n")}\n    </${e.name}>` : `${open}${attrs.length ? "" : " "}/>`;
  return `import { ${e.name} } from "${e.importFrom}";\n\nexport function Example() {\n  return (\n    ${body}\n  );\n}\n`;
}

function aiPrompt(e: DocEntry, values: Values, source: string) {
  const rows = e.props.map((p) => `| ${p.name} | \`${p.type}\` | ${p.default ?? "-"} | ${p.description} |`).join("\n");
  return `# ${e.name}（HX-UI · ${e.title}）\n\n${e.description}\n\n文件：${e.file}\n依赖：react, motion（LazyMotion 下用 m.*）, tailwindcss v4\n\n## 用法\n\n\`\`\`tsx\n${usageOf(e, values)}\`\`\`\n\n## Props\n\n| 名称 | 类型 | 默认 | 说明 |\n|---|---|---|---|\n${rows}\n\n## 源码\n\n\`\`\`tsx\n${source}\`\`\`\n`;
}

function useSource(e: DocEntry) {
  const [src, setSrc] = React.useState<string>("");
  React.useEffect(() => {
    let live = true;
    void e.source().then((s) => live && setSrc(s));
    return () => { live = false; };
  }, [e]);
  return src;
}

export function ComponentPage({ entry: e }: { entry: DocEntry }) {
  const cat = sectionOf(e.section);
  const [values, setValues] = React.useState<Values>(e.defaults);
  const [tab, setTab] = React.useState<"preview" | "code">("preview");
  const [device, setDevice] = React.useState<"desktop" | "mobile">("desktop");
  const [run, setRun] = React.useState(0);
  const source = useSource(e);
  const Demo = React.useMemo(() => React.lazy(e.demo), [e]);

  React.useEffect(() => {
    setValues(e.defaults);
    setTab("preview");
    document.title = `${e.name} · ${e.title} · HX-UI`;
  }, [e]);

  const activePreset = e.presets?.findIndex((p) => Object.entries(p.values).every(([k, v]) => values[k] === v)) ?? -1;
  const siblings = entriesOf(e.section);
  const idx = siblings.indexOf(e);
  const prev = siblings[idx - 1];
  const next = siblings[idx + 1];
  const no = String(idx + 1).padStart(2, "0");
  // UI 组件调参时原地更新 (不闪, 不丢演示里的状态); 视觉组件的入场动画需要重播, 才整块重挂
  const replay = e.remountOnChange ?? e.section === "visual";
  const stageKey = replay ? `${run}:${JSON.stringify(values)}` : `${run}`;

  return (
    <article className="mx-auto w-full max-w-5xl px-5 pt-10 pb-24 md:px-10" style={{ "--cat": cat.color } as React.CSSProperties}>
      <p className="mb-4 flex items-center gap-2 font-mono text-xs tracking-wide text-muted-foreground">
        <span className="size-2 rounded-full bg-[var(--cat)]" aria-hidden />
        <a href={href.section(cat.id)} className="text-[var(--cat-ink)] hover:underline">{cat.title}</a><span aria-hidden>/</span><span>{e.group}</span>
        <span aria-hidden>/</span>
        <span>{no}</span>
      </p>
      <h1 className="text-5xl font-medium tracking-[-0.04em] md:text-6xl">{e.title}<span className="ml-3 align-middle font-mono text-base font-normal tracking-normal text-muted-foreground">{`<${e.name} />`}</span></h1>
      <p className="mt-4 max-w-2xl text-pretty text-muted-foreground">{e.description}</p>

      <div className="mt-8 flex flex-wrap items-center gap-2">
        <div role="tablist" aria-label="视图" className="inline-flex rounded-lg bg-muted p-1">
          {([["preview", "预览", Eye], ["code", "代码", Code2]] as const).map(([id, label, Icon]) => (
            <button
              key={id}
              role="tab"
              aria-selected={tab === id}
              aria-controls={`panel-${id}`}
              id={`tab-${id}`}
              onClick={() => setTab(id)}
              className="relative inline-flex h-8 items-center gap-1.5 rounded-md px-3 text-sm text-muted-foreground transition-colors duration-150 hover:text-foreground aria-selected:text-foreground"
            >
              {tab === id && <m.span layoutId={`view-pill-${e.slug}`} transition={spring.snappy} aria-hidden className="absolute inset-0 rounded-md bg-background shadow-soft" />}
              <Icon className="relative size-4" /><span className="relative">{label}</span>
            </button>
          ))}
        </div>
        <div className="ml-auto flex items-center gap-1">
          <AnimatePresence initial={false}>
          {tab === "preview" && (
            <m.div key="tools" className="flex items-center gap-1" initial={{ opacity: 0, x: 6 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 6 }} transition={{ duration: 0.15 }}>
              <div className="hidden rounded-lg border p-0.5 sm:inline-flex" role="group" aria-label="预览尺寸">
                {([["desktop", "桌面", Monitor], ["mobile", "手机", Smartphone]] as const).map(([id, label, Icon]) => (
                  <button key={id} type="button" aria-pressed={device === id} aria-label={label} title={label} onClick={() => setDevice(id)} className="relative grid size-7 place-items-center rounded-md text-muted-foreground transition-colors duration-150 hover:text-foreground aria-pressed:text-foreground">
                    {device === id && <m.span layoutId={`device-pill-${e.slug}`} transition={spring.snappy} aria-hidden className="absolute inset-0 rounded-md bg-accent" />}
                    <Icon className="relative size-4" />
                  </button>
                ))}
              </div>
              <button type="button" onClick={() => setRun((r) => r + 1)} aria-label="重播" title="重播" className="group grid size-8 place-items-center rounded-lg border text-muted-foreground transition-[color,transform] duration-150 hover:text-foreground active:scale-95">
                <RotateCw key={run} className={cn("size-4", run > 0 && "animate-[hx-spin-once_0.5s_cubic-bezier(0.22,1,0.36,1)] motion-reduce:animate-none")} />
              </button>
            </m.div>
          )}
          </AnimatePresence>
          <CopyButton text={aiPrompt(e, values, source)} label="复制给 AI" className="h-8 border px-3" />
        </div>
      </div>

      <div id="panel-preview" role="tabpanel" aria-labelledby="tab-preview" hidden={tab !== "preview"} className="mt-3 space-y-4 data-[on=true]:animate-[hx-panel-in_0.25s_cubic-bezier(0.22,1,0.36,1)] motion-reduce:animate-none" data-on={tab === "preview"}>
        <div className="stage relative grid place-items-center overflow-hidden rounded-xl border" style={{ minHeight: e.stageHeight ?? 440 }}>
          <div className={cn("relative z-10 grid w-full place-items-center px-6 py-16 transition-[max-width] duration-300 ease-out", device === "mobile" ? "max-w-[390px] border-x border-dashed" : "max-w-full")}>
            <React.Suspense fallback={<span className="text-sm text-muted-foreground">加载中…</span>}>
              <m.div key={stageKey} className="grid w-full place-items-center" initial={{ opacity: 0, scale: 0.985 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.22, ease: ease.out }}>
                <Demo values={values} onEvent={(msg) => toast(msg)} />
              </m.div>
            </React.Suspense>
          </div>
        </div>
        <ControlsPanel
          controls={e.controls}
          values={values}
          onChange={(k, v) => setValues((s) => ({ ...s, [k]: v }))}
          presets={e.presets}
          activePreset={activePreset}
          onPreset={(p) => setValues((s) => ({ ...s, ...p }))}
          onReset={() => setValues(e.defaults)}
        />
      </div>

      <div id="panel-code" role="tabpanel" aria-labelledby="tab-code" hidden={tab !== "code"} className="mt-3 space-y-4 data-[on=true]:animate-[hx-panel-in_0.25s_cubic-bezier(0.22,1,0.36,1)] motion-reduce:animate-none" data-on={tab === "code"}>
        <CodeBlock title="用法（跟随调参）" code={usageOf(e, values)} />
        {source ? <CodeBlock title={e.file} code={source} maxHeight={560} /> : <p className="text-sm text-muted-foreground">源码加载中…</p>}
      </div>

      <section aria-labelledby="props" className="mt-14">
        <div className="mb-3 flex items-baseline justify-between">
          <h2 id="props" className="text-xl font-medium tracking-tight">属性</h2>
          <span className="font-mono text-xs text-muted-foreground">{e.props.length} 项</span>
        </div>
        <div className="overflow-x-auto rounded-xl border" tabIndex={0} role="region" aria-label="属性表">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="border-b font-mono text-xs text-muted-foreground">
              <tr><th className="px-4 py-3 font-normal">名称</th><th className="px-4 py-3 font-normal">类型</th><th className="px-4 py-3 font-normal">默认</th><th className="px-4 py-3 font-normal">说明</th></tr>
            </thead>
            <tbody>
              {e.props.map((p) => (
                <tr key={p.name} className="border-b last:border-0 align-top">
                  <td className="px-4 py-3 font-mono text-[13px] text-[var(--cat-ink)]">{p.name}</td>
                  <td className="max-w-56 px-4 py-3 font-mono text-xs break-words text-muted-foreground">{p.type}</td>
                  <td className="px-4 py-3 font-mono text-xs">{p.default ? <code className="rounded bg-muted px-1.5 py-0.5">{p.default}</code> : <span className="text-muted-foreground">—</span>}</td>
                  <td className="px-4 py-3 text-muted-foreground">{p.description}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <nav aria-label="上一个 / 下一个" className="mt-14 grid gap-3 sm:grid-cols-2">
        {prev ? <a href={href.entry(prev)} className="group rounded-xl border p-4 hover:bg-accent/50 transition-colors duration-150"><span className="flex items-center gap-1 text-xs text-muted-foreground"><ArrowLeft className="size-3.5" />上一个</span><span className="mt-1 block font-medium">{prev.title}</span></a> : <a href={href.section(cat.id)} className="rounded-xl border p-4 hover:bg-accent/50 transition-colors duration-150"><span className="flex items-center gap-1 text-xs text-muted-foreground"><ArrowLeft className="size-3.5" />总览</span><span className="mt-1 block font-medium">{cat.title}</span></a>}
        {next ? (
          <a href={href.entry(next)} className="rounded-xl border p-4 text-right hover:bg-accent/50 transition-colors duration-150"><span className="flex items-center justify-end gap-1 text-xs text-muted-foreground">下一个<ArrowRight className="size-3.5" /></span><span className="mt-1 block font-medium">{next.title}</span></a>
        ) : (
          <a href={cat.id === "ui" ? href.foundation : href.section(cat.id)} className="rounded-xl border p-4 text-right hover:bg-accent/50 transition-colors duration-150"><span className="flex items-center justify-end gap-1 text-xs text-muted-foreground">{cat.id === "ui" ? "下一个" : "回到"}<ArrowRight className="size-3.5" /></span><span className="mt-1 block font-medium">{cat.id === "ui" ? "更多基础件" : `${cat.title}总览`}</span></a>
        )}
      </nav>
      <p className="mt-10 flex items-center gap-2 text-xs text-muted-foreground"><Sparkles className="size-3.5" />系统开了「减弱动效」时，组件直接显示最终状态。</p>
    </article>
  );
}
