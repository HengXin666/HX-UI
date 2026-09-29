import { useCallback, useEffect, useState, type JSX } from "react";
import { Button, TooltipHint } from "@hx/ui";

/**
 * 主题切换。
 *
 * ## 为什么必须做在全局, 而不是像原来那样只放在「设计令牌」页里
 *
 * 令牌页里那个开关只能改**那一页**的 `document.documentElement` —— 离开页面就没人
 * 再管它, 而且没人会为了看一个组件在亮色下的样子先跳到令牌页去点一下。
 * 实测 38 个页面里只有 1 页有开关, 其余 37 页的亮色效果等于没被看过。
 *
 * ## 三条实现上的要求
 *
 *   一、**首屏之前就要定下来**, 否则暗色默认下会先闪一下亮色 (FOUC)。
 *       所以初始值由 main.tsx 里的内联脚本写进 `data-mode`, 这里只读不写。
 *   二、**跟随系统**是一个独立档位 (而不是"没设置时的默认"), 三态循环:
 *       跟随系统 → 亮 → 暗 → 跟随系统。
 *       只在"跟随系统"档位监听 `prefers-color-scheme` 变化, 手动选定后不再跟随 ——
 *       否则用户手动选了亮色、系统入夜, 界面会自己变暗, 那是 bug 不是特性。
 *   三、切换时给根元素加 `theme-transitioning`, 让颜色过渡 180ms。
 *       库的 tokens.css 里已经有这条规则 (只过渡颜色类属性, 不碰 transform/opacity)。
 *       不加的话是硬切, 在整屏深色/浅色之间跳变会刺眼。
 */
const STORAGE_KEY = "hx-ui-docs-theme";
export type ThemeMode = "system" | "light" | "dark";

function systemMode(): "light" | "dark" {
  return window.matchMedia?.("(prefers-color-scheme: light)").matches ? "light" : "dark";
}

/** 把模式落到 DOM。system 档位解析成实际明暗。 */
export function applyMode(mode: ThemeMode): void {
  const resolved = mode === "system" ? systemMode() : mode;
  const root = document.documentElement;
  root.setAttribute("data-mode", resolved);
  root.classList.add("theme-transitioning");
  window.setTimeout(() => root.classList.remove("theme-transitioning"), 200);
}

function readMode(): ThemeMode {
  const saved = localStorage.getItem(STORAGE_KEY);
  return saved === "light" || saved === "dark" || saved === "system" ? saved : "system";
}

const ICON: Record<ThemeMode, string> = {
  system: "icon-[solar--monitor-linear]",
  light: "icon-[solar--sun-linear]",
  dark: "icon-[solar--moon-linear]",
};
const LABEL: Record<ThemeMode, string> = {
  system: "跟随系统",
  light: "亮色",
  dark: "暗色",
};

export function ThemeToggle(): JSX.Element {
  const [mode, setMode] = useState<ThemeMode>(readMode);

  // system 档位要跟随系统变化实时切换; 手动选定后不再跟随
  // (用户手动选了亮色、系统入夜时界面自己变暗 —— 那是 bug 不是特性)
  useEffect(() => {
    if (mode !== "system") return;
    const mq = window.matchMedia("(prefers-color-scheme: light)");
    const onChange = (): void => applyMode("system");
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, [mode]);

  /**
   * 三态循环。
   *
   * setMode 只算状态, 副作用 (落盘 + 改 DOM) 放在下面那个由 mode 驱动的 useEffect 里。
   *
   * 关于"为什么不能把副作用写进 updater": 那确实是不纯的 updater, React 文档明确不建议,
   * 而且 StrictMode 在**开发模式**会故意双调用它以暴露该问题 (localStorage 写两次、
   * applyMode 跑两次)。
   *
   * 但要如实说明: 我一开始把这个改动的理由写成了"修一个真 bug", 那是**错的**。
   * 当时观察到的"DOM 已变亮色但按钮标签仍停在跟随系统", 实际是我的探针在 click() 之后
   * **同一次事件循环里立刻读值**造成的 —— React 18 会把同一 tick 的多次 setState 批处理,
   * 探针读到的是提交前的旧值。用"等一次提交再读"的探针复测后, 原始写法在生产构建下
   * 表现完全正常 (scripts/check-shell.mjs 的负样本验证: 把副作用搬回 updater, 检查依然通过)。
   * 所以这是一次**代码规范修正, 不是缺陷修复**; 保留它是因为不纯 updater 迟早会在
   * 开发模式下产生真实困扰, 但不应被记为"修了 bug"。
   */
  const cycle = useCallback(() => {
    setMode((prev) => (prev === "system" ? "light" : prev === "light" ? "dark" : "system"));
  }, []);

  // 唯一一处副作用: mode 变了才落盘与改 DOM。
  // 首屏也走这里 (mode 初值来自 localStorage), 因此不存在"挂载后不生效"的窗口。
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, mode);
    applyMode(mode);
  }, [mode]);

  return (
    <TooltipHint label={`主题: ${LABEL[mode]} (点击切换)`} side="bottom">
      <Button variant="ghost" size="icon-sm" onClick={cycle} aria-label={"主题: " + LABEL[mode]}>
        <span aria-hidden className={`${ICON[mode]} size-3.5 bg-current`} />
      </Button>
    </TooltipHint>
  );
}

/**
 * 首屏防闪烁脚本。由 main.tsx 在 React 挂载**之前**注入。
 *
 * 不做这一步的后果: 默认 data-mode 是暗色 (tokens.css 的 :root), 用户选了亮色时,
 * 页面会先以暗色绘制一帧再跳成亮色 —— 整屏闪一下。
 */
export const THEME_BOOT_SCRIPT = `(function(){try{var m=localStorage.getItem("${STORAGE_KEY}")||"system";if(m==="system"){m=window.matchMedia("(prefers-color-scheme: light)").matches?"light":"dark";}document.documentElement.setAttribute("data-mode",m);}catch(e){}})();`;