import * as React from "react";
import { toast } from "sonner";
import { ImageIcon, RotateCcwIcon, RotateCcwSquareIcon, RotateCwSquareIcon, SparklesIcon, UploadIcon, ZoomInIcon, ZoomOutIcon } from "lucide-react";
import { ImageCropper, ImageCropperStraighten, type CropArea, type CropOutputType, type ImageCropperDragMode, type ImageCropperHandle } from "@/components/ui/image-cropper";
import { Dropzone, formatBytes } from "@/components/ui/dropzone";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";
import type { DemoProps } from "../types";

const PREVIEW_DEBOUNCE_MS = 120;
const SAMPLE_W = 1600;
const SAMPLE_H = 1067;
const FORMAT_LABEL: Record<CropOutputType, string> = { "image/webp": "WebP", "image/jpeg": "JPEG", "image/png": "PNG" };
/** 远程示例图 (picsum 开放了 CORS, 可直接导出) */
const REMOTE_URL = "https://picsum.photos/id/1015/1600/1067";
const STRAIGHTEN_MAX = 45;

/**
 * 内置示例图: 用主题色在画布上现画一张 "山与日落" (不外链图片), 输出 PNG File.
 * 颜色取自 CSS 令牌 (--chart-*, --brand), 换主题示例图跟着变.
 */
function makeSample(): Promise<File | null> {
  const css = getComputedStyle(document.documentElement);
  const tok = (n: string) => css.getPropertyValue(n).trim() || "gray";
  const [c1, c2, c3, c4, c5, brand] = ["--chart-1", "--chart-2", "--chart-3", "--chart-4", "--chart-5", "--brand"].map(tok);
  const canvas = document.createElement("canvas");
  canvas.width = SAMPLE_W;
  canvas.height = SAMPLE_H;
  const ctx = canvas.getContext("2d");
  if (!ctx) return Promise.resolve(null);
  const W = SAMPLE_W;
  const H = SAMPLE_H;
  const sky = ctx.createLinearGradient(0, 0, 0, H);
  sky.addColorStop(0, brand);
  sky.addColorStop(0.55, c4);
  sky.addColorStop(1, c3);
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, W, H);
  // 太阳 + 光晕
  const sun = ctx.createRadialGradient(W * 0.62, H * 0.5, 0, W * 0.62, H * 0.5, H * 0.42);
  sun.addColorStop(0, c3);
  sun.addColorStop(0.3, c3);
  sun.addColorStop(1, "transparent");
  ctx.fillStyle = sun;
  ctx.fillRect(0, 0, W, H);
  // 三层山
  const ridge = (base: number, amp: number, color: string, alpha: number, phase: number) => {
    ctx.globalAlpha = alpha;
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(0, H);
    for (let x = 0; x <= W; x += 8) ctx.lineTo(x, base + Math.sin(x / 140 + phase) * amp + Math.sin(x / 47 + phase * 2) * amp * 0.25);
    ctx.lineTo(W, H);
    ctx.fill();
  };
  ridge(H * 0.62, 46, c1, 0.55, 0.4);
  ridge(H * 0.72, 38, c2, 0.75, 1.7);
  ridge(H * 0.84, 30, c5, 0.95, 3.1);
  ctx.globalAlpha = 1;
  return new Promise((done) => canvas.toBlob((b) => done(b ? new File([b], "示例-山与日落.png", { type: "image/png" }) : null), "image/png"));
}

interface Opts {
  aspect: number | "free";
  shape: "rect" | "round";
  grid: boolean | "active";
  size: number;
  type: CropOutputType;
  quality: number;
  maxZoom: number;
  rotatable: boolean;
  padding: number;
  duration: number;
  dragMode: ImageCropperDragMode;
  restrict: boolean;
  resizable: boolean;
  remote: boolean;
}

/** 输出预览: 交互结束后按输出参数真的压一次, 显示圆头像 / 尺寸 / 字节数 */
function usePreview(cropper: React.RefObject<ImageCropperHandle | null>, o: Opts) {
  const [preview, setPreview] = React.useState<{ url: string; bytes: number; w: number; h: number } | null>(null);
  const timer = React.useRef(0);
  const urlRef = React.useRef<string | null>(null);
  const refresh = React.useCallback(() => {
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(async () => {
      // 跨域图片只能预览时 getBlob 会以 code="cors" 拒绝, 原因已经由 onError 显示
      const blob = await cropper.current?.getBlob({ size: o.size, type: o.type, quality: o.quality }).catch(() => null);
      if (!blob) {
        // 换了图但导不出 (跨域只能预览): 不留上一张的预览
        setPreview(null);
        return;
      }
      const bitmap = await createImageBitmap(blob);
      const url = URL.createObjectURL(blob);
      if (urlRef.current) URL.revokeObjectURL(urlRef.current);
      urlRef.current = url;
      setPreview({ url, bytes: blob.size, w: bitmap.width, h: bitmap.height });
      bitmap.close();
    }, PREVIEW_DEBOUNCE_MS);
  }, [cropper, o.size, o.type, o.quality]);
  // 输出参数变了也重压一次
  React.useEffect(() => refresh(), [refresh]);
  React.useEffect(
    () => () => {
      window.clearTimeout(timer.current);
      if (urlRef.current) URL.revokeObjectURL(urlRef.current);
    },
    [],
  );
  return { preview, refresh, blobUrl: () => preview?.url ?? null };
}

