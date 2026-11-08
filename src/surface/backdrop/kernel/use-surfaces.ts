// 行为规格参照 docs/research/catalog/backgrounds-1.md 的 Backgrounds 族共用 (单画布, DPR 上限, 离屏停帧) 条目, 实现为 HX 自有.
"use client";

import { useMemo, useRef } from "react";
import { canvasFactory, domFactory, type CanvasSpec, type DomSpec } from "./canvas2d";
import { shaderFactory, shaderKey, type ShaderSpec } from "./shader";
import { useBackdrop, type BackdropHandle, type BackdropOptions } from "./use-backdrop";

/** 各类背景共用的调度选项 (不含渲染器). */
export type SurfaceOptions = Omit<BackdropOptions, "create" | "rendererKey">;

/** WebGL2 片元背景, 可带多个乒乓离屏通道. 任一片元源码变了重建程序, uniform 与纹理每帧读最新. */
export function useShaderBackdrop(spec: ShaderSpec, options: SurfaceOptions): BackdropHandle {
  const ref = useRef(spec);
  ref.current = spec;
  const create = useMemo(() => shaderFactory(ref), []);
  return useBackdrop({ ...options, create, rendererKey: shaderKey(spec) });
}

/** Canvas2D 背景. */
export function useCanvasBackdrop(spec: CanvasSpec, options: SurfaceOptions): BackdropHandle {
  const ref = useRef(spec);
  ref.current = spec;
  const create = useMemo(() => canvasFactory(ref), []);
  return useBackdrop({ ...options, create });
}

/** 纯 DOM 背景. */
export function useDomBackdrop(spec: DomSpec, options: SurfaceOptions): BackdropHandle {
  const ref = useRef(spec);
  ref.current = spec;
  const create = useMemo(() => domFactory(ref), []);
  return useBackdrop({ ...options, create });
}
