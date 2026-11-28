import type { DocEntry, Values } from "../types";

const ACCEPT_CODE: Record<string, string> = { image: "image/*", doc: ".pdf,.doc,.docx,.md,.txt,.xlsx" };
const DZ_DEFAULTS = { tone: "brand", duration: 180, size: "default" };

/** Dropzone 的属性 (默认值不写); overlay = 包裹型, area = 卡片 */
const zoneProps = (v: Values, variant: "overlay" | "area") => {
  const out: string[] = [];
  if (variant === "area") out.push(`variant="area"`);
  if (ACCEPT_CODE[String(v.accept)]) out.push(`accept="${ACCEPT_CODE[String(v.accept)]}"`);
  if (v.multiple === false) out.push("multiple={false}");
  if (Number(v.maxSize) > 0) out.push(`maxSize={${Number(v.maxSize)} * MB}`);
  if (Number(v.maxFiles) > 0) out.push(`maxFiles={${Number(v.maxFiles)}}`);
  if (v.tone !== DZ_DEFAULTS.tone) out.push(`tone="${v.tone}"`);
  if (variant === "overlay" && v.blur === false) out.push("blur={false}");
  if (Number(v.duration) !== DZ_DEFAULTS.duration) out.push(`duration={${Number(v.duration)}}`);
  if (variant === "area" && v.size !== DZ_DEFAULTS.size) out.push(`size="${v.size}"`);
  if (v.paste) out.push("paste");
  if (v.disabled) out.push("disabled");
  return out;
};
const listProps = (v: Values, fallbackDensity = "default") => {
  const out: string[] = [];
  const density = String(v.density ?? fallbackDensity);
  if (density !== "default") out.push(`density="${density}"`);
  if (v.animation && v.animation !== "slide") out.push(`animation="${v.animation}"`);
  return out;
};
const attrs = (list: string[], indent: string) => list.map((a) => `\n${indent}${a}`).join("");
const MB_LINE = (v: Values) => (Number(v.maxSize) > 0 ? "const MB = 1024 * 1024;\n" : "");

const USAGE: Record<string, (v: Values) => string> = {
  chat: (v) => `import { Dropzone, type DropzoneHandle } from "@/components/ui/dropzone";
import { UploadList, type UploadFile } from "@/components/ui/upload-list";
${MB_LINE(v)}
export function Composer({ uploads, upload, cancel, retry }: Props) {
  const zone = React.useRef<DropzoneHandle>(null);
  // 包住整个会话: 拖文件进来盖一层提示, 松手交给 upload (上传与进度由你来做)
  return (
    <Dropzone
      ref={zone}${attrs(zoneProps(v, "overlay"), "      ")}
      count={uploads.length}
      overlayTitle="松开发送到「产品讨论」"
      onFiles={(files) => upload(files)}
      onReject={(files, reasons) => toast.error(\`\${files[0].name}：\${reasons[0][0].message}\`)}
    >
      <Messages />
      <UploadList items={uploads}${attrs(listProps(v), "        ")} onCancel={cancel} onRemove={cancel} onRetry={retry} />
      <button type="button" onClick={() => zone.current?.open()}>添加附件</button>
      <MessageInput />
    </Dropzone>
  );
}
`,
  drive: (v) => `import { Dropzone } from "@/components/ui/dropzone";
import { UploadList, type UploadFile } from "@/components/ui/upload-list";
${MB_LINE(v)}
export function DriveUpload({ uploads, upload, actions }: { uploads: UploadFile[]; upload: (files: File[]) => void; actions: UploadActions }) {
  return (
    <>
      <Dropzone${attrs(zoneProps(v, "area"), "        ")}
        onFiles={upload}
        onReject={(files, reasons) => toast.error(\`\${files.length} 个文件没有添加\`)}
      />
      {/* 进度 / 状态由上传逻辑更新进 uploads: status "queued" | "uploading" | "paused" | "done" | "error" */}
      <UploadList
        items={uploads}${attrs(listProps(v), "        ")}
        onPause={actions.pause}
        onResume={actions.resume}
        onCancel={actions.cancel}
        onRetry={actions.retry}
        onRemove={actions.remove}
      />
    </>
  );
}
`,
  basic: (v) => `import { Dropzone } from "@/components/ui/dropzone";
import { UploadList, type UploadFile } from "@/components/ui/upload-list";
${MB_LINE(v)}
export function Attachments() {
  const [items, setItems] = React.useState<UploadFile[]>([]);
  const add = (files: File[]) =>
    setItems((list) => [...list, ...files.map((file) => ({ id: crypto.randomUUID(), name: file.name, size: file.size, type: file.type, file, status: "uploading" as const, progress: 0 }))]);
  return (
    <>
      <Dropzone${attrs(zoneProps(v, "area"), "        ")}
        count={items.length}
        onFiles={add}
      />
      <UploadList items={items}${attrs(listProps(v), "        ")} onRemove={(f) => setItems((l) => l.filter((x) => x.id !== f.id))} />
    </>
  );
}
`,
};

