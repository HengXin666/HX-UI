/** 展示用的格式化 (纯函数, 服务端安全) */

/** 毫秒 -> "0.4 秒" / "12 秒" / "1 分 05 秒" / "1 小时 02 分" */
export function formatDuration(ms: number): string {
  if (!Number.isFinite(ms) || ms < 0) return "";
  if (ms < 1000) return `${(ms / 1000).toFixed(1)} 秒`;
  const s = Math.floor(ms / 1000);
  if (s < 60) return `${s} 秒`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m} 分 ${String(s % 60).padStart(2, "0")} 秒`;
  return `${Math.floor(m / 60)} 小时 ${String(m % 60).padStart(2, "0")} 分`;
}

/** 字节 -> "820 B" / "12.4 KB" / "3.1 MB" */
export function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(n < 10240 ? 1 : 0)} KB`;
  return `${(n / 1024 / 1024).toFixed(1)} MB`;
}

const compact = new Intl.NumberFormat("zh-CN", { notation: "compact", maximumFractionDigits: 1 });
/** token 数 -> "820" / "1.2万" */
export const formatTokens = (n: number) => (n < 1000 ? String(n) : compact.format(n));
