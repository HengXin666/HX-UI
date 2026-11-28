import type { DocEntry, Values } from "../types";

const IMPORT = `import { VirtualList, type VirtualListHandle } from "@/components/ui/virtual-list";\n`;

/** 组件默认值: 与它相同的参数在用法代码里省略 */
const DEFAULTS = { overscan: 6, estimateSize: 48, followThreshold: 64 };

/** 调参生成的属性 (每个一行); reverse 由示例决定基线: 聊天默认反向 */
const tuned = (v: Values, indent: string, reverseBase: boolean) => {
  const out: string[] = [];
  if (Boolean(v.reverse) !== reverseBase) out.push(v.reverse ? "reverse" : "reverse={false}");
  if (Number(v.estimateSize) !== DEFAULTS.estimateSize) out.push(`estimateSize={${Number(v.estimateSize)}}`);
  if (Number(v.overscan) !== DEFAULTS.overscan) out.push(`overscan={${Number(v.overscan)}}`);
  if (Number(v.followThreshold) !== DEFAULTS.followThreshold && (v.reverse || reverseBase)) out.push(`followThreshold={${Number(v.followThreshold)}}`);
  if (v.smooth) out.push(`scrollBehavior="smooth"`);
  return out.map((p) => `\n${indent}${p}`).join("");
};

const USAGE: Record<string, (v: Values) => string> = {
  mail: (v) =>
    `${IMPORT}\nexport function MailList({ mails }: { mails: Mail[] }) {\n  const list = React.useRef<VirtualListHandle>(null);\n  // 定位到第 n 封并居中; 先按估算位置滚过去, 量出真实高度后自动二次校正\n  const locate = (n: number) => list.current?.scrollToIndex(n, { align: "center" });\n  return (\n    <VirtualList\n      ref={list}\n      aria-label="邮件"\n      className="h-full"\n      items={mails} // ${Number(v.count).toLocaleString()} 封\n      getKey={(m) => m.id}\n      renderItem={(m) => <MailRow mail={m} />}${tuned(v, "      ", false)}\n    />\n  );\n}\n`,
  chat: (v) =>
    `${IMPORT}\nexport function Conversation({ messages, loadOlder }: { messages: Msg[]; loadOlder: () => void }) {\n  const list = React.useRef<VirtualListHandle>(null);\n  const [unseen, setUnseen] = React.useState(0);\n  return (\n    <div className="relative h-full">\n      <VirtualList\n        ref={list}\n        role="log"\n        className="h-full"\n        items={messages}\n        getKey={(m) => m.id}\n        renderItem={(m) => <Bubble message={m} />}${tuned(v, "        ", false)}\n        onStartReached={loadOlder} // 可返回 Promise; 首页不满一屏会自动接着加载, 前插后位置不跳\n        onUnseenChange={setUnseen} // 不在底部时到达的新消息数\n        header={<LoadingOlder />}\n      />\n      {unseen > 0 && (\n        <button type="button" onClick={() => list.current?.scrollToBottom({ behavior: "smooth" })}>\n          {unseen} 条新消息\n        </button>\n      )}\n    </div>\n  );\n}\n`,
  "chat-scroll-area": (v) =>
    `${IMPORT}import { ScrollArea } from "@/components/ui/scroll-area";\n\n// 反向列表放进 ScrollArea: 内容不满一屏也贴底 (列表自己量出最小高度)\nexport function Conversation({ messages, loadOlder }: { messages: Msg[]; loadOlder: () => Promise<void> }) {\n  return (\n    <ScrollArea className="h-full">\n      <VirtualList\n        scrollParent="scroll-area"\n        role="log"\n        items={messages}\n        getKey={(m) => m.id}\n        renderItem={(m) => <Bubble message={m} />}${tuned(v, "        ", false)}\n        onStartReached={loadOlder} // 一页只有 ${Number(v.pageSize)} 条也会自动加载到填满\n      />\n    </ScrollArea>\n  );\n}\n`,
  feed: (v) =>
    `${IMPORT}import { ScrollArea } from "@/components/ui/scroll-area";\n\nexport function Feed({ posts, loadMore }: { posts: Post[]; loadMore: () => void }) {\n  return (\n    <ScrollArea className="h-full">\n      <FeedHeader /> {/* 列表上方的内容, 偏移自动量出 */}\n      <VirtualList\n        scrollParent="scroll-area"\n        items={posts}\n        getKey={(p) => p.id}\n        renderItem={(p) => <FeedCard post={p} />}${tuned({ ...v, reverse: false, smooth: false }, "        ", false)}\n        onEndReached={loadMore}\n        footer={<LoadingMore />}\n      />\n    </ScrollArea>\n  );\n}\n`,
};

