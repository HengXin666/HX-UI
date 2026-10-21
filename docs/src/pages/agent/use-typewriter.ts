import { useCallback, useEffect, useRef, useState } from "react";

/** 逐字流式的节奏: 每次追加的字符数与间隔 (ms). */
const STEP = 1;
const INTERVAL = 40;

export interface Typewriter {
  /** 当前已到达的前缀. */
  readonly text: string;
  /** 仍在逐字追加. */
  readonly streaming: boolean;
  /** 从头开始逐字追加. */
  readonly start: () => void;
  /** 停在当前长度, 不再追加. */
  readonly stop: () => void;
  /** 清空并停止. */
  readonly reset: () => void;
}

/**
 * 演示用的逐字流式: 按固定节奏把 source 逐字喂出来.
 * 只服务于文档页, 不进库; 真实场景的增量由 SSE / WebSocket 驱动.
 */
export function useTypewriter(source: string): Typewriter {
  const [text, setText] = useState("");
  const [streaming, setStreaming] = useState(false);
  const timer = useRef<number | undefined>(undefined);

  const stop = useCallback((): void => {
    window.clearInterval(timer.current);
    timer.current = undefined;
    setStreaming(false);
  }, []);

  useEffect(() => () => window.clearInterval(timer.current), []);

  const start = useCallback((): void => {
    stop();
    setText("");
    setStreaming(true);
    let index = 0;
    timer.current = window.setInterval(() => {
      index += STEP;
      setText(source.slice(0, index));
      if (index >= source.length) {
        stop();
      }
    }, INTERVAL);
  }, [source, stop]);

  const reset = useCallback((): void => {
    stop();
    setText("");
  }, [stop]);

  return { text, streaming, start, stop, reset };
}
