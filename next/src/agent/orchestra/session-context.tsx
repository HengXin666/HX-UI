"use client";
/**
 * 会话里的多 Agent 上下文: Agent 树, 全部消息 (子 Agent 的也在里面), 打开的子 Agent 与打开它的回调.
 * 由 AgentProvider 按 agents / messages / openAgentId / onOpenAgent 提供; 树和消息分成两个 context,
 * 普通消息只读树 (派发不频繁), 只有编排块和子 Agent 轨迹读消息, token 流不会让整段会话重渲染.
 */
import * as React from "react";
import { emptyAgentTree, type AgentTree } from "../model/agents";
import { buildPlanIndex, EMPTY_PLAN_INDEX, type PlanIndex } from "../model/plan-index";
import type { AgentMessage } from "../model/types";
import type { OrchestraView } from "./constants";

export interface AgentSessionValue {
  agents: AgentTree;
  /** 打开着的子 Agent (侧栏 / 弹层里看它的轨迹) */
  openAgentId?: string | null;
  /** 点编排块里的子 Agent; 不给就只在块内选中 */
  onOpenAgent?: (id: string | null) => void;
  /** 编排块默认视图 */
  orchestraView?: OrchestraView;
}

const EMPTY: AgentSessionValue = { agents: emptyAgentTree() };
const NO_MESSAGES: readonly AgentMessage[] = [];

export const AgentSessionContext = React.createContext<AgentSessionValue>(EMPTY);
export const AgentMessagesContext = React.createContext<readonly AgentMessage[]>(NO_MESSAGES);
/** 待办调用的索引 (按所属 Agent 的计划); 只在待办调用变化时换新, 待办卡片与计划面板订阅它 */
export const PlanIndexContext = React.createContext<PlanIndex>(EMPTY_PLAN_INDEX);

/** 弹出成悬浮面板的编排框: 哪条消息的哪一支 (key 是编排框的 id) */
export interface DockedOrchestra {
  key: string;
  agentIds: readonly string[];
  rootId?: string;
}

/** 悬浮面板的界面状态 (收起 / 停靠位置 / 视图); 放在会话这一层, 切到子 Agent 再回来时面板不重置 */
export interface OrchestraDockUi {
  collapsed: boolean;
  position?: "side" | "corner";
  view?: OrchestraView;
}

export interface OrchestraDockValue {
  docked: DockedOrchestra | null;
  ui: OrchestraDockUi;
  setUi: (patch: Partial<OrchestraDockUi>) => void;
  /** 页面里放了 OrchestraDock (悬浮面板的宿主) 才能弹出 */
  hosted: boolean;
  pop: (o: DockedOrchestra) => void;
  restore: () => void;
  /** OrchestraDock 挂载时登记, 卸载时撤销 */
  register: () => () => void;
}

const NOOP_DOCK: OrchestraDockValue = { docked: null, ui: { collapsed: false }, setUi: () => {}, hosted: false, pop: () => {}, restore: () => {}, register: () => () => {} };
export const OrchestraDockContext = React.createContext<OrchestraDockValue>(NOOP_DOCK);
export const useOrchestraDock = () => React.useContext(OrchestraDockContext);

export const useAgentSession = () => React.useContext(AgentSessionContext);
export const useSessionMessages = () => React.useContext(AgentMessagesContext);
export const usePlanIndex = () => React.useContext(PlanIndexContext);

export interface AgentSessionProviderProps extends Partial<AgentSessionValue> {
  messages?: readonly AgentMessage[];
  children: React.ReactNode;
}

/** 单独使用时的提供者 (AgentProvider 已经内置, 一般不用直接写) */
export function AgentSessionProvider({ agents, messages, openAgentId, onOpenAgent, orchestraView, children }: AgentSessionProviderProps) {
  const value = React.useMemo<AgentSessionValue>(() => (agents ? { agents, openAgentId, onOpenAgent, orchestraView } : EMPTY), [agents, openAgentId, onOpenAgent, orchestraView]);
  const prev = React.useRef<PlanIndex>(EMPTY_PLAN_INDEX);
  const [docked, setDocked] = React.useState<DockedOrchestra | null>(null);
  const [hosts, setHosts] = React.useState(0);
  const [ui, setUiState] = React.useState<OrchestraDockUi>({ collapsed: false });
  const setUi = React.useCallback((patch: Partial<OrchestraDockUi>) => setUiState((u) => ({ ...u, ...patch })), []);
  const dock = React.useMemo<OrchestraDockValue>(
    () => ({
      docked,
      ui,
      setUi,
      hosted: hosts > 0,
      pop: (o) => {
        setDocked(o);
        setUi({ collapsed: false });
      },
      restore: () => setDocked(null),
      register: () => {
        setHosts((h) => h + 1);
        return () => setHosts((h) => h - 1);
      },
    }),
    [docked, hosts, ui, setUi],
  );
  const plans = React.useMemo(() => (prev.current = buildPlanIndex(messages ?? NO_MESSAGES, agents, prev.current)), [messages, agents]);
  return (
    <AgentSessionContext.Provider value={value}>
      <AgentMessagesContext.Provider value={messages ?? NO_MESSAGES}>
        <PlanIndexContext.Provider value={plans}>
          <OrchestraDockContext.Provider value={dock}>{children}</OrchestraDockContext.Provider>
        </PlanIndexContext.Provider>
      </AgentMessagesContext.Provider>
    </AgentSessionContext.Provider>
  );
}
