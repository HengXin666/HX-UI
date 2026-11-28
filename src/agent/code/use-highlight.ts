"use client";
import * as React from "react";
import { highlight, type CodeThemePair, type HighlightResult, type HighlightToken } from "./highlight";

/** 流式中两次高亮的最小间隔: 每个 token 都跑一遍完整 shiki 会卡 */
export const STREAM_HIGHLIGHT_MS = 120;

export interface HighlightedLine {
  text: string;
  /** null = 还没高亮到这一行 (先画纯文本) */
  tokens: HighlightToken[] | null;
}

/**
 * 代码 -> 逐行的高亮结果.
 * - 完整代码: 立即高亮.
 * - 流式 (incomplete): 按 STREAM_HIGHLIGHT_MS 节流; 两次之间, 内容没变的行复用上一次的 token,
 *   新来的行先画纯文本, 所以已经写完的行颜色不会闪.
 * - 语言名还是半截 (```t) 时这次高亮失败, 不留失败态: 语言变了就重来.
 */
export function useHighlight(code: string, lang: string, themes: CodeThemePair, incomplete = false): { lines: HighlightedLine[]; result: HighlightResult | null } {
  const [result, setResult] = React.useState<HighlightResult | null>(null);
  const [source, setSource] = React.useState<{ code: string; lang: string } | null>(null);
  const pending = React.useRef<number | null>(null);
  const last = React.useRef(0);
  const themeKey = `${themes.light}|${themes.dark}`;

  React.useEffect(() => {
    let alive = true;
    const run = () => {
      pending.current = null;
      last.current = performance.now();
      void highlight(code, lang, themes).then((r) => {
        if (!alive) return;
        setResult(r);
        setSource({ code, lang });
      });
    };
    if (!incomplete) run();
    else {
      const wait = Math.max(0, STREAM_HIGHLIGHT_MS - (performance.now() - last.current));
      pending.current = window.setTimeout(run, wait);
    }
    return () => {
      alive = false;
      if (pending.current != null) window.clearTimeout(pending.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- themes 按 themeKey 比较
  }, [code, lang, themeKey, incomplete]);

  const lines = React.useMemo(() => {
    const texts = code.split("\n");
    const hl = result && source && source.lang === lang ? result.lines : null;
    const old = source ? source.code.split("\n") : [];
    return texts.map((text, i) => ({ text, tokens: hl && old[i] === text && hl[i] ? hl[i] : null }));
  }, [code, lang, result, source]);

  return { lines, result: source?.lang === lang ? result : null };
}
