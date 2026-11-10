// 行为规格参照 docs/research/catalog/animations.md 的 Strands 条目 (listening, level), 实现为 HX 自有.
/**
 * FiberStrands 的麦克风电平: listening 打开时申请麦克风, 经 AnalyserNode 取时域均方根, 按起落两个时间常数平滑成 0..1.
 * 默认不申请; 被拒, 没有 getUserMedia 或 AudioContext 时状态为 denied / unavailable, 调用方退回 level prop.
 *
 * .agents/notes/implemented/feature/2026-11-10-surface-scene.md
 */
import { useEffect, useRef, useState } from "react";
import { STRAND } from "../tokens";

export type MicStatus = "off" | "pending" | "live" | "denied" | "unavailable";

export interface MicLevel {
  /** 读一次当前电平 (0..1), dt 为距上次读的秒数. 不在 live 时返回 null. */
  read(dt: number): number | null;
}

/** 均方根到电平: rms x gain 钳 0..1. */
export function micLevelOf(samples: Float32Array): number {
  let sum = 0;
  for (const v of samples) sum += v * v;
  const rms = Math.sqrt(sum / Math.max(1, samples.length));
  return Math.min(1, rms * STRAND.mic.gain);
}

/** 起 (变大) 用 attack, 落用 release 的指数趋近. */
export function smoothMic(prev: number, next: number, dt: number): number {
  const tau = next > prev ? STRAND.mic.attack : STRAND.mic.release;
  return prev + (next - prev) * (1 - Math.exp(-Math.max(0, dt) / tau));
}

export function useMicLevel(enabled: boolean): { status: MicStatus; meter: MicLevel } {
  const [status, setStatus] = useState<MicStatus>("off");
  const analyser = useRef<AnalyserNode | null>(null);
  const buffer = useRef<Float32Array<ArrayBuffer> | null>(null);
  const level = useRef(0);

  useEffect(() => {
    if (!enabled) {
      setStatus("off");
      return;
    }
    const media = typeof navigator === "undefined" ? undefined : navigator.mediaDevices;
    const Ctx = typeof window === "undefined" ? undefined : window.AudioContext;
    if (!media?.getUserMedia || !Ctx) {
      setStatus("unavailable");
      return;
    }
    let live = true;
    let stream: MediaStream | null = null;
    let ctx: AudioContext | null = null;
    setStatus("pending");
    media.getUserMedia({ audio: true }).then(
      (s) => {
        stream = s;
        if (!live) {
          for (const t of s.getTracks()) t.stop();
          return;
        }
        ctx = new Ctx();
        const node = ctx.createAnalyser();
        node.fftSize = STRAND.mic.fftSize;
        ctx.createMediaStreamSource(s).connect(node);
        analyser.current = node;
        buffer.current = new Float32Array(node.fftSize);
        setStatus("live");
      },
      () => {
        if (live) setStatus("denied");
      },
    );
    return () => {
      live = false;
      analyser.current = null;
      level.current = 0;
      for (const t of stream?.getTracks() ?? []) t.stop();
      void ctx?.close();
    };
  }, [enabled]);

  const meter = useRef<MicLevel>({
    read(dt) {
      const node = analyser.current;
      const buf = buffer.current;
      if (!node || !buf) return null;
      node.getFloatTimeDomainData(buf);
      level.current = smoothMic(level.current, micLevelOf(buf), dt);
      return level.current;
    },
  });
  return { status, meter: meter.current };
}
