import * as React from "react";
import { toast } from "sonner";
import { CloudUploadIcon, FolderIcon, PaperclipIcon, SendHorizontalIcon, Trash2Icon } from "lucide-react";
import { Dropzone, formatBytes, type DropzoneHandle, type DropzoneTone, type RejectReason } from "@/components/ui/dropzone";
import { UploadItem, UploadList, type UploadDensity, type UploadFile } from "@/components/ui/upload-list";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import type { UnfoldType } from "@/motion/unfold";
import type { DemoProps } from "../types";

const MB = 1024 * 1024;
const TICK_MS = 120;
/** 演示的上传速度区间 (字节 / 秒) */
const SPEED_MIN = 0.6 * MB;
const SPEED_MAX = 3.2 * MB;
const CARD = "relative flex w-full max-w-xl flex-col overflow-hidden rounded-xl border bg-popover text-popover-foreground shadow-float";

const ACCEPT_PRESETS: Record<string, string | undefined> = {
  any: undefined,
  image: "image/*",
  doc: ".pdf,.doc,.docx,.md,.txt,.xlsx",
};

/** 用主题色画一张示例图 (不外链图片), 当作缩略图 / 附件 */
function sampleImage(seed: number, w = 320, h = 220): Promise<Blob | null> {
  const css = getComputedStyle(document.documentElement);
  const tokens = ["--chart-1", "--chart-2", "--chart-3", "--chart-4", "--chart-5", "--brand"].map((t) => css.getPropertyValue(t).trim()).filter(Boolean);
  const pick = (i: number) => tokens[(seed + i) % tokens.length] ?? "gray";
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) return Promise.resolve(null);
  const g = ctx.createLinearGradient(0, 0, w, h);
  g.addColorStop(0, pick(0));
  g.addColorStop(1, pick(2));
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
  ctx.globalAlpha = 0.85;
  ctx.fillStyle = pick(4);
  ctx.beginPath();
  ctx.arc(w * 0.72, h * 0.34, h * 0.16, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 0.7;
  ctx.fillStyle = pick(1);
  ctx.beginPath();
  ctx.moveTo(0, h);
  ctx.lineTo(w * 0.32, h * 0.48);
  ctx.lineTo(w * 0.58, h * 0.8);
  ctx.lineTo(w * 0.8, h * 0.58);
  ctx.lineTo(w, h);
  ctx.fill();
  return new Promise((done) => canvas.toBlob(done, "image/png"));
}

type Sim = UploadFile & { speed: number; failAt?: number };
let uid = 0;
const nextId = () => `f${++uid}`;

/**
 * 模拟上传: 一个定时器推进所有 uploading 的项; 按 failRate 随机在 30% ~ 85% 之间失败.
 * 真实使用时把这里换成 XHR / fetch 的 onprogress 即可, 组件只认 items.
 */
function useFakeUploads(failRate: number, seed: Sim[] = []) {
  const [items, setItems] = React.useState<Sim[]>(seed);
  const rate = React.useRef(failRate);
  rate.current = failRate;
  const active = items.some((f) => f.status === "uploading");

  React.useEffect(() => {
    if (!active) return;
    const t = window.setInterval(() => {
      setItems((list) =>
        list.map((f) => {
          if (f.status !== "uploading") return f;
          const progress = Math.min(100, (f.progress ?? 0) + ((f.speed * (0.7 + Math.random() * 0.6) * TICK_MS) / 1000 / Math.max(1, f.size)) * 100);
          if (f.failAt != null && progress >= f.failAt) return { ...f, status: "error", progress: f.failAt, error: "网络中断，点重试继续", failAt: undefined };
          const left = ((100 - progress) / 100) * f.size;
          return progress >= 100
            ? { ...f, status: "done", progress: 100, meta: undefined }
            : { ...f, progress, meta: `${formatBytes(f.speed)}/s · 剩余 ${Math.max(1, Math.ceil(left / f.speed))} 秒` };
        }),
      );
    }, TICK_MS);
    return () => window.clearInterval(t);
  }, [active]);

  const plan = (): Pick<Sim, "speed" | "failAt"> => ({
    speed: SPEED_MIN + Math.random() * (SPEED_MAX - SPEED_MIN),
    failAt: Math.random() < rate.current ? 30 + Math.random() * 55 : undefined,
  });

  return {
    items,
    add: (files: File[]) =>
      setItems((list) => [...list, ...files.map((file): Sim => ({ id: nextId(), name: file.name, size: file.size, type: file.type, file, status: "uploading", progress: 0, ...plan() }))]),
    retry: (f: UploadFile) => setItems((list) => list.map((x) => (x.id === f.id ? { ...x, status: "uploading", error: undefined, ...plan() } : x))),
    pause: (f: UploadFile) => setItems((list) => list.map((x) => (x.id === f.id ? { ...x, status: "paused", meta: undefined } : x))),
    resume: (f: UploadFile) => setItems((list) => list.map((x) => (x.id === f.id ? { ...x, status: "uploading" } : x))),
    remove: (f: UploadFile) => setItems((list) => list.filter((x) => x.id !== f.id)),
    clear: (pred: (f: Sim) => boolean) => setItems((list) => list.filter((x) => !pred(x))),
    set: setItems,
  };
}

