/**
 * 主题里服务端也要用的部分: 类型, 默认 localStorage 键, 首屏防闪烁脚本.
 * 不写 "use client": Next.js App Router 的 layout (服务端组件) 要能直接拿到 themeScript 这个字符串内联进 <head>.
 */
export type ThemeMode = "light" | "dark" | "system";
export type ThemeAccent = "indigo" | "emerald" | "rose" | "amber" | "zinc";

/** ThemeProvider 默认的 localStorage 键; themeScript 读的也是它. */
export const THEME_STORAGE_KEY = "hx-theme";

/** 内联到 <head> 的首屏脚本, React 挂载前定好亮暗, 避免闪烁. 只认默认的 THEME_STORAGE_KEY. */
export const themeScript = `(()=>{try{var s=JSON.parse(localStorage.getItem("${THEME_STORAGE_KEY}")||"{}");var m=s.mode||"system";var d=m==="dark"||(m==="system"&&matchMedia("(prefers-color-scheme: dark)").matches);var e=document.documentElement;e.classList.toggle("dark",d);e.dataset.theme=s.accent||"indigo";}catch(_){}})()`;
