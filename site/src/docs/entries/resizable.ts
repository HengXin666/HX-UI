import type { DocEntry, Values } from "../types";

const IMPORT = `import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";\n`;

/** 组件默认: 不写 withHandle / collapsible / autoSaveId; 这里只把调了的写出来 */
const handle = (v: Values) => (v.withHandle ? "<ResizableHandle withHandle />" : "<ResizableHandle />");
const side = (v: Values, def: number, max: string) =>
  `defaultSize={${def}} minSize="${Number(v.minSize)}px" maxSize="${max}"${v.collapsible ? " collapsible" : ""}`;
const save = (v: Values, id: string) => (v.persist ? ` autoSaveId="${id}"` : "");
/** 过渡动画: 默认 200ms 不写; 0 写成关闭 */
const anim = (v: Values) => {
  const ms = Number(v.animation);
  if (ms === 200 || !Number.isFinite(ms)) return "";
  return ms > 0 ? ` animation={${ms}}` : " animation={false}";
};

const USAGE: Record<string, (v: Values) => string> = {
  aioa: (v) =>
    `${IMPORT}import type { ResizablePanelHandle } from "@/components/ui/resizable";\n\nexport function ChatLayout() {\n  const inspector = React.useRef<ResizablePanelHandle>(null);\n  return (\n    <ResizablePanelGroup direction="horizontal"${save(v, "aioa-main")}${anim(v)}>\n      <ResizablePanel ${side(v, 26, "40%")}>\n        <ChatList />\n      </ResizablePanel>\n      ${handle(v)}\n      <ResizablePanel minSize="320px">\n        <Conversation onToggleInspector={() => inspector.current?.toggle()} />\n      </ResizablePanel>\n      ${handle(v)}\n      <ResizablePanel panelRef={inspector} ${side(v, 24, "38%")}>\n        <GroupInspector />\n      </ResizablePanel>\n    </ResizablePanelGroup>\n  );\n}\n`,
  basic: (v) =>
    `${IMPORT}\nexport function Split() {\n${v.locked ? "  // 严格受控: onLayout 里不写回 (例如没有权限改布局), 松手后回弹到 layout\n  const [layout] = React.useState([50, 50]);\n  const setLayout = () => toast(\"布局已锁定\");\n" : ""}  return (\n    <ResizablePanelGroup${v.direction === "vertical" ? ` direction="vertical"` : ""}${v.locked ? " layout={layout} onLayout={setLayout}" : save(v, "editor-split")}${anim(v)}>\n      <ResizablePanel defaultSize={50} minSize="${Number(v.minSize)}px"${v.collapsible ? " collapsible" : ""}>\n        <Editor />\n      </ResizablePanel>\n      ${handle(v)}\n      <ResizablePanel defaultSize={50} minSize="${Number(v.minSize)}px"${v.collapsible ? " collapsible" : ""}>\n        <Preview />\n      </ResizablePanel>\n    </ResizablePanelGroup>\n  );\n}\n`,
  cascade: (v) =>
    `${IMPORT}\n// 四栏: 一侧的面板到最小值后继续推更远的面板 (像 VS Code), 可折叠的最后吸附折叠\nexport function MailClient() {\n  return (\n    <ResizablePanelGroup${save(v, "mail-client")}${anim(v)}>\n      <ResizablePanel defaultSize={18} minSize="120px"${v.collapsible ? " collapsible" : ""}><Folders /></ResizablePanel>\n      ${handle(v)}\n      <ResizablePanel defaultSize={28} minSize="${Number(v.minSize)}px"><MailList /></ResizablePanel>\n      ${handle(v)}\n      <ResizablePanel defaultSize={34} minSize="200px"><Reader /></ResizablePanel>\n      ${handle(v)}\n      <ResizablePanel defaultSize={20} minSize="140px"${v.collapsible ? " collapsible" : ""}><Contacts /></ResizablePanel>\n    </ResizablePanelGroup>\n  );\n}\n`,
  ide: (v) =>
    `${IMPORT}\n// 受控持久化: 自己存 (例如存到用户设置), 用 layout + onLayout 代替 autoSaveId\nexport function Workbench({ saved, onSave }: { saved?: number[]; onSave: (sizes: number[]) => void }) {\n  return (\n    <ResizablePanelGroup direction="horizontal" layout={saved} onLayout={onSave}${anim(v)}>\n      <ResizablePanel defaultSize={24} minSize="${Math.min(Number(v.minSize), 200)}px" maxSize="45%"${v.collapsible ? " collapsible" : ""}>\n        <Explorer />\n      </ResizablePanel>\n      ${handle(v)}\n      <ResizablePanel minSize="280px">\n        <ResizablePanelGroup direction="vertical"${save(v, "workbench-editor")}${anim(v)}>\n          <ResizablePanel defaultSize={68} minSize="120px">\n            <Editor />\n          </ResizablePanel>\n          ${handle(v)}\n          <ResizablePanel defaultSize={32} minSize="72px"${v.collapsible ? " collapsible" : ""}>\n            <Terminal />\n          </ResizablePanel>\n        </ResizablePanelGroup>\n      </ResizablePanel>\n    </ResizablePanelGroup>\n  );\n}\n`,
};

