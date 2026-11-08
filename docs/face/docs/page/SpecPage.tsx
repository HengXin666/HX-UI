import { useEffect, useMemo, useState, type JSX } from "react";
import { Tabs, TabsContent } from "@hx/ui";
import { relatedOf, type CatalogEntry } from "../catalog";
import { PKG, STAGE_PX } from "../constants";
import { Thumb } from "../index/Thumb";
import { initialValues, propRows, propsOf, usageCode, type ComponentSpec, type ControlValue, type Values } from "../specs/types";
import { copyText } from "./copy";
import { Customize } from "./Customize";
import { Dependencies, PageHead, Related } from "./Extras";
import { PropsCard } from "./PropsCard";
import { CodePane, StageBox, StageToolbar, type Device, type StageTab } from "./Stage";

const RELATED_COUNT = 4;
const PREVIEW: StageTab = "preview";
const CODE: StageTab = "code";

/** 复制给 AI 的 Markdown: 名称, 说明, 安装, 当前参数的用法与属性表, 粘进对话即可用. */
function aiMarkdown(spec: ComponentSpec, values: Values): string {
  const rows = propRows(spec).map((row) => `| ${row.name} | \`${row.type}\` | \`${row.initial}\` | ${row.desc} |`);
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
    "| 属性 | 类型 | 默认 | 说明 |",
    "| --- | --- | --- | --- |",
    ...rows,
  ].join("\n");
}

/** 可调组件页的中栏: 页头, 预览 | 代码, 调参, 属性, 依赖, 相关组件. */
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
  const related = useMemo(() => relatedOf(entry, RELATED_COUNT), [entry]);
  const stageKey = spec.keepMounted ? String(replay) : `${replay}-${JSON.stringify(values)}`;

  const change = (key: string, value: ControlValue): void => setValues((prev) => ({ ...prev, [key]: value }));

  return (
    <div className="flex flex-col gap-8">
      <PageHead entry={entry} />
      <Tabs value={tab} onValueChange={(next) => setTab(next as StageTab)} className="flex flex-col gap-4">
        <StageToolbar device={device} setDevice={setDevice} onCopyAi={() => copyText(aiMarkdown(spec, values), "组件说明 Markdown")} />
        <TabsContent value={PREVIEW} className="mt-0">
          <StageBox height={spec.fill ? STAGE_PX.fill : STAGE_PX.text} fill={Boolean(spec.fill)} device={device} onReplay={() => setReplay((prev) => prev + 1)}>
            <div key={stageKey} className={spec.fill ? "size-full" : "max-w-full"}>
              {spec.render(props)}
            </div>
          </StageBox>
        </TabsContent>
        <TabsContent value={CODE} className="mt-0">
          <CodePane install={`npm i ${PKG}`} usage={usage} source={spec.source} raw={spec.raw} />
        </TabsContent>
      </Tabs>
      <Customize controls={spec.controls} values={values} onChange={change} />
      <Related items={related} onGo={onGo} preview={(item) => <Thumb entry={item} />} />
      <PropsCard rows={rows} />
      <Dependencies deps={spec.deps} />
    </div>
  );
}
