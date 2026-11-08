"use client";

import { useEffect, useState } from "react";
import type { Domain } from "./scale";
import { VIZ_SHOT } from "./tokens";

const MS = 1000;

export interface ShockDomain {
  /** 当前画面用的 domain. 越界的那一拍仍是旧 domain, 线和柱冲出画框. */
  domain: Domain;
  /** 上一个 domain, 新刻度从它的位置滑进来, 旧刻度滑到新位置后淡出. */
  previous: Domain;
  /** 越界已发生, 还在等重标. */
  pending: boolean;
  /** 第几次重标. 冲击标记用它做 key, 只在重标那一次播. */
  punch: number;
}

/**
 * 坐标轴冲击的三拍: 新值越界时先按旧比例冲出画框 (shock), 停一拍让人看见它坏了 (beat), 再切到新 domain 重标.
 * 对齐 chart-live-moves 的 AxisRescaleShockV2. 减弱动效时直接切, 不留坏掉的那一拍.
 */
export function useShockDomain(target: Domain, reduced: boolean): ShockDomain {
  const [state, setState] = useState({ domain: target, previous: target, punch: 0 });
  useEffect(() => {
    if (target === state.domain) return undefined;
    if (reduced) {
      setState((current) => ({ domain: target, previous: current.domain, punch: current.punch }));
      return undefined;
    }
    const timer = setTimeout(() => {
      setState((current) => ({ domain: target, previous: current.domain, punch: current.punch + 1 }));
    }, (VIZ_SHOT.shock + VIZ_SHOT.beat) * MS);
    return () => clearTimeout(timer);
  }, [target, reduced, state.domain]);
  return { ...state, pending: target !== state.domain };
}
