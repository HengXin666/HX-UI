"use client";

import type { JSX } from "react";

/**
 * 引脚的形状 —— UE5 里 exec 与 data 唯一的形状区别。
 *
 * 单独成文件: 它是 JSX, 而 node-style.ts 要保持 .ts (纯逻辑, 能被后端/worker
 * 直接 import)。两者混在一个 .ts 里会 TS1005。
 *
 * 为什么 exec 用 SVG polygon 而不是 CSS 三角:
 *   CSS 三角靠 border 拼, 在画布的 transform: scale 下边角会露出半像素缝隙,
 *   而蓝图是全程缩放的 —— 缩到 40% 时那个缝会变成一条可见的白线。
 */

/** 极简类名合并 —— 不想为一个字符串拼接去依赖 primitives 层。 */
function cx(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(" ");
}

export function PinShape({
  kind, color, filled, invalid, size = 10,
}: {
  /** exec 画楔形 (尖朝右, 指示执行方向), 其余画圆点。 */
  readonly kind: "exec" | "data";
  /** 颜色。exec 用 text-* (SVG 走 currentColor), data 用 bg-*。 */
  readonly color?: string;
  /** 已连接 = 实心, 未连接 = 空心轮廓。Epic 官方明文规则。 */
  readonly filled?: boolean;
  readonly invalid?: boolean;
  readonly size?: number;
}): JSX.Element {
  if (kind === "exec") {
    // 楔形: 尖端朝右的三角
    return (
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="shrink-0 overflow-visible"
        data-pin="exec"
        data-filled={filled ? "1" : "0"}
      >
        <polygon
          points={`0,0 ${size},${size / 2} 0,${size}`}
          className={
            invalid
              ? "fill-destructive stroke-destructive"
              : filled
                ? cx("fill-current stroke-current", color ?? "text-foreground")
                : "fill-transparent stroke-foreground/70"
          }
          strokeWidth={1}
        />
      </svg>
    );
  }

  return (
    <span
      data-pin="data"
      data-filled={filled ? "1" : "0"}
      className={cx(
        "block shrink-0 rounded-full border",
        invalid
          ? "border-destructive bg-destructive"
          : // 未连接只描边、不填充 —— 与 exec 的"空心/实心"是同一条规则
            filled
            ? cx("border-transparent", color ?? "bg-foreground")
            : "border-foreground/50 bg-transparent"
      )}
      style={{ width: size, height: size }}
    />
  );
}
