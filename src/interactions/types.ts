import type { ComponentType } from "react";

/** 调参面板的一项. 文档站按 kind 自动渲染控件. */
export type Control =
  | { kind: "number"; key: string; label: string; min: number; max: number; step?: number; default: number }
  | { kind: "boolean"; key: string; label: string; default: boolean }
  | { kind: "select"; key: string; label: string; options: readonly { value: string; label: string }[]; default: string }
  | { kind: "text"; key: string; label: string; default: string };

export type ControlValues = Record<string, number | boolean | string>;

/**
 * L2 交互的元信息. 一件交互 = 一个真实的产品瞬间, 不是装饰.
 * budget 是这件的 gzip 体积上限 (KB), 超了要在 notes 里说明理由.
 */
export interface InteractionMeta {
  id: string;
  title: string;
  /** 一句话: 用在什么场景 */
  scene: string;
  /** 参考来源, 只记思路出处 */
  inspiredBy?: string;
  budgetKb: number;
  controls: readonly Control[];
}

export interface InteractionEntry {
  meta: InteractionMeta;
  /** 演示组件, 接收调参面板的当前值 */
  load: () => Promise<{ default: ComponentType<{ values: ControlValues }> }>;
}

export function defaults(meta: InteractionMeta): ControlValues {
  return Object.fromEntries(meta.controls.map((c) => [c.key, c.default]));
}