export const resizable: DocEntry = {
  slug: "resizable",
  name: "ResizablePanelGroup",
  en: "Resizable",
  title: "可拖宽分栏",
  section: "ui",
  group: "展示",
  description:
    "拖动分隔线改宽的分栏：HX-AIOA 电脑端的三栏（列表 / 会话 / 检查栏）、编辑器与预览、IDE 布局。水平与竖直，可嵌套；最小 / 最大尺寸可写百分比或像素，可折叠到 0，双击分隔线复位，宽度可存进 localStorage 或交给回调自己存。拖动用 pointer capture + rAF 直接改 flex，面板内容不重渲染；分隔线可键盘聚焦，方向键调整，Enter 折叠。零依赖。",
  file: "src/components/ui/resizable.tsx",
  importFrom: "@/components/ui/resizable",
  demo: () => import("./resizable.demo"),
  source: () => import("@/components/ui/resizable.tsx?raw").then((m) => m.default),
  defaults: { example: "aioa", direction: "horizontal", minSize: 220, collapsible: true, withHandle: false, persist: true, animation: 200, locked: false },
  componentDefaults: {},
  stageHeight: 640,
  presets: [
    { label: "HX-AIOA 三栏", values: { example: "aioa", minSize: 220, collapsible: true, withHandle: false, persist: true } },
    { label: "左右两栏", values: { example: "basic", direction: "horizontal", minSize: 160, collapsible: false, withHandle: true } },
    { label: "竖直分栏", values: { example: "basic", direction: "vertical", minSize: 80, collapsible: false, withHandle: true } },
    { label: "受控回弹", values: { example: "basic", direction: "horizontal", minSize: 160, collapsible: true, withHandle: true, locked: true } },
    { label: "四栏推挤", values: { example: "cascade", minSize: 160, collapsible: true, withHandle: true } },
    { label: "嵌套 IDE", values: { example: "ide", minSize: 160, collapsible: true, withHandle: false } },
  ],
  controls: [
    {
      type: "select",
      key: "example",
      label: "示例",
      options: [
        { value: "aioa", label: "HX-AIOA 三栏" },
        { value: "basic", label: "两栏" },
        { value: "cascade", label: "四栏推挤" },
        { value: "ide", label: "嵌套 IDE" },
      ],
    },
    { type: "select", key: "direction", label: "方向 (两栏)", options: [{ value: "horizontal", label: "水平" }, { value: "vertical", label: "竖直" }] },
    { type: "number", key: "minSize", label: "最小尺寸", min: 40, max: 360, step: 10, unit: "px" },
    { type: "toggle", key: "collapsible", label: "可折叠" },
    { type: "toggle", key: "withHandle", label: "握把" },
    { type: "toggle", key: "persist", label: "记住布局" },
    { type: "number", key: "animation", label: "折叠动画", min: 0, max: 600, step: 20, unit: "ms" },
    { type: "toggle", key: "locked", label: "受控锁定 (两栏)" },
  ],
  usage: (v) => (USAGE[String(v.example)] ?? USAGE.aioa)(v),
  props: [
    { name: "ResizablePanelGroup.direction", type: '"horizontal" | "vertical"', default: '"horizontal"', description: "排列方向：horizontal 左右分栏（分隔线是竖线），vertical 上下分栏。组可以嵌套。" },
    { name: "ResizablePanelGroup.autoSaveId", type: "string", description: "设了就把布局存进 storage（键 hx-resizable:<id>），挂载时在绘制前恢复，不闪。id 换了会重新读取（没存过就回到默认布局），不用重挂；其它标签页改了同一个键会同步过来。面板数变了会忽略旧值。" },
    { name: "ResizablePanelGroup.storage", type: "{ getItem, setItem }", default: "localStorage", description: "换存储，例如 sessionStorage。读写失败（隐私模式 / 配额满）时静默不存。" },
    { name: "ResizablePanelGroup.layout / onLayout", type: "number[] / (sizes) => void", description: "受控布局（百分比，和为 100）与提交回调。onLayout 在拖动松手、键盘调整、折叠 / 展开、双击复位时调用，拖动过程中不调用；配合 layout 可以自己持久化（如存进用户设置）。严格受控：提交后父组件没把新值写回 layout（拒绝修改）就回弹到 layout。" },
    { name: "ResizablePanelGroup.animation", type: "boolean | number", default: "true (200ms)", description: "折叠、展开、双击复位、Home / End、reset()、受控回弹的过渡时长（ms），false 或 0 关闭。拖动与方向键不加动画（跟手优先）；系统开了减弱动效时直接到位。动画由 rAF 每帧只写各面板的 flexGrow，面板子树不重渲染；进行中组上有 data-animating。" },
    { name: "ResizablePanelGroup.keyboardStep", type: "number", default: "2", description: "方向键每次调整的百分比；按住 Shift 为 5 倍。" },
    { name: "ResizablePanelGroup.groupRef", type: "Ref<ResizablePanelGroupHandle>", description: "句柄：getLayout()、setLayout(sizes)、reset()（全部回到 defaultSize）。" },
    { name: "ResizablePanel.defaultSize", type: 'number | "320px"', description: "初始大小：数字为百分比，也可写像素。不写则平分剩余；双击分隔线复位到它。" },
    { name: "ResizablePanel.minSize / maxSize", type: 'number | "240px" | "30%"', default: "0 / 100", description: "最小 / 最大尺寸。像素值按组的当前长度换算，窗口变化时重新换算并把面板夹回范围内。" },
    { name: "ResizablePanel.collapsible / collapsedSize", type: "boolean / PanelSize", default: "false / 0", description: "可折叠：被压到最小值以下超过一半时吸附到 collapsedSize，不到一半弹回最小值。键盘 Enter、Home 也能折叠（方向键不会）。" },
    { name: "级联推挤", type: "行为", description: "像 VS Code：拖动时被压的一侧由近到远依次压到最小值，再由近到远吸附折叠可折叠的面板；变大的一侧由近到远加到最大值。每帧从按下时的快照算，拖回去原样恢复。最小值之和超过组长度时按最小值比例分配，不会有面板被挤成 0。" },
    { name: "ResizablePanel.onCollapse / onExpand / onResize", type: "() => void / (size) => void", description: "折叠、展开时调用；onResize 在大小变化时调用（拖动中每帧，有变化才调）。" },
    { name: "ResizablePanel.panelRef", type: "Ref<ResizablePanelHandle>", description: "句柄：collapse()、expand()（回到折叠前的大小）、toggle()、resize(size)、getSize()、isCollapsed()。用来做「收起检查栏」按钮。" },
    { name: "ResizableHandle.withHandle", type: "boolean", default: "false", description: "在 1px 分隔线中间显示小握把；拖动或键盘聚焦时握把描边变品牌色。" },
    { name: "ResizableHandle.hitArea", type: "number", default: "8", description: "指针热区宽度（px，线始终 1px）；触屏下至少 16px。写成 CSS 变量 --resizable-hit。" },
    { name: "ResizableHandle.disabled", type: "boolean", default: "false", description: "禁用拖动与键盘，不可聚焦。" },
    { name: "键盘", type: "WAI-ARIA window splitter", description: "分隔线 role=\"separator\"，可 Tab 聚焦，aria-valuenow 是前一个面板的百分比。左右 / 上下方向键调整（会级联推挤，但不会折叠），Home 到最小（可折叠则折叠），End 到最大，Enter 折叠 / 展开（前一个面板可折叠时折它，否则折后一个）。" },
    { name: "data-*", type: "样式钩子", description: "组：data-direction、拖动中 data-resizing、过渡中 data-animating；面板：data-collapsed；分隔线：data-orientation、拖动中 data-dragging、data-disabled。" },
  ],
};
