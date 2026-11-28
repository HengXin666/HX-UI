import * as React from "react";
import { FileCodeIcon, FileJsonIcon, FileTextIcon, FolderIcon, FolderOpenIcon, ImageIcon, SearchIcon } from "lucide-react";
import { Tree, branchIds, type TreeAnimation, type TreeNode } from "@/components/ui/tree";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { cn } from "@/lib/utils";
import { UNFOLD_DEFAULTS } from "@/motion/unfold";
import type { DemoProps } from "../types";

/**
 * 外框照 HX-CF-Drive "移动到" 对话框: 实心面板, 树放在带 1px 边框的浅底框里.
 * 树框固定高度 (超出框内滚动): 展开 / 收起时只有框里的行在动, 框的边不跟着内容一步跳.
 */
const CARD = "w-full max-w-md rounded-xl border bg-popover p-3 text-popover-foreground shadow-float";
const TREE_BOX = "overflow-y-auto overscroll-contain rounded-lg border bg-background/50 p-1.5";
const BOX_FIXED = "h-[23rem]";
const BOX_FIT = "max-h-[23rem]";
const NOTE = "px-1 pt-2.5 text-xs text-muted-foreground";
const FOLDER = <FolderIcon className="text-warning" />;
const FOLDER_OPEN = <FolderOpenIcon className="text-warning" />;

/** 演示面板: 可选的顶部工具条, 树框 (fit: 框高随内容, 用于空 / 加载这类很短的树), 底部说明 */
function Panel({ head, note, fit, children }: { head?: React.ReactNode; note?: React.ReactNode; fit?: boolean; children: React.ReactNode }) {
  return (
    <div className={CARD}>
      {head}
      <div className={cn(TREE_BOX, fit ? BOX_FIT : BOX_FIXED)}>{children}</div>
      {note != null && <p className={NOTE}>{note}</p>}
    </div>
  );
}

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

type Common = { lines: boolean; size: "sm" | "default"; animation: TreeAnimation; onEvent?: (msg: string) => void };

function Basic({ lines, size, animation }: Common) {
  const [sel, setSel] = React.useState<string[]>(["tree"]);
  return (
    <Panel note={<>当前：{sel.length ? labelOf(DOCS, sel[0]) : "无"}</>}>
      <Tree aria-label="文档目录" nodes={DOCS} defaultExpanded={["components", "nav"]} selected={sel} onSelectedChange={setSel} lines={lines} size={size} animation={animation} />
    </Panel>
  );
}

function Files({ lines, size, animation, onEvent }: Common) {
  return (
    <Panel note="双击或回车打开文件；文件夹点整行开合。">
      <Tree aria-label="文件" nodes={FILES} defaultExpanded={["src", "src/components"]} defaultSelected={["src/components/tree.tsx"]} lines={lines} size={size} animation={animation} onAction={(n) => onEvent?.(`打开 ${n.id}`)} />
    </Panel>
  );
}

function Multiple({ lines, size, animation }: Common) {
  const [sel, setSel] = React.useState<string[]>(["proj.read", "deploy.preview"]);
  const leaves = sel.filter((id) => PERM_LEAVES.has(id));
  return (
    <Panel note={<>已授权 {leaves.length} 项：{leaves.map((id) => labelOf(PERMS, id)).join("、") || "无"}</>}>
      <Tree aria-label="权限" nodes={PERMS} selectionMode="multiple" checkboxes defaultExpanded={["proj", "deploy", "deploy.prod"]} selected={sel} onSelectedChange={setSel} lines={lines} size={size} animation={animation} />
    </Panel>
  );
}