/** 换头像的裁剪面板: 裁剪区 + 缩放条 / 旋转 + 输出预览. 内联与 Dialog 两个示例共用 */
function CropEditor({ file, o, cropper, onPick, onArea }: { file: File | string | null; o: Opts; cropper: React.RefObject<ImageCropperHandle | null>; onPick: (f: File) => void; onArea?: (a: CropArea) => void }) {
  const [zoom, setZoom] = React.useState(1);
  // 旋转 = 90° 的倍数 (按钮 / R) + 拉直角度 (刻度尺 / [ ])
  const [quarter, setQuarter] = React.useState(0);
  const [fine, setFine] = React.useState(0);
  const { preview, refresh } = usePreview(cropper, o);
  const [area, setArea] = React.useState<CropArea | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [loaded, setLoaded] = React.useState(false);
  React.useEffect(() => {
    setZoom(1);
    setQuarter(0);
    setFine(0);
    setError(null);
    setArea(null);
    setLoaded(false);
  }, [file]);
  const onRotation = (r: number) => {
    // 组件内部改了角度 (R / [ ] / 复位): 能归到当前四分之一圈就只改拉直角度, 否则重新拆
    const f = r - quarter;
    if (Math.abs(f) <= STRAIGHTEN_MAX) setFine(+f.toFixed(4));
    else {
      const q = Math.round(r / 90) * 90;
      setQuarter(q);
      setFine(+(r - q).toFixed(4));
    }
  };
  const round = o.shape === "round";
  const ratio = preview ? preview.w / preview.h : 1;

  return (
    <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_11rem]">
      <div className="grid min-w-0 gap-2.5">
        {file ? (
          <ImageCropper
            ref={cropper}
            src={file}
            aspect={o.aspect}
            cropShape={o.shape}
            grid={o.grid}
            maxZoom={o.maxZoom}
            rotatable={o.rotatable}
            dragMode={o.dragMode}
            restrict={o.restrict}
            resizable={o.resizable}
            rotation={quarter + fine}
            onRotationChange={onRotation}
            onLoad={() => setLoaded(true)}
            onError={(e) => {
              // 加载失败: 裁剪区里已经显示原因; 只能预览 (cors) 时在预览栏注明为什么没有输出
              if (e.code === "cors") setError(e.message);
              else setLoaded(false);
            }}
            padding={o.padding}
            duration={o.duration}
            zoom={zoom}
            onZoomChange={setZoom}
            onCropComplete={(a) => {
              setArea(a);
              onArea?.(a);
              refresh();
            }}
            aria-label="裁剪头像"
            className="h-72 max-sm:h-64"
          />
        ) : (
          <Dropzone
            variant="area"
            size="lg"
            accept="image/*"
            multiple={false}
            maxSize={20 * 1024 * 1024}
            className="h-72"
            onFiles={([f]) => onPick(f)}
            onReject={(files, reasons) => toast.error(`${files[0].name}：${reasons[0][0].message}`)}
          />
        )}
        <div className={cn("grid gap-1.5 transition-opacity duration-200 motion-reduce:transition-none", !loaded && "pointer-events-none opacity-40")} inert={!loaded || undefined}>
          <div className="flex items-center gap-2">
            <Button type="button" size="icon-sm" variant="ghost" aria-label="缩小" onClick={() => setZoom((z) => Math.max(1, +(z - 0.25).toFixed(2)))}>
              <ZoomOutIcon />
            </Button>
            <Slider aria-label="缩放" min={1} max={o.maxZoom} step={0.01} value={[zoom]} onValueChange={([z]) => setZoom(z)} formatValue={(v) => `${Math.round(v * 100)}%`} className="flex-1" />
            <Button type="button" size="icon-sm" variant="ghost" aria-label="放大" onClick={() => setZoom((z) => Math.min(o.maxZoom, +(z + 0.25).toFixed(2)))}>
              <ZoomInIcon />
            </Button>
            <span className="w-11 text-right text-xs text-muted-foreground tabular">{Math.round(zoom * 100)}%</span>
            <Button type="button" size="icon-sm" variant="ghost" aria-label="复位" title="复位 (0)" onClick={() => cropper.current?.reset()}>
              <RotateCcwIcon />
            </Button>
          </div>
          {o.rotatable && (
            <div className="flex items-center gap-2">
              <Button type="button" size="icon-sm" variant="ghost" aria-label="逆时针旋转 90°" title="逆时针 90° (Shift+R)" onClick={() => setQuarter((q) => q - 90)}>
                <RotateCcwSquareIcon />
              </Button>
              <ImageCropperStraighten value={fine} onValueChange={setFine} className="flex-1" />
              <Button type="button" size="icon-sm" variant="ghost" aria-label="顺时针旋转 90°" title="顺时针 90° (R)" onClick={() => setQuarter((q) => q + 90)}>
                <RotateCwSquareIcon />
              </Button>
            </div>
          )}
        </div>
      </div>

      <aside className="grid content-start gap-3 rounded-xl border bg-background/50 p-3">
        <span className="text-xs text-muted-foreground">预览</span>
        <div className="flex h-16 items-end gap-2.5">
          {[64, 36, 20].map((px) => (
            <span
              key={px}
              className={cn("relative grid shrink-0 place-items-center overflow-hidden border bg-muted text-muted-foreground", round ? "rounded-full" : "rounded-md")}
              style={{ width: ratio >= 1 ? px : px * ratio, height: ratio >= 1 ? px / ratio : px }}
            >
              {preview && file ? <img src={preview.url} alt="" className="size-full object-cover" /> : <ImageIcon className="size-1/2" />}
            </span>
          ))}
        </div>
        <dl className="grid grid-cols-[auto_1fr] gap-x-2 gap-y-1 text-xs tabular">
          <dt className="text-muted-foreground">输出</dt>
          <dd className="text-right">{preview && file ? `${preview.w}×${preview.h}` : "—"}</dd>
          <dt className="text-muted-foreground">格式</dt>
          <dd className="text-right">
            {FORMAT_LABEL[o.type]}
            {o.type !== "image/png" ? ` · ${Math.round(o.quality * 100)}%` : ""}
          </dd>
          <dt className="text-muted-foreground">形状</dt>
          <dd className="text-right">{round ? (o.type === "image/jpeg" ? "圆 · 主题底色" : "圆 · 透明角") : "矩形"}</dd>
          <dt className="text-muted-foreground">大小</dt>
          <dd className="text-right font-medium">{preview && file ? formatBytes(preview.bytes) : "—"}</dd>
          <dt className="text-muted-foreground">选区</dt>
          <dd className="truncate text-right text-muted-foreground">{area && file ? `${area.width}×${area.height}` : "—"}</dd>
          <dt className="text-muted-foreground">角度</dt>
          <dd className="text-right text-muted-foreground">{`${+(quarter + fine).toFixed(1)}°`}</dd>
        </dl>
        {error && <p className="text-[11px] leading-snug text-warning">{error}</p>}
      </aside>
    </div>
  );
}

