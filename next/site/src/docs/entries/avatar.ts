import type { DocEntry } from "../types";

export const avatar: DocEntry = {
  slug: "avatar",
  name: "Avatar",
  title: "头像",
  section: "ui",
  group: "展示",
  description: "用户或团队的头像。图片加载失败自动显示首字母；AvatarBadge 显示在线状态；AvatarGroup 叠放多人，超出的用 AvatarGroupCount 显示数量。",
  file: "src/components/ui/avatar.tsx",
  importFrom: "@/components/ui/avatar",
  demo: () => import("./avatar.demo"),
  source: () => import("@/components/ui/avatar.tsx?raw").then((m) => m.default),
  defaults: { size: "default", status: true, max: 3 },
  componentDefaults: {},
  presets: [
    { label: "默认", values: { size: "default", status: true } },
    { label: "大号", values: { size: "lg" } },
    { label: "紧凑", values: { size: "sm", status: false } },
  ],
  controls: [
    { type: "select", key: "size", label: "尺寸", options: [{ value: "sm", label: "小" }, { value: "default", label: "中" }, { value: "lg", label: "大" }] },
    { type: "toggle", key: "status", label: "在线状态" },
    { type: "number", key: "max", label: "叠放人数", min: 1, max: 4, step: 1 },
  ],
  usage: (v) => `import { Avatar, AvatarBadge, AvatarFallback, AvatarGroup, AvatarGroupCount, AvatarImage } from "@/components/ui/avatar";\n\nexport function Member() {\n  return (\n    <Avatar${v.size !== "default" ? ` size="${v.size}"` : ""}>\n      <AvatarImage src="/u/lin.jpg" alt="林晓" />\n      <AvatarFallback>LX</AvatarFallback>${v.status ? `\n      <AvatarBadge className="bg-success" aria-label="在线" />` : ""}\n    </Avatar>\n  );\n}\n\nexport function Members() {\n  return (\n    <AvatarGroup aria-label="项目成员 12 人">\n      {/* 前 ${v.max} 个 */}\n      <AvatarGroupCount>+${12 - Number(v.max)}</AvatarGroupCount>\n    </AvatarGroup>\n  );\n}\n`,
  props: [
    { name: "Avatar.size", type: '"sm" | "default" | "lg"', default: '"default"', description: "24 / 32 / 40px。" },
    { name: "AvatarImage.src / alt", type: "string", description: "图片；加载失败时显示 AvatarFallback。" },
    { name: "AvatarFallback", type: "ReactNode", description: "首字母或图标。" },
    { name: "AvatarBadge", type: "组件", description: "右下角状态点，用 className 改颜色，加 aria-label。" },
    { name: "AvatarGroup / AvatarGroupCount", type: "组件", description: "叠放与「+n」。" },
  ],
};
