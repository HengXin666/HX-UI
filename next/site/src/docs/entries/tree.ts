import { UNFOLD_DEFAULTS } from "@/motion/unfold";
import type { DocEntry, Values } from "../types";

/** 展开动画的默认调参值 (与组件默认一致, 生成用法代码时省略) */
const ANIM = { animation: UNFOLD_DEFAULTS.type, duration: UNFOLD_DEFAULTS.duration, stagger: UNFOLD_DEFAULTS.stagger };

const IMPORT = `import { Tree, type TreeNode } from "@/components/ui/tree";\n`;

/** 动画参数: 默认值不写; 只换类型写字符串, 调了时间写对象 */
const animProp = (v: Values) => {
  const type = String(v.animation ?? ANIM.animation);
  const timing = [Number(v.duration) !== ANIM.duration ? `duration: ${Number(v.duration)}` : "", Number(v.stagger) !== ANIM.stagger ? `stagger: ${Number(v.stagger)}` : ""].filter(Boolean);
  if (!timing.length) return type === ANIM.animation ? "" : ` animation="${type}"`;
  return ` animation={{ ${[type === ANIM.animation ? "" : `type: "${type}"`, ...timing].filter(Boolean).join(", ")} }}`;
};
const flags = (v: Values) => `${v.lines ? " lines" : ""}${v.size === "sm" ? ` size="sm"` : ""}${animProp(v)}`;

const USAGE: Record<string, (v: Values) => string> = {
  basic: (v) => `${IMPORT}\nconst nodes: TreeNode[] = [\n  { id: "start", label: "快速开始", trailing: 2, children: [\n    { id: "install", label: "安装" },\n    { id: "theme", label: "主题与令牌" },\n  ] },\n  { id: "changelog", label: "更新日志" },\n];\n\nexport function DocsNav() {\n  const [selected, setSelected] = React.useState<string[]>(["install"]);\n  return <Tree aria-label="文档目录" nodes={nodes} defaultExpanded={["start"]} selected={selected} onSelectedChange={setSelected}${flags(v)} />;\n}\n`,
  files: (v) => `${IMPORT}import { FileCodeIcon, FolderIcon, FolderOpenIcon } from "lucide-react";\n\nconst nodes: TreeNode[] = [\n  { id: "src", label: "src", icon: <FolderIcon />, iconExpanded: <FolderOpenIcon />, children: [\n    { id: "src/main.tsx", label: "main.tsx", icon: <FileCodeIcon />, trailing: "640 B" },\n  ] },\n];\n\nexport function FileTree({ onOpen }: { onOpen: (path: string) => void }) {\n  return <Tree aria-label="文件" nodes={nodes} defaultExpanded={["src"]} onAction={(n) => onOpen(n.id)}${flags(v)} />;\n}\n`,
  multiple: (v) => `${IMPORT}\nexport function Permissions({ nodes }: { nodes: TreeNode[] }) {\n  const [selected, setSelected] = React.useState<string[]>([]);\n  // 级联勾选: 勾枝 = 勾全部后代; 部分后代勾上时枝显示半选\n  return <Tree aria-label="权限" nodes={nodes} selectionMode="multiple" checkboxes selected={selected} onSelectedChange={setSelected}${flags(v)} />;\n}\n`,
  controlled: (v) => `import { Tree, branchIds, type TreeNode } from "@/components/ui/tree";\n\nexport function Outline({ nodes }: { nodes: TreeNode[] }) {\n  const [expanded, setExpanded] = React.useState<string[]>([]);\n  return (\n    <>\n      <button type="button" onClick={() => setExpanded(branchIds(nodes))}>全部展开</button>\n      <button type="button" onClick={() => setExpanded([])}>全部收起</button>\n      <Tree aria-label="大纲" nodes={nodes} expanded={expanded} onExpandedChange={setExpanded} selectionMode="none"${flags(v)} />\n    </>\n  );\n}\n`,
  anim: (v) => `${IMPORT}\n// 展开: 下方的行平滑让位, 子行自上而下依次淡入; 收起反过来. 只动 transform / opacity, 减弱动效时直接显示.\n// animation: "slide" (默认) | "fade" | "none", 或 { type, duration, stagger, maxDuration, easing }\nexport function ProjectTree({ nodes }: { nodes: TreeNode[] }) {\n  return <Tree aria-label="项目" nodes={nodes} defaultExpanded={["src"]}${flags(v)} />;\n}\n`,
  custom: (v) => `${IMPORT}\nexport function Filtered({ nodes, query }: { nodes: TreeNode[]; query: string }) {\n  return (\n    <Tree\n      aria-label="文档目录"\n      nodes={nodes}\n      empty={\`没有包含「\${query}」的条目\`}\n      renderLabel={(node, state) => <span className={state.branch ? "font-medium" : undefined}>{node.label}</span>}${v.lines ? "\n      lines" : ""}${v.size === "sm" ? `\n      size="sm"` : ""}${animProp(v) ? `\n     ${animProp(v)}` : ""}\n    />\n  );\n}\n`,
  states: (v) => `${IMPORT}\nexport function Regions({ loading }: { loading: boolean }) {\n  const [nodes, setNodes] = React.useState<TreeNode[]>([{ id: "east", label: "华东", hasChildren: true }]);\n  // 第一次展开 hasChildren 的枝时调用; 把 children 填回 nodes 即可, 期间箭头位置转圈\n  const loadChildren = async (node: TreeNode) => {\n    const kids = await fetchZones(node.id);\n    setNodes((list) => list.map((n) => (n.id === node.id ? { ...n, children: kids } : n)));\n  };\n  return <Tree aria-label="机房" nodes={nodes} loading={loading} loadChildren={loadChildren} empty="还没有机房"${flags(v)} />;\n}\n`,
};

