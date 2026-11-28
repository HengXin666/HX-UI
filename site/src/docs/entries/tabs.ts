import type { DocEntry } from "../types";

export const tabs: DocEntry = {
  slug: "tabs",
  name: "Tabs",
  title: "标签页",
  section: "ui",
  group: "导航",
  description: "同一块区域里切换几组同级内容。default 是分段样式，line 是下划线样式（适合页面顶部）。←→ 切换，Tab 进入内容。",
  file: "src/components/ui/tabs.tsx",
  importFrom: "@/components/ui/tabs",
  demo: () => import("./tabs.demo"),
  source: () => import("@/components/ui/tabs.tsx?raw").then((m) => m.default),
  defaults: { variant: "default", orientation: "horizontal", counts: true },
  componentDefaults: {},
  presets: [
    { label: "分段", values: { variant: "default", orientation: "horizontal" } },
    { label: "下划线", values: { variant: "line", orientation: "horizontal" } },
    { label: "竖排", values: { variant: "line", orientation: "vertical" } },
  ],
  controls: [
    { type: "select", key: "variant", label: "样式", options: [{ value: "default", label: "分段" }, { value: "line", label: "下划线" }] },
    { type: "select", key: "orientation", label: "方向", options: [{ value: "horizontal", label: "横" }, { value: "vertical", label: "竖" }] },
    { type: "toggle", key: "counts", label: "数量" },
  ],
  usage: (v) => `import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";\n\nexport function OrderTabs() {\n  return (\n    <Tabs defaultValue="all"${v.orientation === "vertical" ? ` orientation="vertical"` : ""}>\n      <TabsList${v.variant !== "default" ? ` variant="${v.variant}"` : ""}>\n        <TabsTrigger value="all">全部${v.counts ? ` <span className="text-xs text-muted-foreground">128</span>` : ""}</TabsTrigger>\n        <TabsTrigger value="pending">待发货</TabsTrigger>\n      </TabsList>\n      <TabsContent value="all">…</TabsContent>\n      <TabsContent value="pending">…</TabsContent>\n    </Tabs>\n  );\n}\n`,
  props: [
    { name: "Tabs.value / defaultValue / onValueChange", type: "string", description: "当前标签。" },
    { name: "Tabs.orientation", type: '"horizontal" | "vertical"', default: '"horizontal"', description: "方向，键盘方向键随之变化。" },
    { name: "Tabs.activationMode", type: '"automatic" | "manual"', default: '"automatic"', description: "manual 时方向键只移焦点，回车才切换（内容加载慢时用）。" },
    { name: "TabsList.variant", type: '"default" | "line"', default: '"default"', description: "分段或下划线。" },
    { name: "TabsTrigger.value / disabled", type: "string / boolean", description: "标签值，可禁用。" },
    { name: "TabsContent.forceMount", type: "boolean", description: "隐藏时也保留 DOM（保住表单输入）。" },
  ],
};
