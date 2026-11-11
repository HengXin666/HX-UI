import { Component, useEffect, useState, type ComponentType, type JSX, type ReactNode } from "react";
import { findEntry } from "../catalog";
import { THUMB_PX, THUMB_STATE, type ThumbState } from "./thumbs";

/** 各子路径入口的源码模块; 目录条目的 from 字段决定取哪个. 根入口的件不在总览里拍. */
const LOADERS: Readonly<Record<string, () => Promise<Record<string, unknown>>>> = {
  "@hx/ui/surface": () => import("../../../../src/surface"),
  "@hx/ui/backgrounds": () => import("../../../../src/surface/backgrounds"),
  "@hx/ui/kits": () => import("../../../../src/kits"),
  "@hx/ui/controls": () => import("../../../../src/controls"),
};
/** 挂上后等这么久再算拍得了: 入场动效, 着色器首帧与字体都要时间. */
const SETTLE_MS = 1500;

class Boundary extends Component<{ readonly onError: () => void; readonly children: ReactNode }, { readonly failed: boolean }> {
  override state = { failed: false };
  static getDerivedStateFromError(): { failed: boolean } {
    return { failed: true };
  }
  override componentDidCatch(): void {
    this.props.onError();
  }
  override render(): ReactNode {
    return this.state.failed ? null : this.props.children;
  }
}

/**
 * 缩略图拍摄台 (#/thumb/<id>): 只有一个固定尺寸的框, 里面用默认参数挂上这件组件, 不带外壳.
 * scripts/docs-thumbs.ts 用 playwright 逐件打开它截图; 框上的 data-thumb-state 告诉脚本拍不拍得了
 * (组件缺必填参数而抛错时是 error, 目录里没有这件或入口不认识时是 missing).
 */
export function ThumbStage({ id }: { readonly id: string }): JSX.Element {
  const entry = findEntry(id);
  const [view, setView] = useState<{ readonly Comp?: ComponentType; readonly state: ThumbState }>({ state: THUMB_STATE.loading });

  useEffect(() => {
    let live = true;
    const load = entry?.from ? LOADERS[entry.from] : undefined;
    const name = entry?.exports[0];
    if (!load || !name) {
      setView({ state: THUMB_STATE.missing });
      return;
    }
    load()
      .then((mod) => {
        const Comp = mod[name] as ComponentType | undefined;
        if (!live) return;
        if (!Comp) setView({ state: THUMB_STATE.missing });
        else setView({ Comp, state: THUMB_STATE.loading });
      })
      .catch(() => live && setView({ state: THUMB_STATE.error }));
    return () => {
      live = false;
    };
  }, [entry]);

  useEffect(() => {
    if (!view.Comp || view.state !== THUMB_STATE.loading) return;
    const timer = window.setTimeout(() => setView((prev) => (prev.state === THUMB_STATE.loading ? { ...prev, state: THUMB_STATE.ok } : prev)), SETTLE_MS);
    return () => window.clearTimeout(timer);
  }, [view]);

  const Comp = view.Comp;
  return (
    <main className="min-h-svh bg-background p-0">
      <h1 className="sr-only">{entry?.label ?? id} 缩略图</h1>
      <div data-thumb-state={view.state} style={{ width: THUMB_PX.width, height: THUMB_PX.height }} className="relative isolate grid place-items-center overflow-hidden bg-background text-foreground">
        {Comp ? (
          <Boundary onError={() => setView({ state: THUMB_STATE.error })}>
            <Comp />
          </Boundary>
        ) : null}
      </div>
    </main>
  );
}
