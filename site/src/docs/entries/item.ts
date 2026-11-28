import type { DocEntry, Values } from "../types";

/** 只 import 代码里真正用到的 Item* 件 (扫描生成的 JSX) */
const withImport = (body: string) => {
  const names = [...new Set(Array.from(body.matchAll(/<(Item[A-Za-z]*)\b/g), (m) => m[1]))].sort();
  return `import { ${names.join(", ")} } from "@/components/ui/item";\n${body}`;
};
const EASINGS: Record<string, string> = { ease: "", spring: "spring", inout: "cubic-bezier(0.65, 0, 0.35, 1)" };

/** ItemGroup 上的属性: 与组件默认相同的不写 */
const groupAttrs = (v: Values) =>
  [
    v.size !== "default" ? `size="${v.size}"` : "",
    v.variant !== "default" ? `variant="${v.variant}"` : "",
    v.highlight === "slide" ? `highlight="slide"` : "",
    v.highlight === "slide" && EASINGS[String(v.easing)] ? `highlightEasing="${EASINGS[String(v.easing)]}"` : "",
    v.highlight === "slide" && v.easing !== "spring" && Number(v.duration) !== 220 ? `highlightDuration={${Number(v.duration)}}` : "",
    v.roving ? "roving" : "",
  ]
    .filter(Boolean)
    .map((a) => " " + a)
    .join("");
const reveal = (v: Values) => (v.reveal === "hover" ? "" : ` reveal="${v.reveal}"`);
const lines = (v: Values) => (Number(v.lines) === 2 ? " lines={2}" : "");
const avatarSize = (v: Values) => (v.size === "default" ? "" : ` size="${v.size}"`);

