import type { ComponentProps } from "react";
import { AnimatedNumber, GradientText, RotatingText, SplitText } from "@hx/ui";
import splitRaw from "../../../../src/motion/SplitText.tsx?raw";
import rotateRaw from "../../../../src/motion/RotatingText.tsx?raw";
import numberRaw from "../../../../src/motion/AnimatedNumber.tsx?raw";
import gradientRaw from "../../../../src/typography/GradientText.tsx?raw";
import { MOTION_DEPS, SPEC_GROUP } from "./groups";
import { NONE, T, color, range, select, text, toggle, type ComponentSpec } from "./types";

/** 文字类预览的标题字号, 用法代码里也原样写出. */
const HEADLINE = "text-6xl font-bold tracking-tight text-foreground";
const DIRECTIONS = ["up", "down", "left", "right"];
const TIMINGS = ["enter", "exit", "emphasized"];
const PRESETS = ["fade", "fadeUp", "fadeDown", "scaleIn", "blurIn", "slideLeft", "slideRight"];
const SPRINGS = ["soft", "snappy", "bouncy"];
const STOPS = ["primary", "link", "accent", "heading", "success", "warning", "danger"];
const CLASS_ROW = { name: "className", type: T.str, initial: NONE, desc: "根元素类名, 字号与颜色由调用方给." };
const STOP_TYPE = "GradientStop";
const SEPARATOR = ",";
const ROTATE = { interval: "interval", scroll: "scroll" } as const;
const FORMATS: Record<string, Intl.NumberFormatOptions | undefined> = {
  decimal: undefined,
  compact: { notation: "compact" },
  currency: { style: "currency", currency: "CNY" },
};

