import * as React from "react";
import { AnimatePresence, m } from "motion/react";
import { cn } from "@/lib/utils";

export interface MediaItem {
  src: string;
  alt: string;
}

/** 商品画廊: 主图推镜切换 + 缩略图 tablist, 方向键切换, 悬停放大. */
export function ProductGallery({ media, className }: { media: MediaItem[]; className?: string }) {
  const [i, setI] = React.useState(0);
  const [dir, setDir] = React.useState(1);
  const go = (n: number) => {
    const next = (n + media.length) % media.length;
    setDir(next > i ? 1 : -1);
    setI(next);
  };
  const [zoom, setZoom] = React.useState<{ x: number; y: number } | null>(null);
  return (
    <div className={cn("flex flex-col gap-3 md:flex-row-reverse", className)}>
      <div
        className="relative aspect-square flex-1 overflow-hidden rounded-2xl bg-muted"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "ArrowRight") go(i + 1);
          if (e.key === "ArrowLeft") go(i - 1);
        }}
        onPointerMove={(e) => {
          const r = e.currentTarget.getBoundingClientRect();
          setZoom({ x: ((e.clientX - r.left) / r.width) * 100, y: ((e.clientY - r.top) / r.height) * 100 });
        }}
        onPointerLeave={() => setZoom(null)}
        aria-roledescription="carousel"
      >
        <AnimatePresence initial={false} custom={dir} mode="popLayout">
          <m.img
            key={i}
            src={media[i].src}
            alt={media[i].alt}
            custom={dir}
            initial={{ opacity: 0, scale: 1.04, x: `${dir * 3}%` }}
            animate={{ opacity: 1, scale: zoom ? 1.6 : 1, x: 0 }}
            exit={{ opacity: 0, scale: 1.02, x: `${dir * -3}%` }}
            transition={{ type: "spring", stiffness: 220, damping: 30 }}
            style={zoom ? { transformOrigin: `${zoom.x}% ${zoom.y}%` } : undefined}
            className="absolute inset-0 size-full object-cover"
            draggable={false}
          />
        </AnimatePresence>
        <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1.5 md:hidden">
          {media.map((_, k) => <span key={k} className={cn("h-1.5 rounded-full bg-white/70 transition-all", k === i ? "w-5 bg-white" : "w-1.5")} />)}
        </div>
      </div>
      <div role="tablist" aria-label="商品图片" className="flex gap-2 md:w-20 md:flex-col">
        {media.map((m, k) => (
          <button
            key={m.src}
            type="button"
            role="tab"
            aria-selected={k === i}
            onClick={() => go(k)}
            className={cn("relative aspect-square w-16 overflow-hidden rounded-lg border-2 transition md:w-full", k === i ? "border-foreground" : "border-transparent opacity-60 hover:opacity-100")}
          >
            <img src={m.src} alt="" className="size-full object-cover" />
          </button>
        ))}
      </div>
    </div>
  );
}
