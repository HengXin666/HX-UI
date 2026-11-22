import type { DocEntry } from "../types";

export const kbd: DocEntry = {
  slug: "kbd",
  name: "Kbd",
  title: "快捷键",
  section: "ui",
  group: "展示",
  description: "显示按键。放在提示气泡、菜单、命令面板里会自动换成合适的底色。组合键用 KbdGroup 包起来。",
  file: "src/components/ui/kbd.tsx",
  importFrom: "@/components/ui/kbd",
  demo: () => import("./kbd.demo"),
  source: () => import("@/components/ui/kbd.tsx?raw").then((m) => m.default),
  defaults: { platform: "mac", plus: false },
  componentDefaults: {},
  presets: [
    { label: "Mac", values: { platform: "mac", plus: false } },
    { label: "Windows", values: { platform: "win", plus: true } },
  ],
  controls: [
    { type: "select", key: "platform", label: "系统", options: [{ value: "mac", label: "Mac" }, { value: "win", label: "Windows" }] },
    { type: "toggle", key: "plus", label: "加号" },
  ],
  usage: (v) => `import { Kbd, KbdGroup } from "@/components/ui/kbd";\n\n<KbdGroup>\n  <Kbd>${v.platform === "mac" ? "⌘" : "Ctrl"}</Kbd>${v.plus ? "\n  <span>+</span>" : ""}\n  <Kbd>K</Kbd>\n</KbdGroup>\n`,
  props: [
    { name: "Kbd", type: "ComponentProps<\"kbd\">", description: "一个按键。" },
    { name: "KbdGroup", type: "ComponentProps<\"kbd\">", description: "组合键。" },
  ],
};
