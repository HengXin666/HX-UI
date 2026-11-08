// 行为规格参照 docs/research/catalog/backgrounds-1.md 的 Backgrounds 族共用 (单画布, DPR 上限, 离屏停帧) 条目, 实现为 HX 自有.
import type { ComponentPropsWithoutRef, ReactNode } from "react";
import type { SurfaceOptions } from "./use-surfaces";

/** 每个背景组件都收的公共 props. 其余 div 属性透传到宿主. */
export interface BackdropCommonProps extends Omit<ComponentPropsWithoutRef<"div">, "children"> {
  /** 叠在背景上的内容. */
  readonly children?: ReactNode;
  /** 时钟倍率, 默认 1. */
  readonly speed?: number;
  /** 停在当前画面. */
  readonly paused?: boolean;
  /** 画布不透明度 0..1. */
  readonly opacity?: number;
  /** 像素比上限, 默认 2. */
  readonly dpr?: number;
  /** 是否响应指针, 默认 true. */
  readonly mouseInteraction?: boolean;
  /** 覆写系统的减弱动效偏好: true 只画一帧静态画面. */
  readonly reducedMotion?: boolean;
}

/** 公共 props 里交给内核的部分. */
export type CommonKeys = "speed" | "paused" | "opacity" | "dpr" | "mouseInteraction" | "reducedMotion" | "children";

/**
 * 把公共 props 拆成内核选项与透传给宿主 div 的其余属性.
 *
 * @param props 组件收到的 props (已去掉本件专有的).
 */
export function splitCommon<P extends BackdropCommonProps>(props: P): { options: SurfaceOptions; rest: Omit<P, CommonKeys>; opacity: number | undefined; children: ReactNode } {
  const { speed, paused, opacity, dpr, mouseInteraction, reducedMotion, children, ...rest } = props;
  return { options: { speed, paused, dpr, reducedMotion, pointer: mouseInteraction !== false }, rest, opacity, children };
}
