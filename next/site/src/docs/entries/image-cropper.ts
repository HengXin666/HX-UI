import type { DocEntry, Values } from "../types";

const ASPECT_CODE: Record<string, string> = { "1": "", "4/3": "aspect={4 / 3}", "16/9": "aspect={16 / 9}", "3/4": "aspect={3 / 4}", free: 'aspect="free"' };
const DEF = { shape: "round", grid: "active", size: 256, type: "image/webp", quality: 90, maxZoom: 4, padding: 24, duration: 200, dragMode: "auto" };

/** ImageCropper 的属性 (组件默认值不写) */
const cropperProps = (v: Values) => {
  const out: string[] = [];
  const a = ASPECT_CODE[String(v.aspect)];
  if (a) out.push(a);
  // 组件默认 rect; 演示默认 round (头像), 所以 round 要写出来
  if (v.shape === "round") out.push('cropShape="round"');
  if (v.grid === "always") out.push("grid");
  if (v.grid === "never") out.push("grid={false}");
  if (Number(v.maxZoom) !== DEF.maxZoom) out.push(`maxZoom={${Number(v.maxZoom)}}`);
  if (v.rotatable === false) out.push("rotatable={false}");
  if (v.dragMode && v.dragMode !== DEF.dragMode) out.push(`dragMode="${v.dragMode}"`);
  if (v.restrict === false) out.push("restrict={false}");
  if (v.resizable === false) out.push("resizable={false}");
  if (Number(v.padding) !== DEF.padding) out.push(`padding={${Number(v.padding)}}`);
  if (Number(v.duration) !== DEF.duration) out.push(`duration={${Number(v.duration)}}`);
  return out;
};
const outputOpts = (v: Values) => {
  const parts = [`size: ${Number(v.size)}`, `type: "${v.type}"`];
  if (v.type !== "image/png") parts.push(`quality: ${Number(v.quality) / 100}`);
  return `{ ${parts.join(", ")} }`;
};
const attrs = (list: string[], indent: string) => list.map((x) => `\n${indent}${x}`).join("");

const USAGE: Record<string, (v: Values) => string> = {
  inline: (v) => `import { ImageCropper, ${v.rotatable === false ? "" : "ImageCropperStraighten, "}type ImageCropperHandle } from "@/components/ui/image-cropper";
import { Slider } from "@/components/ui/slider";
import { toast } from "sonner";

export function CropPanel({ file }: { file: File${v.source === "remote" ? " | string" : ""} }) {
  const cropper = React.useRef<ImageCropperHandle>(null);
  const [zoom, setZoom] = React.useState(1);${v.rotatable === false ? "" : `
  // 旋转 = 90° 的倍数 (按钮) + 拉直角度 (刻度尺, -45° ~ 45°)
  const [quarter, setQuarter] = React.useState(0);
  const [fine, setFine] = React.useState(0);`}
  return (
    <>
      <ImageCropper
        ref={cropper}
        src={file}${attrs(cropperProps(v), "        ")}
        zoom={zoom}
        onZoomChange={setZoom}${v.rotatable === false ? "" : `
        rotation={quarter + fine}
        onRotationChange={(r) => setFine(r - quarter) /* 键盘 [ ] 拉直; R 旋转时可按需拆回 quarter */}`}
        onCropComplete={(area) => console.log(area) /* { x, y, width, height } 像素 */}
        onError={(e) => toast.error(e.message) /* e.code: "network" | "http" | "decode" | "cors" */}
        className="h-72"
      />
      <Slider min={1} max={${Number(v.maxZoom)}} step={0.01} value={[zoom]} onValueChange={([z]) => setZoom(z)} aria-label="缩放" />${v.rotatable === false ? "" : `
      <button type="button" onClick={() => setQuarter((q) => q - 90)}>逆时针 90°</button>
      <ImageCropperStraighten value={fine} onValueChange={setFine} />
      <button type="button" onClick={() => setQuarter((q) => q + 90)}>顺时针 90°</button>`}
    </>
  );
}
`,
  dialog: (v) => `import { ImageCropper, type ImageCropperHandle } from "@/components/ui/image-cropper";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export function AvatarDialog({ file, open, onOpenChange, onSave }: Props) {
  const cropper = React.useRef<ImageCropperHandle>(null);
  const save = async () => {
    // 裁剪 + 缩放 + 压缩, 拿到可直接上传的 Blob${v.shape === "round" ? (v.type === "image/jpeg" ? "; 圆形裁剪默认输出圆形, JPEG 角上填当前主题背景色 (background 可改)" : "; 圆形裁剪默认输出圆形, 角上透明") : ""}
    const blob = await cropper.current?.getBlob(${outputOpts(v)});
    if (blob) onSave(blob);
  };
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle>更换头像</DialogTitle></DialogHeader>
        <ImageCropper ref={cropper} src={file}${attrs(cropperProps(v), "          ")} className="h-72" />
        <DialogFooter>
          <button type="button" onClick={save}>保存</button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
`,
};