export const tree: DocEntry = {
  slug: "tree",
  name: "Tree",
  title: "树",
  section: "ui",
  group: "导航",
  description: "多级嵌套的层级列表：文件树、文档目录、组织架构、权限勾选。可折叠，单选 / 多选 / 级联勾选，懒加载子节点，可选连接线；图标、行尾附加内容和标签都能自定义。展开时下方的行平滑让位、子行自上而下依次出现，收起反向收回，动画类型和时长可调。键盘按 WAI-ARIA treeview：上下移动，左右收起展开，Home / End，Enter，空格，打字跳转。",
  file: "src/components/ui/tree.tsx",
  importFrom: "@/components/ui/tree",
  demo: () => import("./tree.demo"),
  source: () => import("@/components/ui/tree.tsx?raw").then((m) => m.default),
  defaults: { example: "files", lines: false, size: "default", ...ANIM },
  componentDefaults: {},
  stageHeight: 560,
  presets: [
    { label: "基础", values: { example: "basic", lines: false } },
    { label: "文件树", values: { example: "files", lines: false } },
    { label: "多选", values: { example: "multiple", lines: false } },
    { label: "受控展开", values: { example: "controlled", lines: true } },
    { label: "自定义渲染", values: { example: "custom", lines: false } },
    { label: "空 / 加载", values: { example: "states", lines: false } },
    { label: "展开动画", values: { example: "anim", lines: false, ...ANIM } },
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
        { value: "anim", label: "展开动画" },
      ],
    },
    { type: "toggle", key: "lines", label: "连接线" },
    { type: "select", key: "size", label: "尺寸", options: [{ value: "default", label: "默认" }, { value: "sm", label: "紧凑" }] },
    { type: "select", key: "animation", label: "展开动画", options: [{ value: "slide", label: "滑入" }, { value: "fade", label: "淡入" }, { value: "none", label: "无" }] },
    { type: "number", key: "duration", label: "时长", min: 80, max: 800, step: 20, unit: "ms" },
    { type: "number", key: "stagger", label: "每行加时", min: 0, max: 60, step: 2, unit: "ms" },
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
    { name: "expandOnClick", type: "boolean", default: "true", description: "点整行开合枝；false 时整行点击只选中，开合靠箭头、双击和键盘（同 HX-CF-Drive 的目录树）。" },
    { name: "lines", type: "boolean", default: "false", description: "连接线（1px，跟随主题边框色）。" },
    { name: "indent", type: "number", default: "16", description: "每级缩进（px）。" },
    { name: "animation", type: '"slide" | "fade" | "none" | UnfoldOptions', default: '"slide"', description: "展开 / 收起动画。slide：下方的行平滑让位，子行随让出的空间自上而下依次淡入并轻微下移；fade：同样让位，子行原地淡入；none：直接出现。收起反向：下方的行收上来，子行自下而上淡出，播完才移除（期间不可聚焦、不被读屏读到）。对象形式 { type, duration, stagger, maxDuration, easing }：duration 让出一行的时长（默认 220ms），stagger 每多一行可见的变化行加的时长（默认 14ms），maxDuration 总时长封顶（默认 380ms，展开上百个孩子也不拖），easing 让位的缓动（CSS cubic-bezier 或关键字，默认 cubic-bezier(0.22, 1, 0.36, 1)；纯收起用它对称成的慢起慢收曲线）。只动 transform / opacity；系统开了减弱动效时直接显示。树本身没有边框，外层容器若随内容变高，容器的边在展开开始 / 收起结束时一步到位，放进固定高度或可滚动的框里（文件树的常见用法）就看不到。" },
    { name: "size", type: '"sm" | "default"', default: '"default"', description: "行高 28 / 32px；触屏下自动加高到 40px。" },
    { name: "loading", type: "boolean", default: "false", description: "整棵树在加载，显示骨架行。" },
    { name: "empty", type: "ReactNode", default: '"暂无内容"', description: "没有节点时显示。" },
    { name: "renderLabel", type: "(node, state) => ReactNode", description: "换掉标签部分；state 有 depth、branch、expanded、selected、checked、focused、loading。" },
    { name: "branchIds / subtreeIds / flattenVisible / checkState", type: "函数", description: "一并导出的工具：全部枝的 id（全部展开用）、某节点及其后代、摊平可见行、勾选态。" },
  ],
};
