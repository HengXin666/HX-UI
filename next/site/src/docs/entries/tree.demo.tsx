import * as React from "react";
import { FileCodeIcon, FileJsonIcon, FileTextIcon, FolderIcon, FolderOpenIcon, ImageIcon, SearchIcon } from "lucide-react";
import { Tree, branchIds, type TreeNode } from "@/components/ui/tree";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import type { DemoProps } from "../types";

const CARD = "w-full max-w-md rounded-2xl border bg-background/85 p-2 shadow-float backdrop-blur";
const NOTE = "px-2 pt-2 text-xs text-muted-foreground";
const FOLDER = <FolderIcon className="text-brand" />;
const FOLDER_OPEN = <FolderOpenIcon className="text-brand" />;

/** 文档目录 (基础 / 受控 / 自定义渲染共用) */
const DOCS: TreeNode[] = [
  { id: "start", label: "快速开始", trailing: 3, children: [
    { id: "install", label: "安装" },
    { id: "theme", label: "主题与令牌" },
    { id: "ssr", label: "服务端渲染" },
  ] },
  { id: "components", label: "组件", trailing: 4, children: [
    { id: "form", label: "表单", children: [
      { id: "input", label: "输入框" },
      { id: "select", label: "选择器" },
      { id: "date", label: "日期选择", disabled: true, trailing: "即将上线" },
    ] },
    { id: "nav", label: "导航", children: [
      { id: "tabs", label: "标签页" },
      { id: "tree", label: "树" },
    ] },
    { id: "feedback", label: "反馈", children: [{ id: "toast", label: "轻提示" }] },
    { id: "data", label: "数据", children: [{ id: "table", label: "数据表格" }] },
  ] },
  { id: "changelog", label: "更新日志" },
];

const file = (id: string, size: string): TreeNode => {
  const name = id.slice(id.lastIndexOf("/") + 1);
  const ext = name.slice(name.lastIndexOf(".") + 1);
  const icon = ext === "json" ? <FileJsonIcon /> : ext === "md" ? <FileTextIcon /> : ext === "png" || ext === "svg" ? <ImageIcon /> : <FileCodeIcon />;
  return { id, label: name, icon, trailing: size };
};
const dir = (id: string, children: TreeNode[]): TreeNode => ({ id, label: id.slice(id.lastIndexOf("/") + 1), icon: FOLDER, iconExpanded: FOLDER_OPEN, children });

const FILES: TreeNode[] = [
  dir("src", [
    dir("src/components", [file("src/components/tree.tsx", "12.4 KB"), file("src/components/tree-model.ts", "8.1 KB"), file("src/components/button.tsx", "2.6 KB")]),
    dir("src/assets", [file("src/assets/logo.svg", "1.2 KB"), file("src/assets/cover.png", "86 KB")]),
    file("src/main.tsx", "640 B"),
  ]),
  dir("docs", [file("docs/getting-started.md", "3.3 KB")]),
  file("package.json", "1.8 KB"),
  file("README.md", "4.0 KB"),
];

const PERMS: TreeNode[] = [
  { id: "proj", label: "项目", children: [
    { id: "proj.read", label: "查看项目" },
    { id: "proj.edit", label: "编辑设置" },
    { id: "proj.delete", label: "删除项目", disabled: true },
  ] },
  { id: "deploy", label: "部署", children: [
    { id: "deploy.preview", label: "预览环境" },
    { id: "deploy.prod", label: "生产环境", children: [
      { id: "deploy.prod.run", label: "发起部署" },
      { id: "deploy.prod.rollback", label: "回滚" },
    ] },
  ] },
  { id: "billing", label: "账单" },
];

const leavesOf = (nodes: readonly TreeNode[]): string[] => nodes.flatMap((n) => (n.children ? leavesOf(n.children) : [n.id]));
const PERM_LEAVES = new Set(leavesOf(PERMS));

const labelOf = (nodes: readonly TreeNode[], id: string): string => {
  for (const n of nodes) {
    if (n.id === id) return String(n.label);
    const hit = n.children ? labelOf(n.children, id) : "";
    if (hit) return hit;
  }
  return "";
};

type Common = { lines: boolean; size: "sm" | "default"; onEvent?: (msg: string) => void };

function Basic({ lines, size }: Common) {
  const [sel, setSel] = React.useState<string[]>(["tree"]);
  return (
    <div className={CARD}>
      <Tree aria-label="文档目录" nodes={DOCS} defaultExpanded={["components", "nav"]} selected={sel} onSelectedChange={setSel} lines={lines} size={size} />
      <p className={NOTE}>当前：{sel.length ? labelOf(DOCS, sel[0]) : "无"}</p>
    </div>
  );
}

function Files({ lines, size, onEvent }: Common) {
  return (
    <div className={CARD}>
      <Tree aria-label="文件" nodes={FILES} defaultExpanded={["src", "src/components"]} lines={lines} size={size} onAction={(n) => onEvent?.(`打开 ${n.id}`)} />
      <p className={NOTE}>双击或回车打开文件；文件夹点整行开合。</p>
    </div>
  );
}

