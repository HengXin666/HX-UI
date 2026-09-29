import type { JSX } from "react";
import { useMemo, useState } from "react";
import {
  Badge, Button, Card, CardContent, DataTable, EmptyState, Input, StatGrid, StatCard,
  type DataTableColumn,
} from "@hx/ui";
import { Callout, H2, P, Preview, PropsTable } from "../components/DocKit";

/**
 * DataTable / StatCard 页。
 *
 * 这一页对着两个真实下游面板写的 —— gh-pool 与 ps-pool 各手搓了一份 170 / 184 行的
 * 原生 table, 而且都把同样四件事重写了一遍: 粘性表头、行悬停、空态、加载态。
 */

interface Acct {
  readonly user: string;
  readonly alive: 0 | 1 | null;
  readonly created: string;
  readonly age: number;
  readonly egress: string;
}

const ROWS: readonly Acct[] = [
  { user: "deepstack0914", alive: 1, created: "2026-08-02", age: 57.4, egress: "SG-01" },
  { user: "nahida_leaf", alive: 0, created: "2026-05-18", age: 133.1, egress: "JP-03" },
  { user: "kfx_builder", alive: 1, created: "2026-09-01", age: 27.2, egress: "US-07" },
  { user: "mizuki_q", alive: null, created: "2026-07-11", age: 79.8, egress: "SG-02" },
  { user: "settlement_dev", alive: 1, created: "2026-06-24", age: 96.3, egress: "DE-01" },
];

const COLUMNS: readonly DataTableColumn<Acct>[] = [
  {
    key: "user",
    header: "用户名",
    render: (r) => (
      <a
        href={"https://github.com/" + r.user}
        target="_blank"
        rel="noreferrer noopener"
        className="font-mono text-[12px] text-foreground underline-offset-2 hover:text-primary hover:underline"
      >
        {r.user}
      </a>
    ),
  },
  {
    key: "alive",
    header: "状态",
    render: (r) => (
      <Badge variant={r.alive === 1 ? "success" : r.alive === 0 ? "destructive" : "outline"}>
        {r.alive === 1 ? "活" : r.alive === 0 ? "死" : "未知"}
      </Badge>
    ),
  },
  { key: "created", header: "GitHub 创建", cellClassName: "text-muted-foreground" },
  { key: "age", header: "年龄", numeric: true, render: (r) => r.age.toFixed(1) + "d" },
  { key: "egress", header: "出口", cellClassName: "text-muted-foreground" },
];

