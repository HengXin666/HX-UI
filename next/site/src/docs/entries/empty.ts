import type { DocEntry, Values } from "../types";

/** 只 import 代码里真正用到的 Empty* 件 (扫描生成的 JSX) */
const withImport = (body: string) => {
  const names = [...new Set(Array.from(body.matchAll(/<(Empty[A-Za-z]*)\b/g), (m) => m[1]))].sort();
  return `import { ${names.join(", ")} } from "@/components/ui/empty";\n${body}`;
};

/** Empty 上的属性: 与组件默认 (size="page", variant="default", animate="fade", duration 300, stagger 50) 相同的不写 */
const rootAttrs = (v: Values) =>
  [
    v.size !== "page" ? `size="${v.size}"` : "",
    v.variant !== "default" ? `variant="${v.variant}"` : "",
    v.animate !== "fade" ? `animate="${v.animate}"` : "",
    v.animate !== "none" && Number(v.duration) !== 300 ? `duration={${Number(v.duration)}}` : "",
    v.animate !== "none" && Number(v.stagger) !== 50 ? `stagger={${Number(v.stagger)}}` : "",
  ]
    .filter(Boolean)
    .map((a) => " " + a)
    .join("");
/** EmptyMedia 的属性; fixedTone 给错误态这类固定语义色 */
const mediaAttrs = (v: Values, fixedTone?: string) => {
  const tone = fixedTone ?? String(v.tone);
  return `${v.media !== "default" ? ` variant="${v.media}"` : ""}${tone !== "muted" ? ` tone="${tone}"` : ""}`;
};
const content = (v: Values, inner: string) => (v.action ? `\n      <EmptyContent>\n        ${inner}\n      </EmptyContent>` : "");

const USAGE: Record<string, (v: Values) => string> = {
  list: (v) => `import { Button } from "@/components/ui/button";
import { InboxIcon } from "lucide-react";

export function ChatListEmpty({ onCreate }: { onCreate: () => void }) {
  return (
    <Empty${rootAttrs(v)}>
      <EmptyMedia${mediaAttrs(v)}><InboxIcon /></EmptyMedia>
      <EmptyTitle>还没有消息</EmptyTitle>
      <EmptyDescription>和同事或 Agent 发起一个会话，消息会按时间出现在这里。</EmptyDescription>${content(v, `<Button size="sm" onClick={onCreate}>发起会话</Button>`)}
    </Empty>
  );
}
`,
  detail: (v) => `${v.action ? `import { Button } from "@/components/ui/button";\n` : ""}import { MessagesSquareIcon${v.action ? ", PlusIcon" : ""} } from "lucide-react";

// 详情区 (flex 列) 里没有选中项时: 撑满并居中
export function DetailPane({ chat${v.action ? ", onCreate" : ""} }: { chat?: Chat${v.action ? "; onCreate: () => void" : ""} }) {
  if (chat) return <ChatView chat={chat} />;
  return (
    <div className="flex h-full flex-col">
      <Empty${rootAttrs(v)}>
        <EmptyMedia${mediaAttrs(v)}><MessagesSquareIcon /></EmptyMedia>
        <EmptyTitle>选择一个会话</EmptyTitle>
        <EmptyDescription>从左侧列表打开会话，或按 ⌘K 搜索联系人。</EmptyDescription>${v.action ? `\n        <EmptyContent>\n          <Button size="sm" variant="outline" onClick={onCreate}><PlusIcon />新建会话</Button>\n        </EmptyContent>` : ""}
      </Empty>
    </div>
  );
}
`,
  search: (v) => `import { Button } from "@/components/ui/button";
import { SearchXIcon } from "lucide-react";

export function NoResults({ query, onClear }: { query: string; onClear: () => void }) {
  return (
    <Empty${rootAttrs(v)}>
      <EmptyMedia${mediaAttrs(v)}><SearchXIcon /></EmptyMedia>
      <EmptyTitle>没有找到「{query}」</EmptyTitle>
      <EmptyDescription>换个关键词试试，或者 <a href="/favorites">查看全部收藏</a>。</EmptyDescription>${content(v, `<Button size="sm" variant="outline" onClick={onClear}>清除搜索</Button>`)}
    </Empty>
  );
}
`,
  error: (v) => `import { Button } from "@/components/ui/button";
import { CloudOffIcon, RefreshCwIcon } from "lucide-react";

export function LoadError({ onRetry }: { onRetry: () => void }) {
  return (
    <Empty${rootAttrs(v)}>
      <EmptyMedia${mediaAttrs(v, "destructive")}><CloudOffIcon /></EmptyMedia>
      <EmptyTitle>待办加载失败</EmptyTitle>
      <EmptyDescription>网络连接中断。已保存的待办不会丢失。</EmptyDescription>${content(v, `<Button size="sm" variant="outline" onClick={onRetry}><RefreshCwIcon />重试</Button>`)}
    </Empty>
  );
}
`,
  flow: (v) => `import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { CloudOffIcon, InboxIcon } from "lucide-react";

// 加载中用骨架 (形状与真实的行一致), 加载完没数据用 Empty, 失败用 Empty + 重试
export function Inbox({ query }: { query: UseQueryResult<Mail[]> }) {
  if (query.isPending)
    return (
      <div aria-busy className="grid gap-0.5">
        {[68, 52, 74].map((w) => (
          <div key={w} className="flex items-center gap-3 px-2.5 py-2">
            <Skeleton className="size-8 rounded-full" />
            <div className="grid flex-1 gap-1.5"><Skeleton className="h-3.5 w-20" /><Skeleton className="h-3" style={{ width: \`\${w}%\` }} /></div>
          </div>
        ))}
      </div>
    );
  if (query.isError)
    return (
      <Empty${rootAttrs(v)}>
        <EmptyMedia${mediaAttrs(v, "destructive")}><CloudOffIcon /></EmptyMedia>
        <EmptyTitle>同步失败</EmptyTitle>
        <EmptyDescription>IMAP 服务器无响应，请稍后重试。</EmptyDescription>
        <EmptyContent><Button size="sm" variant="outline" onClick={() => query.refetch()}>重试</Button></EmptyContent>
      </Empty>
    );
  if (!query.data.length)
    return (
      <Empty${rootAttrs(v)}>
        <EmptyMedia${mediaAttrs(v)}><InboxIcon /></EmptyMedia>
        <EmptyTitle>收件箱是空的</EmptyTitle>
        <EmptyDescription>所有邮件都处理完了。</EmptyDescription>
      </Empty>
    );
  return <MailList mails={query.data} />;
}
`,
};

