import type { DocEntry, Values } from "../types";

/** MentionInput 上与组件默认值不同的属性 (默认值不写); 换行缩进 6 格 */
const flags = (v: Values) =>
  [
    Number(v.maxItems) !== 8 ? `maxItems={${Number(v.maxItems)}}` : "",
    v.highlight === "off" ? "highlight={false}" : v.highlight === "background" ? 'highlight="background"' : "",
    v.placement !== "auto" ? `placement="${v.placement}"` : "",
    v.anchor !== "trigger" ? `anchor="${v.anchor}"` : "",
    !v.autoGrow ? "autoGrow={false}" : "",
    Number(v.maxRows) !== 8 ? `maxRows={${Number(v.maxRows)}}` : "",
    !v.hint ? "hint={false}" : "",
    Number(v.popoverWidth) !== 288 ? `popoverWidth={${Number(v.popoverWidth)}}` : "",
  ]
    .filter(Boolean)
    .map((s) => `\n      ${s}`)
    .join("");

const usage = (v: Values) => {
  const full = v.triggers !== "at";
  const at = v.async
    ? `  // 异步候选: 返回 Promise 即可, 自带防抖 (debounce, 默认 150ms) 与 "加载中", 过期请求的结果会被丢弃\n  { char: "@", items: (q) => api.searchMembers(q), label: "提及成员" },`
    : `  { char: "@", items: members, label: "提及成员" }, // MentionItem: id, label, group, icon, tag, description, keywords`;
  const triggers = full
    ? `const triggers: MentionTrigger[] = [\n${at}\n  { char: "#", items: topics, label: "话题", tone: "info" },\n  // 斜杠命令: 只在行首触发, 不计入 mentions\n  { char: "/", items: commands, label: "命令", startOfLine: true, track: false },\n];\n`
    : `const triggers: MentionTrigger[] = [\n${at}\n];\n`;
  return `import * as React from "react";\nimport { MentionInput, type MentionTrigger } from "@/components/ui/mention-input";\n\n${triggers}\nexport function Composer({ onSend }: { onSend: (text: string, mentions: string[]) => void }) {\n  const [text, setText] = React.useState("");\n  const [mentions, setMentions] = React.useState<string[]>([]);\n  return (\n    <MentionInput\n      aria-label="消息"\n      value={text}\n      onValueChange={setText}\n      triggers={triggers}\n      onMentionsChange={setMentions}${flags(v)}\n      onKeyDown={(e) => {\n        // 候选浮层开着时 Enter / Tab 被组件拿去确认, 不会走到这里\n        if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {\n          e.preventDefault();\n          onSend(text, mentions);\n          setText("");\n        }\n      }}\n    />\n  );\n}\n`;
};

const BASE = {
  triggers: "all",
  async: false,
  maxItems: 8,
  highlight: "text",
  placement: "auto",
  anchor: "trigger",
  autoGrow: true,
  maxRows: 8,
  hint: true,
  popoverWidth: 288,
};

