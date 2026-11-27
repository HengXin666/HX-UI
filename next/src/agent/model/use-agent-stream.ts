"use client";
import * as React from "react";
import { emptyAgentState, reduceAgentEvents, type AgentEvent, type AgentState } from "./events";
import type { AgentMessage } from "./types";

export interface AgentStream {
  messages: AgentMessage[];
  /** 推一个或多个事件; 同一帧里的事件合成一次提交 */
  push: (e: AgentEvent | readonly AgentEvent[]) => void;
  /** 立即提交 (测试或需要同步读的时候) */
  flush: () => void;
  reset: (messages?: AgentMessage[]) => void;
  /** 有消息还在生成 */
  busy: boolean;
}

/**
 * 事件流 -> 消息快照. token 一个一个来时按 requestAnimationFrame 合批, 一帧最多 setState 一次;
 * 页面在后台 (rAF 停了) 时退回 50ms 定时器, 回来时不会一下子堆一大批.
 */
export function useAgentStream(initial?: AgentMessage[]): AgentStream {
  const [state, setState] = React.useState<AgentState>(() => (initial ? { messages: initial } : emptyAgentState()));
  const queue = React.useRef<AgentEvent[]>([]);
  const frame = React.useRef<{ raf: number | null; timer: number | null }>({ raf: null, timer: null });

  const flush = React.useCallback(() => {
    const f = frame.current;
    if (f.raf != null) cancelAnimationFrame(f.raf);
    if (f.timer != null) window.clearTimeout(f.timer);
    f.raf = f.timer = null;
    if (!queue.current.length) return;
    const batch = queue.current;
    queue.current = [];
    setState((s) => reduceAgentEvents(s, batch));
  }, []);

  const push = React.useCallback(
    (e: AgentEvent | readonly AgentEvent[]) => {
      if (Array.isArray(e)) queue.current.push(...(e as AgentEvent[]));
      else queue.current.push(e as AgentEvent);
      const f = frame.current;
      if (f.raf == null && f.timer == null) {
        if (typeof document !== "undefined" && document.visibilityState === "hidden") f.timer = window.setTimeout(flush, 50);
        else f.raf = requestAnimationFrame(flush);
      }
    },
    [flush],
  );

  const reset = React.useCallback((messages?: AgentMessage[]) => {
    queue.current = [];
    setState({ messages: messages ?? [] });
  }, []);

  React.useEffect(() => () => {
    const f = frame.current;
    if (f.raf != null) cancelAnimationFrame(f.raf);
    if (f.timer != null) window.clearTimeout(f.timer);
  }, []);

  const busy = state.messages.some((m) => m.status === "streaming");
  return { messages: state.messages, push, flush, reset, busy };
}
