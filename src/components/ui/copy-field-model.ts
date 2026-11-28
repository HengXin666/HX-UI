/**
 * CopyField 的纯逻辑: 遮罩文本. 不碰 DOM, 服务端 / 脚本里都能直接测.
 */

export interface MaskOptions {
  /** 末尾保留几个字符明文 (如 4: "••••••a9F2"), 默认 0 */
  peek?: number
  /** 遮罩字符, 默认 "•" */
  char?: string
  /** 遮罩部分最多几个字符 (长密钥不必显示一长串点), 默认 16; 至少 4 个 */
  max?: number
}

export const MASK_CHAR = "•"
export const MASK_MAX = 16
const MASK_MIN = 4

/**
 * 把值换成遮罩显示. 多行值按行遮罩 (保留行数, 每行按同样规则), 空值返回空串.
 * peek 不超过值长度的一半, 免得短值几乎全露.
 */
export function maskValue(value: string, { peek = 0, char = MASK_CHAR, max = MASK_MAX }: MaskOptions = {}): string {
  if (!value) return ""
  if (value.includes("\n")) return value.split("\n").map((line) => (line ? maskValue(line, { peek: 0, char, max }) : "")).join("\n")
  const chars = Array.from(value)
  const keep = Math.max(0, Math.min(Math.floor(peek), Math.floor(chars.length / 2)))
  const dots = Math.max(MASK_MIN, Math.min(chars.length - keep, max))
  return char.repeat(dots) + chars.slice(chars.length - keep).join("")
}
