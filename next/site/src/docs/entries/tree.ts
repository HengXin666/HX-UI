import type { DocEntry, Values } from "../types";

const IMPORT = `import { Tree, type TreeNode } from "@/components/ui/tree";\n`;

const flags = (v: Values) => `${v.lines ? " lines" : ""}${v.size === "sm" ? ` size="sm"` : ""}`;

const USAGE: Record<string, (v: Values) => string> = {
  basic: (v) => `${IMPORT}\nconst nodes: TreeNode[] = [\n  { id: "start", label: "快速开始", trailing: 2, children: [\n    { id: "install", label: "安装" },\n    { id: "theme", label: "主题与令牌" },\n  ] },\n  { id: "changelog", label: "更新日志" },\n];\n\nexport function DocsNav() {\n  const [selected, setSelected] = React.useState<string[]>(["install"]);\n  return <Tree aria-label="文档目录" nodes={nodes} defaultExpanded={["start"]} selected={selected} onSelectedChange={setSelected}${flags(v)} />;\n}\n`,
  files: (v) => `${IMPORT}import { FileCodeIcon, FolderIcon, FolderOpenIcon } from "lucide-react";\n\nconst nodes: TreeNode[] = [\n  { id: "src", label: "src", icon: <FolderIcon />, iconExpanded: <FolderOpenIcon />, children: [\n    { id: "src/main.tsx", label: "main.tsx", icon: <FileCodeIcon />, trailing: "640 B" },\n  ] },\n];\n\nexport function FileTree({ onOpen }: { onOpen: (path: string) => void }) {\n  return <Tree aria-label="文件" nodes={nodes} defaultExpanded={["src"]} onAction={(n) => onOpen(n.id)}${flags(v)} />;\n}\n`,
  multiple: (v) => `${IMPORT}\nexport function Permissions({ nodes }: { nodes: TreeNode[] }) {\n  const [selected, setSelected] = React.useState<string[]>([]);\n  // 级联勾选: 勾枝 = 勾全部后代; 部分后代勾上时枝显示半选\n  return <Tree aria-label="权限" nodes={nodes} selectionMode="multiple" checkboxes selected={selected} onSelectedChange={setSelected}${flags(v)} />;\n}\n`,
  controlled: (v) => `import { Tree, branchIds, type TreeNode } from "@/components/ui/tree";\n\nexport function Outline({ nodes }: { nodes: TreeNode[] }) {\n  const [expanded, setExpanded] = React.useState<string[]>([]);\n  return (\n    <>\n      <button type="button" onClick={() => setExpanded(branchIds(nodes))}>全部展开</button>\n      <button type="button" onClick={() => setExpanded([])}>全部收起</button>\n      <Tree aria-label="大纲" nodes={nodes} expanded={expanded} onExpandedChange={setExpanded} selectionMode="none"${flags(v)} />\n    </>\n  );\n}\n`,
  custom: (v) => `${IMPORT}\nexport function Filtered({ nodes, query }: { nodes: TreeNode[]; query: string }) {\n  return (\n    <Tree\n      aria-label="文档目录"\n      nodes={nodes}\n      empty={\`没有包含「\${query}」的条目\`}\n      renderLabel={(node, state) => <span className={state.branch ? "font-medium" : undefined}>{node.label}</span>}${v.lines ? "\n      lines" : ""}${v.size === "sm" ? `\n      size="sm"` : ""}\n    />\n  );\n}\n`,
  states: (v) => `${IMPORT}\nexport function Regions({ loading }: { loading: boolean }) {\n  const [nodes, setNodes] = React.useState<TreeNode[]>([{ id: "east", label: "华东", hasChildren: true }]);\n  // 第一次展开 hasChildren 的枝时调用; 把 children 填回 nodes 即可, 期间箭头位置转圈\n  const loadChildren = async (node: TreeNode) => {\n    const kids = await fetchZones(node.id);\n    setNodes((list) => list.map((n) => (n.id === node.id ? { ...n, children: kids } : n)));\n  };\n  return <Tree aria-label="机房" nodes={nodes} loading={loading} loadChildren={loadChildren} empty="还没有机房"${flags(v)} />;\n}\n`,
};