export const dropzone: DocEntry = {
  slug: "dropzone",
  name: "Dropzone",
  title: "拖放上传",
  section: "ui",
  group: "表单",
  description:
    "Dropzone 包住任意区域（会话、网盘列表），拖文件进来时盖一层 1px 虚线提示层，淡入并轻微放大；也能作为独立的「拖放或点击选择」上传卡片。按 accept（MIME / 扩展名）、单文件大小、数量校验，通过的交给 onFiles，没通过的连原因交给 onReject；拖动途中浏览器只给 MIME：扩展名规则经常见扩展名 → MIME 映射表推断，能确定类型不对或超数量时提示层直接变成拒绝样式，部分不对时注明会跳过几个，判断不了时显示中性的「松开后检查」，放下后再按文件名精确校验。点击选文件、ref.open()、粘贴文件都支持。UploadList 显示每个文件的进度（复用 Progress）、状态、暂停 / 继续 / 取消 / 重试 / 移除，增删有平滑过渡。只出 UI 和事件，不负责上传。",
  file: "src/components/ui/dropzone.tsx",
  importFrom: "@/components/ui/dropzone",
  demo: () => import("./dropzone.demo"),
  source: () =>
    Promise.all([
      import("@/components/ui/dropzone.tsx?raw"),
      import("@/components/ui/upload-list.tsx?raw"),
      import("@/components/ui/dropzone-model.ts?raw"),
    ]).then(([a, b, c]) => `${a.default}\n\n// ===== src/components/ui/upload-list.tsx =====\n\n${b.default}\n\n// ===== src/components/ui/dropzone-model.ts =====\n\n${c.default}`),
  defaults: {
    example: "chat",
    accept: "any",
    multiple: true,
    maxSize: 50,
    maxFiles: 0,
    tone: "brand",
    blur: true,
    duration: 180,
    size: "default",
    density: "compact",
    animation: "slide",
    paste: true,
    disabled: false,
    failRate: 25,
  },
  componentDefaults: {},
  demoOnly: ["failRate"],
  stageHeight: 600,
  // 每个预设都写全会互相影响的参数, 切换预设时不会带着上一个预设的 multiple / accept / maxFiles
  presets: [
    { label: "会话发文件", values: { example: "chat", density: "compact", paste: true, accept: "any", multiple: true, maxSize: 50, maxFiles: 0 } },
    { label: "网盘上传", values: { example: "drive", density: "default", size: "sm", accept: "any", multiple: true, maxSize: 0, maxFiles: 0, failRate: 25 } },
    { label: "只收图片", values: { example: "basic", accept: "image", multiple: true, maxSize: 10, maxFiles: 6, size: "default", density: "default" } },
    { label: "单个文件", values: { example: "basic", accept: "doc", multiple: false, maxSize: 50, maxFiles: 0, size: "lg", density: "comfortable" } },
  ],
  controls: [
    { type: "select", key: "example", label: "示例", options: [{ value: "chat", label: "会话发文件" }, { value: "drive", label: "网盘上传" }, { value: "basic", label: "上传卡片" }] },
    { type: "select", key: "accept", label: "接受类型", options: [{ value: "any", label: "不限" }, { value: "image", label: "图片 image/*" }, { value: "doc", label: "文档 .pdf .docx .md …" }] },
    { type: "toggle", key: "multiple", label: "多文件" },
    { type: "number", key: "maxSize", label: "单个上限 (0 不限)", min: 0, max: 500, step: 5, unit: "MB" },
    { type: "number", key: "maxFiles", label: "数量上限 (0 不限)", min: 0, max: 20, step: 1 },
    { type: "select", key: "tone", label: "高亮色调", options: [{ value: "brand", label: "品牌" }, { value: "primary", label: "主色" }, { value: "neutral", label: "中性" }] },
    { type: "toggle", key: "blur", label: "覆盖层磨砂" },
    { type: "number", key: "duration", label: "覆盖层时长", min: 0, max: 600, step: 20, unit: "ms" },
    { type: "select", key: "size", label: "卡片尺寸", options: [{ value: "sm", label: "横排" }, { value: "default", label: "默认" }, { value: "lg", label: "大" }] },
    { type: "select", key: "density", label: "列表密度", options: [{ value: "compact", label: "紧凑" }, { value: "default", label: "默认" }, { value: "comfortable", label: "宽松" }] },
    { type: "select", key: "animation", label: "增删动画", options: [{ value: "slide", label: "让位滑入" }, { value: "fade", label: "淡入" }, { value: "none", label: "无" }] },
    { type: "toggle", key: "paste", label: "粘贴文件" },
    { type: "toggle", key: "disabled", label: "禁用" },
    { type: "number", key: "failRate", label: "随机失败 (演示)", min: 0, max: 100, step: 5, unit: "%" },
  ],
  usage: (v) => (USAGE[String(v.example)] ?? USAGE.chat)(v),
  props: [
    { name: "variant", type: '"overlay" | "area"', default: '"overlay"', description: "overlay：包住 children，拖入时盖提示层，点击不选文件（区域本身可交互）；area：独立上传卡片，点击 / 回车 / 空格选文件。" },
    { name: "children", type: "ReactNode | (state) => ReactNode", description: "被包住的区域；area 时换掉卡片默认内容。函数形式拿到 { dragState, dragging, rejectMessage, dragMessage, disabled, open }。" },
    { name: "accept", type: "string | string[]", description: "同 <input accept>：MIME（image/png）、通配（image/*）、扩展名（.pdf），逗号分隔或数组。不给全收。" },
    { name: "multiple", type: "boolean", default: "true", description: "多选；false 时只收第一个，其余以 too-many 拒绝。" },
    { name: "maxSize / minSize", type: "number (字节)", description: "单个文件大小上下限；minSize={1} 可排除空文件。" },
    { name: "maxFiles / count", type: "number", description: "文件总数上限；count 是已有的文件数（附件栏里已有几个），一起计入。" },
    { name: "onFiles", type: '(files: File[], source: "drop" | "pick" | "paste") => void', description: "通过校验的文件。" },
    { name: "onReject", type: "(files: File[], reasons: RejectReason[][]) => void", description: "没通过的文件，reasons[i] 对应 files[i]：{ code: \"type\" | \"too-large\" | \"too-small\" | \"too-many\", message }，message 是可直接显示的中文。" },
    { name: "onDragStateChange", type: '(state: "idle" | "accept" | "reject" | "unknown") => void', description: "拖入 / 离开 / 放下时调用（不会每次 dragover 都调）。unknown：拖动中看不出类型（扩展名不在映射表里、系统报不出 MIME、Safari 拖动中不给条目），提示层为中性样式，放下后再校验。" },
    { name: "ref", type: "Ref<DropzoneHandle>", description: "{ open(), root }：open() 打开选择文件框（回形针按钮）。" },
    { name: "clickable", type: "boolean", description: "点击区域选文件；area 默认 true，overlay 默认 false。" },
    { name: "paste", type: 'boolean | "window"', default: "false", description: "接受粘贴的文件（截图）：true 区域内有焦点时；\"window\" 整页任意位置。" },
    { name: "disabled", type: "boolean", default: "false", description: "不响应拖放 / 点击 / 粘贴。" },
    { name: "tone", type: '"brand" | "primary" | "neutral"', default: '"brand"', description: "提示层与卡片拖入高亮的色调；拒绝时固定 destructive。" },
    { name: "overlay", type: "false | ReactNode | (state) => ReactNode", description: "提示层：false 不要；节点 / 函数换掉默认内容（外框与动画照旧）。也可单独用导出的 DropzoneOverlay 自己摆位置。" },
    { name: "overlayTitle / hint / icon", type: "ReactNode", description: "提示层标题（默认「松开即可上传」）、说明（默认按 accept / maxSize / maxFiles 生成，如「图片 · 单个不超过 10 MB」）、图标。" },
    { name: "blur", type: "boolean", default: "true", description: "提示层背后轻微磨砂。" },
    { name: "inset / duration", type: "number", default: "6 / 180", description: "提示层离边缘的距离（px）；淡入 + 缩放时长（ms），也可用 CSS 变量 --dropzone-inset / --dropzone-duration。减弱动效时直接出现。" },
    { name: "size", type: '"sm" | "default" | "lg"', default: '"default"', description: "area 尺寸：sm 横排一行，default 竖排，lg 更高。" },
    { name: "inputProps", type: "InputHTMLAttributes", description: "隐藏 input 的其他属性（name、capture、id）。" },
    { name: "UploadList · items", type: "UploadFile[]", description: "{ id, name, size, type?, status: \"queued\" | \"uploading\" | \"paused\" | \"done\" | \"error\", progress?: 0..100 | null, error?, preview?, file?, meta? }。progress 为 null 显示不确定进度；file 是图片且没给 preview 时自动生成缩略图（对象 URL 自动释放）；meta 显示在进度后，如速度 / 剩余时间。" },
    { name: "UploadList · onPause / onResume / onCancel / onRetry / onRemove", type: "(item) => void", description: "按状态出现对应按钮：上传中 暂停 + 取消，暂停 继续 + 取消，失败 重试 + 移除，完成 移除。不给回调就不显示该按钮。" },
    { name: "UploadList · density", type: '"compact" | "default" | "comfortable"', default: '"default"', description: "compact 单行 40px（附件栏，进度为行底 2px 细线），default 两行，comfortable 更大的缩略图。" },
    { name: "UploadList · animation", type: '"slide" | "fade" | "none" | UnfoldOptions', default: '"slide"', description: "增删过渡（与 Tree 同一套 useUnfold）：新行淡入并带动下方让位，移除的行淡出后收拢。" },
    { name: "UploadList · thumbnail / empty / renderItem / gap", type: "—", description: "是否显示图片缩略图（默认 true）；空列表时显示的内容；换掉某一行（第二个参数是默认行）；行间距 px。" },
    { name: "UploadItem", type: "组件", description: "单行，可脱离列表使用：item、density、thumbnail、icon、actions（附加按钮）、keepTail（文件名尾部保留字符数，默认 6，中间截断）以及同名回调。" },
    { name: "formatBytes / validateFiles / matchAccept / describeAccept / dragVerdict / EXT_MIME", type: "函数 / 常量", description: "一并导出的纯函数（dropzone-model.ts，服务端可用）：字节格式化、按规则校验一组文件、单个文件是否匹配 accept、把 accept 说成人话、拖动途中只凭 MIME 判断 \"accept\" | \"reject\" | \"unknown\"、常见扩展名 → MIME 映射表。" },
  ],
};
