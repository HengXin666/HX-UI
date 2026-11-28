import type { DocEntry, Values } from "../types";

const IMPORT = `import { Chip, ChipGroup } from "@/components/ui/chip-group";\n`;

/** ChipGroup 上与组件默认值不同的属性 (默认值不写) */
const groupFlags = (v: Values) =>
  [
    v.size !== "default" ? ` size="${v.size}"` : "",
    v.variant !== "soft" ? ` variant="${v.variant}"` : "",
    v.animation !== "slide" ? ` animation="${v.animation}"` : "",
    Number(v.duration) !== 220 ? ` duration={${Number(v.duration)}}` : "",
    !v.fade ? " fade={false}" : "",
    v.scrollButtons ? " scrollButtons" : "",
    v.counts && v.zeroCount !== "dim" ? ` zeroCount="${v.zeroCount}"` : "",
  ].join("");

/** 单选 / 多选的状态与绑定 */
const state = (v: Values, initial: string[]) =>
  v.type === "multiple"
    ? { decl: `  const [value, setValue] = React.useState<string[]>(${JSON.stringify(initial)});`, bind: ` type="multiple" value={value} onValueChange={setValue}` }
    : initial[0]
      ? { decl: `  const [value, setValue] = React.useState(${JSON.stringify(initial[0])});`, bind: ` value={value} onValueChange={setValue}` }
      : { decl: `  // null = 不筛选 (选中「全部」)\n  const [value, setValue] = React.useState<string | null>(null);`, bind: ` value={value} onValueChange={(v, { all }) => setValue(all ? null : v)}` };

const chip = (v: Values, value: string, label: string, count: number, icon: string) =>
  `      <Chip value="${value}"${v.counts ? ` count={${count}}` : ""}${v.icons ? ` icon={<${icon} />}` : ""}>${label}</Chip>`;

const allProps = (v: Values, count: number) => (v.all ? ` all${v.counts ? ` allCount={${count}}` : ""}` : "");

const USAGE: Record<string, (v: Values) => string> = {
  mail: (v) => {
    const s = state(v, []);
    return `${IMPORT}${v.icons ? `import { InboxIcon, MailIcon, ShieldIcon } from "lucide-react";\n` : ""}\n// 邮件厂商筛选 (HX-AIOA MailView): "全部" = 不筛选\nexport function MailFilter() {\n${s.decl}\n  return (\n    <ChipGroup aria-label="按邮箱筛选"${s.bind}${allProps(v, 24)}${groupFlags(v)}>\n${[
      chip(v, "gmail", "Gmail", 12, "MailIcon"),
      chip(v, "outlook", "Outlook", 3, "InboxIcon"),
      chip(v, "qq", "QQ 邮箱", 0, "MailIcon"),
      chip(v, "company", "企业邮箱", 7, "ShieldIcon"),
    ].join("\n")}\n    </ChipGroup>\n  );\n}\n`;
  },
  feed: (v) => {
    const s = state(v, v.type === "multiple" ? ["ai", "frontend"] : ["ai"]);
    return `${IMPORT}${v.icons ? `import { BotIcon, CodeIcon, FlameIcon, SparklesIcon } from "lucide-react";\n` : ""}\n// 信息流类别 (HX-AIOA FeedView): 类别多时横向滚动, 只在有溢出的一侧渐隐; 竖向滚轮也能横滚\nexport function FeedTopics() {\n${s.decl}\n  return (\n    <ChipGroup aria-label="信息流类别"${s.bind}${allProps(v, 0)}${groupFlags(v)}>\n${[
      chip(v, "hot", "热门", 128, "FlameIcon"),
      chip(v, "ai", "AI", 64, "SparklesIcon"),
      chip(v, "frontend", "前端", 41, "CodeIcon"),
      chip(v, "agent", "Agent", 23, "BotIcon"),
    ].join("\n")}\n    </ChipGroup>\n  );\n}\n`;
  },
  todo: (v) => {
    const s = state(v, ["today"]);
    return `${IMPORT}${v.icons ? `import { AlarmClockIcon, CalendarDaysIcon, CheckCircle2Icon } from "lucide-react";\n` : ""}\n// 待办筛选 (HX-AIOA TodoBoard)\nexport function TodoFilter({ counts }: { counts: Record<string, number> }) {\n${s.decl}\n  return (\n    <ChipGroup aria-label="待办筛选"${s.bind}${allProps(v, 18)}${groupFlags(v)}>\n${[
      chip(v, "today", "今天", 5, "CalendarDaysIcon").replace("count={5}", "count={counts.today}"),
      chip(v, "overdue", "已逾期", 2, "AlarmClockIcon").replace("count={2}", "count={counts.overdue}"),
      chip(v, "done", "已完成", 0, "CheckCircle2Icon").replace("count={0}", "count={counts.done}"),
    ].join("\n")}\n    </ChipGroup>\n  );\n}\n`;
  },
};

