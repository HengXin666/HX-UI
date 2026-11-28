import type { DocEntry } from "../types";

export const skeleton: DocEntry = {
  slug: "skeleton",
  name: "Skeleton",
  title: "骨架屏",
  section: "ui",
  group: "反馈",
  description: "内容加载前的占位。形状和尺寸跟真实内容一致，加载完页面不跳。容器加 aria-busy，骨架块本身对读屏隐藏。",
  file: "src/components/ui/skeleton.tsx",
  importFrom: "@/components/ui/skeleton",
  demo: () => import("./skeleton.demo"),
  source: () => import("@/components/ui/skeleton.tsx?raw").then((m) => m.default),
  defaults: { layout: "list", loading: true },
  componentDefaults: {},
  presets: [
    { label: "列表", values: { layout: "list", loading: true } },
    { label: "卡片", values: { layout: "card", loading: true } },
    { label: "已加载", values: { loading: false } },
  ],
  controls: [
    { type: "select", key: "layout", label: "形状", options: [{ value: "list", label: "成员列表" }, { value: "card", label: "文章卡片" }] },
    { type: "toggle", key: "loading", label: "加载中" },
  ],
  usage: (v) => v.layout === "card"
    ? `import { Skeleton } from "@/components/ui/skeleton";\n\nexport function PostCardSkeleton() {\n  return (\n    <div aria-busy className="grid gap-3">\n      <Skeleton className="aspect-[16/9] w-full rounded-xl" />\n      <Skeleton className="h-5 w-2/3" />\n      <Skeleton className="h-4 w-full" />\n    </div>\n  );\n}\n`
    : `import { Skeleton } from "@/components/ui/skeleton";\n\nexport function MemberSkeleton() {\n  return (\n    <div aria-busy className="flex items-center gap-3">\n      <Skeleton className="size-10 rounded-full" />\n      <div className="grid gap-1.5">\n        <Skeleton className="h-4 w-24" />\n        <Skeleton className="h-3.5 w-36" />\n      </div>\n    </div>\n  );\n}\n`,
  props: [
    { name: "className", type: "string", description: "用尺寸和圆角拼出内容的形状。" },
    { name: "...div", type: "ComponentProps<\"div\">", description: "原生 div 属性；默认 aria-hidden。" },
  ],
};
