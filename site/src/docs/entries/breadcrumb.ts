import type { DocEntry } from "../types";

export const breadcrumb: DocEntry = {
  slug: "breadcrumb",
  name: "Breadcrumb",
  title: "面包屑",
  section: "ui",
  group: "导航",
  description: "告诉用户在哪一层、能一步回到上级。最后一项是当前页（不可点，aria-current）。层级超过 4 级时把中间折进省略号下拉。",
  file: "src/components/ui/breadcrumb.tsx",
  importFrom: "@/components/ui/breadcrumb",
  demo: () => import("./breadcrumb.demo"),
  source: () => import("@/components/ui/breadcrumb.tsx?raw").then((m) => m.default),
  defaults: { separator: "chevron", collapse: false },
  componentDefaults: {},
  presets: [
    { label: "完整", values: { collapse: false } },
    { label: "折叠中间", values: { collapse: true } },
    { label: "斜线", values: { separator: "slash" } },
  ],
  controls: [
    { type: "select", key: "separator", label: "分隔符", options: [{ value: "chevron", label: "箭头" }, { value: "slash", label: "斜线" }] },
    { type: "toggle", key: "collapse", label: "折叠中间" },
  ],
  usage: (v) => `import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";\n${v.separator === "slash" ? `import { Slash } from "lucide-react";\n` : ""}\nexport function OrderCrumbs() {\n  return (\n    <Breadcrumb>\n      <BreadcrumbList>\n        <BreadcrumbItem><BreadcrumbLink href="/">工作台</BreadcrumbLink></BreadcrumbItem>\n        <BreadcrumbSeparator${v.separator === "slash" ? "><Slash /></BreadcrumbSeparator>" : " />"}\n        <BreadcrumbItem><BreadcrumbLink href="/orders">订单中心</BreadcrumbLink></BreadcrumbItem>\n        <BreadcrumbSeparator${v.separator === "slash" ? "><Slash /></BreadcrumbSeparator>" : " />"}\n        <BreadcrumbItem><BreadcrumbPage>TL-20518</BreadcrumbPage></BreadcrumbItem>\n      </BreadcrumbList>\n    </Breadcrumb>\n  );\n}\n`,
  props: [
    { name: "BreadcrumbLink.href / asChild", type: "string / boolean", description: "上级链接；asChild 可换成路由的 Link。" },
    { name: "BreadcrumbPage", type: "组件", description: "当前页，不可点。" },
    { name: "BreadcrumbSeparator", type: "children?: ReactNode", description: "分隔符，默认箭头。" },
    { name: "BreadcrumbEllipsis", type: "组件", description: "折叠的中间层级，配下拉菜单用。" },
  ],
};