const USAGE: Record<string, (v: Values) => string> = {
  chat: (v) => `import { Avatar, AvatarBadge, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { MoreHorizontalIcon, PinIcon } from "lucide-react";

export function ChatList({ chats, current, onOpen }: { chats: Chat[]; current: string; onOpen: (id: string) => void }) {
  return (
    <ItemGroup aria-label="会话"${groupAttrs(v)}>
      {chats.map((c) => (
        // 行里有尾部按钮: 行保持 div, 主操作是标题里的 ItemTrigger (铺满整行接住点击)
        <Item key={c.id} active={c.id === current}>
          <ItemMedia>
            <Avatar${avatarSize(v)}>
              <AvatarFallback>{c.name[0]}</AvatarFallback>
              {c.online && <AvatarBadge aria-label="在线" className="bg-success" />}
            </Avatar>
          </ItemMedia>
          <ItemContent>
            <ItemTitle><ItemTrigger onClick={() => onOpen(c.id)}>{c.name}</ItemTrigger></ItemTitle>
            <ItemDescription${lines(v)}>{c.last}</ItemDescription>
          </ItemContent>
          <ItemMeta>
            <span>{c.time}</span>
            {c.unread > 0 && <span className="rounded-full bg-brand px-1 text-[10px] text-brand-foreground">{c.unread}</span>}
          </ItemMeta>
          <ItemActions${reveal(v)}>
            <Button type="button" size="icon-xs" variant="ghost" aria-label="置顶" onClick={() => pin(c.id)}><PinIcon /></Button>
            <Button type="button" size="icon-xs" variant="ghost" aria-label="更多"><MoreHorizontalIcon /></Button>
          </ItemActions>
        </Item>
      ))}
    </ItemGroup>
  );
}
`,
  mail: (v) => `import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export function MailList({ mails, current, onOpen }: { mails: Mail[]; current: string; onOpen: (id: string) => void }) {
  return (
    <ItemGroup aria-label="邮件"${groupAttrs(v)}>
      {mails.map((m) => (
        <Item key={m.id} active={m.id === current} className="items-start">
          <ItemMedia><Avatar${avatarSize(v)}><AvatarFallback>{m.from[0]}</AvatarFallback></Avatar></ItemMedia>
          <ItemContent>
            <ItemTitle className={m.unread ? undefined : "font-normal"}>
              <ItemTrigger onClick={() => onOpen(m.id)}>{m.from}</ItemTrigger>
            </ItemTitle>
            <ItemDescription className="text-foreground">{m.subject}</ItemDescription>
            <ItemDescription${lines(v)}>{m.snippet}</ItemDescription>
          </ItemContent>
          <ItemMeta className="justify-start">{m.time}</ItemMeta>
          <ItemActions${reveal(v)} className="self-center">{/* 星标 / 删除 */}</ItemActions>
        </Item>
      ))}
    </ItemGroup>
  );
}
`,
  nav: (v) => `import { Link } from "your-router";
import { BellIcon, ChevronRightIcon, ShieldCheckIcon, UserIcon } from "lucide-react";

const NAV = [
  { to: "/me/profile", icon: <UserIcon />, title: "个人资料", desc: "头像、昵称与签名" },
  { to: "/me/notify", icon: <BellIcon />, title: "通知", desc: "邮件、消息与待办提醒" },
  { to: "/me/security", icon: <ShieldCheckIcon />, title: "账号与安全", desc: "密码、两步验证、登录设备" },
];

export function MeNav({ pathname }: { pathname: string }) {
  return (
    <ItemGroup aria-label="设置"${groupAttrs(v)}>
      {NAV.map((n) => (
        // asChild: 样式交给路由链接, 选中态读当前路由
        <Item key={n.to} asChild active={pathname === n.to}>
          <Link to={n.to}>
            <ItemMedia variant="icon">{n.icon}</ItemMedia>
            <ItemContent>
              <ItemTitle>{n.title}</ItemTitle>
              <ItemDescription${lines(v)}>{n.desc}</ItemDescription>
            </ItemContent>
            <ItemMeta><ChevronRightIcon className="size-4" /></ItemMeta>
          </Link>
        </Item>
      ))}
    </ItemGroup>
  );
}
`,
  files: (v) => `import { Button } from "@/components/ui/button";
import { DownloadIcon, FileTextIcon, Share2Icon } from "lucide-react";

export function FileList({ files, current, onSelect }: { files: DriveFile[]; current?: string; onSelect: (id: string) => void }) {
  return (
    <div className="max-h-96 overflow-y-auto p-1.5">
      <ItemGroup aria-label="文件"${groupAttrs(v)}>
        {files.map((f) => (
          <Item key={f.id} active={f.id === current}>
            <ItemMedia variant="icon"><FileTextIcon /></ItemMedia>
            <ItemContent>
              <ItemTitle><ItemTrigger onClick={() => onSelect(f.id)}>{f.name}</ItemTrigger></ItemTitle>
              <ItemDescription${lines(v)}>{f.size} · {f.updated}</ItemDescription>
            </ItemContent>
            <ItemActions${reveal(v)}>
              <Button type="button" size="icon-xs" variant="ghost" aria-label="下载" onClick={() => download(f)}><DownloadIcon /></Button>
              <Button type="button" size="icon-xs" variant="ghost" aria-label="分享" onClick={() => share(f)}><Share2Icon /></Button>
            </ItemActions>
          </Item>
        ))}
      </ItemGroup>
    </div>
  );
}
`,
  agents: (v) => `import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BotIcon, MoreHorizontalIcon } from "lucide-react";

const STATE = { running: { dot: "success", label: "运行中" }, idle: { dot: "muted", label: "空闲" }, error: { dot: "destructive", label: "异常" } } as const;

export function AgentList({ agents, current, onSelect }: { agents: Agent[]; current: string; onSelect: (id: string) => void }) {
  return (
    <ItemGroup aria-label="Agent"${groupAttrs(v)}>
      {agents.map((a) => (
        <Item key={a.id} active={a.id === current}>
          <ItemMedia>
            <Avatar${avatarSize(v)} className="rounded-md"><AvatarFallback className="rounded-md"><BotIcon className="size-4" /></AvatarFallback></Avatar>
          </ItemMedia>
          <ItemContent>
            <ItemTitle><ItemTrigger onClick={() => onSelect(a.id)}>{a.name}</ItemTrigger></ItemTitle>
            <ItemDescription${lines(v)}>{a.description}</ItemDescription>
          </ItemContent>
          <ItemMeta>
            <Badge variant="outline" dot={STATE[a.state].dot} live={a.state === "running"}>{STATE[a.state].label}</Badge>
          </ItemMeta>
          <ItemActions${reveal(v)}>
            <Button type="button" size="icon-xs" variant="ghost" aria-label="设置"><MoreHorizontalIcon /></Button>
          </ItemActions>
        </Item>
      ))}
    </ItemGroup>
  );
}
`,
};