export const mentionInput: DocEntry = {
  slug: "mention-input",
  name: "MentionInput",
  en: "MentionInput",
  title: "提及输入",
  section: "ui",
  group: "表单",
  description:
    "多行输入框里打 @（也可以配 #、/ 等触发符，各自有候选源）时在光标处弹出候选：可分组、带头像和类型标签，上下键选择，Enter / Tab 确认，Esc 关闭，关闭时淡出。中文输入法选字时候选按拼音实时预过滤（Enter 仍交给输入法）。选中后插入「@名字 」并把光标放到后面，提及文字直接染成主题色（光标、选区、撤销仍是原生的），onMentionsChange 给出已选 id，文字被删时同步移除、撤销找回时一起恢复。还有：异步候选（防抖 + 加载中），浮层上下翻转，随内容长高。",
  file: "src/components/ui/mention-input.tsx",
  importFrom: "@/components/ui/mention-input",
  demo: () => import("./mention-input.demo"),
  source: () => import("@/components/ui/mention-input.tsx?raw").then((m) => m.default),
  defaults: { ...BASE },
  componentDefaults: {},
  stageHeight: 620,
  demoOnly: ["triggers", "async"],
  presets: [
    { label: "群聊输入框", values: { ...BASE } },
    { label: "只有 @", values: { ...BASE, triggers: "at" } },
    { label: "异步候选", values: { ...BASE, triggers: "at", async: true } },
    { label: "紧凑浮层", values: { ...BASE, maxItems: 5, popoverWidth: 240, hint: false } },
    { label: "跟随光标 · 底色高亮", values: { ...BASE, anchor: "caret", highlight: "background" } },
    { label: "固定高度", values: { ...BASE, autoGrow: false, maxRows: 4 } },
  ],
  controls: [
    { type: "select", key: "triggers", label: "触发符", options: [{ value: "all", label: "@ 提及 + # 话题 + / 命令" }, { value: "at", label: "只有 @" }] },
    { type: "toggle", key: "async", label: "@ 异步候选" },
    { type: "number", key: "maxItems", label: "最大候选数", min: 3, max: 12, step: 1 },
    { type: "select", key: "highlight", label: "高亮提及", options: [{ value: "text", label: "文字着色" }, { value: "background", label: "垫底色" }, { value: "off", label: "关闭" }] },
    { type: "select", key: "placement", label: "浮层位置", options: [{ value: "auto", label: "自动翻转" }, { value: "bottom", label: "优先下方" }, { value: "top", label: "优先上方" }] },
    { type: "select", key: "anchor", label: "浮层对齐", options: [{ value: "trigger", label: "触发符" }, { value: "caret", label: "跟随光标" }] },
    { type: "toggle", key: "autoGrow", label: "自动增高" },
    { type: "number", key: "maxRows", label: "最多行数", min: 2, max: 12, step: 1 },
    { type: "toggle", key: "hint", label: "键盘提示" },
    { type: "number", key: "popoverWidth", label: "浮层宽度", min: 220, max: 420, step: 4, unit: "px" },
  ],
  usage,
  props: [
    { name: "value / defaultValue / onValueChange", type: "string", description: "文本，受控或非受控。原生 onChange 也照常触发。" },
    { name: "triggers", type: "MentionTrigger[]", description: "触发符与各自的候选：char（如 \"@\" \"#\" \"/\"）、items（数组或 (query) => 数组 / Promise）、label（浮层的读屏名）、startOfLine（只在行首触发，斜杠命令用）、allowSpaces（查询词可含空格）、filter、renderItem、empty（无匹配时显示）、track（是否计入 mentions，默认 true）、tone（高亮底色：brand / info / success / warning）。" },
    { name: "items", type: "MentionItem[] | (query) => …", description: "只有 \"@\" 一种触发时的简写；给了 triggers 就忽略。" },
    { name: "MentionItem", type: "{ id, label, value?, description?, icon?, tag?, group?, keywords?, disabled?, data? }", description: "候选项：value 是插入的名字（默认 label）；icon 头像 / 图标；tag 行尾类型标签（如「Agent」）；group 分组名（如 全体 / 群 Agent / 成员，按第一次出现排序）；keywords 额外参与过滤的词（拼音、英文名）。" },
    { name: "onMentionsChange", type: "(ids: string[], mentions: MentionRecord[]) => void", description: "已选提及变化：插入新的，或文字里的「@名字」被删 / 改坏。MentionRecord = { id, trigger, value }，发送时带上 ids。" },
    { name: "defaultMentions", type: "MentionRecord[]", description: "编辑已有草稿时，文本里已经存在的提及。" },
    { name: "onMentionSelect", type: "(item, trigger) => void", description: "选中候选时（插入之前），斜杠命令在这里执行。" },
    { name: "maxItems", type: "number", default: "8", description: "浮层最多显示几条（名字以查询词开头的排前面）。" },
    { name: "highlight", type: 'boolean | "text" | "background"', default: '"text"', description: "高亮已插入的提及。\"text\"（= true）：输入框文字透明、只留原生光标与选区，可见文字由下面同排版的 overlay 画，提及染成触发符的 tone 色；输入法组合期间临时换回输入框自己画字（保证组合下划线可见）。\"background\"：文字仍由输入框画，overlay 只垫底色。false：不高亮。overlay 与输入框在同一个滚动容器里一起原生滚动，不会错位。" },
    { name: "placement", type: '"auto" | "bottom" | "top"', default: '"auto"', description: "浮层在光标行下方 / 上方；放不下时自动翻到另一侧，左右夹在视口内，不遮挡正在输入的那一行。" },
    { name: "anchor", type: '"trigger" | "caret"', default: '"trigger"', description: "浮层对齐触发符（打字时不跟着抖）或当前光标。坐标由隐藏的镜像 div 量出，滚动 / 改尺寸时 rAF 重新定位。" },
    { name: "autoGrow", type: "boolean", default: "true", description: "随内容长高（field-sizing；Firefox 等不支持时用 JS 量高度），在 minRows 与 maxRows 之间，超过后外层滚动；false 时固定 minRows 行高，超出滚动。" },
    { name: "minRows / maxRows", type: "number", default: "2 / 8", description: "行数范围，也写在 CSS 变量 --mi-min / --mi-max 上。" },
    { name: "variant", type: '"default" | "ghost"', default: '"default"', description: "default 与 Textarea 同款边框和聚焦环；ghost 无边框无底，嵌进自己的输入卡片（工具条、发送按钮）里用。" },
    { name: "popoverWidth / popoverClassName", type: "number / string", default: "288", description: "浮层宽度与附加类名。" },
    { name: "debounce", type: "number", default: "150", description: "异步候选的防抖（ms）；第一次立即请求，之后防抖，期间保留上一批结果并显示加载中。" },
    { name: "loading", type: "boolean", default: "false", description: "强制显示加载中。" },
    { name: "hint", type: "boolean", default: "true", description: "浮层底部的键盘提示。" },
    { name: "emptyText", type: "ReactNode", default: '"没有匹配项"', description: "无匹配时显示（触发符自己的 empty 优先）。" },
    { name: "renderItem", type: "(item, { active, query, trigger, composing }) => ReactNode", description: "所有触发符共用的候选渲染；composing 为 true 时是输入法选字中的预览。" },
    { name: "撤销 / 重做", type: "Ctrl/⌘+Z, Ctrl/⌘+Shift+Z", description: "插入提及走 execCommand(\"insertText\")，进浏览器原生撤销栈；极少数不可用的环境里组件自己维护撤销栈接管这两个快捷键。撤销 / 重做把「@名字」找回来时，对应的提及也一起回到 mentions。" },
    { name: "className / textareaClassName", type: "string", description: "className 给外层（边框所在），textareaClassName 给输入框本身（高亮层同步）。其余属性（placeholder、disabled、name、onKeyDown…）透传给 textarea；浮层开着时 Enter / Tab / 方向键 / Esc 被组件处理，不会传到 onKeyDown。能放进 Field。" },
    { name: "findTrigger / findTriggerComposing / insertMention / syncMentions / mentionRanges", type: "函数", description: "一并导出的纯逻辑：找光标前的触发（含输入法组合串预过滤版）、插入提及、同步提及列表、求高亮区间（消息气泡里给提及上色也能用）。" },
    { name: "data-slot", type: "mention-input / mention-input-scroller / mention-input-highlight / mention-input-mark / mention-input-textarea / mention-input-popover / mention-input-item", description: "各部分的定位钩子；外层有 data-open、data-composing、data-highlight，浮层有 data-state=open|closed、data-side=top|bottom。" },
  ],
};
