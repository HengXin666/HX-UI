"use client";
import * as React from "react";
import type { CodeTheme } from "../code/code-block";
import type { FenceMeta } from "./fence";

export interface FenceRendererProps {
  /** 围栏里的代码 (末尾换行已去掉) */
  code: string;
  /** 归一后的语言 id */
  lang: string;
  meta: FenceMeta;
  /** 围栏还没闭合 (还在生成) */
  incomplete: boolean;
  theme: CodeTheme;
}
/** 自定义围栏渲染器: 按语言注册, 例如 { mermaid: Mermaid, chart: MyChart } */
export type FenceRenderer = React.ComponentType<FenceRendererProps>;
export type FenceRenderers = Record<string, FenceRenderer>;

export interface MarkdownSettings {
  fences: FenceRenderers;
  codeTheme: CodeTheme;
  /** 代码块超过多少行折叠 (围栏 meta 的 collapse 优先) */
  codeCollapse: number;
  codeMaxHeight?: number;
  /** 文件路径 / 链接点击: 返回 true 表示已处理, 不再走默认跳转 */
  onLinkClick?: (href: string, e: React.MouseEvent) => boolean | void;
}

export const MarkdownSettingsContext = React.createContext<MarkdownSettings>({ fences: {}, codeTheme: "dark", codeCollapse: 0 });
export const useMarkdownSettings = () => React.useContext(MarkdownSettingsContext);

/** 组合代码块里的单个围栏: 只画正文, 外框和选项卡由组负责 */
export const InCodeGroupContext = React.createContext(false);
