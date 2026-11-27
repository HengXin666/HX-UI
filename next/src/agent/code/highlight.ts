/**
 * Shiki 高亮的懒加载单例.
 * - 第一次需要高亮时才 import shiki (core + JS 正则引擎, 不加载 wasm), 语言和主题再按需各自加载
 * - 亮暗两套主题一次出: token 带 --shiki-light / --shiki-dark 两个变量, 切主题不用重新高亮
 * - 结果按 (语言, 主题对, 代码) 缓存一小批, 同一段代码在多处出现 (历史消息重挂) 不重复算
 */
import type { HighlighterCore, ThemedToken } from "shiki/core";

export type CodeThemePair = { light: string; dark: string };

/** 默认: 博客同款 One Dark Pro; 亮色下也用它 (代码块是一块深色面板) */
export const ONE_DARK: CodeThemePair = { light: "one-dark-pro", dark: "one-dark-pro" };
/** 跟随亮暗: 亮色 One Light, 暗色 One Dark Pro */
export const ONE_AUTO: CodeThemePair = { light: "one-light", dark: "one-dark-pro" };

export interface HighlightToken {
  content: string;
  /** 两个主题的颜色变量, 直接当 style 用 */
  style?: Record<string, string>;
  fontStyle?: number;
}
export interface HighlightResult {
  lang: string;
  lines: HighlightToken[][];
  /** 两个主题下的前景 / 背景 */
  fg: { light: string; dark: string };
  bg: { light: string; dark: string };
}

let core: Promise<HighlighterCore> | null = null;
const loadedLangs = new Map<string, Promise<boolean>>();
const loadedThemes = new Map<string, Promise<boolean>>();
const cache = new Map<string, HighlightResult>();
const CACHE_MAX = 200;

function getCore(): Promise<HighlighterCore> {
  core ??= (async () => {
    const [{ createHighlighterCore }, { createJavaScriptRegexEngine }] = await Promise.all([import("shiki/core"), import("shiki/engine/javascript")]);
    return createHighlighterCore({ themes: [], langs: [], engine: createJavaScriptRegexEngine({ forgiving: true }) });
  })();
  return core;
}

async function ensureTheme(h: HighlighterCore, id: string): Promise<boolean> {
  let p = loadedThemes.get(id);
  if (!p) {
    p = (async () => {
      const { bundledThemes } = await import("shiki/themes");
      const load = (bundledThemes as Record<string, () => Promise<{ default: unknown }>>)[id];
      if (!load) return false;
      await h.loadTheme((await load()).default as never);
      return true;
    })().catch(() => false);
    loadedThemes.set(id, p);
  }
  return p;
}

/** 语言能否高亮 (加载失败或不认识就按纯文本) */
async function ensureLang(h: HighlighterCore, id: string): Promise<string | null> {
  if (id === "plaintext" || id === "") return null;
  let p = loadedLangs.get(id);
  if (!p) {
    p = (async () => {
      const { bundledLanguages, bundledLanguagesAlias } = await import("shiki/langs");
      const table = { ...bundledLanguagesAlias, ...bundledLanguages } as Record<string, () => Promise<{ default: unknown }>>;
      const load = table[id];
      if (!load) return false;
      await h.loadLanguage((await load()).default as never);
      return true;
    })().catch(() => false);
    loadedLangs.set(id, p);
  }
  return (await p) ? id : null;
}

function toResult(lang: string, tokens: ThemedToken[][], fg: string | undefined, bg: string | undefined, rootStyle: string | false | undefined): HighlightResult {
  const vars = parseStyle(typeof rootStyle === "string" ? rootStyle : "");
  return {
    lang,
    lines: tokens.map((line) => line.map((t) => ({ content: t.content, style: t.htmlStyle as Record<string, string> | undefined, fontStyle: t.fontStyle }))),
    fg: { light: vars["--shiki-light"] ?? fg ?? "", dark: vars["--shiki-dark"] ?? fg ?? "" },
    bg: { light: vars["--shiki-light-bg"] ?? bg ?? "", dark: vars["--shiki-dark-bg"] ?? bg ?? "" },
  };
}

function parseStyle(s: string): Record<string, string> {
  const out: Record<string, string> = {};
  for (const part of s.split(";")) {
    const i = part.indexOf(":");
    if (i > 0) out[part.slice(0, i).trim()] = part.slice(i + 1).trim();
  }
  return out;
}

/** 高亮一段代码; 语言不认识时返回 null (调用方按纯文本画) */
export async function highlight(code: string, lang: string, themes: CodeThemePair = ONE_DARK): Promise<HighlightResult | null> {
  const key = `${lang}\u0000${themes.light}\u0000${themes.dark}\u0000${code}`;
  const hit = cache.get(key);
  if (hit) return hit;
  const h = await getCore();
  const [okLang] = await Promise.all([ensureLang(h, lang), ensureTheme(h, themes.light), ensureTheme(h, themes.dark)]);
  if (!okLang) return null;
  const r = h.codeToTokens(code, { lang: okLang, themes: { light: themes.light, dark: themes.dark }, defaultColor: false });
  const res = toResult(okLang, r.tokens, r.fg, r.bg, r.rootStyle);
  if (cache.size >= CACHE_MAX) cache.delete(cache.keys().next().value as string);
  cache.set(key, res);
  return res;
}

/** 预热: 页面空闲时先把引擎和主题拉下来, 第一个代码块就不用等 */
export function preloadHighlighter(themes: CodeThemePair = ONE_DARK, langs: string[] = []): void {
  void getCore().then((h) => Promise.all([ensureTheme(h, themes.light), ensureTheme(h, themes.dark), ...langs.map((l) => ensureLang(h, l))]));
}