export const TEXT_SPECS: readonly ComponentSpec[] = [
  {
    id: "split-text",
    label: "SplitText 逐字入场",
    desc: "把一句话拆成字或词, 依次从一个方向浮入. 读屏器只读原文, 减弱动效时直接显示静态文字.",
    group: SPEC_GROUP.text,
    importName: "SplitText",
    required: ["text"],
    source: "src/motion/SplitText.tsx",
    raw: splitRaw,
    deps: MOTION_DEPS,
    fixed: { className: HEADLINE },
    controls: [
      text("text", "文字", "你好, HX UI!", "要拆分的纯文本."),
      select("by", "拆分", ["char", "word"], "char", '"char" | "word"', "逐字 (默认) 或逐词. 中文建议逐字, 长英文句子建议逐词."),
      select("direction", "方向", DIRECTIONS, "up", '"up" | "down" | "left" | "right"', "每个单元从哪个方向进入."),
      select("timing", "节奏", TIMINGS, "enter", '"enter" | "exit" | "emphasized"', "动效节奏令牌, 首屏大标题可用 emphasized."),
      select("trigger", "触发", ["inView", "mount"], "inView", '"inView" | "mount"', "inView 进视口才播; mount 挂载即播."),
      range("step", "步长", [0.01, 0.2, 0.01], 0.02, "相邻单元的起播间隔 (s). 省略时逐字 0.02, 逐词 0.06."),
      range("delay", "延迟", [0, 1, 0.05], 0, "第一个单元之前的延迟 (s)."),
      toggle("once", "只播一次", true, "inView 时是否只播一次."),
    ],
    extraProps: [CLASS_ROW],
    render: (props) => <SplitText {...(props as unknown as Partial<ComponentProps<typeof SplitText>>)} text={String(props.text ?? "")} />,
  },
  {
    id: "rotating-text",
    label: "RotatingText 轮换词",
    desc: "首屏 \"为 ___ 而生\" 那一格: 定时或按滚动进度换词, 旧词离场新词就位, 读屏器只读一份完整列表.",
    group: SPEC_GROUP.text,
    importName: "RotatingText",
    required: ["words"],
    source: "src/motion/RotatingText.tsx",
    raw: rotateRaw,
    deps: MOTION_DEPS,
    fixed: { className: HEADLINE },
    controls: [
      text("words", "词表", "设计师,工程师,产品经理", "轮换的词, 至少一个; 只有一个时等同静态文本."),
      select("preset", "进出场", PRESETS, "fadeUp", "MotionPresetName", "换词的进出场预设. 默认 fadeUp: 旧词上浮离场, 新词自下浮入."),
      select("trigger", "触发", Object.values(ROTATE), ROTATE.interval, '"interval" | "scroll"', "interval 定时轮换; scroll 按目标元素的滚动进度均分换词."),
      range(ROTATE.interval, "停留", [800, 4000, 100], 2400, "定时轮换的停留时长 (ms)."),
    ],
    extraProps: [
      { name: "container", type: "RefObject<HTMLElement>", initial: NONE, desc: "scroll 触发时的滚动容器, 省略时跟随整页." },
      { name: "onWordChange", type: "(index, word) => void", initial: NONE, desc: "当前词变化时回调." },
      CLASS_ROW,
    ],
    toProps: (values) => ({ ...values, words: String(values.words).split(SEPARATOR).map((word) => word.trim()).filter(Boolean) }),
    render: (props) => (
      <RotatingText {...(props as unknown as Partial<ComponentProps<typeof RotatingText>>)} words={Array.isArray(props.words) ? props.words.map(String) : []} />
    ),
  },
  {
    id: "animated-number",
    label: "AnimatedNumber 弹簧数字",
    desc: "数值由弹簧驱动, 每帧直接写文字不走 React 渲染; 等宽数字滚动时不左右抖, 减弱动效时直接跳到终值.",
    group: SPEC_GROUP.text,
    importName: "AnimatedNumber",
    required: ["value"],
    source: "src/motion/AnimatedNumber.tsx",
    raw: numberRaw,
    deps: MOTION_DEPS,
    keepMounted: true,
    fixed: { className: HEADLINE },
    controls: [
      range("value", "数值", [0, 100000, 500], 12800, "目标数值, 变化时从当前值滚过去."),
      range("from", "起点", [0, 100000, 500], 0, "首次进入视口时从这个值开始."),
      select("spring", "弹簧", SPRINGS, "soft", '"soft" | "snappy" | "bouncy"', "弹簧档位."),
      select("format", "格式", Object.keys(FORMATS), "decimal", "Intl.NumberFormatOptions", "数字格式 (货币, 紧凑写法等), 省略小数位时按 value 自身的小数位."),
    ],
    extraProps: [{ name: "locale", type: T.str, initial: NONE, desc: "区域设置, 省略时跟随运行环境." }, CLASS_ROW],
    toProps: (values) => ({ value: values.value, from: values.from, spring: values.spring, format: FORMATS[String(values.format)] }),
    render: (props) => <AnimatedNumber {...(props as unknown as Partial<ComponentProps<typeof AnimatedNumber>>)} value={Number(props.value ?? 0)} />,
  },
  {
    id: "gradient-text",
    label: "GradientText 渐变字",
    desc: "文字渐变, 色标只接受语义令牌名; 高对比模式下退回系统文字色. 嵌在 Display 或正文里使用.",
    group: SPEC_GROUP.text,
    importName: "GradientText",
    source: "src/typography/GradientText.tsx",
    raw: gradientRaw,
    deps: [],
    fixed: { className: HEADLINE },
    children: "渐变标题",
    controls: [
      color("from", "起点", STOPS, "primary", STOP_TYPE, "起点色标 (语义令牌名)."),
      color("via", "中间", STOPS, "accent", STOP_TYPE, "可选中间色标."),
      color("to", "终点", STOPS, "success", STOP_TYPE, "终点色标."),
      range("angle", "角度", [0, 360, 5], 135, "渐变角度 (deg)."),
    ],
    extraProps: [{ name: "classNames / styles", type: "SlotClassNames", initial: NONE, desc: "按状态给 root 槽位追加类名或样式." }],
    render: (props) => <GradientText {...(props as unknown as ComponentProps<typeof GradientText>)}>渐变标题</GradientText>,
  },
];
