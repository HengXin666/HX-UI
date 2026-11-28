/**
 * 常用技术指标, 纯函数. 输入收盘价等数组, 输出等长数组, 数据不足的位置是 null.
 * 参数默认值与国内行情软件一致 (MACD 12/26/9, BOLL 20/2, KDJ 9/3/3, RSI 6/12/24).
 */
type N = number | null;

export function sma(values: number[], n: number): N[] {
  const out: N[] = new Array(values.length).fill(null);
  let sum = 0;
  for (let i = 0; i < values.length; i++) {
    sum += values[i];
    if (i >= n) sum -= values[i - n];
    if (i >= n - 1) out[i] = sum / n;
  }
  return out;
}

export function ema(values: number[], n: number): number[] {
  const k = 2 / (n + 1);
  const out: number[] = [];
  values.forEach((v, i) => out.push(i === 0 ? v : v * k + out[i - 1] * (1 - k)));
  return out;
}

/** MACD: DIF = EMA12 - EMA26, DEA = EMA9(DIF), 柱 = 2 × (DIF - DEA) */
export function macd(close: number[], fast = 12, slow = 26, signal = 9) {
  const f = ema(close, fast), s = ema(close, slow);
  const dif = close.map((_, i) => f[i] - s[i]);
  const dea = ema(dif, signal);
  return { dif, dea, hist: dif.map((d, i) => 2 * (d - dea[i])) };
}

/** 布林带: 中轨 MA20, 上下轨 ± 2 倍标准差 */
export function boll(close: number[], n = 20, k = 2) {
  const mid = sma(close, n);
  const up: N[] = [], low: N[] = [];
  close.forEach((_, i) => {
    const m = mid[i];
    if (m == null) { up.push(null); low.push(null); return; }
    let v = 0;
    for (let j = i - n + 1; j <= i; j++) v += (close[j] - m) ** 2;
    const sd = Math.sqrt(v / n);
    up.push(m + k * sd); low.push(m - k * sd);
  });
  return { mid, up, low };
}

/** KDJ 随机指标 */
export function kdj(high: number[], low: number[], close: number[], n = 9, m1 = 3, m2 = 3) {
  const K: number[] = [], D: number[] = [], J: number[] = [];
  close.forEach((c, i) => {
    const from = Math.max(0, i - n + 1);
    const hh = Math.max(...high.slice(from, i + 1)), ll = Math.min(...low.slice(from, i + 1));
    const rsv = hh === ll ? 50 : ((c - ll) / (hh - ll)) * 100;
    const k = ((m1 - 1) * (K[i - 1] ?? 50) + rsv) / m1;
    const d = ((m2 - 1) * (D[i - 1] ?? 50) + k) / m2;
    K.push(k); D.push(d); J.push(3 * k - 2 * d);
  });
  return { k: K, d: D, j: J };
}

/** RSI 相对强弱 (Wilder 平滑) */
export function rsi(close: number[], n = 6): N[] {
  const out: N[] = [null];
  let up = 0, down = 0;
  for (let i = 1; i < close.length; i++) {
    const ch = close[i] - close[i - 1];
    const u = Math.max(ch, 0), d = Math.max(-ch, 0);
    if (i <= n) { up += u / n; down += d / n; out.push(i < n ? null : down === 0 ? 100 : 100 - 100 / (1 + up / down)); continue; }
    up = (up * (n - 1) + u) / n; down = (down * (n - 1) + d) / n;
    out.push(down === 0 ? 100 : 100 - 100 / (1 + up / down));
  }
  return out;
}
