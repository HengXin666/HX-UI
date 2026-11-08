import { useEffect, useMemo, useState, type JSX } from "react";
import { DocsPager, Tabs, TabsContent } from "@hx/ui";
import { COMPONENTS, relatedOf, type CatalogEntry } from "../catalog";
import { PAGER_CLASS, PKG, STAGE_PX } from "../constants";
import { Thumb } from "../index/Thumb";
import { initialValues, propRows, propsOf, usageCode, type ComponentSpec, type ControlValue, type Values } from "../specs/types";
import { copyText } from "./copy";
import { Customize } from "./Customize";
import { Dependencies, PageHead, Related } from "./Extras";
import { PropsCard } from "./PropsCard";
import { Examples, Keyboard } from "./Sections";
import { CodePane, StageBox, StageToolbar, type Device, type StageTab } from "./Stage";

const RELATED_COUNT = 4;
const PREVIEW: StageTab = "preview";
const CODE: StageTab = "code";

/** 复制给 AI 的 Markdown: 名称, 说明, 安装, 当前参数的用法与属性表, 粘进对话即可用. */
function aiMarkdown(spec: ComponentSpec, values: Values): string {
  const table = (name: string): string[] => [
    "| 属性 | 类型 | 默认 | 说明 |",
    "| --- | --- | --- | --- |",
    ...propRows(spec, name).map((row) => `| ${row.name} | \`${row.type}\` | \`${row.initial}\` | ${row.desc} |`),
  ];
  const parts = (spec.parts ?? []).flatMap((part) => ["", `### ${part}`, ...table(part)]);
  const keys = (spec.keyboard ?? []).map((row) => `- ${row.keys.join(" + ")}: ${row.action}`);
  return [
    `# ${spec.importName} (${PKG})`,
    "",
    spec.desc,
    "",
    "## 安装",
    "```bash\nnpm i " + PKG + "\n```",
    "",
    "## 用法",
    "```tsx\n" + usageCode(spec, values) + "\n```",
    "",
    "## Props",
    ...table(spec.importName),
    ...parts,
    ...(keys.length > 0 ? ["", "## 键盘", ...keys] : []),
  ].join("\n");
}

/**
 * 组件页的中栏, 所有页型同一顺序: 页头, 预览 | 代码, 调参, 示例, 属性 (主件与各部件), 键盘, 依赖, 相关组件, 上下页.
 * 没有内容的段落不出 (没有控件就没有调参, 没有键盘行就没有键盘段).
 */
export function SpecPage({ entry, spec, onGo }: { readonly entry: CatalogEntry; readonly spec: ComponentSpec; readonly onGo: (id: string) => void }): JSX.Element {
  const [values, setValues] = useState<Values>(() => initialValues(spec.controls));
  const [tab, setTab] = useState<StageTab>(PREVIEW);
  const [device, setDevice] = useState<Device>("desktop");
  const [replay, setReplay] = useState(0);

  useEffect(() => {
    setValues(initialValues(spec.controls));
    setTab(PREVIEW);
  }, [spec]);

  const props = useMemo(() => ({ ...spec.fixed, ...propsOf(spec, values) }), [spec, values]);
  const usage = useMemo(() => usageCode(spec, values), [spec, values]);
  const rows = useMemo(() => propRows(spec), [spec]);
  const parts = useMemo(() => (spec.parts ?? []).map((part) => ({ part, rows: propRows(spec, part) })), [spec]);
  const block = spec.kind === "block";
  const height = spec.height ?? (spec.fill ? STAGE_PX.fill : STAGE_PX.text);
  const index = COMPONENTS.findIndex((item) => item.id === entry.id);
  const prev = index > 0 ? COMPONENTS[index - 1] : undefined;
  const next = COMPONENTS[index + 1];
  const related = useMemo(() => relatedOf(entry, RELATED_COUNT), [entry]);
  const stageKey = spec.keepMounted ? String(replay) : `${replay}-${JSON.stringify(values)}`;

  const change = (key: string, value: ControlValue): void => setValues((prev) => ({ ...prev, [key]: value }));

  return (
    <div className="flex flex-col gap-8">
      <PageHead entry={entry} />
      <Tabs value={tab} onValueChange={(next) => setTab(next as StageTab)} className="flex flex-col gap-4">
        <StageToolbar device={device} setDevice={setDevice} onCopyAi={() => copyText(aiMarkdown(spec, values), "组件说明 Markdown")} />
        <TabsContent value={PREVIEW} className="mt-0">
          <StageBox height={height} fill={Boolean(spec.fill) || block} device={device} onReplay={() => setReplay((prev) => prev + 1)}>
            <div key={stageKey} className={block ? "size-full overflow-y-auto text-left" : spec.fill ? "size-full" : "max-w-full"}>
              {spec.render(props)}
            </div>
          </StageBox>
        </TabsContent>
        <TabsContent value={CODE} className="mt-0">
          <CodePane install={`npm i ${PKG}`} usage={usage} source={spec.source} raw={spec.raw} />
        </TabsContent>
      </Tabs>
      {spec.controls.length > 0 ? <Customize controls={spec.controls} values={values} onChange={change} /> : null}
      <Examples items={spec.examples ?? []} />
      <PropsCard rows={rows} note={spec.propsNote} />
      {parts.map((item) => (
        <PropsCard key={item.part} part={item.part} rows={item.rows} />
      ))}
      <Keyboard rows={spec.keyboard ?? []} />
      <Dependencies deps={spec.deps} />
      <Related items={related} onGo={onGo} preview={(item) => <Thumb entry={item} />} />
      <DocsPager
        aria-label="页面导航"
        className="mt-6"
        labels={{ prev: "上一页", next: "下一页" }}
        prev={prev ? { label: prev.label, href: `#/${prev.id}` } : undefined}
        next={next ? { label: next.label, href: `#/${next.id}` } : undefined}
        classNames={PAGER_CLASS}
      />
    </div>
  );
}
