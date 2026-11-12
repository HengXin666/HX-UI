import { LikeBurst } from "../../../../../../src/controls";
import likeRaw from "../../../../../../src/controls/press/signal/LikeBurst.tsx?raw";
import { initialValues, range, select, toggle, type ControlDef, type PageSpec, type Values } from "../../types";
import { controlUsage } from "../shared";

/**
 * controls 批 1: 点赞. 演示是一条文章的点赞数; 粒子与心跳只在点亮那半秒出现, 舞台右上角重播或直接点它看.
 */

const CONTROLS: readonly ControlDef[] = [
  select("icon", "图标", ["heart", "star", "thumb"], "heart", '"heart" | "star" | "thumb"', "心, 星或大拇指."),
  toggle("defaultLiked", "初始已赞", false, "非受控的初始状态; 计数按它加减."),
  range("count", "基数", [0, 2000, 1], 128, "不含本人这一下的计数."),
  toggle("showCount", "显示计数", true, "关掉后只剩图标, 读屏标签也不再带数字."),
  toggle("idleOutline", "未赞描边", true, "未赞时画描边图标; 关掉画实心灰图标."),
  range("size", "尺寸", [28, 64, 2], 48, "按钮高度与图标区边长 px, 图标是它的一半."),
  range("corner", "圆角", [0, 32, 1], 32, "圆角 px."),
  range("dotSize", "粒子大小", [0.1, 0.6, 0.05], 0.3, "外飞粒子直径相对图标的比例."),
  range("duration", "迸发时长", [200, 1200, 20], 560, "弹出, 心跳与粒子一共多久 ms."),
  toggle("disabled", "禁用", false, "半透明, 不响应."),
];
const BASE = initialValues(CONTROLS);

export const LIKE_BURST: PageSpec = {
  id: "like-burst",
  kind: "control",
  importName: "LikeBurst",
  source: "src/controls/press/signal/LikeBurst.tsx",
  raw: likeRaw,
  deps: ["lucide-react"],
  controls: CONTROLS,
  height: 260,
  render: (props) => (
    <article className="w-[min(22rem,calc(100vw-6rem))] rounded-2xl border border-border bg-card p-4 text-left">
      <p className="text-[12px] text-muted-foreground">林知夏 · 3 小时前</p>
      <p className="mt-1.5 text-[14px] font-medium leading-snug text-foreground">controls 层 50 件, 每件都带减少动效对照</p>
      <p className="mt-1.5 text-[12.5px] leading-relaxed text-muted-foreground">把动效当信息还是装饰, 决定了它在 reduce 下该去掉还是保留.</p>
      <div className="mt-3 flex items-center justify-between">
        <span className="text-[12px] text-muted-foreground">阅读 2,418</span>
        <LikeBurst {...props} label="点赞这篇文章" />
      </div>
    </article>
  ),
  usage: (values: Values) => controlUsage("LikeBurst", { ...values, label: "点赞这篇文章" }, { ...BASE, size: 40, count: -1, label: "" }),
  propDesc: {
    onChange: "切换后调用, 参数是新的点赞状态与新计数.",
    overshoot: "弹出那一下的回弹力度 (back-out 系数).",
    beat: "弹出后的心跳次数, 逐次衰减.",
    rollDuration: "计数纵向滚一格的时长 ms.",
    label: "读屏标签; 显示计数时读成 \"标签, 数字\". 默认 Like.",
  },
  propsNote: "根元素是 <button aria-pressed>, 粒子与滚动的数字都 aria-hidden, 计数经 aria-label 读出.",
  examples: [
    {
      id: "icons",
      title: "三种图标",
      desc: "收藏用星, 赞同用大拇指; 已赞态都落在 danger 色.",
      code: `<LikeBurst icon="star" count={42} label="收藏" />\n<LikeBurst icon="thumb" count={9} defaultLiked label="赞同" />\n<LikeBurst icon="heart" showCount={false} label="喜欢" />`,
      render: () => (
        <>
          <LikeBurst icon="star" count={42} label="收藏" />
          <LikeBurst icon="thumb" count={9} defaultLiked label="赞同" />
          <LikeBurst icon="heart" showCount={false} label="喜欢" />
        </>
      ),
    },
  ],
  keyboard: [
    { keys: ["Tab"], action: "聚焦按钮, 出 1px 焦点环." },
    { keys: ["Enter"], action: "切换点赞; aria-pressed 随之改变, 读屏器读出新计数." },
    { keys: ["Space"], action: "同 Enter." },
  ],
  reduced: {
    desc: "减少动效下只换色和数字: 没有弹出, 心跳与粒子, 计数直接换成新值.",
    notes: ["点亮时图标不弹出, 不跳心跳, 不放粒子.", "计数不滚动, 直接显示新值.", "按下不缩放, 颜色切换没有过渡."],
  },
};
