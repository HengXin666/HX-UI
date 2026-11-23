import type { DocEntry } from "../types";
import { SHOTS, MOTIONS } from "@/stage/shots";
import { diffProps } from "./_visual";

const D = {
  shot: "turn", motion: "none", arrange: "single", device: "browser", background: "spotlight",
  size: 0.62, shadow: 0.7, softness: 0.65, reflection: 0, sheen: 0.5, dof: 0, grain: 0.12, vignette: 0.3, parallax: 0.4,
  transition: 0.9, orbit: true, interactive: true, selectable: false, thickness: 1,
};
const DEMO = { ...D, screen: "dashboard", title: "" };
const opt = (o: Record<string, { label: string }>) => Object.entries(o).map(([value, x]) => ({ value, label: x.label }));

export const stage: DocEntry = {
  slug: "stage",
  name: "Stage",
  title: "3D 展台",
  section: "ui",
  group: "3D",
  description: "把任何界面放进一个 3D 场景：几十个机位、设备外框、背景、光影、倒影、景深和运镜，镜头切换自动平滑过渡。屏幕里放的是真组件，可以直接点；空白处拖动转镜头，双击复位，也能跟着滚动运镜。",
  file: "src/stage/stage.tsx",
  importFrom: "@/stage/stage",
  demo: () => import("./stage.demo"),
  source: () => import("@/stage/stage.tsx?raw").then((m) => m.default),
  bleed: true,
  stageHeight: 560,
  remountOnChange: false,
  defaults: DEMO,
  componentDefaults: D,
  demoOnly: ["screen", "title"],
  presets: [
    { label: "微转", values: { ...DEMO } },
    { label: "工作室倒影", values: { ...DEMO, shot: "hero", background: "studio", reflection: 0.5, shadow: 0.8, motion: "float" } },
    { label: "环绕", values: { ...DEMO, motion: "orbit", background: "grid", shadow: 0.6 } },
    { label: "巡游特写", values: { ...DEMO, motion: "tour", background: "spotlight", vignette: 0.45 } },
    { label: "层叠景深", values: { ...DEMO, screen: "layers", arrange: "layers", motion: "focusPull", dof: 0.45, background: "mesh", shot: "hero" } },
    { label: "手机", values: { ...DEMO, screen: "phone", device: "phone", shot: "hero", background: "gradient", motion: "float", reflection: 0.35 } },
    { label: "等距", values: { ...DEMO, shot: "iso", background: "grid", parallax: 0.2, shadow: 0.5 } },
    { label: "发布会", values: { ...DEMO, motion: "pushIn", background: "spotlight", title: "把产品放上舞台", vignette: 0.5, device: "laptop" } },
  ],
  controls: [
    { type: "select", key: "screen", label: "内容", options: [{ value: "dashboard", label: "仪表盘" }, { value: "phone", label: "手机应用" }, { value: "layers", label: "三块屏幕" }] },
    { type: "select", key: "shot", label: "机位", options: opt(SHOTS) },
    { type: "select", key: "motion", label: "运镜", options: [{ value: "none", label: "无" }, ...opt(MOTIONS)] },
    { type: "select", key: "device", label: "设备", options: [{ value: "browser", label: "浏览器" }, { value: "window", label: "窗口" }, { value: "laptop", label: "笔记本" }, { value: "phone", label: "手机" }, { value: "tablet", label: "平板" }, { value: "card", label: "卡片" }, { value: "none", label: "无外框" }] },
    { type: "select", key: "arrange", label: "排布", options: [{ value: "single", label: "单块" }, { value: "layers", label: "前后层叠" }, { value: "row", label: "一排" }, { value: "fan", label: "扇形" }, { value: "stack", label: "叠放" }, { value: "tower", label: "竖排" }] },
    { type: "select", key: "background", label: "背景", options: [{ value: "spotlight", label: "聚光" }, { value: "solid", label: "纯色" }, { value: "gradient", label: "渐变" }, { value: "mesh", label: "流光" }, { value: "studio", label: "影棚" }, { value: "grid", label: "网格地面" }, { value: "transparent", label: "透明" }] },
    { type: "number", key: "size", label: "屏幕大小", min: 0.2, max: 0.95, step: 0.01 },
    { type: "number", key: "shadow", label: "阴影", min: 0, max: 1, step: 0.01 },
    { type: "number", key: "softness", label: "柔和", min: 0, max: 1, step: 0.01 },
    { type: "number", key: "reflection", label: "倒影", min: 0, max: 1, step: 0.01 },
    { type: "number", key: "sheen", label: "反光", min: 0, max: 1, step: 0.01 },
    { type: "number", key: "dof", label: "景深", min: 0, max: 1.5, step: 0.05 },
    { type: "number", key: "grain", label: "颗粒", min: 0, max: 0.6, step: 0.01 },
    { type: "number", key: "vignette", label: "暗角", min: 0, max: 1, step: 0.01 },
    { type: "number", key: "parallax", label: "视差", min: 0, max: 1.5, step: 0.05 },
    { type: "number", key: "transition", label: "切换时长", min: 0.1, max: 3, step: 0.05, unit: "s" },
    { type: "toggle", key: "orbit", label: "拖拽转镜头" },
    { type: "toggle", key: "interactive", label: "内容可操作" },
    { type: "toggle", key: "selectable", label: "文字可拖选" },
    { type: "number", key: "thickness", label: "机身厚度", min: 0, max: 3, step: 0.1 },
    { type: "text", key: "title", label: "标题" },
  ],
  usage: (v) => {
    const p = diffProps(v, D, ["screen", "title"]);
    if (v.title) p.push(`title="${v.title}"`);
    const screens = v.screen === "layers"
      ? `  <StageScreen url="app.northwind.io"><Dashboard /></StageScreen>\n  <StageScreen device="window" url="stage.tsx"><Code /></StageScreen>\n  <StageScreen device="phone"><Todo /></StageScreen>`
      : v.screen === "phone" ? `  <StageScreen contentWidth={430}><Todo /></StageScreen>` : `  <StageScreen url="app.northwind.io">\n    <Dashboard />\n  </StageScreen>`;
    return `import { Stage, StageScreen } from "@hx/ui/stage";\n\n<Stage${p.length ? `\n  ${p.join("\n  ")}\n` : ""} className="h-[600px] rounded-2xl">\n${screens}\n</Stage>`;
  },
  props: [
    { name: "children", type: "ReactNode", description: "场景里的屏幕，一般是 StageScreen；其它内容自动装进一块屏幕。" },
    { name: "shot", type: "ShotName | Partial<Shot>", default: '"turn"', description: "静止机位：内置名字，或 { yaw, pitch, roll, zoom, x, y, lens, focus, tilt }。改它会平滑运镜过去。" },
    { name: "motion", type: 'MotionName | StageMotion | "none"', default: '"none"', description: "运镜：内置名字，或 { keyframes: [{ at, shot, ease }], duration, loop, delay }。" },
    { name: "scroll", type: "boolean | { container?, start?, end? }", default: "false", description: "运镜进度跟随滚动位置，适合落地页长滚动。" },
    { name: "transition", type: "number", default: "0.9", description: "镜头切换的过渡时长，秒。" },
    { name: "arrange", type: '"single" | "layers" | "row" | "fan" | "stack" | "tower"', default: '"single"', description: "多块屏幕的自动排布。" },
    { name: "device", type: '"browser" | "window" | "laptop" | "phone" | "tablet" | "card" | "none"', default: '"browser"', description: "屏幕默认的设备外框。" },
    { name: "size", type: "number", default: "0.62", description: "屏幕宽度占舞台宽度的比例。" },
    { name: "background", type: '"spotlight" | "solid" | "gradient" | "mesh" | "studio" | "grid" | "transparent"', default: '"spotlight"', description: "背景样式；影棚和网格自带 3D 地面。" },
    { name: "backgroundColor / backgroundColor2 / colors", type: "string / string / string[]", description: "背景用色，支持 var(--token)。" },
    { name: "floor", type: "boolean", description: "强制显示或隐藏 3D 地面。" },
    { name: "shadow / softness", type: "number", default: "0.7 / 0.65", description: "接触阴影和投影的浓度与柔和度。" },
    { name: "reflection", type: "number", default: "0", description: "屏幕在地面上的倒影（Chromium / Safari）。" },
    { name: "sheen", type: "number", default: "0.5", description: "屏幕表面随角度扫过的反光。" },
    { name: "dof", type: "number", default: "0", description: "景深：离 shot.focus 越远的屏幕越虚。" },
    { name: "grain / vignette", type: "number", default: "0.12 / 0.3", description: "胶片颗粒和暗角。" },
    { name: "parallax", type: "number", default: "0.4", description: "光标视差强度。" },
    { name: "orbit", type: "boolean", default: "true", description: "在空白处拖动转镜头，双击复位；屏幕里照常操作。" },
    { name: "interactive", type: "boolean", default: "true", description: "屏幕内容能否点击。" },
    { name: "selectable", type: "boolean", default: "false", description: "屏幕里的文字能否拖选。关闭时在屏幕上拖动会转镜头，点击照常；输入框、滑块和带 data-stage-keep 的元素不受影响。" },
    { name: "thickness", type: "number", default: "1", description: "机身厚度倍数，0 为纸片。手机、平板、笔记本按真实比例有侧边和背壳。" },
    { name: "title / subtitle / textPosition", type: "ReactNode / ReactNode / \"top\" | \"bottom\"", description: "叠在画面上的大标题。" },
    { name: "paused", type: "boolean", default: "false", description: "冻结运镜。" },
    { name: "ref", type: "{ play, pause, seek(p), getShot }", description: "控制运镜，或读出当前镜头存成预设。" },
    { name: "onMotionEnd", type: "() => void", description: "不循环的运镜播完时调用。" },
    { name: "className / style / worldClassName / textClassName", type: "string / CSSProperties", description: "各层样式。" },
    { name: "StageScreen.device / url", type: "StageDevice / string", description: "单块屏幕的外框和地址栏文字。" },
    { name: "StageScreen.contentWidth", type: "number", default: "1280", description: "内容按这个宽度排版再缩放进屏幕，像一张高清截图。" },
    { name: "StageScreen.position / rotation / depth", type: "[x, y, z] / [x, y, z] / number", description: "手动摆放（以屏幕宽度为单位）和景深层号。" },
    { name: "StageScreen.scale / aspect / scrollable", type: "number / number / boolean", description: "单块屏幕的大小倍数、宽高比、内容可滚动。" },
    { name: "StageScreen.className / screenClassName", type: "string", description: "外框与内容视口的样式。" },
  ],
};