export const empty: DocEntry = {
  slug: "empty",
  name: "Empty",
  title: "空状态",
  section: "ui",
  group: "反馈",
  description:
    "空列表、未选中详情、搜索无结果、加载失败的统一样子：图标 + 一句标题 + 说明 + 可选的操作按钮。两种尺寸：整页居中与卡片内紧凑；图标可放进带语义色的圆底；插槽依次淡入（可上移、图标弹出），时长和交错可调，减弱动效时直接显示。与 Skeleton 搭配：加载中用骨架，没数据用 Empty，失败用 Empty + 重试。",
  file: "src/components/ui/empty.tsx",
  importFrom: "@/components/ui/empty",
  demo: () => import("./empty.demo"),
  source: () => import("@/components/ui/empty.tsx?raw").then((m) => m.default),
  defaults: { example: "flow", size: "compact", variant: "default", media: "icon", tone: "muted", animate: "rise", duration: 300, stagger: 50, action: true },
  componentDefaults: {},
  stageHeight: 560,
  presets: [
    { label: "加载 → 空 / 失败", values: { example: "flow", size: "compact", variant: "default", media: "icon", animate: "rise" } },
    { label: "列表为空", values: { example: "list", size: "compact", variant: "default", media: "icon", tone: "brand", animate: "pop" } },
    { label: "详情未选中", values: { example: "detail", size: "page", variant: "default", media: "default", tone: "muted", animate: "fade" } },
    { label: "搜索无结果", values: { example: "search", size: "compact", variant: "outline", media: "icon", tone: "muted", animate: "rise" } },
    { label: "加载失败", values: { example: "error", size: "compact", variant: "muted", media: "icon", animate: "pop" } },
    { label: "无动画", values: { example: "list", size: "compact", variant: "outline", media: "default", tone: "muted", animate: "none" } },
  ],
  controls: [
    {
      type: "select",
      key: "example",
      label: "示例",
      options: [
        { value: "flow", label: "加载 → 空 / 失败" },
        { value: "list", label: "列表为空" },
        { value: "detail", label: "详情未选中" },
        { value: "search", label: "搜索无结果" },
        { value: "error", label: "加载失败" },
      ],
    },
    { type: "select", key: "size", label: "尺寸", options: [{ value: "page", label: "整页" }, { value: "compact", label: "紧凑" }] },
    { type: "select", key: "variant", label: "外观", options: [{ value: "default", label: "无框" }, { value: "outline", label: "虚线框" }, { value: "muted", label: "浅底" }] },
    { type: "select", key: "media", label: "图标", options: [{ value: "icon", label: "圆底" }, { value: "default", label: "裸图标" }] },
    {
      type: "select",
      key: "tone",
      label: "图标色",
      options: [
        { value: "muted", label: "中性" },
        { value: "brand", label: "品牌" },
        { value: "success", label: "成功" },
        { value: "warning", label: "提醒" },
        { value: "destructive", label: "错误" },
      ],
    },
    { type: "select", key: "animate", label: "入场", options: [{ value: "none", label: "无" }, { value: "fade", label: "淡入" }, { value: "rise", label: "上移淡入" }, { value: "pop", label: "图标弹出" }] },
    { type: "number", key: "duration", label: "时长", min: 100, max: 800, step: 20, unit: "ms" },
    { type: "number", key: "stagger", label: "插槽交错", min: 0, max: 160, step: 10, unit: "ms" },
    { type: "toggle", key: "action", label: "操作按钮" },
  ],
  usage: (v) => withImport((USAGE[String(v.example)] ?? USAGE.list)(v)),
  props: [
    { name: "Empty size", type: '"page" | "compact"', default: '"page"', description: "page：撑满父容器并上下左右居中（父容器要有高度，如 flex 列里或固定高的详情区），图标 / 字号更大；compact：卡片、列表、弹层里用，间距与图标收小。插槽跟随它变，不用各自传。" },
    { name: "Empty variant", type: '"default" | "outline" | "muted"', default: '"default"', description: "default 无框；outline 1px 虚线框（拖放区、“点这里新建”）；muted 浅底。" },
    { name: "Empty animate", type: '"none" | "fade" | "rise" | "pop"', default: '"fade"', description: "入场：直接子元素依次淡入（个数不限：Empty 给每个子元素注入 --i 序号，展开 Fragment、跳过 null；子组件不转发 style 时退回 CSS sibling-index()）；rise 再加 8px 上移；pop 让图标从 90% 带回弹放大。纯 CSS 动画，只动 opacity / transform；换 key 可重播；减弱动效时直接显示。" },
    { name: "Empty duration / stagger", type: "number", default: "300 / 50", description: "每个插槽的入场时长与相邻插槽的错开（ms），写在 CSS 变量 --empty-duration / --empty-stagger 上，也可在 style 里覆盖；第 n 个子元素延迟 n × stagger（子元素 style 里写 --i 可自定顺序）。" },
    { name: "EmptyMedia variant", type: '"default" | "icon"', default: '"default"', description: "default 裸图标（page 40px / compact 28px），也可放插画或头像；icon 放进 1px 描边的圆底（56 / 40px）。" },
    { name: "EmptyMedia tone", type: '"muted" | "brand" | "success" | "warning" | "destructive"', default: '"muted"', description: "图标的语义色；加载失败用 destructive。" },
    { name: "EmptyTitle as / asChild", type: '"h1"…"h6" | "p" | "div" / boolean', default: '"h3" / false', description: "一句话标题，默认 <h3>（读屏可按标题跳到空状态）；as 换级别（整页空状态可用 h2，不想进标题大纲用 p），asChild 把样式交给自己的标题元素。" },
    { name: "EmptyDescription", type: "div", description: "为什么是空的、下一步做什么；里面的链接自动带下划线。" },
    { name: "EmptyContent", type: "div", description: "操作区：按钮 / 链接，居中换行排。" },
  ],
};
