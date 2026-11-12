import { TallyRoll } from "../../../../../../src/controls";
import tallyRaw from "../../../../../../src/controls/range/meter/TallyRoll.tsx?raw";
import { color, initialValues, range, select, text, toggle, type ControlDef, type PageSpec, type Values } from "../../types";
import { controlUsage } from "../shared";
import { RANGE_TONES } from "./tones";

/**
 * controls 批 1: 逐位滚动的数字. 演示是本月营收; keepMounted 保证改 "数值" 时从旧值滚到新值, 而不是重挂后从 0 滚.
 */

const CONTROLS: readonly ControlDef[] = [
  range("value", "数值", [0, 99999, 1], 48210, "要显示的数; 变化时每一位从旧数字滚到新数字."),
  select("locale", "区域格式", ["zh-CN", "de-DE", "fr-FR"], "zh-CN", "string", "Intl.NumberFormat 的区域, 决定千分位与小数点."),
  range("decimals", "小数位", [0, 2, 1], 0, "固定小数位."),
  text("prefix", "前缀", "¥", "数字前的内容, 不参与滚动."),
  select("direction", "滚向", ["auto", "up", "down"], "auto", '"auto" | "up" | "down"', "auto 跟值的增减走; up / down 固定滚向."),
  range("fontSize", "字号", [16, 72, 2], 56, "字号 px."),
  color("tone", "颜色", RANGE_TONES, "foreground", "RangeTone", "数字颜色; 不给时跟随文字色."),
  toggle("motionBlur", "运动模糊", true, "滚动中按速度加纵向模糊."),
  toggle("tabular", "等宽数字", true, "每位等宽, 滚动时版面不抖."),
  toggle("loading", "加载中", false, "显示终值宽度的骨架, 版面不被挤开."),
];
const BASE = initialValues(CONTROLS);

export const TALLY_ROLL: PageSpec = {
  id: "tally-roll",
  kind: "control",
  importName: "TallyRoll",
  source: "src/controls/range/meter/TallyRoll.tsx",
  raw: tallyRaw,
  deps: [],
  controls: CONTROLS,
  keepMounted: true,
  height: 260,
  render: (props) => (
    <div className="flex w-[min(22rem,calc(100vw-6rem))] flex-col items-start gap-2 rounded-2xl border border-border bg-card p-5 text-left">
      <span className="text-[12px] text-muted-foreground">本月营收 · 截至 11 月 12 日</span>
      <TallyRoll {...props} fontWeight={600} />
      <span className="text-[12px] text-muted-foreground">较上月同期 +12.4%, 目标 ¥60,000</span>
    </div>
  ),
  usage: (values: Values) => controlUsage("TallyRoll", values, { ...BASE, value: -1, locale: "en-US", prefix: "", fontSize: -1, tone: "" }),
  propDesc: {
    format: "追加给 Intl.NumberFormat 的选项 (货币, 百分比, 紧凑写法).",
    minDigits: "整数部分最少位数, 不足补 0.",
    suffix: "数字后的内容, 不参与滚动.",
    duration: "每位滚动时长 ms.",
    bounce: "过冲 (0 到 1); 0.2 及以上即过冲上限 0.06 位.",
    stagger: "位间错峰上限 ms.",
    intro: "首次进入视口一半时从 0 滚到值.",
    fade: "窗口上下边的渐隐占比.",
    fontWeight: "字重.",
    gap: "位间距 px.",
    padding: "外层内边距 px.",
    digitClassName: "加在每个数字位上的类名.",
  },
  propsNote: "根元素是 <span data-slot=\"tally-roll\">; 滚动的各位 aria-hidden, 读屏器只读一份格式化好的完整数字.",
  examples: [
    {
      id: "formats",
      title: "百分比与紧凑写法",
      desc: "format 直接交给 Intl.NumberFormat; suffix 不参与滚动.",
      code: `<TallyRoll value={0.873} format={{ style: "percent", maximumFractionDigits: 1 }} fontSize={32} />\n<TallyRoll value={1284000} locale="en-US" format={{ notation: "compact" }} suffix=" 次下载" fontSize={32} />`,
      render: () => (
        <>
          <TallyRoll value={0.873} format={{ style: "percent", maximumFractionDigits: 1 }} fontSize={32} />
          <TallyRoll value={1284000} locale="en-US" format={{ notation: "compact" }} suffix=" 次下载" fontSize={32} />
        </>
      ),
    },
  ],
  keyboard: [{ keys: ["Tab"], action: "不可聚焦: 这是展示数字, 不占 Tab 位; 读屏器读出完整格式化后的值." }],
  reduced: {
    desc: "减少动效下数字直接换成新值: 不滚动, 不过冲, 没有运动模糊, 入场也不从 0 滚.",
    notes: ["值变化时每一位直接切到新数字.", "首次进入视口不做从 0 滚起的入场.", "loading 骨架照常显示 (它占位, 不是动效)."],
  },
};
