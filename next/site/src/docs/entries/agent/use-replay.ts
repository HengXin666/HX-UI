import * as React from "react";
import { useAgentStream } from "@/agent";
import type { Step } from "./samples";

/** 按剧本把事件推进 useAgentStream: 可调速, 可暂停, 可重放 */
export function useReplay(make: () => Step[], { speed = 1, playing = true }: { speed?: number; playing?: boolean } = {}) {
  const stream = useAgentStream();
  const steps = React.useMemo(make, [make]);
  const [run, setRun] = React.useState(0);
  const idx = React.useRef(0);
  const [done, setDone] = React.useState(false);

  React.useEffect(() => {
    if (!playing || done) return;
    let timer = 0;
    const tick = () => {
      // 同一刻 (wait 0) 的步骤合在一起推
      do {
        const s = steps[idx.current++];
        if (!s) {
          setDone(true);
          return;
        }
        stream.push(s.events);
      } while (steps[idx.current] && steps[idx.current].wait === 0);
      const next = steps[idx.current];
      if (!next) {
        setDone(true);
        return;
      }
      timer = window.setTimeout(tick, next.wait / speed);
    };
    timer = window.setTimeout(tick, (steps[idx.current]?.wait ?? 0) / speed);
    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playing, speed, run, done, steps]);

  const restart = React.useCallback(() => {
    idx.current = 0;
    stream.reset();
    setDone(false);
    setRun((r) => r + 1);
  }, [stream]);

  return { ...stream, done, restart, progress: steps.length ? idx.current / steps.length : 0 };
}

/** 把一段文字按速度逐步放出来 (流式 Markdown 演示用) */
export function useTypewriter(text: string, { cps = 120, playing = true }: { cps?: number; playing?: boolean } = {}) {
  const [n, setN] = React.useState(0);
  const [run, setRun] = React.useState(0);
  React.useEffect(() => {
    if (!playing) return;
    let raf = 0;
    let last = performance.now();
    let acc = 0;
    const loop = (t: number) => {
      acc += ((t - last) / 1000) * cps;
      last = t;
      const step = Math.floor(acc);
      if (step > 0) {
        acc -= step;
        let done = false;
        setN((x) => {
          const v = Math.min(text.length, x + step);
          done = v >= text.length;
          return v;
        });
        if (done) return;
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [text, cps, playing, run]);
  return { text: text.slice(0, n), done: n >= text.length, restart: () => (setN(0), setRun((r) => r + 1)) };
}
