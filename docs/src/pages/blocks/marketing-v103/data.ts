/**
 * V1-03 文档页的 JSON 数据示例: 每个区块一份纯数据 (可直接 JSON.stringify 给 PageComposer / CMS).
 * 图标用 Iconify 类串, 媒体用 kind="node" 的产品 mock 由页面补上, 这里只放可序列化部分.
 */

export const DOC_V103 = {
  skins: ["default", "linear", "fintech"],
  skinAttr: "data-skin",
  stage: "flex w-full flex-col gap-6",
  skinGrid: "grid w-full grid-cols-1 gap-4 @container",
  skinFrame: "overflow-hidden rounded-(--radius-lg) border border-border bg-background text-foreground",
  skinTag: "block border-b border-border px-4 py-2 font-mono text-xs text-muted-foreground",
  mock: "flex aspect-video w-full items-end gap-2 bg-muted p-6",
  mockBar: "flex-1 rounded-(--radius-sm) bg-primary/60",
  mockAlt: "flex-1 rounded-(--radius-sm) bg-primary/25",
  figure: "flex h-24 items-center justify-center rounded-(--radius-md) border border-dashed border-border font-mono text-xs",
  bars: [40, 65, 52, 80, 70, 95],
} as const;

export const FEATURE_GRID_DATA = {
  heading: { eyebrow: "为什么选 HX-UI", title: "一个库拼出整页", description: "区块只吃数据, 皮肤与密度由令牌决定." },
  cols: 3,
  variant: "card",
  items: [
    { icon: "lucide:zap", title: "零运行时样式", body: "只拼类名与 CSS 变量, 首屏无闪烁.", href: "#zero-runtime" },
    { icon: "lucide:languages", title: "Intl 内建", body: "数字, 货币, 日期统一走 BlocksProvider 的 locale." },
    { icon: "lucide:accessibility", title: "无障碍兜底", body: "列表语义, 焦点环, 减弱动效全部默认开启.", cta: { label: "了解更多", href: "#a11y", icon: "lucide:arrow-right", iconEnd: true } },
  ],
} as const;

export const FEATURE_ALT_DATA = {
  heading: { title: "从原型到生产, 同一套区块" },
  mediaSide: "start",
  items: [
    {
      eyebrow: "设计",
      title: "皮肤一键切换",
      body: "六套皮肤只覆盖语义令牌, 区块不感知皮肤名.",
      bullets: ["暗色优先", "1px 细边分层", "CJK 字距修正"],
      ctas: [{ label: "查看皮肤", href: "#skins", variant: "secondary" }],
      media: { kind: "node", alt: "" },
    },
    {
      eyebrow: "交付",
      title: "JSON 生成整页",
      body: "PageComposer 按 schema 数组渲染, Agent 与 CMS 共用一份数据.",
      bullets: ["registry 注入", "slots 留 10% 定制口"],
      ctas: [{ label: "开始使用", href: "#start" }],
      media: { kind: "node", alt: "" },
    },
  ],
} as const;

export const BENTO_DATA = {
  heading: { title: "灵活的产品矩阵", description: "大格, 横跨, 竖跨自由组合, 悬停换图." },
  cols: 3,
  rowHeight: "md",
  items: [
    { title: "数据库", body: "完整的 Postgres, 亮暗双插画.", span: { col: 2, row: 2 }, media: { kind: "node", alt: "" }, hoverMedia: { kind: "node", alt: "" } },
    { icon: "lucide:shield-check", title: "鉴权", body: "行级安全与第三方登录.", span: { row: 2 } },
    { icon: "lucide:radio", title: "实时", body: "订阅变更, 毫秒级推送." },
    { icon: "lucide:hard-drive", title: "存储", body: "大文件与图片变换.", span: { col: 2 }, href: "#storage" },
  ],
} as const;

export const STAT_DATA = {
  heading: { title: "全球商业的基础设施" },
  align: "center",
  variant: "inline",
  animate: true,
  items: [
    { value: 15, suffix: "%", label: "美国电商份额", description: "按 GMV 统计" },
    { value: 250, suffix: "M+", label: "年度消费者" },
    { value: 99.999, suffix: "%", label: "历史可用性" },
    { value: 1400000000, prefix: "$", label: "黑五单日交易额", format: { notation: "compact" } },
  ],
} as const;

export const SHOWCASE_DATA = {
  heading: { eyebrow: "客户", title: "大截图 + tabs", description: "多张图 tabs 切换, 亮暗双图自动跟随 data-mode." },
  frame: "browser",
  items: [
    { value: "table", label: "表格编辑器", address: "app.example.com/table", media: { kind: "node", alt: "表格编辑器截图" }, caption: "像电子表格一样编辑数据." },
    { value: "sql", label: "SQL 编辑器", address: "app.example.com/sql", media: { kind: "node", alt: "SQL 编辑器截图" } },
  ],
  features: [
    { icon: "lucide:table", title: "表格视图", body: "排序, 筛选, 内联编辑." },
    { icon: "lucide:code", title: "SQL 片段", body: "保存与分享常用查询." },
    { icon: "lucide:lock", title: "策略", body: "可视化编辑行级安全." },
  ],
} as const;

export const FIGURE_DATA = {
  heading: { title: "A new species of product tool" },
  prefix: "Fig",
  major: 0,
  items: [
    { title: "为速度而生", body: "全键盘操作, 毫秒级交互." },
    { title: "为团队而设计", body: "工作流与权限随规模生长." },
    { title: "为未来打造", body: "AI 原生, 开放 API." },
  ],
} as const;
