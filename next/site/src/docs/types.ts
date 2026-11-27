import type * as React from "react";

export type SectionId = "ui" | "visual" | "pages";

export type Values = Record<string, string | number | boolean>;

export type Control =
  | { type: "select"; key: string; label: string; options: { value: string; label: string }[] }
  | { type: "number"; key: string; label: string; min: number; max: number; step: number; unit?: string }
  | { type: "toggle"; key: string; label: string }
  | { type: "text"; key: string; label: string };

export interface PropRow {
  name: string;
  type: string;
  default?: string;
  description: string;
}

export interface DemoProps {
  values: Values;
  /** 演示里需要通知 "播完了" 时调用 */
  onEvent?: (msg: string) => void;
}

export interface DocEntry {
  slug: string;
  /** 组件导出名, 如 SplitText */
  name: string;
  /** 侧栏右侧的英文短名, 默认 name */
  en?: string;
  /** 中文名 */
  title: string;
  section: SectionId;
  /** 侧栏分组名, 取自 SECTIONS[].groups */
  group: string;
  /** 组内的二级文件夹, 如 "2D 图表"; 不给就直接挂在组下 */
  sub?: string;
  description: string;
  /** 组件文件在仓库里的路径 */
  file: string;
  /** 从哪里引入 */
  importFrom: string;
  /** 演示 (按需加载) */
  demo: () => Promise<{ default: React.ComponentType<DemoProps> }>;
  /** 源码 (按需加载) */
  source: () => Promise<string>;
  /** 调参面板的初值 */
  defaults: Values;
  /** 组件自身的默认值, 生成用法代码时与它相同的属性省略 */
  componentDefaults: Values;
  controls: Control[];
  presets?: { label: string; values: Values }[];
  /** 不进组件 props 的演示开关 (如 "播完提示") */
  demoOnly?: string[];
  props: PropRow[];
  /** 自定义用法代码; 不给则按 values 与 componentDefaults 的差异生成 */
  usage?: (values: Values) => string;
  /** 包裹型组件: 生成用法时放进去的子元素 */
  usageChildren?: string;
  /** 调参时是否整块重挂演示 (重播入场动画). 默认视觉组件 true, UI 组件 false */
  remountOnChange?: boolean;
  /** 演示铺满整个舞台 (背景、滚动容器), 不留内边距 */
  bleed?: boolean;
  /** 舞台高度 (默认 440) */
  stageHeight?: number;
  /** 静态缩略: 总览卡片上显示的一句话或小样 */
  thumb?: string;
  /** 整页演示: 文档页上出现「全屏打开」, 地址 #/<分区>/<slug>/full, 不带文档外壳, 铺满视口 */
  fullPage?: { label: string; load: () => Promise<{ default: React.ComponentType }> };
}