export const imageCropper: DocEntry = {
  slug: "image-cropper",
  name: "ImageCropper",
  title: "图片裁剪",
  section: "ui",
  group: "表单",
  description:
    "换头像、群头像、封面的选区裁剪。载入 File / Blob / URL；固定比例（1:1、4:3、16:9 可配）拖四角等比缩放裁剪框，自由比例拖四边 / 四角（对边固定）；框有空余时拖框内部移动框，否则拖动平移图片；滚轮以指针为中心缩放，双指捏合。90° 旋转 + 任意角度拉直（附 -45° ~ 45° 刻度尺），按旋转后的外接约束保证图片始终盖住裁剪框。圆形裁剪默认输出圆形（PNG / WebP 透明角，JPEG 填主题背景色）。URL 图片带 CORS 加载，失败自动 fetch 回退，仍不行给出明确原因。键盘可调图片与裁剪框。rAF 合并写入、补间同一条时间线，拖动不触发 React 渲染。",
  file: "src/components/ui/image-cropper.tsx",
  importFrom: "@/components/ui/image-cropper",
  demo: () => import("./image-cropper.demo"),
  source: () =>
    Promise.all([import("@/components/ui/image-cropper.tsx?raw"), import("@/components/ui/image-cropper-model.ts?raw")]).then(
      ([a, b]) => `${a.default}\n\n// ===== src/components/ui/image-cropper-model.ts =====\n\n${b.default}`,
    ),
  defaults: { example: "inline", source: "sample", aspect: "1", ...DEF, rotatable: true, restrict: true, resizable: true },
  componentDefaults: {},
  demoOnly: ["source"],
  stageHeight: 560,
  presets: [
    { label: "圆形头像", values: { example: "inline", aspect: "1", shape: "round", grid: "active", size: 256, type: "image/webp", quality: 90 } },
    { label: "换头像 (Dialog)", values: { example: "dialog", aspect: "1", shape: "round", grid: "active", size: 256, type: "image/webp", quality: 90 } },
    { label: "封面 16:9", values: { example: "inline", aspect: "16/9", shape: "rect", grid: "always", size: 1280, type: "image/jpeg", quality: 82 } },
    { label: "自由比例", values: { example: "inline", aspect: "free", shape: "rect", grid: "active", size: 1024, type: "image/png", quality: 90 } },
    { label: "远程 URL (CORS)", values: { example: "inline", source: "remote", aspect: "4/3", shape: "rect", grid: "active", size: 1024, type: "image/jpeg", quality: 85 } },
  ],
  controls: [
    { type: "select", key: "example", label: "示例", options: [{ value: "inline", label: "内联面板" }, { value: "dialog", label: "换头像 (Dialog)" }] },
    { type: "select", key: "source", label: "图片来源", options: [{ value: "sample", label: "本地示例 (File)" }, { value: "remote", label: "远程 URL (CORS)" }] },
    { type: "select", key: "aspect", label: "比例", options: [{ value: "1", label: "1:1" }, { value: "4/3", label: "4:3" }, { value: "16/9", label: "16:9" }, { value: "3/4", label: "3:4" }, { value: "free", label: "自由" }] },
    { type: "select", key: "shape", label: "形状", options: [{ value: "round", label: "圆形" }, { value: "rect", label: "矩形" }] },
    { type: "select", key: "grid", label: "网格线", options: [{ value: "active", label: "交互时" }, { value: "always", label: "常显" }, { value: "never", label: "不显示" }] },
    { type: "number", key: "size", label: "输出长边", min: 64, max: 2048, step: 32, unit: "px" },
    { type: "select", key: "type", label: "输出格式", options: [{ value: "image/webp", label: "WebP" }, { value: "image/jpeg", label: "JPEG" }, { value: "image/png", label: "PNG" }] },
    { type: "number", key: "quality", label: "质量", min: 10, max: 100, step: 5, unit: "%" },
    { type: "number", key: "maxZoom", label: "最大缩放", min: 1.5, max: 10, step: 0.5, unit: "×" },
    { type: "select", key: "dragMode", label: "框内拖动", options: [{ value: "auto", label: "自动" }, { value: "frame", label: "移动裁剪框" }, { value: "image", label: "拖图片" }] },
    { type: "toggle", key: "resizable", label: "可调裁剪框" },
    { type: "toggle", key: "restrict", label: "图片盖满框" },
    { type: "toggle", key: "rotatable", label: "可旋转 / 拉直" },
    { type: "number", key: "padding", label: "框边距", min: 0, max: 64, step: 4, unit: "px" },
    { type: "number", key: "duration", label: "过渡时长", min: 0, max: 600, step: 20, unit: "ms" },
  ],
  usage: (v) => (USAGE[String(v.example)] ?? USAGE.inline)(v),
  props: [
    { name: "src", type: "File | Blob | string | null", description: "图片。File / Blob 内部建对象 URL，换图或卸载时释放。URL 以 crossOrigin（默认 \"anonymous\"）加载；失败时自动改用 fetch → Blob → 对象 URL 重试（绕开同一地址先被无 CORS 请求缓存这类问题）；仍失败则不带 CORS 只做预览，onError 给出 code=\"cors\" 的原因，导出时 getBlob 以同样的错误拒绝。" },
    { name: "crossOrigin", type: '"anonymous" | "use-credentials" | ""', default: '"anonymous"', description: "URL 图片的跨域模式；\"\" 表示不带 CORS（同源图片或不需要导出时）。" },
    { name: "aspect", type: 'number | "free"', default: "1", description: "裁剪框宽高比，如 1、4 / 3、16 / 9：拖四角等比缩放（对角固定）。\"free\" 为自由比例：拖四边 / 四角，对边固定、互不牵连；90° 旋转时裁剪框跟着转。" },
    { name: "dragMode", type: '"auto" | "frame" | "image"', default: '"auto"', description: "在裁剪框内部拖动时：auto 框还有地方可挪就移动框（光标变为移动），框占满时拖图片（头像场景照旧）；frame 总是移动框，框外拖图片；image 总是拖图片。" },
    { name: "resizable / minFrameSize", type: "boolean / number", default: "true / 48", description: "允许拖边角调整裁剪框；裁剪框最小边长（px）。调整时图片不动，缩放比例随之变化，并保证不超出 minZoom / maxZoom 与图片范围。" },
    { name: "cropShape", type: '"rect" | "round"', default: '"rect"', description: "遮罩形状；round 为圆（非 1:1 时椭圆）。round 时 getBlob / getCanvas 默认按圆抠出（round: true）：PNG / WebP 角上透明，JPEG 角上填 background。" },
    { name: "grid", type: 'boolean | "active"', default: '"active"', description: "三分网格线：active 拖动 / 缩放时淡入；true 常显；false 不显示。" },
    { name: "zoom / defaultZoom / onZoomChange", type: "number", default: "1", description: "缩放，1 = 图片恰好盖满裁剪框（任意角度下都成立）。受控时外部改值（Slider、按钮）以裁剪框中心缩放并补间；滚轮 / 双指 / 调整裁剪框时按帧回调。" },
    { name: "minZoom / maxZoom", type: "number", default: "1 / 4", description: "缩放范围。" },
    { name: "zoomStep / wheelSpeed", type: "number", default: "0.1 / 1", description: "键盘 + / - 每次的缩放量；滚轮灵敏度倍数。" },
    { name: "rotation / defaultRotation / onRotationChange", type: "number (度)", default: "0", description: "旋转，任意角度：通常 = 90° 的倍数 + 拉直角度（ImageCropperStraighten）。可累加，一直顺时针转不会倒转回去。拉直时 zoom 不变、图片自动放大到仍盖满裁剪框。" },
    { name: "rotatable", type: "boolean", default: "true", description: "允许键盘 R（Shift+R 逆时针）旋转 90°、[ / ] 拉直 ±1°（Shift ±5°）。ref.rotate / setRotation 不受它限制。" },
    { name: "restrict", type: "boolean", default: "true", description: "图片始终盖住裁剪框：按旋转后的图片坐标精确约束（裁剪框四个角都在图片内），平移、缩放、旋转、移动 / 调整裁剪框都遵守，输出不会有空角。" },
    { name: "padding", type: "number", default: "24", description: "裁剪框可活动范围离容器边缘的距离（px）。容器尺寸由 className / style 决定（如 h-72）；容器变化时整体等比缩放，裁剪结果不变。" },
    { name: "keyStep", type: "number", default: "10", description: "方向键每次平移 px，Shift 时 ×4。焦点在图片上时移动图片；Tab 到裁剪框后方向键移动框，Alt + 方向键调整宽高。" },
    { name: "duration", type: "number", default: "200", description: "键盘、按钮、受控 zoom / rotation、比例切换、复位的补间时长（ms），0 关闭；图片与裁剪框在同一个 rAF 时间线上，中途再改从当前位置接着走。拖动与滚轮始终跟手。减弱动效时直接到位。" },
    { name: "onCropChange", type: "(area, state) => void", description: "裁剪变化，每帧最多一次。area = { x, y, width, height }，为旋转后图片外接框的像素坐标；state = { x, y, zoom, rotation }。" },
    { name: "onCropComplete", type: "(area, state) => void", description: "一次交互结束（松手、滚轮停 150ms、按键、图片载入）时调用，适合在这里生成预览。" },
    { name: "onLoad / onError", type: "(size) => void / (error: ImageCropperError) => void", description: "图片载入完成（原始尺寸）/ 失败或只能预览。error.code：network（地址或网络）、http（附 status）、decode（不是图片或格式不支持）、cors（服务器未开放跨域，可预览不可导出）；error.message 是可直接显示的中文。" },
    { name: "placeholder / disabled", type: "ReactNode / boolean", description: "没有图片时显示的内容；禁用交互。" },
    { name: "ref", type: "Ref<ImageCropperHandle>", description: "getCanvas(opts) / getBlob(opts)：opts = { size（输出长边，头像常用 256）, width, height, type（默认 webp）, quality（0..1，默认 0.9）, round（默认跟随 cropShape）, background（任意 CSS 颜色，可写 var(--card)；JPEG 默认取当前主题 --background 的计算值）}；从原图重新取样，缩小时分步减半防锯齿。另有 getArea()、getState()、getFrame()、reset()、rotate(delta)、setRotation(deg)、zoomTo(z)、naturalSize()。" },
    { name: "ImageCropperStraighten", type: "组件", description: "拉直刻度尺：value / defaultValue / onValueChange / onValueCommit，min / max（默认 -45 / 45），step（0.1），spacing（每度 px，默认 8），snap（靠近 0 吸附，默认 0.75°）。左右拖动刻度带（只动 transform），双击归零；键盘 ← / → ±1°（Shift ±0.1°）、PageUp / PageDown ±5°、Home / End、0。" },
    { name: "CSS 变量", type: "--cropper-mask", description: "裁剪框外遮罩的颜色，默认 color-mix(in oklch, var(--background) 62%, transparent)。" },
    { name: "cropArea / outputSize / splitRotation", type: "函数", description: "一并导出的纯几何函数（image-cropper-model.ts，服务端可用）：由状态算裁剪区域；由区域与输出参数算画布尺寸；把角度拆成 90° 倍数 + 拉直角度。" },
  ],
};