export const item: DocEntry = {
  slug: "item",
  name: "Item",
  title: "列表行",
  section: "ui",
  group: "展示",
  description:
    "会话列表、邮件列表、收藏、设置导航、Agent 列表共用的一种行：左侧头像 / 图标，中间主标题 + 副标题（截断），右侧时间 / 角标 / 操作。asChild 渲染成路由链接或按钮；选中态、悬停态与树一致；尾部操作只在有指针时悬停出现（触屏常显），也能悬停时换掉时间。尺寸与 Avatar 对齐；ItemGroup 可选键盘上下移动焦点（始终只占一个 Tab 位），选中底色可滑动跟随（自带实现，不需要 MotionProvider，滚动中也对得上）。",
  file: "src/components/ui/item.tsx",
  importFrom: "@/components/ui/item",
  demo: () => import("./item.demo"),
  source: () => import("@/components/ui/item.tsx?raw").then((m) => m.default),
  defaults: { example: "chat", size: "default", variant: "default", highlight: "slide", easing: "ease", duration: 220, reveal: "swap", roving: false, lines: "1", separators: false },
  componentDefaults: {},
  stageHeight: 560,
  presets: [
    { label: "会话列表", values: { example: "chat", size: "default", variant: "default", highlight: "slide", reveal: "swap", lines: "1", separators: false } },
    { label: "邮件", values: { example: "mail", size: "default", variant: "default", highlight: "static", reveal: "swap", lines: "2", separators: true } },
    { label: "设置导航", values: { example: "nav", size: "default", variant: "default", highlight: "slide", reveal: "hover", roving: true, separators: false } },
    { label: "网盘文件", values: { example: "files", size: "sm", variant: "default", highlight: "static", reveal: "hover", separators: false } },
    { label: "卡片行", values: { example: "agents", size: "lg", variant: "outline", highlight: "static", reveal: "always", lines: "1", separators: false } },
    { label: "弹簧高亮", values: { example: "nav", size: "default", variant: "muted", highlight: "slide", easing: "spring", roving: true, separators: false } },
  ],
  controls: [
    {
      type: "select",
      key: "example",
      label: "示例",
      options: [
        { value: "chat", label: "会话列表" },
        { value: "mail", label: "邮件" },
        { value: "nav", label: "我的 / 设置导航" },
        { value: "files", label: "网盘文件" },
        { value: "agents", label: "Agent 列表" },
      ],
    },
    { type: "select", key: "size", label: "尺寸", options: [{ value: "sm", label: "紧凑 (24)" }, { value: "default", label: "默认 (32)" }, { value: "lg", label: "大 (40)" }] },
    { type: "select", key: "variant", label: "外观", options: [{ value: "default", label: "默认" }, { value: "outline", label: "描边卡片" }, { value: "muted", label: "浅底" }] },
    { type: "select", key: "highlight", label: "选中底色", options: [{ value: "static", label: "原地" }, { value: "slide", label: "滑动跟随" }] },
    { type: "select", key: "easing", label: "滑动曲线", options: [{ value: "ease", label: "缓出" }, { value: "spring", label: "弹簧" }, { value: "inout", label: "缓入缓出 (自定义串)" }] },
    { type: "number", key: "duration", label: "滑动时长", min: 80, max: 600, step: 20, unit: "ms" },
    { type: "select", key: "reveal", label: "尾部操作", options: [{ value: "hover", label: "悬停显示" }, { value: "swap", label: "悬停替换时间" }, { value: "always", label: "常显" }] },
    { type: "select", key: "lines", label: "副标题行数", options: [{ value: "1", label: "1 行" }, { value: "2", label: "2 行" }] },
    { type: "toggle", key: "roving", label: "键盘上下移动" },
    { type: "toggle", key: "separators", label: "分隔线" },
  ],
  usage: (v) => withImport((USAGE[String(v.example)] ?? USAGE.chat)(v)),
  props: [
    { name: "Item asChild", type: "boolean", default: "false", description: "把样式与行为交给唯一的子元素：<a> / 路由 <Link>（导航）或 <button type=\"button\">（选中）。只用于行里没有其它按钮的情况（按钮 / 链接不能嵌套）。不传时是 div。" },
    { name: "ItemTrigger", type: "button（asChild 可换成 <a>）", description: "行里还有尾部按钮时的主操作：放在 ItemTitle 里包住标题，用 ::after 铺满整行接住点击，焦点环画在整行，行选中时自动补 aria-current。尾部按钮浮在它上面各自可点。" },
    { name: "Item active", type: "boolean", default: "false", description: "选中：data-active，accent 底 + accent-foreground + 1px 描边（同 Tree）。读屏自动补 aria-current；role=\"option\" 时补 aria-selected。" },
    { name: "Item size", type: '"sm" | "default" | "lg"', default: '"default"', description: "与 Avatar 的 24 / 32 / 40px 对齐：ItemMedia 的方块跟着变，放 Avatar 时给同档 size。触屏自动加高到 40 / 44px。不传时读 ItemGroup 的。" },
    { name: "Item variant", type: '"default" | "outline" | "muted"', default: '"default"', description: "default 透明行（列表）；outline 1px 描边卡片行（组内行距自动加大）；muted 浅底。" },
    { name: "Item interactive", type: "boolean", default: "asChild || onClick", description: "是否有悬停底色与手型指针。" },
    { name: "Item disabled", type: "boolean", default: "false", description: "半透明、不可点，补 aria-disabled；roving 时跳过。" },
    { name: "ItemMedia variant", type: '"default" | "icon" | "image"', default: '"default"', description: "default 放 Avatar 等自带尺寸的内容；icon 圆角方块里一个图标（导航、文件类型）；image 缩略图铺满。icon / image 的边长跟随行尺寸。" },
    { name: "ItemContent / ItemTitle", type: "div", description: "中间列占满剩余宽度且可收缩；标题单行省略号。" },
    { name: "ItemDescription lines", type: "1 | 2 | 3", default: "1", description: "副标题最多几行，超出省略号。可放多个（如邮件的主题 + 摘要）。" },
    { name: "ItemMeta", type: "div", description: "右侧时间 / 未读数 / 角标，竖排右对齐，等宽数字，一直显示。" },
    { name: "ItemActions reveal", type: '"hover" | "swap" | "always"', default: '"hover"', description: "hover：有悬停能力的指针设备上，悬停 / 键盘聚焦到行内 / 选中时淡入，占位不变不跳布局；swap：悬停时盖到 ItemMeta 的位置并把它淡出（Gmail 式），不占位；always：常显。触屏（无悬停）上 hover / swap 都常显。" },
    { name: "ItemSeparator inset", type: "boolean", default: "false", description: "1px 分隔线；inset 时从内容列开始，按 ItemGroup 的尺寸跳过媒体列（sm 40 / default 54 / lg 64px）。" },
    { name: "ItemGroup size / variant", type: "同 Item", description: "组内行的默认尺寸与外观，行自己传的优先。" },
    { name: "ItemGroup highlight", type: '"static" | "slide"', default: '"static"', description: "选中底色：static 每行自己铺；slide 组里一块底色（data-slot=\"item-highlight\"）从旧行滑到新行。自带 FLIP（Web Animations，只动 transform），不需要 MotionProvider；位置相对 ItemGroup 量，列表滚动中、祖先缩放时都对得上；行增删 / 重排 / 变高时下一帧直接到位；中途再点从当前画面位置接着滑。服务端渲染与首帧前选中行先自己铺底，不闪。减弱动效时直接到位。" },
    { name: "ItemGroup highlightEasing / highlightDuration", type: '"ease" | "spring" | string / number', default: '"ease" / 220', description: "滑动曲线：ease 缓出；spring 由弹簧模拟生成的 CSS linear() 缓动（有一点回弹，时长由弹簧决定）；也可传任意 CSS 缓动串（如 \"cubic-bezier(0.65, 0, 0.35, 1)\"）。时长 ms（spring 时不用）。" },
    { name: "ItemGroup roving / loop", type: "boolean", default: "false / true", description: "键盘 ↑ ↓ Home End 在可聚焦行（a / button / tabindex）之间移动焦点。整组任何时候都只有一个 Tab 位（上次聚焦、否则选中、否则第一行）：行增删、禁用、选中变化都由 MutationObserver 即时重排，不依赖重渲染；聚焦的行被删掉时焦点移到相邻行。loop 到头回到另一端。行内输入框的方向键不拦。" },
  ],
};
