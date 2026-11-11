import type { ReactNode } from "react";
import { generatedRows } from "../props";

/** 一个控件的取值. 颜色控件存语义令牌名, 不存色值. */
export type ControlValue = string | number | boolean;
export type Values = Readonly<Record<string, ControlValue>>;

export interface Option {
  readonly value: string;
  readonly label: string;
}

/** 控件同时是 Props 表的一行: key 即属性名, type 与 desc 取自组件源码的 JSDoc. */
interface Base {
  readonly key: string;
  readonly label: string;
  readonly type: string;
  readonly desc: string;
  /** 几个控件合成一个属性时 (colors 数组的各项) 填真实属性名, Props 表只出一行. */
  readonly prop?: string;
}

/** Customize 网格里的一格. kind 决定用库里的哪个控件: Select, Switch, Slider, 令牌色, 文本. */
export type ControlDef =
  | (Base & { readonly kind: "select"; readonly options: readonly Option[]; readonly initial: string })
  | (Base & { readonly kind: "switch"; readonly initial: boolean })
  | (Base & { readonly kind: "slider"; readonly min: number; readonly max: number; readonly step: number; readonly initial: number })
  | (Base & { readonly kind: "color"; readonly options: readonly string[]; readonly initial: string })
  | (Base & { readonly kind: "text"; readonly initial: string });

/** Props 表的一行. */
export interface PropRow {
  readonly name: string;
  readonly type: string;
  readonly initial: string;
  readonly desc: string;
  readonly required?: boolean;
}

/**
 * 页型. single: 可调单件, 全部段落; composite: 复合组件, 主演示只调常用属性, Props 按部件分表, 必有键盘段;
 * block: 区块与模板, 宽舞台, 默认手机/桌面可切; control: 交互控件, 段落同 single, 另有减少动效对照段 (reduced).
 */
export type PageKind = "single" | "composite" | "block" | "control";

/** control 页型的减少动效对照: 一句总述, 再逐条写 prefers-reduced-motion 下哪些动效去掉, 哪些照常 (以组件源码为准). */
export interface ReducedNote {
  readonly desc: string;
  readonly notes: readonly string[];
  /** 对照格高度 (px), 省略时 220. */
  readonly height?: number;
}

/** 示例段的一张卡: 标题, 一句说明, 预览与它对应的代码. */
export interface Example {
  readonly id: string;
  readonly title: string;
  readonly desc?: string;
  readonly code: string;
  readonly render: () => ReactNode;
  /** 预览区对齐: center (默认) 居中成排, stretch 撑满宽度 (区块). */
  readonly align?: "center" | "stretch";
}

/** 键盘段的一行: 按键 (可多个组合) 与它做的事. */
export interface KeyRow {
  readonly keys: readonly string[];
  readonly action: string;
}

/**
 * 一个可调组件页的全部数据. toProps 把控件值换成组件真实 props (省略时控件值原样当 props),
 * 预览与 Code 页签的用法代码都从它出, 两边不会说两套话.
 */
export interface ComponentSpec {
  readonly id: string;
  readonly label: string;
  readonly desc: string;
  readonly group: string;
  readonly importName: string;
  /** 仓库相对源码路径, 右栏源码链接与 Code 页签标题用. */
  readonly source: string;
  /** 源码原文 (Vite ?raw). */
  readonly raw: string;
  /** 运行时依赖, 都是 @hx/ui 的 dependencies, 随包安装. */
  readonly deps: readonly string[];
  /** fill: 背景类, 预览铺满整个台面. */
  readonly fill?: boolean;
  /** 值变化时不重挂预览 (数字滚动要从旧值滚到新值). */
  readonly keepMounted?: boolean;
  readonly controls: readonly ControlDef[];
  /** 没有对应控件的属性 (className, children 等). */
  readonly extraProps?: readonly PropRow[];
  readonly toProps?: (values: Values) => Record<string, unknown>;
  readonly render: (props: Record<string, unknown>) => ReactNode;
  /** 用法代码里固定写出的属性 (例如标题字号的 className). */
  readonly fixed?: Readonly<Record<string, unknown>>;
  /** 缩略图缩放比例, 省略时按大标题与背景的默认值. 固定尺寸的演示卡可以放大些. */
  readonly thumbScale?: number;
  /** 必填属性: 用法代码里即使等于默认值也写出. */
  readonly required?: readonly string[];
  /** 用法代码里包在组件里的子内容, 省略时自闭合. */
  readonly children?: string;
  /** 页型, 省略为 single. */
  readonly kind?: PageKind;
  /** 舞台高度 (px), 省略时按 fill 取文字或背景档. */
  readonly height?: number;
  /** 一起出 Props 表的其他部件 (Dialog 的 DialogContent 等), 按导出名. */
  readonly parts?: readonly string[];
  /** 生成的 Props 里 JSDoc 为空或是英文时, 按属性名补中文说明; 只对某个部件生效时键写成 "部件名.属性名". */
  readonly propDesc?: Readonly<Record<string, string>>;
  /** 不进 Props 表的属性 (区块共有的槽位与样式钩子等), 由 propsNote 一句话交代. */
  readonly hideProps?: readonly string[];
  /** Props 表下的一句补充: 透传给谁, 隐藏了哪些共有属性. */
  readonly propsNote?: string;
  readonly examples?: readonly Example[];
  readonly keyboard?: readonly KeyRow[];
  /** control 页型必填: 减少动效对照段的说明. */
  readonly reduced?: ReducedNote;
  /** 自定义用法代码 (多部件组合, 整页模板), 省略时按控件值生成单个标签. */
  readonly usage?: (values: Values) => string;
}

