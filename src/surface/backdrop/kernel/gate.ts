// 行为规格参照 docs/research/catalog/backgrounds-1.md 的 Backgrounds 族共用 (单画布, DPR 上限, 离屏停帧) 条目, 实现为 HX 自有.

/** 决定帧循环怎么跑的输入. */
export interface RunGate {
  /** 宿主与视口相交. */
  readonly inView: boolean;
  /** 页面在后台. */
  readonly pageHidden: boolean;
  /** 减弱动效 (系统偏好或 prop 覆写). */
  readonly reduced: boolean;
  /** 用户的 paused prop. */
  readonly paused: boolean;
}

/**
 * animate: 持续出帧. still: 只画一帧静态画面然后停 (减弱动效或暂停).
 * idle: 什么都不画 (离屏或页面隐藏), 回来时再按 animate 或 still 接上.
 */
export type RunPlan = "animate" | "still" | "idle";

/** 由可见性, 减弱动效与暂停算出本刻的运行方式. 纯函数, 调度测试直接覆盖. */
export function planRun(gate: RunGate): RunPlan {
  if (!gate.inView || gate.pageHidden) return "idle";
  if (gate.reduced || gate.paused) return "still";
  return "animate";
}

/** 进出视口的判定余量: 提前一点起帧, 滚进来时第一帧已经画好. */
export const VIEW_MARGIN = "64px";

/**
 * 观察 el 是否在视口里. 环境没有 IntersectionObserver 时视为一直可见 (只少了离屏停帧, 不会不出图).
 *
 * @param el 被观察的宿主元素.
 * @param onChange 可见性变化回调, 观察开始后至少回调一次.
 */
export function watchView(el: Element, onChange: (inView: boolean) => void): () => void {
  if (typeof IntersectionObserver === "undefined") {
    onChange(true);
    return () => undefined;
  }
  const io = new IntersectionObserver(
    (entries) => {
      const last = entries[entries.length - 1];
      if (last) onChange(last.isIntersecting);
    },
    { rootMargin: VIEW_MARGIN },
  );
  io.observe(el);
  return () => io.disconnect();
}