export function DataTablePage(): JSX.Element {
  const [loading, setLoading] = useState(false);
  const [pick, setPick] = useState("(没点过行)");
  const [q, setQ] = useState("");

  const filtered = useMemo(
    () => (q ? ROWS.filter((r) => r.user.toLowerCase().includes(q.toLowerCase())) : ROWS),
    [q],
  );

  return (
    <>
      <H2>DataTable</H2>
      <P>
        三条刻意的设计约束: <b className="text-foreground">不接管数据获取</b> (排序分页筛选全由使用方给数据 ——
        把请求逻辑塞进来会把"什么时候该重新取数"焊死, 而真实项目里数据可能来自轮询 / SSE / 共享 store);
        列宽走 <code className="rounded-md bg-muted/60 px-1.5 py-0.5 font-mono text-[11.5px]">&lt;col&gt;</code> 由浏览器原生算法分配;
        <b className="text-foreground">粘性表头默认开</b> —— 表格超过一屏时看不到列名是最常见的可用性缺陷, 而且不写不报错。
      </P>
      <Preview
        align="stretch"
        code={`const COLUMNS: DataTableColumn<Acct>[] = [
  { key: "user", header: "用户名", render: (r) => <a href={...}>{r.user}</a> },
  { key: "alive", header: "状态", render: (r) => <Badge variant={...}>…</Badge> },
  { key: "created", header: "GitHub 创建" },
  { key: "age", header: "年龄", numeric: true, render: (r) => r.age.toFixed(1) + "d" },
  { key: "egress", header: "出口" },
];

<DataTable
  title="账号池"
  columns={COLUMNS}
  rows={rows}
  rowKey={(r) => r.user}
  maxHeight="320px"
  actions={<Input placeholder="搜索用户名…" className="w-44" />}
  onRowClick={(r) => setPick(r.user)}
/>`}
      >
        <div className="w-full">
          <DataTable
            title="账号池"
            columns={COLUMNS}
            rows={filtered}
            rowKey={(r) => r.user}
            maxHeight="320px"
            onRowClick={(r) => setPick(r.user)}
            actions={
              <Input
                placeholder="搜索用户名…"
                className="w-44"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                aria-label="搜索用户名"
              />
            }
          />
          <div className="mt-2 font-mono text-[11.5px] text-muted-foreground">点过的行: {pick}</div>
        </div>
      </Preview>

      <H2>加载态与空态</H2>
      <P>
        加载态渲染成骨架行 (而不是一句"加载中"), 好处是表格高度不会在数据到达的瞬间跳一下。
        空态直接复用 EmptyState, 不用每个页面自己写一句"暂无数据"。
      </P>
      <Preview
        align="start"
        code={`{/* 加载: 5 行骨架 */}
<DataTable columns={COLUMNS} rows={[]} loading loadingRows={5} className="w-96" />

{/* 空: 走 EmptyState, 也可以传 empty 自定义 */}
<DataTable columns={COLUMNS} rows={[]} emptyText="该筛选条件下没有账号" className="w-96" />`}
      >
        <DataTable columns={COLUMNS} rows={[]} loading loadingRows={5} className="w-96" bare={false} />
        <DataTable columns={COLUMNS} rows={[]} emptyText="该筛选条件下没有账号" className="w-96" />
      </Preview>

      <H2>StatCard / StatGrid</H2>
      <P>
        tone 的<b className="text-foreground">全部</b>用途是"这个数说明好还是坏", 不是装饰 ——
        所以只有五档, 且默认档不染色。大多数指标本身没有好坏, 硬染色会让整页都在喊。
        数字用 tabular-nums: 轮询刷新时位数变化不会让整块面板左右抖, 这一点手写版本几乎总被漏掉。
      </P>
      <Preview
        align="stretch"
        code={`<StatGrid columns={4}>
  <StatCard label="账号总数" value="128" icon="icon-[solar--users-group-rounded-linear]" hint="含已死" />
  <StatCard label="存活" value="104" tone="good" icon="icon-[solar--check-circle-linear]" />
  <StatCard label="已死" value="24" tone="bad" icon="icon-[solar--close-circle-linear]" />
  <StatCard label="下次保活" value="3.2h" tone="muted" icon="icon-[solar--clock-circle-linear]" />
</StatGrid>`}
      >
        <div className="w-full">
          <StatGrid columns={4}>
            <StatCard label="账号总数" value="128" icon="icon-[solar--users-group-rounded-linear]" hint="含已死" />
            <StatCard label="存活" value="104" tone="good" icon="icon-[solar--check-circle-linear]" />
            <StatCard label="已死" value="24" tone="bad" icon="icon-[solar--close-circle-linear]" />
            <StatCard label="下次保活" value="3.2h" tone="muted" icon="icon-[solar--clock-circle-linear]" />
          </StatGrid>
        </div>
      </Preview>

      <Callout title="空态顺序由 DataBoundary 固定">
        手写三态判断时最常出的错是顺序 —— 先判空再判 loading, 首次加载会先闪一下"暂无数据"
        再变成内容。DataBoundary 把顺序固定为 loading &gt; error &gt; empty &gt; 内容。
      </Callout>

      <H2>属性</H2>
      <PropsTable
        rows={[
          { name: "columns", type: "DataTableColumn<T>[]", desc: "key / header / render / width / align / numeric。" },
          { name: "rows", type: "T[]", desc: "数据。组件不做筛选排序, 给什么渲染什么。" },
          { name: "rowKey", type: "(row, i) => string | number", desc: "行 key。不给会退回下标, 有重复 key 风险。" },
          { name: "onRowClick", type: "(row: T) => void", desc: "整行可点, 同时加键盘可达性 (Enter / Space)。" },
          { name: "loading / loadingRows", type: "boolean / number", default: "false / 5", desc: "骨架行数。" },
          { name: "empty / emptyText", type: "ReactNode / string", desc: "空态内容, 默认复用 EmptyState。" },
          { name: "maxHeight", type: "string", desc: "给值才出滚动区与粘性表头。" },
          { name: "bare", type: "boolean", default: "false", desc: "不套 Card, 嵌进已有卡片时用。" },
          { name: "StatCard.tone", type: '"default" | "good" | "bad" | "muted" | "accent"', default: '"default"', desc: "语义语气, 不是配色。" },
          { name: "StatGrid.columns", type: "2 | 3 | 4 | 5", default: "4", desc: "栅格列数, 窄屏一律先掉到 1 列。" },
        ]}
      />
    </>
  );
}
