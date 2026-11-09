// 行为规格参照 docs/research/catalog/backgrounds-1.md 的 GridScan 条目 (enableGyro, deviceorientation), 实现为 HX 自有.
"use client";

import { useEffect, useRef, type RefObject } from "react";
import { clamp } from "../../backdrop/kernel/math";

/** 陀螺仪倾斜的规格常数. */
export const DEVICE_TILT = {
  /** 偏离起始姿态多少度算满偏 (归一化到 ±1). */
  range: 30,
  /** 平滑时间常数 (秒), 压掉传感器抖动. */
  tau: 0.12,
} as const;

/** 倾斜状态: target 为最近一次读数映射出的 [-1, 1] 目标, value 为平滑后的值, base 为起始姿态. */
export interface TiltState {
  active: boolean;
  base: readonly [number, number] | null;
  target: [number, number];
  value: [number, number];
}

/** 一份空的倾斜状态. */
export function createTiltState(): TiltState {
  return { active: false, base: null, target: [0, 0], value: [0, 0] };
}

/**
 * 把一次 deviceorientation 读数映射成画面坐标里的倾斜 [x, y] (各钳到 ±1, x 朝右, y 朝上).
 * 以第一次读数为中性姿态 (手机通常斜握着), 并按屏幕旋转角换轴, 横屏时左右前后不会错位.
 *
 * @param beta 前后俯仰 (度). @param gamma 左右侧倾 (度).
 * @param base 中性姿态 [beta, gamma]. @param angle 屏幕旋转角 (0 / 90 / 180 / 270).
 */
export function tiltTarget(beta: number, gamma: number, base: readonly [number, number], angle: number = 0): [number, number] {
  const db = beta - base[0];
  const dg = gamma - base[1];
  const turn = ((Math.round(angle / 90) % 4) + 4) % 4;
  const [x, y] = turn === 1 ? [db, dg] : turn === 2 ? [-dg, db] : turn === 3 ? [-db, -dg] : [dg, -db];
  return [clamp(x / DEVICE_TILT.range, -1, 1), clamp(y / DEVICE_TILT.range, -1, 1)];
}

/**
 * 把平滑值按指数趋近目标走一帧, 原地改写并返回 value. dt 为 0 (静态帧) 时不动.
 *
 * @param s 倾斜状态. @param dt 帧长 (秒). @param tau 时间常数 (秒).
 */
export function stepTilt(s: TiltState, dt: number, tau: number = DEVICE_TILT.tau): readonly [number, number] {
  const k = dt > 0 ? 1 - Math.exp(-dt / Math.max(tau, 1e-3)) : 0;
  s.value[0] += (s.target[0] - s.value[0]) * k;
  s.value[1] += (s.target[1] - s.value[1]) * k;
  return s.value;
}

/** 收一次读数: 首次读数记为中性姿态; 缺字段的读数 (桌面浏览器常见) 忽略. */
export function readTilt(s: TiltState, beta: number | null, gamma: number | null, angle: number): void {
  if (beta === null || gamma === null || !Number.isFinite(beta) || !Number.isFinite(gamma)) return;
  if (!s.base) s.base = [beta, gamma];
  s.target = tiltTarget(beta, gamma, s.base, angle);
  s.active = true;
}

type PermissionCtor = { requestPermission?: () => Promise<string> };

/**
 * 监听 deviceorientation, 返回倾斜状态的 ref (平滑在帧回调里用 stepTilt 做). 只在 enabled 时挂监听, 服务端不碰 window.
 * iOS 要求 DeviceOrientationEvent.requestPermission 在用户手势里调: 不在挂载时请求, 等宿主里第一次 pointerdown 再请求.
 *
 * @param hostRef 宿主元素. @param enabled 是否启用 (已排除减弱动效).
 */
export function useDeviceTilt(hostRef: RefObject<HTMLElement | null>, enabled: boolean): RefObject<TiltState> {
  const state = useRef<TiltState>(createTiltState());
  useEffect(() => {
    if (!enabled || typeof window === "undefined" || typeof window.DeviceOrientationEvent === "undefined") return undefined;
    const s = state.current;
    const onOrient = (e: DeviceOrientationEvent): void => readTilt(s, e.beta, e.gamma, window.screen?.orientation?.angle ?? 0);
    let listening = false;
    let disposed = false;
    const listen = (): void => {
      if (listening || disposed) return;
      listening = true;
      window.addEventListener("deviceorientation", onOrient);
    };
    const ctor = window.DeviceOrientationEvent as unknown as PermissionCtor;
    const host = hostRef.current;
    let onDown: (() => void) | null = null;
    if (typeof ctor.requestPermission === "function" && host) {
      const ask = ctor.requestPermission.bind(ctor);
      onDown = () => {
        if (onDown) host.removeEventListener("pointerdown", onDown);
        ask().then((answer) => { if (answer === "granted") listen(); }, () => undefined);
      };
      host.addEventListener("pointerdown", onDown);
    } else if (typeof ctor.requestPermission !== "function") {
      listen();
    }
    return () => {
      disposed = true;
      if (onDown && host) host.removeEventListener("pointerdown", onDown);
      window.removeEventListener("deviceorientation", onOrient);
      Object.assign(s, createTiltState());
    };
  }, [enabled, hostRef]);
  return state;
}
