import * as React from "react";

export type ThemeMode = "light" | "dark" | "system";
export type ThemeAccent = "indigo" | "emerald" | "rose" | "amber" | "zinc";

interface ThemeState {
  mode: ThemeMode;
  resolved: "light" | "dark";
  accent: ThemeAccent;
  setMode: (mode: ThemeMode) => void;
  setAccent: (accent: ThemeAccent) => void;
}

const STORAGE_KEY = "hx-theme";
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

/** 内联到 <head> 的首屏脚本, React 挂载前定好亮暗, 避免闪烁. */
export const themeScript = `(()=>{try{var s=JSON.parse(localStorage.getItem("${STORAGE_KEY}")||"{}");var m=s.mode||"system";var d=m==="dark"||(m==="system"&&matchMedia("(prefers-color-scheme: dark)").matches);var e=document.documentElement;e.classList.toggle("dark",d);e.dataset.theme=s.accent||"indigo";}catch(_){}})()`;