function Multiple({ lines, size }: Common) {
  const [sel, setSel] = React.useState<string[]>(["proj.read", "deploy.preview"]);
  const leaves = sel.filter((id) => PERM_LEAVES.has(id));
  return (
    <div className={CARD}>
      <Tree aria-label="权限" nodes={PERMS} selectionMode="multiple" checkboxes defaultExpanded={["proj", "deploy", "deploy.prod"]} selected={sel} onSelectedChange={setSel} lines={lines} size={size} />
      <p className={NOTE}>已授权 {leaves.length} 项：{leaves.map((id) => labelOf(PERMS, id)).join("、") || "无"}</p>
    </div>
  );
}

function Controlled({ lines, size }: Common) {
  const [open, setOpen] = React.useState<string[]>(["start"]);
  return (
    <div className={CARD}>
      <div className="flex items-center gap-1.5 border-b px-1 pb-2">
        <Button type="button" size="xs" variant="outline" onClick={() => setOpen(branchIds(DOCS))}>全部展开</Button>
        <Button type="button" size="xs" variant="outline" onClick={() => setOpen([])}>全部收起</Button>
        <span className="ml-auto text-xs text-muted-foreground tabular">展开 {open.length} 个</span>
      </div>
      <Tree aria-label="文档目录" nodes={DOCS} expanded={open} onExpandedChange={setOpen} selectionMode="none" lines={lines} size={size} className="pt-1" />
    </div>
  );
}

/** 按关键字过滤: 命中的节点和它的祖先留下, 其余剪掉 */
function filterTree(nodes: readonly TreeNode[], q: string): TreeNode[] {
  return nodes.flatMap((n) => {
    const kids = n.children ? filterTree(n.children, q) : [];
    if (String(n.label).includes(q) || kids.length) return [{ ...n, children: n.children ? kids : undefined }];
    return [];
  });
}

function Custom({ lines, size }: Common) {
  const [q, setQ] = React.useState("表");
  const shown = q ? filterTree(DOCS, q) : DOCS;
  return (
    <div className={CARD}>
      <div className="relative px-1 pb-2">
        <SearchIcon aria-hidden className="pointer-events-none absolute top-1/2 left-3.5 size-3.5 -translate-y-1/2 text-muted-foreground" />
        <Input aria-label="过滤" value={q} onChange={(e) => setQ(e.target.value)} placeholder="过滤目录" className="h-8 pl-8" />
      </div>
      <Tree
        aria-label="文档目录"
        nodes={shown}
        expanded={q ? branchIds(shown) : undefined}
        defaultExpanded={["components"]}
        lines={lines}
        size={size}
        empty={`没有包含「${q}」的条目`}
        renderLabel={(n, s) => {
          const text = String(n.label);
          const at = q ? text.indexOf(q) : -1;
          return (
            <span className="flex min-w-0 items-center gap-1.5">
              <span className={s.branch ? "font-medium" : undefined}>
                {at < 0 ? text : <>{text.slice(0, at)}<mark className="rounded-sm bg-brand-soft px-0.5 font-medium text-brand">{q}</mark>{text.slice(at + q.length)}</>}
              </span>
              {s.selected && <span className="rounded-full bg-brand px-1.5 text-[10px] leading-4 text-brand-foreground">当前</span>}
            </span>
          );
        }}
      />
    </div>
  );
}

const LAZY_MS = 900;

function States({ lines, size }: Common) {
  const [mode, setMode] = React.useState("lazy");
  const [nodes, setNodes] = React.useState<TreeNode[]>([
    { id: "east", label: "华东", hasChildren: true },
    { id: "north", label: "华北", hasChildren: true },
    { id: "south", label: "华南", hasChildren: true },
  ]);
  const load = (node: TreeNode) =>
    new Promise<void>((done) =>
      window.setTimeout(() => {
        const kids = [1, 2, 3].map((i) => ({ id: `${node.id}-${i}`, label: `${String(node.label)} ${i} 区`, trailing: `${8 * i} 台` }));
        setNodes((list) => list.map((n) => (n.id === node.id ? { ...n, children: kids } : n)));
        done();
      }, LAZY_MS),
    );
  return (
    <div className={CARD}>
      <ToggleGroup type="single" size="sm" variant="outline" value={mode} onValueChange={(v) => v && setMode(v)} className="mb-2 px-1">
        <ToggleGroupItem value="lazy">懒加载</ToggleGroupItem>
        <ToggleGroupItem value="loading">加载中</ToggleGroupItem>
        <ToggleGroupItem value="empty">空</ToggleGroupItem>
      </ToggleGroup>
      <Tree aria-label="机房" nodes={mode === "empty" ? [] : nodes} loading={mode === "loading"} loadChildren={load} lines={lines} size={size} empty="还没有机房，先去创建一个。" />
    </div>
  );
}

const EXAMPLES: Record<string, (p: Common) => React.ReactElement> = { basic: Basic, files: Files, multiple: Multiple, controlled: Controlled, custom: Custom, states: States };

export default function TreeDemo({ values, onEvent }: DemoProps) {
  const Example = EXAMPLES[String(values.example)] ?? Basic;
  return <Example lines={Boolean(values.lines)} size={values.size === "sm" ? "sm" : "default"} onEvent={onEvent} />;
}
