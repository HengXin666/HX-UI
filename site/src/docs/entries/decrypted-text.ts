import type { DocEntry } from "../types";

const CHARSETS: Record<string, string> = {
  letters: "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz!@#$%^&*()_+",
  binary: "01",
  hex: "0123456789ABCDEF",
  symbols: "!<>-_\\/[]{}—=+*^?#________",
  katakana: "アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン",
};

export const decryptedText: DocEntry = {
  slug: "decrypted-text",
  name: "DecryptedText",
  title: "解密文字",
  section: "visual",
  group: "文字",
  description: "文字先是一串乱码，再一个个被「破解」成原文。支持悬停、进入视口、点击或用 ref 手动触发；悬停半径只打乱光标附近的字。读屏始终读原文。",
  file: "src/text/decrypted-text.tsx",
  importFrom: "@/text/decrypted-text",
  demo: () => import("./decrypted-text.demo"),
  source: () => import("@/text/decrypted-text.tsx?raw").then((m) => m.default),
  thumb: "Hacking into the mainframe...",
  defaults: {
    text: "Hacking into the mainframe...",
    effect: "scramble",
    animateOn: "inViewHover",
    clickMode: "once",
    revealDirection: "start",
    speed: 60,
    maxIterations: 10,
    hoverRadius: 100,
    loop: false,
    loopDelay: 2000,
    sequential: false,
    charset: "letters",
    useOriginalCharsOnly: false,
    scrambleColor: "",
  },
  componentDefaults: {
    effect: "scramble",
    animateOn: "hover",
    clickMode: "once",
    revealDirection: "start",
    speed: 50,
    maxIterations: 10,
    hoverRadius: 0,
    loop: false,
    loopDelay: 2000,
    sequential: false,
    charset: "letters",
    useOriginalCharsOnly: false,
    scrambleColor: "",
  },
  presets: [
    { label: "经典", values: { effect: "scramble", animateOn: "inViewHover", sequential: false, speed: 60, maxIterations: 10, hoverRadius: 100, charset: "letters", scrambleColor: "" } },
    { label: "逐字终端", values: { effect: "scramble", animateOn: "view", sequential: true, revealDirection: "start", speed: 45, charset: "symbols", scrambleColor: "var(--chart-2)", loop: true } },
    { label: "翻牌", values: { effect: "flip", animateOn: "view", sequential: true, revealDirection: "center", speed: 55, charset: "letters", loop: true } },
    { label: "暗码浮现", values: { effect: "fade", animateOn: "view", sequential: false, speed: 70, maxIterations: 16, charset: "katakana", scrambleColor: "var(--brand)", loop: true } },
    { label: "二进制", values: { effect: "scramble", animateOn: "click", clickMode: "toggle", sequential: true, revealDirection: "random", speed: 30, charset: "binary" } },
  ],
  controls: [
    { type: "text", key: "text", label: "文字" },
    { type: "select", key: "effect", label: "效果", options: [{ value: "scramble", label: "乱跳" }, { value: "flip", label: "翻牌" }, { value: "fade", label: "暗码浮现" }] },
    { type: "select", key: "animateOn", label: "触发", options: [{ value: "view", label: "进入视口" }, { value: "hover", label: "悬停" }, { value: "inViewHover", label: "视口 + 悬停" }, { value: "click", label: "点击" }] },
    { type: "select", key: "clickMode", label: "点击方式", options: [{ value: "once", label: "一次" }, { value: "toggle", label: "来回切换" }] },
    { type: "select", key: "revealDirection", label: "方向", options: [{ value: "start", label: "开头" }, { value: "end", label: "结尾" }, { value: "center", label: "中间" }, { value: "random", label: "随机" }] },
    { type: "select", key: "charset", label: "字符池", options: [{ value: "letters", label: "字母" }, { value: "symbols", label: "符号" }, { value: "hex", label: "十六进制" }, { value: "binary", label: "二进制" }, { value: "katakana", label: "片假名" }] },
    { type: "select", key: "scrambleColor", label: "乱码颜色", options: [{ value: "", label: "同文字" }, { value: "var(--brand)", label: "品牌" }, { value: "var(--chart-2)", label: "青" }, { value: "var(--chart-3)", label: "琥珀" }, { value: "var(--muted-foreground)", label: "灰" }] },
    { type: "number", key: "speed", label: "步速", min: 16, max: 200, step: 2, unit: "ms" },
    { type: "number", key: "maxIterations", label: "乱跳步数", min: 2, max: 40, step: 1 },
    { type: "number", key: "hoverRadius", label: "悬停半径", min: 0, max: 300, step: 5, unit: "px" },
    { type: "number", key: "loopDelay", label: "循环停留", min: 300, max: 6000, step: 100, unit: "ms" },
    { type: "toggle", key: "sequential", label: "逐字解开" },
    { type: "toggle", key: "loop", label: "循环" },
    { type: "toggle", key: "useOriginalCharsOnly", label: "只用原文字符" },
  ],
  usage: (v) => {
    const pairs: string[] = [`text="${v.text}"`];
    const d = decryptedText.componentDefaults;
    for (const k of ["effect", "animateOn", "clickMode", "revealDirection", "scrambleColor"]) if (v[k] !== d[k]) pairs.push(`${k}="${v[k]}"`);
    for (const k of ["speed", "maxIterations", "hoverRadius", "loopDelay"]) if (v[k] !== d[k]) pairs.push(`${k}={${v[k]}}`);
    for (const k of ["sequential", "loop", "useOriginalCharsOnly"]) if (v[k] !== d[k]) pairs.push(v[k] ? k : `${k}={false}`);
    if (v.charset !== "letters") pairs.push(`characters="${CHARSETS[String(v.charset)].replace(/\\/g, "\\\\")}"`);
    return `import { DecryptedText } from "@hx/ui/text/decrypted-text";\n\n<DecryptedText\n  ${pairs.join("\n  ")}\n  parentClassName="text-4xl font-medium tracking-tight"\n/>`;
  },
  props: [
    { name: "text", type: "string", description: "要解密的文字。" },
    { name: "as", type: '"h1" | "h2" | "h3" | "h4" | "p" | "span" | "div"', default: '"span"', description: "渲染成哪个标签。" },
    { name: "effect", type: '"scramble" | "flip" | "fade"', default: '"scramble"', description: "scramble 原地换字；flip 解出的字竖着翻进来、带一点回弹；fade 乱码发暗，解出时变亮。" },
    { name: "animateOn", type: '"view" | "hover" | "inViewHover" | "click" | "manual"', default: '"hover"', description: "什么时候开始。view 与 click 一开始就是乱码，原文不会先闪；manual 只听 ref 的 play()。" },
    { name: "clickMode", type: '"once" | "toggle"', default: '"once"', description: "点击触发时只解一次，还是来回切换。" },
    { name: "speed", type: "number", default: "50", description: "每一步的间隔，毫秒。" },
    { name: "maxIterations", type: "number", default: "10", description: "非逐字模式乱跳多少步才落定；也决定悬停半径下字乱跳多久。" },
    { name: "sequential", type: "boolean", default: "false", description: "一步解开一个字。" },
    { name: "revealDirection", type: '"start" | "end" | "center" | "random"', default: '"start"', description: "从哪一头开始解；随机顺序对同一段文字固定。" },
    { name: "useOriginalCharsOnly", type: "boolean", default: "false", description: "乱码只用原文里出现过的字符，中文标题用它最自然。" },
    { name: "characters", type: "string", default: "A–Z a–z 符号", description: "乱码字符池。" },
    { name: "hoverRadius", type: "number", default: "0", description: "悬停时只打乱光标附近这么多像素内的字，越近越乱；0 表示悬停整段重解。" },
    { name: "loop", type: "boolean", default: "false", description: "解完停一会儿再打乱重来；离开视口时暂停。" },
    { name: "loopDelay", type: "number", default: "2000", description: "循环时原文停留多久，毫秒。" },
    { name: "scrambleColor", type: "string", default: '""', description: "乱码时的颜色，解出后 300ms 过渡回文字色；留空沿用文字色。" },
    { name: "parentClassName", type: "string", description: "加在外层标签上，字号、字重写这里。" },
    { name: "className", type: "string", description: "加在已解出的每个字上。" },
    { name: "encryptedClassName", type: "string", description: "加在还是乱码的每个字上，比如等宽字体、降低透明度。" },
    { name: "style", type: "CSSProperties", description: "外层行内样式。" },
    { name: "renderChar", type: "(c: { char; shown; revealed; index }) => ReactNode", description: "完全接管每个字怎么画，做下划线、光标、逐字渐变都靠它。" },
    { name: "ref", type: "{ play(); scramble(); reveal() }", description: "手动重播、打乱或直接显示原文。" },
    { name: "onComplete", type: "() => void", description: "每次解完调用。" },
  ],
};

export { CHARSETS };
