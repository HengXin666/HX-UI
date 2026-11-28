/**
 * 终端输出的 ANSI SGR 解析 (纯函数): 颜色 (16 色, 256 色, 真彩), 粗体, 暗淡, 斜体, 下划线.
 * 其余控制序列 (光标移动, 清屏 ...) 丢掉; 回车 \r 按 "回到行首覆盖" 处理 (进度条只留最后一帧).
 */
export interface AnsiSpan {
  text: string;
  fg?: string;
  bg?: string;
  bold?: boolean;
  dim?: boolean;
  italic?: boolean;
  underline?: boolean;
}

/** One Dark 调的 16 色 */
export const ANSI_COLORS = ["#3f4451", "#e06c75", "#98c379", "#e5c07b", "#61afef", "#c678dd", "#56b6c2", "#d7dae0", "#4f5666", "#ff7b86", "#b1e18b", "#efd88f", "#8dcaff", "#de99f0", "#6ed4e0", "#ffffff"];

function color256(n: number): string {
  if (n < 16) return ANSI_COLORS[n];
  if (n >= 232) {
    const v = 8 + (n - 232) * 10;
    return `rgb(${v},${v},${v})`;
  }
  const i = n - 16;
  const c = (x: number) => (x ? 55 + x * 40 : 0);
  return `rgb(${c(Math.floor(i / 36))},${c(Math.floor(i / 6) % 6)},${c(i % 6)})`;
}

// eslint-disable-next-line no-control-regex
const ESC = /\x1b\[([0-9;?]*)([A-Za-z])|\x1b\][^\x07\x1b]*(?:\x07|\x1b\\)|\x1b[()][A-Z0-9]|\x1b[=>78]/g;

/** 处理 \r: 每行只留最后一次覆盖后的内容 (不含 \r\n 里的 \r) */
export function collapseCarriageReturns(s: string): string {
  if (!s.includes("\r")) return s;
  return s
    .replace(/\r\n/g, "\n")
    .split("\n")
    .map((line) => {
      const segs = line.split("\r");
      let out = "";
      for (const seg of segs) out = seg + out.slice(seg.length);
      return out;
    })
    .join("\n");
}

export function stripAnsi(s: string): string {
  return s.replace(ESC, "");
}

export function parseAnsi(input: string): AnsiSpan[] {
  const s = collapseCarriageReturns(input);
  const out: AnsiSpan[] = [];
  let style: Omit<AnsiSpan, "text"> = {};
  let last = 0;
  const push = (text: string) => {
    if (!text) return;
    const prev = out[out.length - 1];
    if (prev && prev.fg === style.fg && prev.bg === style.bg && prev.bold === style.bold && prev.dim === style.dim && prev.italic === style.italic && prev.underline === style.underline) prev.text += text;
    else out.push({ text, ...style });
  };
  for (const m of s.matchAll(ESC)) {
    push(s.slice(last, m.index));
    last = (m.index ?? 0) + m[0].length;
    if (m[2] !== "m") continue;
    const codes = (m[1] || "0").split(";").map((x) => Number(x || 0));
    for (let i = 0; i < codes.length; i++) {
      const c = codes[i];
      if (c === 0) style = {};
      else if (c === 1) style = { ...style, bold: true };
      else if (c === 2) style = { ...style, dim: true };
      else if (c === 3) style = { ...style, italic: true };
      else if (c === 4) style = { ...style, underline: true };
      else if (c === 22) style = { ...style, bold: false, dim: false };
      else if (c === 23) style = { ...style, italic: false };
      else if (c === 24) style = { ...style, underline: false };
      else if (c >= 30 && c <= 37) style = { ...style, fg: ANSI_COLORS[c - 30] };
      else if (c >= 90 && c <= 97) style = { ...style, fg: ANSI_COLORS[c - 90 + 8] };
      else if (c >= 40 && c <= 47) style = { ...style, bg: ANSI_COLORS[c - 40] };
      else if (c >= 100 && c <= 107) style = { ...style, bg: ANSI_COLORS[c - 100 + 8] };
      else if (c === 39) style = { ...style, fg: undefined };
      else if (c === 49) style = { ...style, bg: undefined };
      else if ((c === 38 || c === 48) && codes[i + 1] === 5) {
        const v = color256(codes[i + 2] ?? 0);
        style = c === 38 ? { ...style, fg: v } : { ...style, bg: v };
        i += 2;
      } else if ((c === 38 || c === 48) && codes[i + 1] === 2) {
        const v = `rgb(${codes[i + 2] ?? 0},${codes[i + 3] ?? 0},${codes[i + 4] ?? 0})`;
        style = c === 38 ? { ...style, fg: v } : { ...style, bg: v };
        i += 4;
      }
    }
  }
  push(s.slice(last));
  return out;
}

/** 只留最后 maxLines 行 (运行中的输出预览); 返回被省略的行数 */
export function tailLines(s: string, maxLines: number): { text: string; hidden: number } {
  let count = 0;
  for (let i = s.length - 1; i >= 0; i--) {
    if (s[i] === "\n" && i !== s.length - 1) {
      count++;
      if (count >= maxLines) {
        const rest = s.slice(i + 1);
        let hidden = 0;
        for (let j = 0; j <= i; j++) if (s[j] === "\n") hidden++;
        return { text: rest, hidden };
      }
    }
  }
  return { text: s, hidden: 0 };
}
