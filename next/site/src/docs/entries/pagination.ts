import type { DocEntry } from "../types";

export const pagination: DocEntry = {
  slug: "pagination",
  name: "PaginationBar",
  title: "分页",
  section: "ui",
  group: "导航",
  description: "传当前页和总条数，省略号、首尾页、上下页、「第 81–100 条」都算好。手机上只留上下页和当前页。需要自定义时用 Pagination 系列和 getPageItems 自己拼。",
  file: "src/components/ui/pagination.tsx",
  importFrom: "@/components/ui/pagination",
  demo: () => import("./pagination.demo"),
  source: () => import("@/components/ui/pagination.tsx?raw").then((m) => m.default),
  defaults: { total: 386, pageSize: 20, siblings: 1, showRange: true },
  componentDefaults: { pageSize: 20, siblings: 1, showRange: true },
  presets: [
    { label: "常规", values: { total: 386, pageSize: 20 } },
    { label: "很多页", values: { total: 12480, pageSize: 20, siblings: 2 } },
    { label: "只有几页", values: { total: 64, pageSize: 20 } },
  ],
  controls: [
    { type: "number", key: "total", label: "总条数", min: 0, max: 20000, step: 2 },
    { type: "select", key: "pageSize", label: "每页", options: [{ value: "10", label: "10" }, { value: "20", label: "20" }, { value: "50", label: "50" }] },
    { type: "number", key: "siblings", label: "两侧页码", min: 0, max: 3, step: 1 },
    { type: "toggle", key: "showRange", label: "条数范围" },
  ],
  usage: (v) => `import * as React from "react";\nimport { PaginationBar } from "@/components/ui/pagination";\n\nexport function OrdersFooter({ total }: { total: number }) {\n  const [page, setPage] = React.useState(1);\n  return (\n    <PaginationBar\n      page={page}\n      total={total}${Number(v.pageSize) !== 20 ? `\n      pageSize={${v.pageSize}}` : ""}${Number(v.siblings) !== 1 ? `\n      siblings={${v.siblings}}` : ""}${v.showRange ? "" : "\n      showRange={false}"}\n      onPageChange={setPage}\n    />\n  );\n}\n`,
  props: [
    { name: "page", type: "number", description: "当前页，从 1 开始。" },
    { name: "total", type: "number", description: "总条数。" },
    { name: "pageSize", type: "number", default: "20", description: "每页条数。" },
    { name: "onPageChange", type: "(page: number) => void", description: "翻页。" },
    { name: "siblings", type: "number", default: "1", description: "当前页左右各显示几个页码。" },
    { name: "showRange", type: "boolean", default: "true", description: "左侧显示「第 x–y 条，共 n 条」。" },
    { name: "getPageItems(page, pageCount, siblings)", type: "函数", description: "只要页码数组时用，返回如 [1, \"…\", 4, 5, 6, \"…\", 20]。" },
  ],
};