const BASE = {
  type: "single",
  size: "default",
  variant: "soft",
  animation: "slide",
  duration: 220,
  fade: true,
  scrollButtons: false,
  counts: true,
  icons: false,
  zeroCount: "dim",
  all: true,
  width: 420,
};

export const chipGroup: DocEntry = {
  slug: "chip-group",
  name: "ChipGroup",
  en: "ChipGroup",
  title: "筛选标签",
  section: "ui",
  group: "操作",
  description:
    "一排可横向滚动的筛选标签：文字 + 计数徽标 + 可选图标，单选或多选，可带「全部」一键清空。超出宽度时横向滚动、隐藏滚动条，只在有被裁内容的一侧渐隐，可加左右滚动按钮，竖向滚轮自动转横向，选中项自动滚进视野。单选时选中底色从旧标签滑到新标签（clip-path 过渡，圆角不变形）。键盘：Tab 进组，方向键 / Home / End 切换。",
  file: "src/components/ui/chip-group.tsx",
  importFrom: "@/components/ui/chip-group",
  demo: () => import("./chip-group.demo"),
  source: () => import("@/components/ui/chip-group.tsx?raw").then((m) => m.default),
  defaults: { example: "mail", ...BASE },
  componentDefaults: {},
  stageHeight: 520,
  demoOnly: ["example", "width", "counts", "icons"],
  presets: [
    { label: "邮件厂商", values: { ...BASE, example: "mail" } },
    { label: "信息流 · 多选", values: { ...BASE, example: "feed", type: "multiple", icons: true, all: false, width: 380 } },
    { label: "待办 · 描边", values: { ...BASE, example: "todo", variant: "outline", icons: true } },
    { label: "实心 · 紧凑", values: { ...BASE, example: "feed", variant: "solid", size: "sm", all: true, width: 340 } },
    { label: "滚动按钮", values: { ...BASE, example: "feed", scrollButtons: true, icons: true, width: 360 } },
    { label: "无动画", values: { ...BASE, example: "mail", animation: "none", fade: false } },
  ],
  controls: [
    {
      type: "select",
      key: "example",
      label: "示例",
      options: [
        { value: "mail", label: "邮件厂商筛选" },
        { value: "feed", label: "信息流类别" },
        { value: "todo", label: "待办筛选" },
      ],
    },
    { type: "select", key: "type", label: "选择方式", options: [{ value: "single", label: "单选" }, { value: "multiple", label: "多选" }] },
    { type: "select", key: "variant", label: "变体", options: [{ value: "soft", label: "柔和" }, { value: "outline", label: "描边" }, { value: "solid", label: "实心" }] },
    { type: "select", key: "size", label: "尺寸", options: [{ value: "default", label: "默认" }, { value: "sm", label: "紧凑" }] },
    { type: "toggle", key: "counts", label: "计数" },
    { type: "select", key: "zeroCount", label: "计数为 0", options: [{ value: "dim", label: "变淡" }, { value: "hide", label: "隐藏计数" }, { value: "show", label: "照常" }] },
    { type: "toggle", key: "icons", label: "图标" },
    { type: "toggle", key: "all", label: "「全部」" },
    { type: "toggle", key: "fade", label: "两端渐隐" },
    { type: "toggle", key: "scrollButtons", label: "滚动按钮" },
    { type: "select", key: "animation", label: "选中动画", options: [{ value: "slide", label: "滑动跟随" }, { value: "fade", label: "淡入" }, { value: "none", label: "无" }] },
    { type: "number", key: "duration", label: "动画时长", min: 80, max: 600, step: 20, unit: "ms" },
    { type: "number", key: "width", label: "容器宽度", min: 260, max: 720, step: 10, unit: "px" },
  ],
  usage: (v) => (USAGE[String(v.example)] ?? USAGE.mail)(v),
  props: [
    { name: "type", type: '"single" | "multiple"', default: '"single"', description: "单选（role=radiogroup，方向键即选中）或多选（role=group，标签是 aria-pressed 的开关按钮，方向键只移焦点，空格 / 回车切换）。" },
    { name: "value / defaultValue / onValueChange", type: "string | null | string[]", description: "单选时是字符串，null 表示没有选中（有「全部」时即选中「全部」）；onValueChange(value, { all })，没有选中时 value 为 \"\"、all 为 true。旧写法 \"\" 仍兼容：没有 value=\"\" 的标签时等同 null。「全部」用内部 Symbol 标识，不占用任何字符串值。多选时是数组，[] 表示没有选中。" },
    { name: "deselectable", type: "boolean", default: "false", description: "单选时再点一次已选中的标签取消选中。" },
    { name: "all", type: "boolean | ReactNode", default: "false", description: "最前面加一个「全部」标签，选中它 = 清空；true 用默认文字，也可传自己的内容。" },
    { name: "allCount", type: "number", description: "「全部」标签的计数。" },
    { name: "variant", type: '"soft" | "outline" | "solid"', default: '"soft"', description: "soft：浅底标签，选中品牌色淡底；outline：1px 描边，选中 accent 底（同 Tree 的选中态）；solid：选中前景色实心。" },
    { name: "size", type: '"sm" | "default"', default: '"default"', description: "高 28 / 32px，触屏下自动加高到 36 / 40px。" },
    { name: "animation", type: '"slide" | "fade" | "none"', default: '"slide"', description: "选中态过渡。slide：单选时选中底色从旧标签滑到新标签并伸缩到新宽度（clip-path 裁出胶囊形，圆角全程不变形；描边 / 阴影在标签上淡入），中途再切换从当前位置接着滑（多选时同 fade）；fade：每个标签自己的底块淡入并轻微等比放大；none：直接切换。只动 clip-path / transform / opacity，系统开了减弱动效时不位移。" },
    { name: "duration", type: "number", default: "220", description: "选中过渡时长（ms），也写在 CSS 变量 --chip-duration 上。" },
    { name: "fade", type: "boolean", default: "true", description: "溢出时两端渐隐（mask-image），只在还有被裁内容的那一侧出现，随滚动实时切换。" },
    { name: "fadeWidth", type: "number", default: "28", description: "渐隐宽度（px）；选中项滚进视野时两侧也留出这么宽，不会停在半透明的边上。" },
    { name: "scrollButtons", type: "boolean", default: "false", description: "溢出时两端显示左右滚动按钮，一次滚过 70% 宽度；不进 Tab 序（键盘用方向键）。" },
    { name: "wheel", type: "boolean", default: "true", description: "竖向滚轮转成横向滚动；滚到头时不拦截，交还给页面。" },
    { name: "zeroCount", type: '"show" | "dim" | "hide"', default: '"dim"', description: "计数为 0 时：照常显示 / 整个标签变淡（仍可点，选中时恢复）/ 不显示计数。" },
    { name: "countMax", type: "number", default: "999", description: "计数超过它显示「999+」。" },
    { name: "disabled", type: "boolean", default: "false", description: "禁用整组。" },
    { name: "Chip", type: "value, count?, icon?, disabled?, children", description: "一个标签：value 必填；count 计数徽标；icon 前置图标；其余属性透传给 button（className、onClick、title…）。可以包在自己的组件里，顺序按 DOM 读。" },
    { name: "data-slot", type: "chip-group / chip-group-viewport / chip / chip-indicator / chip-ring / chip-count / chip-icon / chip-group-scroll", description: "各部分的定位钩子；标签有 data-state=on|off、data-zero（「全部」另有 data-all），外层有 data-overflow=start|end|both，可用 Tailwind 的 data-* 变体自定义外观。" },
  ],
};
