"use client";
/**
 * 多 Agent 编排容器: 总览条 + 视图切换 (关系图 / 泳道 / 卡片墙) + 选中 Agent 的详情.
 * 三个视图吃同一棵 AgentTree (useAgentStream().agents 或 reduceAgentEvents(...).agents), 选中状态共享.
 */
import * as React from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { linksOf, type AgentTree } from "../model/agents";
import type { AgentMessage } from "../model/types";
import { AgentCardWall } from "./agent-card-wall";
import { AgentGraph } from "./agent-graph";
import { AgentSwimlanes } from "./agent-swimlanes";
import { KIND_LABEL, ORCHESTRA_VIEWS, type OrchestraView } from "./constants";
import { AgentStatusBadge, AgentTimer, OrchestraSummary, useOrchestraNow } from "./shared";

export interface AgentOrchestraProps {
  agents: AgentTree;
  /** 给了就在泳道上画工具调用, 卡片上显示最新输出 */
  messages?: readonly AgentMessage[];
  view?: OrchestraView;
  defaultView?: OrchestraView;
  onViewChange?: (view: OrchestraView) => void;
  selectedId?: string | null;
  defaultSelectedId?: string | null;
  onSelect?: (id: string | null) => void;
  /** 底部显示选中 Agent 的详情, 默认 true */
  showDetail?: boolean;
  /** 视图切换右侧的额外内容 */
  toolbar?: React.ReactNode;
  className?: string;
  /** 视图区域的类名 (高度, 内边距) */
  contentClassName?: string;
}

const LINK_LABEL = { message: "消息", result: "结果", handoff: "交接" } as const;
const DETAIL_LINKS = 4;

function AgentDetail({ tree, id, onClose }: { tree: AgentTree; id: string; onClose: () => void }) {
  const now = useOrchestraNow(tree);
  const n = tree.nodes[id];
  if (!n) return null;
  const { sent, received } = linksOf(tree, id);
  const links = [...sent, ...received].sort((a, b) => b.at - a.at).slice(0, DETAIL_LINKS);
  const name = (x: string) => tree.nodes[x]?.name ?? x;
  return (
    <div data-slot="agent-detail" className="grid gap-1.5 border-t px-4 py-3 text-[13px]">
      <div className="flex min-w-0 items-center gap-2">
        <span className="truncate font-medium">{n.name}</span>
        <AgentStatusBadge node={n} />
        <span className="truncate text-xs text-muted-foreground">{[n.role, n.model, KIND_LABEL[n.kind]].filter(Boolean).join(" · ")}</span>
        <AgentTimer node={n} now={now} className="ml-auto shrink-0 text-xs" />
        <button type="button" onClick={onClose} className="shrink-0 rounded px-1.5 text-xs text-muted-foreground transition-colors duration-150 hover:bg-accent hover:text-foreground">
          收起
        </button>
      </div>
      {n.task && <p className="text-foreground/85">{n.task}</p>}
      {n.summary && <p className="text-xs text-muted-foreground">最新: {n.summary}</p>}
      {links.length > 0 && (
        <ul className="grid gap-1 text-xs text-muted-foreground">
          {links.map((l) => (
            <li key={l.id} className="flex min-w-0 items-center gap-1.5">
              <span className="shrink-0 rounded border px-1 text-[11px]">{LINK_LABEL[l.kind]}</span>
              <span className="shrink-0 text-foreground">{name(l.from)} → {name(l.to)}</span>
              {l.text && <span className="truncate">{l.text}</span>}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function AgentOrchestra({ agents, messages, view: viewProp, defaultView = "graph", onViewChange, selectedId: selProp, defaultSelectedId = null, onSelect, showDetail = true, toolbar, className, contentClassName }: AgentOrchestraProps) {
  const [viewInner, setViewInner] = React.useState<OrchestraView>(defaultView);
  const [selInner, setSelInner] = React.useState<string | null>(defaultSelectedId);
  const view = viewProp ?? viewInner;
  const selected = selProp !== undefined ? selProp : selInner;
  const setView = (v: string) => {
    if (viewProp === undefined) setViewInner(v as OrchestraView);
    onViewChange?.(v as OrchestraView);
  };
  const select = React.useCallback(
    (id: string | null) => {
      if (selProp === undefined) setSelInner(id);
      onSelect?.(id);
    },
    [selProp, onSelect],
  );
  // 再点一次取消选中
  const toggle = React.useCallback((id: string) => select(selected === id ? null : id), [select, selected]);
  const shared = { agents, selectedId: selected, onSelect: toggle };
  return (
    <Tabs data-slot="agent-orchestra" value={view} onValueChange={setView} className={cn("min-w-0 gap-0", className)}>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 border-b px-4 py-2.5">
        <TabsList aria-label="视图" className="h-8">
          {ORCHESTRA_VIEWS.map((v) => (
            <TabsTrigger key={v.value} value={v.value} className="px-2.5 text-[13px]">
              {v.label}
            </TabsTrigger>
          ))}
        </TabsList>
        <OrchestraSummary tree={agents} className="min-w-0 flex-1" />
        {toolbar}
      </div>
      <TabsContent value="graph" className={cn("min-h-0 p-4", contentClassName)}>
        <AgentGraph {...shared} />
      </TabsContent>
      <TabsContent value="lanes" className={cn("min-h-0 p-4", contentClassName)}>
        <AgentSwimlanes {...shared} messages={messages} />
      </TabsContent>
      <TabsContent value="cards" className={cn("min-h-0 overflow-auto p-4", contentClassName)}>
        <AgentCardWall {...shared} messages={messages} />
      </TabsContent>
      {showDetail && selected && <AgentDetail tree={agents} id={selected} onClose={() => select(null)} />}
    </Tabs>
  );
}
