"use client";
import * as React from "react";
import type { AgentPart, ToolCallData } from "../model/types";
import type { ActivityKind } from "../model/summary";
import type { MarkdownProps } from "../markdown/markdown";

export type { ActivityKind };

export type ActivityMode = "grouped" | "flat" | "hide-success" | "zen";

/** 正文 / 思考里 Markdown 的默认值 */
export type AgentMarkdownDefaults = Omit<MarkdownProps, "children" | "streaming">;

/** 工具视图拿到的参数 */
export interface ToolViewProps {
  call: ToolCallData;
}

/**
 * 一个工具在会话里的样子 (按工具名注册; 未注册的走通用卡片):
 * 折叠行由 icon / title / summary / suffix 决定, 展开后画 Body.
 * 参考 DSH 的 tool.call.toolview: 折叠行就给出最重要的信息 (命令, 路径, 增删数, 非零退出码).
 */
export interface ToolView {
  icon?: React.ReactNode | ((call: ToolCallData) => React.ReactNode);
  /** 动词, 例如 "运行" / "读取"; 不给就用工具名 */
  title?: (call: ToolCallData) => React.ReactNode;
  /** 参数摘要: 命令, 路径, 查询 */
  summary?: (call: ToolCallData) => React.ReactNode;
  /** 行尾: 增删数, 命中数, 退出码 */
  suffix?: (call: ToolCallData) => React.ReactNode;
  Body?: React.ComponentType<ToolViewProps>;
  /** 默认展开 (例如运行中的终端) */
  defaultOpen?: (call: ToolCallData) => boolean;
  /** 这一类在活动摘要里怎么数: "运行了 3 条命令" */
  kind?: ActivityKind;
  /** 始终露在外面 (不进活动折叠), 例如提问 / 审批 */
  pinned?: (call: ToolCallData) => boolean;
}
export type ToolViews = Record<string, ToolView>;

/** 使用方的回调: 审批, 回答提问, 打开文件 / 链接, 查看原始调用 */
export interface AgentActions {
  onApprove?: (callId: string, scope: "once" | "always") => void;
  onDeny?: (callId: string, reason?: string) => void;
  /** 提问的答案: 问题 id (或下标) -> 选中的选项 / 自由输入 */
  onAnswer?: (callId: string, answers: Record<string, string | string[]>) => void;
  onOpenFile?: (path: string, line?: number) => void;
  onOpenUrl?: (url: string) => void;
  onInspect?: (call: ToolCallData) => void;
}

export interface AgentUIConfig {
  toolViews: ToolViews;
  actions: AgentActions;
  cwd?: string;
  /** 正文 / 思考里 Markdown 的默认设置 (围栏渲染器, 公式插件, 代码配色) */
  markdown?: AgentMarkdownDefaults;
  /** 显示模式: grouped (默认, 连续的过程折成一行), flat (逐条), hide-success (藏起成功的调用), zen (只看结论) */
  mode?: ActivityMode;
  /** 子 Agent 的嵌套时间线由 AgentParts 注入, 避免模块循环 */
  renderParts?: (parts: AgentPart[], opts: { streaming: boolean }) => React.ReactNode;
}

export const AgentUIContext = React.createContext<AgentUIConfig>({ toolViews: {}, actions: {} });
export const useAgentUI = () => React.useContext(AgentUIContext);