export const virtualList: DocEntry = {
  slug: "virtual-list",
  name: "VirtualList",
  title: "虚拟列表",
  section: "ui",
  group: "数据",
  description:
    "只渲染视口附近几十行的长列表：群消息、邮件、信息流上万条也不卡，CPU / GPU 占用与总条数无关。行高可以不固定（量过后按 key 缓存），支持反向聊天列表（贴底、在底部才跟随新消息、不在底部时报告新消息数、滚到顶加载更早的且位置不跳），ref 句柄定位到某条（居中 / 贴顶 / 贴底，可平滑，量完自动二次校正）。零依赖，可放进 ScrollArea。",
  file: "src/components/ui/virtual-list.tsx",
  importFrom: "@/components/ui/virtual-list",
  demo: () => import("./virtual-list.demo"),
  source: () => import("@/components/ui/virtual-list.tsx?raw").then((m) => m.default),
  defaults: { example: "mail", overscan: 6, estimateSize: 96, reverse: false, followThreshold: 64, smooth: true, count: 10000, pageSize: 40 },
  componentDefaults: {},
  stageHeight: 640,
  presets: [
    { label: "1 万封邮件", values: { example: "mail", reverse: false, estimateSize: 96, count: 10000 } },
    { label: "反向聊天", values: { example: "chat", reverse: true, estimateSize: 72, count: 2000 } },
    { label: "首页只有 3 条 (自动续载)", values: { example: "chat", reverse: true, estimateSize: 72, count: 2000, pageSize: 3 } },
    { label: "ScrollArea 里的聊天", values: { example: "chat-scroll-area", reverse: true, estimateSize: 72, count: 2000, pageSize: 4 } },
    { label: "ScrollArea 信息流", values: { example: "feed", reverse: false, estimateSize: 110, count: 1000 } },
    { label: "10 万条压测", values: { example: "mail", reverse: false, estimateSize: 96, count: 100000, overscan: 4 } },
  ],
  controls: [
    {
      type: "select",
      key: "example",
      label: "示例",
      options: [
        { value: "mail", label: "邮件列表" },
        { value: "chat", label: "反向聊天" },
        { value: "chat-scroll-area", label: "ScrollArea 里的聊天" },
        { value: "feed", label: "ScrollArea 信息流" },
      ],
    },
    { type: "number", key: "count", label: "条数", min: 100, max: 100000, step: 100 },
    { type: "number", key: "pageSize", label: "聊天每页", min: 1, max: 100, step: 1, unit: "条" },
    { type: "number", key: "overscan", label: "overscan", min: 0, max: 30, step: 1, unit: "行" },
    { type: "number", key: "estimateSize", label: "估算高度", min: 24, max: 240, step: 4, unit: "px" },
    { type: "toggle", key: "reverse", label: "反向 (贴底)" },
    { type: "number", key: "followThreshold", label: "跟随阈值", min: 0, max: 400, step: 8, unit: "px" },
    { type: "toggle", key: "smooth", label: "平滑滚动" },
  ],
  usage: (v) => (USAGE[String(v.example)] ?? USAGE.mail)(v),
  props: [
    { name: "items", type: "readonly T[]", description: "全部条目。只有视口附近（加 overscan）的会渲染进 DOM。" },
    { name: "getKey", type: "(item, index) => string | number", description: "稳定的 key：测量缓存、滚动锚点、追加 / 前插判断、scrollToKey 都靠它。前插、重排不会丢已量过的高度。" },
    { name: "renderItem", type: "(item, index) => ReactNode", description: "渲染一行。外层定位层由列表提供（绝对定位 + translateY），行内间距请写在你的元素里（会被一起测量）。用 useCallback 包住可避免已挂载行重渲染。" },
    { name: "estimateSize", type: "number | (item, index) => number", default: "48", description: "未测量行的估算高度（px）。越接近真实值，滚动条越稳、定位的二次校正越小。" },
    { name: "overscan", type: "number", default: "6", description: "视口上下各多渲染的行数。快速滚动时更不容易露白，代价是多几行 DOM。" },
    { name: "gap", type: "number", default: "0", description: "行间距（px），计入布局但不计入行的测量高度。" },
    { name: "reverse", type: "boolean", default: "false", description: "反向（聊天）：内容不满一屏时贴底，初次挂载滚到底，默认跟随新消息。" },
    { name: "followOutput", type: "boolean", default: "= reverse", description: "在底部时末尾追加的条目自动滚到底；最后一行变高（流式输出、图片加载完）也会贴住底部。" },
    { name: "followThreshold", type: "number", default: "64", description: "距底多少 px 以内算「在底部」：决定是否跟随，以及何时把未读数清零。" },
    { name: "scrollBehavior", type: '"auto" | "smooth"', default: '"auto"', description: "跟随与定位方法的默认滚动方式。系统开了减弱动效时平滑一律改为直接跳。" },
    { name: "onStartReached / startThreshold", type: "() => void | Promise / number", default: "240", description: "视口顶在距顶 startThreshold px 以内时调用（反向列表加载更早的消息）。不只看滚动：挂载后、条目变化后、测量后都会检查，首页不满一屏或加载完仍在阈值内会自动接着加载，调用方不用补。去重：触发后要等这一头真的多了条目（或离开区域再回来）才会再触发，加载到头自然停下；返回 Promise 时它结束前不会重复触发。前插后用 key 锚点保持位置（亚像素级不跳）。" },
    { name: "onEndReached / endThreshold", type: "() => void | Promise / number", default: "240", description: "视口在距底 endThreshold px 以内时调用（普通列表加载下一页），规则同上。" },
    { name: "onUnseenChange", type: "(count: number) => void", description: "不在底部时末尾新增的条数（回到底部清零），用来显示「有 N 条新消息」。" },
    { name: "onAtBottomChange", type: "(atBottom: boolean) => void", description: "是否在底部变化，可用来显示「回到底部」按钮。" },
    { name: "onRangeChange", type: "(range: VirtualRange) => void", description: "渲染区间变化：start / end 含 overscan，visibleStart / visibleEnd 是真正落在视口里的行。" },
    { name: "scrollParent", type: '"self" | "scroll-area" | RefObject<HTMLElement>', default: '"self"', description: "滚动容器。self 自带（给 className 一个高度）；scroll-area 用外层 ScrollArea 的 viewport；也可传任意滚动元素的 ref。列表上方的其他内容会自动计入偏移。反向列表在外部容器里同样贴底（自动量出最小高度）。" },
    { name: "header / footer", type: "ReactNode", description: "随内容滚动的上下插槽：加载更早的提示、「没有更多了」。高度变化时锚点保持，不跳。" },
    { name: "empty", type: "ReactNode", description: "没有条目时显示。" },
    { name: "itemClassName / itemRole", type: "string / AriaRole", description: "每行外层定位层的 className 与 role（列表 role=\"list\" 时传 \"listitem\"）。" },
    { name: "触屏惯性", type: "行为", description: "iOS / 安卓惯性滚动中写 scrollTop 会掐断惯性，所以触屏滚动期间（含松手后的惯性）前插、测量带来的位置修正先用内容层的 translateY 抵消，滚动停下（scrollend 或 120ms 无滚动）后再并回 scrollTop，惯性不断、画面不跳。桌面滚轮照常当帧修正。" },
    { name: "ref", type: "Ref<VirtualListHandle>", description: "句柄：scrollToIndex(i, { align, behavior }) / scrollToKey(key, …)，align 为 auto（已可见不动）/ start / center / end；scrollToBottom / scrollToTop；返回的 Promise 在校正完成时 resolve(true)，被用户滚动打断或目标不存在时 resolve(false)。另有 getScrollElement、isAtBottom、getUnseen、getRange、measure（清缓存重量）。" },
  ],
};
