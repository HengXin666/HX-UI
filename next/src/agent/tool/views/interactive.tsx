"use client";
/**
 * 需要用户参与或带结构的工具视图的组件: 待办清单, 提问卡片, 子 Agent, 审批条. 视图对象在 defs.tsx.
 */
import * as React from "react";
import { Check, CircleDashed, CircleDot, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { ToolCallData } from "../../model/types";
import { formatDuration } from "../../parts/format";
import { COMMAND_KEYS, firstLine, PATH_KEYS, str } from "../args";
import { useAgentUI, type ToolViewProps } from "../context";
import { answersOf, questionsOf, type QuestionItem, type TodoItem } from "./data";

/* ---------------- 待办 / 计划 ---------------- */

/** 待办清单: 也可以单独放在侧栏用 */
export function TodoList({ items, className }: { items: TodoItem[]; className?: string }) {
  return (
    <ul data-slot="todo-list" className={cn("space-y-0.5 py-1", className)}>
      {items.map((t, i) => (
        <li key={t.id ?? i} className="flex items-start gap-2 text-[13px] leading-6">
          <span className="mt-1 grid size-4 shrink-0 place-items-center">
            {t.status === "completed" ? (
              <span className="grid size-3.5 place-items-center rounded-full bg-success text-background">
                <Check className="size-2.5" strokeWidth={3} />
              </span>
            ) : t.status === "in_progress" ? (
              <CircleDot className="size-3.5 text-brand" />
            ) : (
              <CircleDashed className="size-3.5 text-muted-foreground/60" />
            )}
          </span>
          <span className={cn("min-w-0", t.status === "completed" && "text-muted-foreground line-through decoration-muted-foreground/40", t.status === "cancelled" && "text-muted-foreground/60 line-through", t.status === "in_progress" && "font-medium text-foreground")}>
            {t.status === "in_progress" && t.activeForm ? t.activeForm : t.content}
          </span>
        </li>
      ))}
    </ul>
  );
}

/* ---------------- 向用户提问 ---------------- */

export function QuestionCard({ call }: ToolViewProps) {
  const { actions } = useAgentUI();
  const qs = questionsOf(call);
  const answered = answersOf(call);
  const waiting = !answered && (call.status === "running" || call.status === "awaiting-approval" || call.status === "preparing");
  const [picked, setPicked] = React.useState<Record<string, string[]>>({});
  const [other, setOther] = React.useState<Record<string, string>>({});
  const canSubmit = waiting && !!actions.onAnswer && qs.every((q) => (picked[q.id]?.length ?? 0) > 0 || (other[q.id] ?? "").trim() !== "");
  const toggle = (q: QuestionItem, label: string) =>
    setPicked((p) => {
      const cur = p[q.id] ?? [];
      return { ...p, [q.id]: q.multiSelect ? (cur.includes(label) ? cur.filter((x) => x !== label) : [...cur, label]) : [label] };
    });
  return (
    <div data-slot="question" className="my-1 space-y-3 rounded-lg border bg-card px-4 py-3">
      {qs.map((q) => {
        const ans = answered?.[q.id] ?? answered?.[q.question];
        return (
          <fieldset key={q.id} className="space-y-2">
            <legend className="text-sm font-medium">
              {q.header && <span className="mr-2 rounded border px-1.5 py-0.5 text-[11px] font-normal text-muted-foreground">{q.header}</span>}
              {q.question}
            </legend>
            {ans != null ? (
              <div className="flex flex-wrap gap-1.5">
                {(Array.isArray(ans) ? ans : [ans]).map((a, i) => (
                  <span key={i} className="inline-flex items-center gap-1 rounded-md bg-brand-soft px-2 py-1 text-[13px] text-foreground">
                    <Check className="size-3.5 text-brand" />
                    {a}
                  </span>
                ))}
              </div>
            ) : (
              <div className="grid gap-1.5 sm:grid-cols-2">
                {q.options.map((op) => {
                  const on = picked[q.id]?.includes(op.label) ?? false;
                  return (
                    <button
                      key={op.label}
                      type="button"
                      disabled={!waiting}
                      aria-pressed={on}
                      onClick={() => toggle(q, op.label)}
                      className="flex flex-col items-start rounded-md border px-3 py-2 text-left text-[13px] transition-[border-color,background-color,transform] duration-150 hover:bg-accent/60 active:scale-[0.99] disabled:opacity-60 aria-pressed:border-brand aria-pressed:bg-brand-soft"
                    >
                      <span className="font-medium">{op.label}</span>
                      {op.description && <span className="text-xs text-muted-foreground">{op.description}</span>}
                    </button>
                  );
                })}
                {waiting && (
                  <input
                    value={other[q.id] ?? ""}
                    onChange={(e) => setOther((o) => ({ ...o, [q.id]: e.target.value }))}
                    placeholder="其他, 自己写…"
                    className="h-auto min-h-9 rounded-md border bg-transparent px-3 py-2 text-[13px] outline-none placeholder:text-muted-foreground focus-visible:border-ring sm:col-span-2"
                  />
                )}
              </div>
            )}
          </fieldset>
        );
      })}
      {waiting && actions.onAnswer && (
        <div className="flex justify-end">
          <Button
            size="sm"
            disabled={!canSubmit}
            onClick={() => {
              const out: Record<string, string | string[]> = {};
              for (const q of qs) {
                const vals = [...(picked[q.id] ?? []), ...((other[q.id] ?? "").trim() ? [other[q.id].trim()] : [])];
                out[q.id] = q.multiSelect ? vals : (vals[vals.length - 1] ?? "");
              }
              actions.onAnswer!(call.id, out);
            }}
          >
            提交回答
          </Button>
        </div>
      )}
      {!answered && !waiting && <div className="text-xs text-muted-foreground">{call.status === "interrupted" ? "已中断, 没有回答" : "没有回答"}</div>}
    </div>
  );
}

/* ---------------- 子 Agent ---------------- */

export function SubagentBody({ call }: ToolViewProps) {
  const { renderParts } = useAgentUI();
  const prompt = str(call.args, "prompt", "task", "instructions");
  return (
    <div className="space-y-1 py-1">
      {prompt && <div className="line-clamp-3 rounded-md bg-muted/50 px-3 py-2 text-xs whitespace-pre-wrap text-muted-foreground">{prompt}</div>}
      {call.children?.length && renderParts ? renderParts(call.children, { streaming: call.status === "running" }) : null}
    </div>
  );
}

/* ---------------- 审批条 ---------------- */

/** 工具在 awaiting-approval 时挂在卡片下面: 允许一次 / 总是允许 / 拒绝 */
export function ApprovalBar({ call }: ToolViewProps) {
  const { actions } = useAgentUI();
  const what = str(call.args, ...COMMAND_KEYS) ?? str(call.args, ...PATH_KEYS) ?? call.name;
  return (
    <div data-slot="approval" role="group" aria-label="需要你的批准" className="my-1.5 flex flex-wrap items-center gap-2 rounded-lg border border-warning/40 bg-warning/8 px-3 py-2">
      <ShieldAlert className="size-4 shrink-0 text-warning" />
      <span className="min-w-0 flex-1 text-[13px]">
        需要你的批准: <span className="font-mono text-[12px]">{firstLine(what, 80)}</span>
      </span>
      <div className="flex gap-1.5">
        <Button size="sm" variant="ghost" onClick={() => actions.onDeny?.(call.id)} disabled={!actions.onDeny}>
          拒绝
        </Button>
        <Button size="sm" variant="outline" onClick={() => actions.onApprove?.(call.id, "always")} disabled={!actions.onApprove}>
          总是允许
        </Button>
        <Button size="sm" onClick={() => actions.onApprove?.(call.id, "once")} disabled={!actions.onApprove}>
          允许
        </Button>
      </div>
    </div>
  );
}

/** 结束了的时长 (行尾, 静态) */
export function DoneDuration({ call }: { call: ToolCallData }) {
  if (call.startedAt == null || call.endedAt == null) return null;
  return <span>{formatDuration(call.endedAt - call.startedAt)}</span>;
}