function notifyReject(files: File[], reasons: RejectReason[][]) {
  const first = `${files[0]?.name}：${reasons[0]?.map((r) => r.message).join("，")}`;
  toast.error(files.length > 1 ? `${files.length} 个文件没有添加` : "文件没有添加", { description: files.length > 1 ? `${first} 等` : first });
}

interface Common {
  accept?: string;
  multiple: boolean;
  maxSize?: number;
  maxFiles?: number;
  tone: DropzoneTone;
  blur: boolean;
  duration: number;
  size: "sm" | "default" | "lg";
  density: UploadDensity;
  animation: UnfoldType;
  paste: boolean;
  disabled: boolean;
  failRate: number;
}

/* ------------------------------------------------------------------ 会话 */

interface Message {
  id: string;
  me: boolean;
  who: string;
  text: string;
  files?: UploadFile[];
}

const SEED_MESSAGES: Message[] = [
  { id: "m1", me: false, who: "林", text: "首页改版的设计稿出来了吗？评审会前我想先看一眼。" },
  { id: "m2", me: true, who: "我", text: "出了，导出成 PDF 和几张关键页的截图，我拖进来发你。" },
];

function Bubble({ m, density }: { m: Message; density: UploadDensity }) {
  return (
    <div className={cn("flex items-end gap-2", m.me && "flex-row-reverse")}>
      <Avatar size="sm">
        <AvatarFallback className={m.me ? "bg-brand-soft text-brand" : undefined}>{m.who}</AvatarFallback>
      </Avatar>
      <div className={cn("grid max-w-[78%] gap-1.5", m.me && "justify-items-end")}>
        {m.text && <p className={cn("rounded-2xl px-3 py-2 text-sm", m.me ? "rounded-br-md bg-primary text-primary-foreground" : "rounded-bl-md bg-muted")}>{m.text}</p>}
        {m.files?.length ? (
          <div className="grid w-64 gap-1 rounded-xl border bg-background/60 p-1">
            {m.files.map((f) => (
              <UploadItem key={f.id} item={f} density={density === "comfortable" ? "default" : density} />
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
}

function Chat(p: Common) {
  const zone = React.useRef<DropzoneHandle>(null);
  const up = useFakeUploads(p.failRate);
  const [messages, setMessages] = React.useState(SEED_MESSAGES);
  const [text, setText] = React.useState("");
  const scroller = React.useRef<HTMLDivElement>(null);
  const pending = up.items.some((f) => f.status !== "done");
  const canSend = !pending && (text.trim() !== "" || up.items.length > 0);

  React.useEffect(() => {
    scroller.current?.scrollTo({ top: scroller.current.scrollHeight, behavior: "smooth" });
  }, [messages.length]);

  const send = () => {
    if (!canSend) return;
    setMessages((list) => [...list, { id: nextId(), me: true, who: "我", text: text.trim(), files: up.items.map(({ speed: _s, failAt: _f, ...f }) => f) }]);
    setText("");
    up.set([]);
  };

  return (
    <Dropzone
      ref={zone}
      accept={p.accept}
      multiple={p.multiple}
      maxSize={p.maxSize}
      maxFiles={p.maxFiles}
      count={up.items.length}
      tone={p.tone}
      blur={p.blur}
      duration={p.duration}
      paste={p.paste}
      disabled={p.disabled}
      overlayTitle="松开发送到「产品讨论」"
      onFiles={(files, source) => {
        up.add(files);
        if (source === "paste") toast.success(`已粘贴 ${files.length} 个文件`);
      }}
      onReject={notifyReject}
      className={cn(CARD, "h-[30rem] rounded-xl")}
    >
      <header className="flex items-center gap-2.5 border-b px-4 py-3">
        <span className="grid size-8 place-items-center rounded-lg bg-brand-soft text-sm font-medium text-brand">产</span>
        <div className="grid min-w-0 flex-1">
          <span className="truncate text-sm font-medium">产品讨论</span>
          <span className="text-xs text-muted-foreground">林、阿哲 和 你 · 拖文件到这里发送</span>
        </div>
      </header>
      <div ref={scroller} className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto px-4 py-4">
        {messages.map((m) => (
          <Bubble key={m.id} m={m} density={p.density} />
        ))}
      </div>
      <div className="border-t bg-background/40 p-2.5">
        {up.items.length > 0 && (
          <UploadList
            items={up.items}
            density={p.density === "comfortable" ? "default" : p.density}
            animation={p.animation}
            onCancel={up.remove}
            onRemove={up.remove}
            onRetry={up.retry}
            className="mb-2 max-h-32 overflow-y-auto overscroll-contain rounded-lg border bg-background/60 p-1"
          />
        )}
        <div className="flex items-end gap-1.5 rounded-lg border bg-background px-1.5 py-1.5 focus-within:ring-1 focus-within:ring-ring">
          <Button type="button" size="icon-sm" variant="ghost" aria-label="添加附件" title="添加附件" disabled={p.disabled} onClick={() => zone.current?.open()}>
            <PaperclipIcon />
          </Button>
          <textarea
            value={text}
            rows={1}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
                e.preventDefault();
                send();
              }
            }}
            placeholder={p.paste ? "输入消息，可直接粘贴截图…" : "输入消息…"}
            aria-label="消息"
            className="max-h-24 min-h-8 flex-1 resize-none bg-transparent py-1.5 text-sm outline-none placeholder:text-muted-foreground"
          />
          <Button type="button" size="icon-sm" aria-label="发送" title={pending ? "附件上传完再发送" : "发送"} disabled={!canSend} onClick={send}>
            <SendHorizontalIcon />
          </Button>
        </div>
      </div>
    </Dropzone>
  );
}

/* ------------------------------------------------------------------ 网盘 */

const DRIVE_SEED: Sim[] = [
  { id: "d1", name: "首页改版-终稿-v3.fig", size: 48.2 * MB, status: "uploading", progress: 37, speed: 2.4 * MB },
  { id: "d2", name: "品牌规范手册（对外版）2026Q4.pdf", size: 12.6 * MB, type: "application/pdf", status: "paused", progress: 62, speed: 1.6 * MB },
  { id: "d3", name: "用户访谈录音-第二轮.m4a", size: 86 * MB, type: "audio/mp4", status: "error", progress: 44, error: "网络中断，点重试继续", speed: 2.8 * MB },
  { id: "d4", name: "发布会素材.zip", size: 214 * MB, type: "application/zip", status: "queued", progress: 0, speed: 3 * MB },
  { id: "d5", name: "数据看板导出.xlsx", size: 1.3 * MB, status: "done", progress: 100, speed: 1 * MB },
];

function Drive(p: Common) {
  const zone = React.useRef<DropzoneHandle>(null);
  const up = useFakeUploads(p.failRate, DRIVE_SEED);
  const { set } = up;

  // 示例图片缩略图 (用主题色现画)
  React.useEffect(() => {
    let live = true;
    Promise.all([sampleImage(0), sampleImage(3)]).then(([a, b]) => {
      if (!live || !a || !b) return;
      set((list) => [
        { id: "img1", name: "hero-banner@2x.png", size: 2.4 * MB, type: "image/png", file: a, status: "done", progress: 100, speed: MB },
        { id: "img2", name: "活动海报-竖版.png", size: 3.9 * MB, type: "image/png", file: b, status: "uploading", progress: 18, speed: 1.2 * MB },
        ...list,
      ]);
    });
    return () => {
      live = false;
    };
  }, [set]);

  // 排队的项: 有空位就开始 (同时最多 3 个)
  React.useEffect(() => {
    const running = up.items.filter((f) => f.status === "uploading").length;
    const queued = up.items.find((f) => f.status === "queued");
    if (running < 3 && queued) set((list) => list.map((x) => (x.id === queued.id ? { ...x, status: "uploading" } : x)));
  }, [up.items, set]);

  const total = up.items.reduce((s, f) => s + f.size, 0);
  const sent = up.items.reduce((s, f) => s + (f.size * (f.progress ?? 0)) / 100, 0);
  const count = (st: UploadFile["status"]) => up.items.filter((f) => f.status === st).length;

  return (
    <div className={cn(CARD, "h-[32rem] max-w-2xl")}>
      <header className="flex items-center gap-2 border-b px-4 py-3">
        <FolderIcon className="size-4 text-warning" />
        <span className="text-sm text-muted-foreground">我的网盘 /</span>
        <span className="text-sm font-medium">设计资源</span>
        <div className="ml-auto flex items-center gap-1.5">
          <Button type="button" size="xs" variant="ghost" disabled={!count("done")} onClick={() => up.clear((f) => f.status === "done")}>
            <Trash2Icon />
            清除已完成
          </Button>
          <Button type="button" size="xs" disabled={p.disabled} onClick={() => zone.current?.open()}>
            <CloudUploadIcon />
            上传文件
          </Button>
        </div>
      </header>
      <div className="grid min-h-0 flex-1 grid-rows-[auto_1fr] gap-3 p-3">
        <Dropzone
          ref={zone}
          variant="area"
          size={p.size}
          accept={p.accept}
          multiple={p.multiple}
          maxSize={p.maxSize}
          maxFiles={p.maxFiles}
          count={up.items.filter((f) => f.status !== "done").length}
          tone={p.tone}
          duration={p.duration}
          paste={p.paste}
          disabled={p.disabled}
          onFiles={(files) => up.add(files)}
          onReject={notifyReject}
        />
        <UploadList
          items={up.items}
          density={p.density}
          animation={p.animation}
          onCancel={up.remove}
          onRemove={up.remove}
          onRetry={up.retry}
          onPause={up.pause}
          onResume={up.resume}
          empty={<p className="py-6 text-center">还没有上传任务</p>}
          className="min-h-0 overflow-y-auto overscroll-contain pr-1"
        />
      </div>
      <footer className="grid gap-1.5 border-t px-4 py-2.5">
        <div className="flex items-center gap-3 text-xs text-muted-foreground tabular">
          <span>上传中 {count("uploading")}</span>
          <span>排队 {count("queued")}</span>
          <span>完成 {count("done")}</span>
          {count("error") > 0 && <span className="text-destructive">失败 {count("error")}</span>}
          <span className="ml-auto">
            {formatBytes(sent)} / {formatBytes(total)}
          </span>
        </div>
        <Progress size="sm" value={total ? (sent / total) * 100 : 0} aria-label="总进度" />
      </footer>
    </div>
  );
}

/* ------------------------------------------------------------------ 基础 */

function Basic(p: Common) {
  const up = useFakeUploads(p.failRate);
  return (
    <div className="grid w-full max-w-md gap-3">
      <Dropzone
        variant="area"
        size={p.size}
        accept={p.accept}
        multiple={p.multiple}
        maxSize={p.maxSize}
        maxFiles={p.maxFiles}
        count={up.items.length}
        tone={p.tone}
        duration={p.duration}
        paste={p.paste}
        disabled={p.disabled}
        onFiles={(files) => up.add(files)}
        onReject={notifyReject}
      />
      <UploadList
        items={up.items}
        density={p.density}
        animation={p.animation}
        onCancel={up.remove}
        onRemove={up.remove}
        onRetry={up.retry}
        empty={<p className="text-center text-xs">选好的文件会出现在这里（模拟上传，按「随机失败」的概率出错）</p>}
      />
    </div>
  );
}

const EXAMPLES: Record<string, (p: Common) => React.ReactElement> = { chat: Chat, drive: Drive, basic: Basic };

export default function DropzoneDemo({ values }: DemoProps) {
  const Example = EXAMPLES[String(values.example)] ?? Chat;
  const maxSize = Number(values.maxSize);
  const maxFiles = Number(values.maxFiles);
  const pick = <T extends string>(v: unknown, list: readonly T[], fallback: T): T => (list.includes(v as T) ? (v as T) : fallback);
  return (
    <Example
      accept={ACCEPT_PRESETS[String(values.accept)]}
      multiple={values.multiple !== false}
      maxSize={maxSize > 0 ? maxSize * MB : undefined}
      maxFiles={maxFiles > 0 ? maxFiles : undefined}
      tone={pick(values.tone, ["brand", "primary", "neutral"] as const, "brand")}
      blur={values.blur !== false}
      duration={Number(values.duration ?? 180)}
      size={pick(values.size, ["sm", "default", "lg"] as const, "default")}
      density={pick(values.density, ["compact", "default", "comfortable"] as const, "default")}
      animation={pick(values.animation, ["slide", "fade", "none"] as const, "slide")}
      paste={Boolean(values.paste)}
      disabled={Boolean(values.disabled)}
      failRate={Number(values.failRate ?? 25) / 100}
    />
  );
}
