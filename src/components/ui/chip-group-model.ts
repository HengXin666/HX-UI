/**
 * 筛选标签 (ChipGroup) 的纯逻辑: 选中值的增删, 键盘移动, 两端渐隐该出现在哪一侧, 把某个标签滚进视野要滚到哪.
 * 不带 "use client": 组件 (chip-group.tsx) 与自检脚本共用, 服务端也能 import.
 */

/** 渐隐 / 滚动按钮出现在哪一侧: 只在那一侧还有被裁掉的内容时出现 */
export type ChipFade = "none" | "start" | "end" | "both"

/** 小于这个像素差视为已经到头 (缩放 / 小数像素下 scrollLeft 不一定精确等于最大值) */
const EDGE_EPSILON = 1

/** 按滚动位置算哪一侧有溢出 */
export function fadeSide(scrollLeft: number, scrollWidth: number, clientWidth: number): ChipFade {
  const max = scrollWidth - clientWidth
  if (max <= EDGE_EPSILON) return "none"
  const start = scrollLeft > EDGE_EPSILON
  const end = scrollLeft < max - EDGE_EPSILON
  return start && end ? "both" : start ? "start" : end ? "end" : "none"
}

/** 多选: 切换一个值, 保持原来的顺序 */
export function toggleChip(list: readonly string[], value: string): string[] {
  return list.includes(value) ? list.filter((v) => v !== value) : [...list, value]
}

export const CHIP_KEYS = ["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Home", "End"] as const

/**
 * 键盘移动焦点: 左 / 上 前一个, 右 / 下 后一个 (首尾循环), Home / End 首尾.
 * rtl 时左右对调. 返回新下标; 不处理的键返回 -1.
 */
export function moveChip(count: number, current: number, key: string, rtl = false): number {
  if (count <= 0) return -1
  const cur = current < 0 ? 0 : current
  const prev = (cur - 1 + count) % count
  const next = (cur + 1) % count
  switch (key) {
    case "ArrowLeft":
      return rtl ? next : prev
    case "ArrowRight":
      return rtl ? prev : next
    case "ArrowUp":
      return prev
    case "ArrowDown":
      return next
    case "Home":
      return 0
    case "End":
      return count - 1
    default:
      return -1
  }
}

/**
 * 让 [left, left + width] 这一段完整出现在可视区 (两侧各留 pad, 通常 = 渐隐宽度, 免得落在渐隐里看不清).
 * 已经完整可见时返回 null (不滚); 否则返回目标 scrollLeft (已夹在 0..max 内).
 */
export function scrollToReveal(
  left: number,
  width: number,
  scrollLeft: number,
  clientWidth: number,
  scrollWidth: number,
  pad = 0
): number | null {
  const max = Math.max(0, scrollWidth - clientWidth)
  // 段比可视区还宽 (减去留白后) 时, 让它的左边对齐
  const room = Math.max(0, clientWidth - pad * 2)
  let target: number | null = null
  if (left - pad < scrollLeft || width > room) target = left - pad
  else if (left + width + pad > scrollLeft + clientWidth) target = left + width + pad - clientWidth
  if (target == null) return null
  const clamped = Math.min(max, Math.max(0, target))
  return Math.abs(clamped - scrollLeft) < EDGE_EPSILON ? null : clamped
}
