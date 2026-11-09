/**
 * 公共曲线表: craft 的 EASE 之外, 控件各族规格里反复出现的三次贝塞尔.
 * 每条曲线只在这里写一次; 组件引用名字, 不再各自持有 "cubic-bezier(...)" 副本.
 *
 * 点值按规格原样收录; 名字描述形状, 不描述用在哪个组件上.
 */
export const CURVE = {
  /** 五次缓出: 起步最快, 尾段很长. 导航指示条, 菜单展开, 步骤填充落定. */
  outQuint: [0.22, 1, 0.36, 1],
  /** 强缓出: 比 outQuint 稍硬的尾段. 按压, 输入, 滑杆的颜色与位置跟随. */
  outStrong: [0.23, 1, 0.32, 1],
  /** 四次缓入缓出: 两端都慢. 分段切换, 抖动往返. */
  inOutQuart: [0.77, 0, 0.175, 1],
  /** 轻回弹缓出: 越过终点约 4% 再收回. 指示点放大. */
  backOutSoft: [0.34, 1.4, 0.64, 1],
  /** 托起: 前段快后段平, 无过冲. 坞栏图标升起. */
  lift: [0.3, 0.8, 0.3, 1],
  /** 弹出: 越过终点约 8% 再收回. 坞栏标签弹出. */
  popOut: [0.2, 1.25, 0.4, 1],
} as const satisfies Record<string, readonly [number, number, number, number]>;

export type CurveName = keyof typeof CURVE;

/** 取一条曲线的 CSS 写法, 给 transition / Web Animations 的 easing 用. */
export function cssCurve(name: CurveName): string {
  return `cubic-bezier(${CURVE[name].join(", ")})`;
}
