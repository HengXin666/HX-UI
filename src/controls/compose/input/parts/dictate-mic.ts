/** DictateButton 的收音会话: 每次开始的电平状态, 麦克风与分析器的打开和释放. */
import { DICTATE, HALF } from "../../tokens";

export interface Live {
  startedAt: number;
  env: number;
  frame: number;
  history: number[];
  analyser: AnalyserNode | null;
  bins: Uint8Array<ArrayBuffer> | null;
  context: AudioContext | null;
  stream: MediaStream | null;
}

export const freshLive = (): Live => ({ startedAt: 0, env: 0, frame: 0, history: [], analyser: null, bins: null, context: null, stream: null });

/** 打开麦克风. 失败 (无权限, 无设备, 非安全上下文) 返回 false, 调用方退回模拟. */
export async function openMic(live: Live): Promise<boolean> {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const context = new AudioContext();
    const analyser = context.createAnalyser();
    analyser.fftSize = DICTATE.micBins * HALF;
    context.createMediaStreamSource(stream).connect(analyser);
    Object.assign(live, { stream, context, analyser, bins: new Uint8Array(analyser.frequencyBinCount) });
    return true;
  } catch {
    return false;
  }
}

export function closeMic(live: Live): void {
  live.stream?.getTracks().forEach((track) => track.stop());
  void live.context?.close();
  Object.assign(live, { stream: null, context: null, analyser: null, bins: null });
}