export const tree: DocEntry = {
  slug: "tree",
  name: "Tree",
  title: "树",
  section: "ui",
  group: "导航",
  description: "多级嵌套的层级列表：文件树、文档目录、组织架构、权限勾选。可折叠，单选 / 多选 / 级联勾选，懒加载子节点，可选连接线；图标、行尾附加内容和标签都能自定义。键盘按 WAI-ARIA treeview：上下移动，左右收起展开，Home / End，Enter，空格，打字跳转。",
  file: "src/components/ui/tree.tsx",
  importFrom: "@/components/ui/tree",
  demo: () => import("./tree.demo"),
  source: () => import("@/components/ui/tree.tsx?raw").then((m) => m.default),
  defaults: { example: "files", lines: true, size: "default" },
  componentDefaults: {},
  stageHeight: 480,
  presets: [
    { label: "基础", values: { example: "basic", lines: false } },
    { label: "文件树", values: { example: "files", lines: true } },
    { label: "多选", values: { example: "multiple", lines: false } },
    { label: "受控展开", values: { example: "controlled", lines: true } },
    { label: "自定义渲染", values: { example: "custom", lines: false } },
    { label: "空 / 加载", values: { example: "states", lines: false } },
  ],
  controls: [
    {
      type: "select",
      key: "example",
      label: "示例",
      options: [
        { value: "basic", label: "基础" },
        { value: "files", label: "文件树" },
        { value: "multiple", label: "多选" },
        { value: "controlled", label: "受控展开" },
        { value: "custom", label: "自定义渲染" },
        { value: "states", label: "空 / 加载" },
      ],
    },
    { type: "toggle", key: "lines", label: "连接线" },
    { type: "select", key: "size", label: "尺寸", options: [{ value: "default", label: "默认" }, { value: "sm", label: "紧凑" }] },
  ],
  usage: (v) => (USAGE[String(v.example)] ?? USAGE.basic)(v),
  props: [
    { name: "nodes", type: "TreeNode[]", description: "节点：id、label，可选 textValue（打字跳转 / 读屏用的纯文本）、icon、iconExpanded（展开时的图标）、trailing（行尾内容）、children、hasChildren（待懒加载）、disabled、data。" },
    { name: "expanded / defaultExpanded / onExpandedChange", type: "string[]", description: "展开的枝；onExpandedChange 第二个参数是 { id, expanded }。" },
    { name: "selectionMode", type: '"none" | "single" | "multiple"', default: '"single"', description: "选中方式。多选时 Ctrl/⌘ 点击切换，Shift 点击或 Shift+上下连选，Ctrl/⌘+A 全选。" },
    { name: "selected / defaultSelected / onSelectedChange", type: "string[]", description: "选中的节点。" },
    { name: "checkboxes", type: "boolean", default: "false", description: "多选时显示复选框并级联：勾枝 = 勾全部后代，部分勾上时半选。" },
    { name: "onAction", type: "(node) => void", description: "打开叶子：回车或双击。" },
    { name: "loadChildren", type: "(node) => Promise<void> | void", description: "懒加载：第一次展开 hasChildren 的枝时调用，期间箭头位置转圈；失败自动收起。" },
    { name: "expandOnClick", type: "boolean", default: "true", description: "点整行开合枝；false 时只有箭头和键盘能开合。" },
    { name: "lines", type: "boolean", default: "false", description: "连接线（1px，跟随主题边框色）。" },
    { name: "indent", type: "number", default: "16", description: "每级缩进（px）。" },
    { name: "size", type: '"sm" | "default"', default: '"default"', description: "行高 28 / 32px；触屏下自动加高到 40px。" },
    { name: "loading", type: "boolean", default: "false", description: "整棵树在加载，显示骨架行。" },
    { name: "empty", type: "ReactNode", default: '"暂无内容"', description: "没有节点时显示。" },
    { name: "renderLabel", type: "(node, state) => ReactNode", description: "换掉标签部分；state 有 depth、branch、expanded、selected、checked、focused、loading。" },
    { name: "branchIds / subtreeIds / flattenVisible / checkState", type: "函数", description: "一并导出的工具：全部枝的 id（全部展开用）、某节点及其后代、摊平可见行、勾选态。" },
  ],
};
