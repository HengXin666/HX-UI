"use client";

import * as React from "react";
import { THEME_STORAGE_KEY, type ThemeAccent, type ThemeMode } from "./theme-script";

export type { ThemeAccent, ThemeMode };
/** 兼容 2.0.0 的导入路径; 服务端组件请从 "@hx/ui/theme" 引 (那里的 themeScript 是真正的字符串). */
export { themeScript } from "./theme-script";

interface ThemeState {
  mode: ThemeMode;
  resolved: "light" | "dark";
  accent: ThemeAccent;
  setMode: (mode: ThemeMode) => void;
  setAccent: (accent: ThemeAccent) => void;
}

const STORAGE_KEY = THEME_STORAGE_KEY;
const ThemeContext = React.createContext<ThemeState | null>(null);

function systemDark(): boolean {
  return typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme: dark)").matches;
}

function read(key: string, mode: ThemeMode): { mode: ThemeMode; accent: ThemeAccent } {
  try {
    const raw = localStorage.getItem(key);
    if (raw) return { mode, accent: "indigo", ...JSON.parse(raw) };
  } catch {
    /* 隐私模式下 localStorage 不可用, 用默认值 */
  }
  return { mode, accent: "indigo" };
}

/**
 * 主题: 亮 / 暗 / 跟随系统 + 强调色. 只在 "跟随系统" 档监听系统变化,
 * 手动选定后不再跟随. 首屏防闪烁用 themeScript 内联到 <head>.
 */
export function ThemeProvider({
  children,
  defaultMode = "system",
  storageKey = STORAGE_KEY,
}: {
  children: React.ReactNode;
  /** 用户没选过时的模式 */
  defaultMode?: ThemeMode;
  /** localStorage 键, 同域多个应用互不干扰 */
  storageKey?: string;
}) {
  const [state, setState] = React.useState(() => read(storageKey, defaultMode));
  const [sysDark, setSysDark] = React.useState(systemDark);

  React.useEffect(() => {
    if (state.mode !== "system") return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const on = () => setSysDark(mq.matches);
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, [state.mode]);

  const resolved = state.mode === "system" ? (sysDark ? "dark" : "light") : state.mode;

  React.useEffect(() => {
    const el = document.documentElement;
    el.classList.toggle("dark", resolved === "dark");
    el.dataset.theme = state.accent;
    el.style.colorScheme = resolved;
    localStorage.setItem(storageKey, JSON.stringify(state));
  }, [resolved, state, storageKey]);

  const value = React.useMemo<ThemeState>(
    () => ({
      ...state,
      resolved,
      setMode: (mode) => setState((s) => ({ ...s, mode })),
      setAccent: (accent) => setState((s) => ({ ...s, accent })),
    }),
    [state, resolved],
  );
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeState {
  const ctx = React.useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme 需要包在 <ThemeProvider> 里");
  return ctx;
}

