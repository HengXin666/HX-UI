import { useState, type JSX } from "react";
import { Button, DiffView, type DiffLine, type DiffLineType } from "@hx/ui";
import { H2, P, Preview, PropsTable } from "../../components/DocKit";

const FILENAME = "src/format-quota.ts";
const MAX_EXTRA = 3;

const BASE_HUNKS: DiffLine[] = [
  { type: "ctx", text: "export function formatQuota(value: number, unit = 'tokens') {" },
  { type: "del", text: "  const safe = Math.max(0, value);" },
  { type: "add", text: "  const safe = Number.isFinite(value) ? Math.max(0, value) : 0;" },
  { type: "ctx", text: "  return safe + ' ' + unit;" },
  { type: "ctx", text: "}" },
];

/** 变更对比页, 用本地状态驱动 DiffView 的逐行增删示例 */
export function DiffViewPage(): JSX.Element {
  const [hunks, setHunks] = useState<DiffLine[]>(() => [...BASE_HUNKS]);
  const extra = hunks.length - BASE_HUNKS.length;
  const full = extra >= MAX_EXTRA;

  const append = (type: DiffLineType): void => {
    const index = extra + 1;
    const text = type === "add" ? `  const extraLimit${index} = 200000;` : `  const legacyLimit${index} = null;`;
    setHunks((prev) => (prev.length >= BASE_HUNKS.length + MAX_EXTRA ? prev : [...prev, { type, text }]));
  };

  const reset = (): void => setHunks([...BASE_HUNKS]);

  return (
    <>
      <P>DiffView 逐行渲染变更, 新增行绿底, 删除行红底, 上下文行灰字, 行首带符号并统计增删行数</P>

      <H2>逐行变更</H2>
      <P>点追加新增行或追加删除行会改动真实 state, 点重置回到初始差异</P>
      <Preview
        align="stretch"
        code={`const INITIAL: DiffLine[] = [
  { type: "ctx", text: "export function formatQuota(value: number, unit = 'tokens') {" },
  { type: "del", text: "  const safe = Math.max(0, value);" },
  { type: "add", text: "  const safe = Number.isFinite(value) ? Math.max(0, value) : 0;" },
  { type: "ctx", text: "  return safe + ' ' + unit;" },
  { type: "ctx", text: "}" },
];

const [hunks, setHunks] = useState<DiffLine[]>(INITIAL);

const append = (type: DiffLineType): void => {
  setHunks((prev) => [...prev, { type, text: "  const extraLimit = 200000;" }]);
};

<DiffView hunks={hunks} filename="${FILENAME}" />`}
      >
        <div className="flex w-full max-w-2xl flex-col gap-3">
          <DiffView hunks={hunks} filename={FILENAME} />
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="outline" size="sm" onClick={() => append("add")} disabled={full}>
              追加新增行
            </Button>
            <Button type="button" variant="outline" size="sm" onClick={() => append("del")} disabled={full}>
              追加删除行
            </Button>
            <Button type="button" variant="ghost" size="sm" onClick={reset} disabled={extra === 0}>
              重置
            </Button>
          </div>
        </div>
      </Preview>

      <H2>无表头</H2>
      <P>省略 filename 时不出表头, 适合嵌在已有文件上下文的卡片里</P>
      <Preview
        align="stretch"
        code={`<DiffView
  hunks={[
    { type: "add", text: "  const safe = 0;" },
    { type: "del", text: "  const safe = value;" },
    { type: "ctx", text: "  return safe;" },
  ]}
/>`}
      >
        <div className="w-full max-w-2xl">
          <DiffView
            hunks={[
              { type: "add", text: "  const safe = 0;" },
              { type: "del", text: "  const safe = value;" },
              { type: "ctx", text: "  return safe;" },
            ]}
          />
        </div>
      </Preview>

      <H2>属性</H2>
      <PropsTable
        rows={[
          { name: "hunks", type: "DiffLine[]", desc: "逐行变更数据, 每行是 add, del 或 ctx 加文本" },
          { name: "filename", type: "string", default: "-", desc: "顶部文件名与增删行数, 省略时不出表头" },
        ]}
      />
    </>
  );
}