/** 挂在已有导航条目上的组件页: 名称, 说明, 分组沿用导航. */
export type PageSpec = Omit<ComponentSpec, "label" | "desc" | "group">;

/** Props 表里没有默认值的占位. */
export const NONE = "-";

/** Props 表的类型列常用写法. */
export const T = { num: "number", bool: "boolean", str: "string", tokens: "string[]" } as const;

export function select(key: string, label: string, options: readonly string[], initial: string, type: string, desc: string): ControlDef {
  return { kind: "select", key, label, options: options.map((value) => ({ value, label: value })), initial, type, desc };
}
export function toggle(key: string, label: string, initial: boolean, desc: string): ControlDef {
  return { kind: "switch", key, label, initial, type: T.bool, desc };
}
export function range(key: string, label: string, [min, max, step]: readonly [number, number, number], initial: number, desc: string): ControlDef {
  return { kind: "slider", key, label, min, max, step, initial, type: T.num, desc };
}
export function color(key: string, label: string, options: readonly string[], initial: string, type: string, desc: string): ControlDef {
  return { kind: "color", key, label, options, initial, type, desc };
}
export function text(key: string, label: string, initial: string, desc: string): ControlDef {
  return { kind: "text", key, label, initial, type: T.str, desc };
}

/** 控件的初始值表. */
export function initialValues(controls: readonly ControlDef[]): Values {
  return Object.fromEntries(controls.map((control) => [control.key, control.initial]));
}

export function propsOf(spec: ComponentSpec, values: Values): Record<string, unknown> {
  return spec.toProps ? spec.toProps(values) : { ...values };
}

/**
 * 一个导出名的 Props 表. 类型, 默认值与说明取自源码类型 (scripts/docs-props.ts 生成),
 * 说明按 控件说明 > propDesc > JSDoc 取第一个非空的; 控件对应的属性排在前面.
 * 生成数据里没有该导出名时退回控件定义 (控件的 type 与 desc 手写).
 */
export function propRows(spec: ComponentSpec, name: string = spec.importName): PropRow[] {
  const hidden = new Set(spec.hideProps ?? []);
  const controlDesc = new Map(spec.controls.map((control) => [control.prop ?? control.key, control.desc]));
  const generated = generatedRows(name);
  if (generated) {
    const main = name === spec.importName;
    const rows = generated
      .filter((row) => !hidden.has(row.name))
      .map((row) => ({ ...row, desc: (main ? controlDesc.get(row.name) : undefined) || spec.propDesc?.[`${name}.${row.name}`] || spec.propDesc?.[row.name] || row.desc }));
    const first = main ? rows.filter((row) => controlDesc.has(row.name)) : [];
    const known = new Set(rows.map((row) => row.name));
    const extra = main ? (spec.extraProps ?? []).filter((row) => !known.has(row.name)) : [];
    return [...first, ...rows.filter((row) => !first.includes(row)), ...extra];
  }
  const base = propsOf(spec, initialValues(spec.controls));
  const rows = new Map<string, PropRow>();
  for (const control of spec.controls) {
    const key = control.prop ?? control.key;
    if (rows.has(key)) continue;
    const value = base[key];
    rows.set(key, { name: key, type: control.type, initial: value === undefined ? NONE : JSON.stringify(value), desc: control.desc });
  }
  return [...rows.values(), ...(spec.extraProps ?? [])];
}

const INDENT = "  ";
const NL = "\n";

function literal(value: unknown): string {
  if (typeof value === "string") return JSON.stringify(value);
  return "{" + JSON.stringify(value) + "}";
}

/** 只写出与默认值不同的 props 加固定 props, 和读者自己会写的那份一样短. */
export function usageCode(spec: ComponentSpec, values: Values): string {
  if (spec.usage) return spec.usage(values);
  const props = propsOf(spec, values);
  const base = propsOf(spec, initialValues(spec.controls));
  const must = new Set(spec.required ?? []);
  const changed = Object.entries(props).filter(([name, value]) => must.has(name) || JSON.stringify(value) !== JSON.stringify(base[name]));
  const lines = [...Object.entries(spec.fixed ?? {}), ...changed].map(([name, value]) =>
    value === true ? INDENT + name : INDENT + name + "=" + literal(value),
  );
  const multi = lines.length > 0;
  const open = multi ? "<" + spec.importName + NL + lines.join(NL) + NL : "<" + spec.importName;
  const tag = spec.children
    ? open + ">" + NL + INDENT + spec.children + NL + "</" + spec.importName + ">"
    : open + (multi ? "/>" : " />");
  const body = tag
    .split(NL)
    .map((line) => INDENT + INDENT + line)
    .join(NL);
  return `import { ${spec.importName} } from "@hx/ui";\n\nexport function Demo() {\n  return (\n${body}\n  );\n}`;
}
