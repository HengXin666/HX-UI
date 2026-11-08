/** DictateButton 展开区的波形: 条数, 宽度与画布绘制. */
import { fitCanvas, inkOf } from "../../canvas";
import { DICTATE, HALF } from "../../tokens";

/** 展开区能放下的波形条数. */
export const WAVE_BARS = 24;
/** 一条加一个间隙的横向步长. */
export const WAVE_PITCH = DICTATE.barWidthPx + DICTATE.barGapPx;

/** 把历史的最后 WAVE_BARS 格画成居中竖条, 最新一格用当前包络. */
export function drawWave(canvas: HTMLCanvasElement, history: readonly number[], latest: number): void {
  const width = canvas.clientWidth;
  const height = canvas.clientHeight;
  const ctx = fitCanvas(canvas, width, height);
  if (!ctx) return;
  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = inkOf(canvas);
  const levels = [...history.slice(-(WAVE_BARS - 1)), latest];
  const offset = WAVE_BARS - levels.length;
  levels.forEach((level, index) => {
    const bar = Math.max(1, level * height);
    ctx.fillRect((offset + index) * WAVE_PITCH, (height - bar) / HALF, DICTATE.barWidthPx, bar);
  });
}
