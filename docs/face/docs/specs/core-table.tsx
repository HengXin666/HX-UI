import { useState, type JSX } from "react";
import { DataTable, type DataTableColumn } from "@hx/ui";
import tableRaw from "../../../../src/layout/DataTable.tsx?raw";
import { range, text, toggle, type PageSpec, type Values } from "./types";
import { INDENT, NL, demo } from "./usage-code";

/**
 * 样板批的复合组件页之一: DataTable.
 * .agents/notes/implemented/feature/2026-11-08-docs-component-pages.md
 */

// ── DataTable ───────────────────────────────────────────────────────
interface Account {
  readonly user: string;
  readonly region: string;
  readonly age: number;
}

const ACCOUNTS: readonly Account[] = [
  { user: "deepstack0914", region: "SG-01", age: 57.4 },
  { user: "nahida_leaf", region: "JP-03", age: 133.1 },
  { user: "kfx_builder", region: "US-07", age: 27.2 },
  { user: "mizuki_q", region: "SG-02", age: 79.8 },
  { user: "settlement_dev", region: "DE-01", age: 96.3 },
];

const COLUMNS: readonly DataTableColumn<Account>[] = [
  {
    key: "user",
    header: "用户名",
    cellClassName: "font-mono text-[12px]",
    // 行内链接: 点它只走链接, 不触发 onRowClick (DataTable 的事件边界), 文档站外壳检查 check-shell 依赖这一格
    render: (row) => (
      <a href={`https://github.com/${row.user}`} target="_blank" rel="noreferrer" className="underline underline-offset-2">
        {row.user}
      </a>
    ),
  },
  { key: "region", header: "出口", cellClassName: "text-muted-foreground" },
  { key: "age", header: "年龄", numeric: true, render: (row) => `${row.age.toFixed(1)}d` },
];

const COLUMNS_CODE = `const columns: DataTableColumn<Account>[] = [\n  { key: "user", header: "用户名" },\n  { key: "region", header: "出口" },\n  { key: "age", header: "年龄", numeric: true, render: (r) => r.age.toFixed(1) + "d" },\n];`;

function tableProps(values: Values): Record<string, unknown> {
  return {
    title: values.title || undefined,
    rows: ACCOUNTS.slice(0, Number(values.count)),
    loading: values.loading,
    bare: values.bare,
    clickable: values.clickable,
  };
}

const NO_PICK = "(没点过行)";

interface DemoProps {
  readonly rows: readonly Account[];
  readonly clickable?: boolean;
  readonly title?: string;
  readonly loading?: boolean;
  readonly bare?: boolean;
}

/** 主舞台: 整行可点时把点到的行写到表下, 行内链接不算点行. */
function TableDemo({ clickable, ...rest }: DemoProps): JSX.Element {
  const [pick, setPick] = useState(NO_PICK);
  return (
    <div className="mx-auto w-full max-w-[640px] p-6">
      <DataTable columns={COLUMNS} rowKey={(row) => row.user} onRowClick={clickable ? (row) => setPick(row.user) : undefined} {...rest} />
      {clickable ? <div className="mt-2 font-mono text-[11.5px] text-muted-foreground">点过的行: {pick}</div> : null}
    </div>
  );
}

function tableUsage(values: Values): string {
  const attrs = [
    "columns={columns}",
    Number(values.count) === ACCOUNTS.length ? "rows={rows}" : `rows={rows.slice(0, ${Number(values.count)})}`,
    "rowKey={(r) => r.user}",
    ...(values.title ? [`title=${JSON.stringify(values.title)}`] : []),
    ...(values.loading ? ["loading"] : []),
    ...(values.bare ? ["bare"] : []),
    ...(values.clickable ? ["onRowClick={(r) => open(r.user)}"] : []),
  ];
  return demo(["DataTable", "type DataTableColumn"], `<DataTable\n${attrs.map((line) => INDENT + line).join(NL)}\n/>`, `\n\n${COLUMNS_CODE}`);
}

export const DATA_TABLE: PageSpec = {
  id: "data-table",
  kind: "composite",
  importName: "DataTable",
  source: "src/layout/DataTable.tsx",
  raw: tableRaw,
  deps: [],
  height: 420,
  controls: [
    text("title", "标题", "账号池", "卡头标题; 不给时没有卡头."),
    range("count", "行数", [0, ACCOUNTS.length, 1], ACCOUNTS.length, "演示数据的行数, 调到 0 看空态."),
    toggle("loading", "加载中", false, "渲染成骨架行, 表格高度不会在数据到达时跳一下."),
    toggle("bare", "去掉卡片", false, "不包 Card, 直接是一张表, 放进已有容器时用."),
    toggle("clickable", "整行可点", true, "传 onRowClick 后整行可点, 也可以用键盘聚焦与回车."),
  ],
  propDesc: {
    columns: "列定义: key, header, render, width, align, numeric.",
    rows: "数据. 组件不筛选不排序, 给什么渲染什么.",
    rowKey: "行 key. 不给时退回 row.id 或下标, 有重复 key 的风险.",
    onRowClick: "整行可点, 同时让行可聚焦, Enter 与 Space 触发. 点到行内的链接与按钮不会触发.",
    loadingRows: "加载态的骨架行数.",
    empty: "自定义空态节点, 给了就不用 emptyText.",
    emptyText: "默认空态 (EmptyState) 的文字.",
    maxHeight: "表体最大高度, 超出时表头吸顶并纵向滚动.",
    actions: "卡头右侧的操作区.",
    tableClassName: "<table> 本身的类名.",
  },
  toProps: tableProps,
  render: (props) => <TableDemo {...(props as unknown as DemoProps)} />,
  usage: tableUsage,
  examples: [
    {
      id: "empty",
      title: "空态与自定义文案",
      desc: "空态直接复用 EmptyState, 不用每页自己写一句 \"暂无数据\".",
      code: `<DataTable columns={columns} rows={[]} emptyText="该筛选条件下没有账号" />`,
      align: "stretch",
      render: () => (
        <div className="p-6">
          <DataTable columns={COLUMNS} rows={[]} emptyText="该筛选条件下没有账号" />
        </div>
      ),
    },
    {
      id: "scroll",
      title: "限高滚动",
      desc: "maxHeight 限住表体, 表头吸顶.",
      code: `<DataTable columns={columns} rows={rows} maxHeight="160px" bare />`,
      align: "stretch",
      render: () => (
        <div className="p-6">
          <DataTable columns={COLUMNS} rows={ACCOUNTS} rowKey={(row) => row.user} maxHeight="160px" bare />
        </div>
      ),
    },
  ],
  keyboard: [
    { keys: ["Tab"], action: "传了 onRowClick 时逐行聚焦; 行内的链接与按钮照常可聚焦." },
    { keys: ["Enter"], action: "在聚焦的行上触发 onRowClick." },
    { keys: ["Space"], action: "同 Enter, 不滚动页面." },
  ],
};
