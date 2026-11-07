"use client";

import { useCallback, useEffect, useRef, useState, type JSX, type ReactNode } from "react";
import { SPRING_THUMB } from "./tokens";
import { useTrack } from "./use-track";

/** 读父节点 data-state, 打开为 1, 关闭为 0. 速度在反向时保留. */
export function useStateProgress(node: HTMLElement | null): number {
  const track = useTrack(0, SPRING_THUMB);
  useEffect(() => {
    if (!node) return;
    const read = (): void => {
      track.setTarget(node.getAttribute("data-state") === "closed" ? 0 : 1);
    };
    read();
    const observer = new MutationObserver(read);
    observer.observe(node, { attributes: true, attributeFilter: ["data-state"] });
    return () => observer.disconnect();
  }, [node, track.setTarget]);
  return track.value;
}

function useHost(): [(node: HTMLDivElement | null) => void, HTMLElement | null] {
  const [host, setHost] = useState<HTMLElement | null>(null);
  const bind = useCallback((node: HTMLDivElement | null) => {
    setHost(node?.parentElement ?? null);
  }, []);
  return [bind, host];
}

/** 面板进出. 包在 radix 内容里, 父级 data-state 驱动. */
export function SpringShell({ children, axis = "y" }: { readonly children: ReactNode; readonly axis?: "x" | "y" }): JSX.Element {
  const [bind, host] = useHost();
  const t = useStateProgress(host);
  const shift = axis === "x" ? (1 - t) * 16 : 0;
  const drop = axis === "y" ? (1 - t) * 8 : 0;
  return (
    <div ref={bind} style={{ opacity: t, transform: `translate3d(${shift}px, ${drop}px, 0) scale(${0.98 + t * 0.02})` }}>
      {children}
    </div>
  );
}

/** 折叠高度跟父级开关走, 中途反向从当前高度继续. */
export function SpringHeight({ children }: { readonly children: ReactNode }): JSX.Element {
  const [bind, host] = useHost();
  const inner = useRef<HTMLDivElement>(null);
  const open = useStateProgress(host);
  const [full, setFull] = useState(0);
  useEffect(() => {
    setFull(inner.current?.scrollHeight ?? 0);
  }, [children, open]);
  return (
    <div ref={bind} className="overflow-hidden" style={{ height: open * full }}>
      <div ref={inner}>{children}</div>
    </div>
  );
}