function Controlled({ lines, size, animation }: Common) {
  const [open, setOpen] = React.useState<string[]>(["start"]);
  return (
    <Panel
      head={
        <div className="flex items-center gap-1.5 pb-2">
          <Button type="button" size="xs" variant="outline" onClick={() => setOpen(branchIds(DOCS))}>全部展开</Button>
          <Button type="button" size="xs" variant="outline" onClick={() => setOpen([])}>全部收起</Button>
          <span className="ml-auto text-xs text-muted-foreground tabular">展开 {open.length} 个</span>
        </div>
      }
    >
      <Tree aria-label="文档目录" nodes={DOCS} expanded={open} onExpandedChange={setOpen} selectionMode="none" lines={lines} size={size} animation={animation} />
    </Panel>
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

function Custom({ lines, size, animation }: Common) {
  const [q, setQ] = React.useState("表");
  const shown = q ? filterTree(DOCS, q) : DOCS;
  return (
    <Panel
      head={
        <div className="relative pb-2">
          <SearchIcon aria-hidden className="pointer-events-none absolute top-4 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input aria-label="过滤" value={q} onChange={(e) => setQ(e.target.value)} placeholder="过滤目录" className="h-8 pl-8" />
        </div>
      }
    >
      <Tree
        aria-label="文档目录"
        nodes={shown}
        expanded={q ? branchIds(shown) : undefined}
        defaultExpanded={["components"]}
        lines={lines}
        size={size}
        animation={animation}
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
    </Panel>
  );
}

const LAZY_MS = 900;

function States({ lines, size, animation }: Common) {
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
    <Panel
      fit
      head={
        <ToggleGroup type="single" size="sm" variant="outline" value={mode} onValueChange={(v) => v && setMode(v)} className="mb-2">
          <ToggleGroupItem value="lazy">懒加载</ToggleGroupItem>
          <ToggleGroupItem value="loading">加载中</ToggleGroupItem>
          <ToggleGroupItem value="empty">空</ToggleGroupItem>
        </ToggleGroup>
      }
    >
      <Tree aria-label="机房" nodes={mode === "empty" ? [] : nodes} loading={mode === "loading"} loadChildren={load} lines={lines} size={size} animation={animation} empty="还没有机房，先去创建一个。" />
    </Panel>
  );
}

/** 展开动画示例: 深层嵌套, 200 个孩子的目录, 懒加载目录, 一键全部展开 / 收起 */
const BIG_DIR_SIZE = 200;
const PROJECT: TreeNode[] = [
  dir("app", [
    dir("app/src", [
      dir("app/src/components", [
        dir("app/src/components/ui", [file("app/src/components/ui/tree.tsx", "14.2 KB"), file("app/src/components/ui/button.tsx", "2.6 KB"), file("app/src/components/ui/dialog.tsx", "5.1 KB")]),
        file("app/src/components/header.tsx", "3.0 KB"),
        file("app/src/components/sidebar.tsx", "6.4 KB"),
      ]),
      dir("app/src/motion", [file("app/src/motion/unfold.ts", "15 KB"), file("app/src/motion/use-unfold.ts", "7.9 KB")]),
      file("app/src/main.tsx", "640 B"),
    ]),
    dir("app/public", [file("app/public/logo.svg", "1.2 KB"), file("app/public/cover.png", "86 KB")]),
    file("app/package.json", "1.8 KB"),
  ]),
  dir(
    "icons",
    Array.from({ length: BIG_DIR_SIZE }, (_, i) => file(`icons/icon-${String(i + 1).padStart(3, "0")}.svg`, `${(0.4 + (i % 9) * 0.1).toFixed(1)} KB`)),
  ),
  { id: "remote", label: "remote (懒加载)", icon: FOLDER, iconExpanded: FOLDER_OPEN, hasChildren: true },
  file("README.md", "4.0 KB"),
];
const PROJECT_OPEN = ["app", "app/src"];

function Anim({ lines, size, animation }: Common) {
  const [nodes, setNodes] = React.useState(PROJECT);
  const [open, setOpen] = React.useState<string[]>(PROJECT_OPEN);
  const load = (node: TreeNode) =>
    new Promise<void>((done) =>
      window.setTimeout(() => {
        const kids = ["main", "dev", "release"].map((b) => dir(`${node.id}/${b}`, [file(`${node.id}/${b}/HEAD`, "41 B"), file(`${node.id}/${b}/config`, "312 B")]));
        setNodes((list) => list.map((n) => (n.id === node.id ? { ...n, children: kids } : n)));
        done();
      }, LAZY_MS),
    );
  return (
    <Panel
      head={
        <div className="flex items-center gap-1.5 pb-2">
          <Button type="button" size="xs" variant="outline" onClick={() => setOpen(branchIds(nodes))}>全部展开</Button>
          <Button type="button" size="xs" variant="outline" onClick={() => setOpen([])}>全部收起</Button>
          <Button type="button" size="xs" variant="ghost" onClick={() => setOpen(PROJECT_OPEN)}>复位</Button>
          <span className="ml-auto text-xs text-muted-foreground tabular">展开 {open.length} 个</span>
        </div>
      }
      note={<>icons 里有 {BIG_DIR_SIZE} 个文件；remote 第一次展开时懒加载。快速连点、展开中途收起都会从当前位置接着走。</>}
    >
      <Tree aria-label="项目" nodes={nodes} expanded={open} onExpandedChange={setOpen} loadChildren={load} lines={lines} size={size} animation={animation} />
    </Panel>
  );
}

const EXAMPLES: Record<string, (p: Common) => React.ReactElement> = { basic: Basic, files: Files, multiple: Multiple, controlled: Controlled, custom: Custom, states: States, anim: Anim };

export default function TreeDemo({ values, onEvent }: DemoProps) {
  const Example = EXAMPLES[String(values.example)] ?? Basic;
  const type = values.animation === "fade" || values.animation === "none" ? values.animation : "slide";
  const animation = React.useMemo<TreeAnimation>(() => ({ type, duration: Number(values.duration ?? UNFOLD_DEFAULTS.duration), stagger: Number(values.stagger ?? UNFOLD_DEFAULTS.stagger) }), [type, values.duration, values.stagger]);
  return <Example lines={Boolean(values.lines)} size={values.size === "sm" ? "sm" : "default"} animation={animation} onEvent={onEvent} />;
}
