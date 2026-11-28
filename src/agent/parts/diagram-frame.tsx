"use client";
/**
 * 图类围栏 (mermaid, svg, 公式, 使用方自定义) 的外框: 标题栏 (语言名, 图 / 源码切换, 复制, 下载, 全屏).
 * 全屏里可以滚轮缩放, 拖动平移, 双击复位.
 */
import * as React from "react";
import { Code2, Download, Image as ImageIcon, Maximize2, RotateCcw } from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { CopyIconButton, IconButton } from "./copy";

export interface DiagramFrameProps {
  label: string;
  /** 源码 (复制 / 源码视图用) */
  source: string;
  /** 图的内容; 生成中或出错时可以不给 */
  children?: React.ReactNode;
  /** 源码视图 (一般是一个 bare CodeBlock) */
  sourceView: React.ReactNode;
  /** 先显示源码 (生成中, 出错) */
  showSource?: boolean;
  /** 出错信息, 显示在源码上方 */
  error?: string | null;
  /** 下载: 返回 [文件名, 内容, MIME] */
  download?: () => [string, string, string] | null;
  /** 图底色: "card" (默认) 或透明 */
  surface?: "card" | "none";
  status?: React.ReactNode;
  className?: string;
}

const MIN_ZOOM = 0.2;
const MAX_ZOOM = 8;

function PanZoom({ children }: { children: React.ReactNode }) {
  const [t, setT] = React.useState({ x: 0, y: 0, k: 1 });
  const drag = React.useRef<{ x: number; y: number } | null>(null);
  const ref = React.useRef<HTMLDivElement>(null);
  React.useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const r = el.getBoundingClientRect();
      const px = e.clientX - r.left - r.width / 2;
      const py = e.clientY - r.top - r.height / 2;
      setT((s) => {
        const k = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, s.k * Math.exp(-e.deltaY * 0.0015)));
        const f = k / s.k;
        return { k, x: px - (px - s.x) * f, y: py - (py - s.y) * f };
      });
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, []);
  return (
    <div
      ref={ref}
      className="relative size-full cursor-grab touch-none overflow-hidden active:cursor-grabbing"
      onPointerDown={(e) => {
        drag.current = { x: e.clientX - t.x, y: e.clientY - t.y };
        e.currentTarget.setPointerCapture(e.pointerId);
      }}
      onPointerMove={(e) => drag.current && setT((s) => ({ ...s, x: e.clientX - drag.current!.x, y: e.clientY - drag.current!.y }))}
      onPointerUp={() => (drag.current = null)}
      onDoubleClick={() => setT({ x: 0, y: 0, k: 1 })}
    >
      <div className="hx-diagram absolute inset-0 grid place-items-center will-change-transform" style={{ transform: `translate(${t.x}px, ${t.y}px) scale(${t.k})` }}>
        {children}
      </div>
      <div className="pointer-events-none absolute bottom-3 left-3 rounded-md border bg-background/80 px-2 py-1 font-mono text-xs text-muted-foreground tabular backdrop-blur">{Math.round(t.k * 100)}%</div>
      <IconButton label="复位" className="absolute bottom-2.5 right-3 border bg-background/80 text-foreground backdrop-blur" onClick={() => setT({ x: 0, y: 0, k: 1 })}>
        <RotateCcw />
      </IconButton>
    </div>
  );
}

export function DiagramFrame({ label, source, children, sourceView, showSource = false, error, download, surface = "card", status, className }: DiagramFrameProps) {
  const [mode, setMode] = React.useState<"auto" | "source" | "view">("auto");
  const [full, setFull] = React.useState(false);
  const viewing = mode === "view" || (mode === "auto" && !showSource && !error);
  const canView = children != null && !error;

  const doDownload = () => {
    const d = download?.();
    if (!d) return;
    const url = URL.createObjectURL(new Blob([d[1]], { type: d[2] }));
    Object.assign(document.createElement("a"), { href: url, download: d[0] }).click();
    window.setTimeout(() => URL.revokeObjectURL(url), 0);
  };

  return (
    <figure data-slot="diagram" className={cn("group/diagram my-4 min-w-0 overflow-hidden rounded-lg border bg-card", className)}>
      <figcaption className="flex h-9 items-center gap-2 border-b pl-3.5 pr-1.5 text-muted-foreground">
        <span className="font-mono text-xs">{label}</span>
        {status}
        <div className="ml-auto flex items-center gap-0.5">
          {canView && (
            <IconButton label={viewing ? "看源码" : "看图"} onClick={() => setMode(viewing ? "source" : "view")}>
              {viewing ? <Code2 /> : <ImageIcon />}
            </IconButton>
          )}
          {download && canView && (
            <IconButton label="下载" onClick={doDownload}>
              <Download />
            </IconButton>
          )}
          <CopyIconButton text={source} label="复制源码" />
          {canView && (
            <IconButton label="全屏" onClick={() => setFull(true)}>
              <Maximize2 />
            </IconButton>
          )}
        </div>
      </figcaption>
      {error && <div className="border-b bg-destructive/8 px-3.5 py-2 font-mono text-xs text-destructive">{error}</div>}
      {viewing && canView ? (
        <div className={cn("hx-diagram overflow-auto p-4 scrollbar-thin", surface === "none" && "bg-transparent")}>{children}</div>
      ) : (
        sourceView
      )}
      {canView && (
        <Dialog open={full} onOpenChange={setFull}>
          <DialogContent className="h-[min(86vh,900px)] w-[min(94vw,1400px)] max-w-none gap-0 overflow-hidden p-0 sm:max-w-none">
            <DialogTitle className="flex h-11 items-center border-b px-4 font-mono text-sm font-normal text-muted-foreground">{label}</DialogTitle>
            <div className="h-[calc(100%-2.75rem)]">
              <PanZoom>{children}</PanZoom>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </figure>
  );
}