function useSample() {
  const [file, setFile] = React.useState<File | null>(null);
  const loadSample = React.useCallback(() => {
    makeSample().then((f) => f && setFile(f));
  }, []);
  return { file, setFile, loadSample };
}

function PickButtons({ onPick, onSample }: { onPick: (f: File) => void; onSample: () => void }) {
  const input = React.useRef<HTMLInputElement>(null);
  return (
    <>
      <input
        ref={input}
        type="file"
        accept="image/*"
        hidden
        onChange={(e) => {
          const f = e.currentTarget.files?.[0];
          if (f) onPick(f);
          e.currentTarget.value = "";
        }}
      />
      <Button type="button" size="sm" variant="outline" onClick={() => input.current?.click()}>
        <UploadIcon />
        选择图片
      </Button>
      <Button type="button" size="sm" variant="ghost" onClick={onSample}>
        <SparklesIcon />
        示例图
      </Button>
    </>
  );
}

/** 内联: 裁剪面板直接放在舞台上, 改调参立刻看到效果 */
function Inline({ o }: { o: Opts }) {
  const cropper = React.useRef<ImageCropperHandle>(null);
  const { file, setFile, loadSample } = useSample();
  React.useEffect(() => loadSample(), [loadSample]);
  const src = o.remote ? REMOTE_URL : file;
  return (
    <div className="w-full max-w-2xl rounded-xl border bg-popover p-4 text-popover-foreground shadow-float">
      <div className="mb-3 flex items-center gap-2">
        <span className="text-sm font-medium">裁剪</span>
        <span className="truncate text-xs text-muted-foreground max-sm:hidden">拖动 / 滚轮 / 双指；拖边角调整裁剪框；方向键、+ -、R、[ ]、0</span>
        <div className="ml-auto flex items-center gap-1.5">
          <PickButtons onPick={setFile} onSample={loadSample} />
        </div>
      </div>
      <CropEditor file={src} o={o} cropper={cropper} onPick={setFile} />
    </div>
  );
}

