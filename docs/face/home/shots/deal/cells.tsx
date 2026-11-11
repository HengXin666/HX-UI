import { useState, type JSX, type ReactNode } from "react";
import {
  BUTTON_TYPE,
  Calendar,
  CodeBlock,
  DataTable,
  DialogFooter,
  DialogHeader,
  TOOL_CALL_STATUS,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  TodoTree,
  ToolCallCard,
  confirmDialog,
  toast,
  type DataTableColumn,
  type TodoNode,
} from "@hx/ui";
import { TONE_VARIANT } from "../../../../../src/constants/ui";
import { Button } from "../../../../../src/primitives/button";
import { CATALOG as DOCS, type CatalogEntry as DocEntry } from "../../../docs/catalog";

const MUTED = "text-xs leading-relaxed text-muted-foreground";
const ROWS = 4;
const TABLE_IDS = ["dialog", "data-table", "calendar", "code-block"] as const;
const SNIPPET = `import { Button } from "@hx/ui";

export function Save() {
  return (
    <Button variant="primary">
      保存
    </Button>
  );
}`;
const TOOL_MS = 182;

/** 一格: 文档里的一个真组件. 右上 ↗ 进它的文档页. */
export interface WallCell {
  readonly id: string;
  readonly name: string;
  /** 窄屏只留前六格, 宽表与编辑器只在 md 以上出现. */
  readonly wideOnly?: boolean;
  readonly body: () => ReactNode;
}

function DialogCell(): JSX.Element {
  const ask = (): void => {
    void confirmDialog({ title: "删除这条决定?", message: "删除后时间线上不再出现, 署名人会收到一条通知.", confirmLabel: "删除", variant: "danger" });
  };
  return (
    <div className="grid h-full content-between gap-4 rounded-lg border border-border bg-background p-4">
      <DialogHeader>
        <p className="text-sm font-semibold text-foreground">删除这条决定?</p>
        <p className={MUTED}>删除后时间线上不再出现, 署名人会收到一条通知.</p>
      </DialogHeader>
      <DialogFooter>
        <Button type={BUTTON_TYPE} variant={TONE_VARIANT.outline}>取消</Button>
        <Button type={BUTTON_TYPE} variant={TONE_VARIANT.destructive} onClick={ask}>打开真的对话框</Button>
      </DialogFooter>
    </div>
  );
}

const TABLE_COLUMNS: readonly DataTableColumn<DocEntry>[] = [
  { key: "label", header: "组件", render: (row) => row.label },
  { key: "group", header: "分组", render: (row) => row.group },
];

function TableCell(): JSX.Element {
  const rows = TABLE_IDS.map((id) => DOCS.find((entry) => entry.id === id)).filter((entry): entry is DocEntry => Boolean(entry)).slice(0, ROWS);
  return <DataTable columns={TABLE_COLUMNS} rows={rows} rowKey={(row) => row.id} />;
}

const TODO: readonly TodoNode[] = [
  { id: "read", title: "读完镜头卡", status: "done" },
  { id: "deal", title: "组件墙发牌", status: "done" },
  { id: "crane", title: "整页拉升", status: "running", note: "对准第二行, 起点 3 倍" },
  { id: "close", title: "收尾字卡", status: "pending" },
];

function TodoCell(): JSX.Element {
  return <TodoTree items={TODO} title="这一页的计划" />;
}

function ToolCell(): JSX.Element {
  return (
    <ToolCallCard
      name="search_docs"
      args={{ query: "分段拇指", limit: ROWS }}
      result={{ hits: ["segmented-control", "switch", "tabs"] }}
      status={TOOL_CALL_STATUS.ok}
      durationMs={TOOL_MS}
      defaultOpen
    />
  );
}

function ToastCell(): JSX.Element {
  return (
    <div className="grid h-full content-between gap-4">
      <p className={`${MUTED} hidden md:block`}>右下角堆叠, 最多三条. 按一下, 消息是真的发出去了.</p>
      <div className="flex flex-wrap gap-2">
        <Button type={BUTTON_TYPE} variant={TONE_VARIANT.outline} onClick={() => toast.info("已保存到草稿")}>信息</Button>
        <Button type={BUTTON_TYPE} variant={TONE_VARIANT.outline} onClick={() => toast.success("决定已发布")}>成功</Button>
        <Button type={BUTTON_TYPE} variant={TONE_VARIANT.outline} onClick={() => toast.warning("还有 3 条未决")}>警告</Button>
      </div>
    </div>
  );
}

function TabsCell(): JSX.Element {
  return (
    <Tabs defaultValue="week">
      <TabsList>
        <TabsTrigger value="week">本周</TabsTrigger>
        <TabsTrigger value="open">未决</TabsTrigger>
        <TabsTrigger value="done">已定</TabsTrigger>
      </TabsList>
      <TabsContent value="week" className={MUTED}>周一评审定下首页的八镜, 周三交逐帧取样.</TabsContent>
      <TabsContent value="open" className={MUTED}>暗色下收尾页的马克线颜色, 等皮肤定稿.</TabsContent>
      <TabsContent value="done" className={MUTED}>线宽一律 1px, 颜色只走语义令牌.</TabsContent>
    </Tabs>
  );
}

function CalendarCell(): JSX.Element {
  const [day, setDay] = useState<Date | undefined>(() => new Date());
  return <Calendar mode="single" selected={day} onSelect={setDay} className="rounded-lg border border-border" />;
}

/** 代码块: shiki 高亮, 自带复制. 编辑器 (monaco) 的图标字体在开发服务器上取不到, 首页不放. */
function CodeCell(): JSX.Element {
  return <CodeBlock code={SNIPPET} lang="tsx" title="Save.tsx" />;
}

/** 发牌顺序就是阅读顺序: 先上排四格, 再下排四格. 只在宽屏出现的两格排在最后. */
export const WALL: readonly WallCell[] = [
  { id: "dialog", name: "Dialog", body: () => <DialogCell /> },
  { id: "data-table", name: "DataTable", body: () => <TableCell /> },
  { id: "agent-process", name: "TodoTree", body: () => <TodoCell /> },
  { id: "agent-toolcall", name: "ToolCallCard", body: () => <ToolCell /> },
  { id: "toast", name: "Toast", body: () => <ToastCell /> },
  { id: "tabs", name: "Tabs", body: () => <TabsCell /> },
  { id: "calendar", name: "Calendar", wideOnly: true, body: () => <CalendarCell /> },
  { id: "code-block", name: "CodeBlock", wideOnly: true, body: () => <CodeCell /> },
];
