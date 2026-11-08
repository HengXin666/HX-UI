// 行为规格参照 docs/research/catalog/backgrounds-1.md 与 backgrounds-2.md 的 grid 路各条目, 实现为 HX 自有.
import { approach, clamp } from "../../backdrop/kernel/math";
import type { Rgb } from "../../backdrop/kernel/color";

/** 解析失败或颜色未给时的中灰, 只作着色器入参兜底, 不会上屏为默认色. */
export const GREY: Rgb = [0.5, 0.5, 0.5];
/** 角度换弧度. */
export const DEG = Math.PI / 180;

/**
 * 入场进度 0..1: 关闭入场, 减弱动效 (elapsed 为 Infinity) 时直接为 1.
 *
 * @param elapsed 出帧以来真实秒数.
 * @param seconds 入场时长 (秒).
 * @param enabled 是否播入场.
 */
export function introProgress(elapsed: number, seconds: number, enabled: boolean): number {
  if (!enabled || !Number.isFinite(elapsed) || seconds <= 0) return 1;
  return clamp(elapsed / seconds, 0, 1);
}

/**
 * CSS 渐变角 (0 朝上, 90 朝右) 换成 y 朝上坐标里的单位方向.
 *
 * @param deg 角度 (度).
 */
export function cssAngleDir(deg: number): readonly [number, number] {
  return [Math.sin(deg * DEG), Math.cos(deg * DEG)];
}

/** 取第 i 个解析色, 缺省为中灰. */
export function rgbAt(colors: readonly Rgb[], i: number): Rgb {
  return colors[i] ?? GREY;
}

/** 一个随帧逼近目标的标量, 进出可用不同时间常数. */
export interface Follower {
  value: number;
}

/**
 * 推进一个跟随量. dt 为 0 (静态帧) 时直接落到目标, 静态画面不留半截过渡.
 *
 * @param f 原地修改的跟随量.
 * @param target 目标值.
 * @param dt 帧长 (秒).
 * @param tauUp 目标高于当前值时的时间常数 (秒).
 * @param tauDown 目标低于当前值时的时间常数 (秒), 默认同 tauUp.
 */
export function follow(f: Follower, target: number, dt: number, tauUp: number, tauDown: number = tauUp): number {
  f.value = dt <= 0 ? target : approach(f.value, target, dt, target > f.value ? tauUp : tauDown);
  return f.value;
}

/** 名字到着色器整型枚举, 未知名落到 0. */
export function enumOf<K extends string>(table: Readonly<Record<K, number>>, key: string): number {
  return (table as Readonly<Record<string, number>>)[key] ?? 0;
}

/**
 * 解析色写成 2d 画布能吃的 color(srgb ...) 串, 不出现色值字面量.
 *
 * @param rgb 0..1 的 sRGB.
 * @param alpha 不透明度 0..1.
 */
export function inkOf(rgb: Rgb, alpha: number = 1): string {
  const [r, g, b] = rgb.map((c) => clamp(c, 0, 1).toFixed(4));
  return `color(srgb ${r} ${g} ${b} / ${clamp(alpha, 0, 1).toFixed(4)})`;
}

/**
 * 色相环上的满饱和 sRGB, 给彩虹模式用.
 *
 * @param turn 色相, 以圈计 (0..1 一圈).
 */
export function hueRgb(turn: number): Rgb {
  const h = (((turn % 1) + 1) % 1) * 6;
  const channel = (n: number): number => clamp(Math.abs(((h + n) % 6) - 3) - 1, 0, 1);
  return [channel(0), channel(4), channel(2)];
}