/** 换头像流程: 账号卡片 -> Dialog (选图 -> 裁剪 -> 预览) -> 保存后头像更新 */
function AvatarFlow({ o }: { o: Opts }) {
  const cropper = React.useRef<ImageCropperHandle>(null);
  const { file, setFile, loadSample } = useSample();
  const [open, setOpen] = React.useState(false);
  const [avatar, setAvatar] = React.useState<{ url: string; bytes: number } | null>(null);
  const [saving, setSaving] = React.useState(false);
  const avatarRef = React.useRef<string | null>(null);
  React.useEffect(() => () => void (avatarRef.current && URL.revokeObjectURL(avatarRef.current)), []);

  const save = async () => {
    setSaving(true);
    const blob = await cropper.current?.getBlob({ size: o.size, type: o.type, quality: o.quality }).catch((e: Error) => {
      toast.error(e.message);
      return null;
    });
    setSaving(false);
    if (!blob) return;
    if (avatarRef.current) URL.revokeObjectURL(avatarRef.current);
    const url = URL.createObjectURL(blob);
    avatarRef.current = url;
    setAvatar({ url, bytes: blob.size });
    setOpen(false);
    toast.success("头像已更新", { description: `${FORMAT_LABEL[o.type]} · ${formatBytes(blob.size)}（演示：未真正上传）` });
  };

  return (
    <div className="w-full max-w-md rounded-xl border bg-popover p-5 text-popover-foreground shadow-float">
      <p className="text-sm font-medium">账号</p>
      <p className="mt-0.5 text-xs text-muted-foreground">头像会显示在会话、群成员列表和邮件签名里。</p>
      <div className="mt-4 flex items-center gap-4">
        <Avatar className={cn("size-16 border", o.shape === "rect" && "rounded-xl")}>
          {avatar && <AvatarImage src={avatar.url} alt="我的头像" className="object-cover" />}
          <AvatarFallback className={cn("bg-brand-soft text-lg text-brand", o.shape === "rect" && "rounded-xl")}>恒</AvatarFallback>
        </Avatar>
        <div className="grid min-w-0 flex-1 gap-0.5">
          <span className="truncate text-sm font-medium">HengXin</span>
          <span className="text-xs text-muted-foreground tabular">{avatar ? `${o.size}px · ${formatBytes(avatar.bytes)}` : "还没有设置头像"}</span>
        </div>
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() => {
            setOpen(true);
            if (!file) loadSample();
          }}
        >
          更换头像
        </Button>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>更换头像</DialogTitle>
            <DialogDescription>拖动调整位置，滚轮或双指缩放。保存时压缩成 {o.size}px {FORMAT_LABEL[o.type]}。</DialogDescription>
          </DialogHeader>
          <CropEditor file={file} o={o} cropper={cropper} onPick={setFile} />
          <DialogFooter className="items-center sm:justify-between">
            <div className="flex items-center gap-1.5">
              <PickButtons onPick={setFile} onSample={loadSample} />
            </div>
            <div className="flex items-center gap-2">
              <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
                取消
              </Button>
              <Button type="button" disabled={!file || saving} onClick={save}>
                {saving ? "保存中…" : "保存"}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

const ASPECTS: Record<string, number | "free"> = { "1": 1, "4/3": 4 / 3, "16/9": 16 / 9, "3/4": 3 / 4, free: "free" };

export default function ImageCropperDemo({ values }: DemoProps) {
  const type = (["image/webp", "image/jpeg", "image/png"] as const).find((t) => t === values.type) ?? "image/webp";
  const o: Opts = {
    aspect: ASPECTS[String(values.aspect)] ?? 1,
    shape: values.shape === "rect" ? "rect" : "round",
    grid: values.grid === "always" ? true : values.grid === "never" ? false : "active",
    size: Number(values.size ?? 256),
    type,
    quality: Number(values.quality ?? 90) / 100,
    maxZoom: Number(values.maxZoom ?? 4),
    rotatable: values.rotatable !== false,
    padding: Number(values.padding ?? 24),
    duration: Number(values.duration ?? 200),
    dragMode: values.dragMode === "frame" || values.dragMode === "image" ? values.dragMode : "auto",
    restrict: values.restrict !== false,
    resizable: values.resizable !== false,
    remote: values.source === "remote",
  };
  return values.example === "dialog" ? <AvatarFlow o={o} /> : <Inline o={o} />;
}
