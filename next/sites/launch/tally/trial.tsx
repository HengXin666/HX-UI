import * as React from "react";

export type TrialIntent = { kind: "trial" | "demo"; plan?: string };

const TrialContext = React.createContext<(intent: TrialIntent) => void>(() => {});

/** 页面里任何按钮都能打开试用 / 演示表单. */
export const useTrial = () => React.useContext(TrialContext);

const loadDialog = () => import("./trial-dialog");
const TrialDialog = React.lazy(loadDialog);

/**
 * 试用 / 演示表单的入口. 弹层代码 (Dialog, 表单, 有状态按钮) 不进首屏:
 * 页面空闲时预取, 第一次点击时一定已经在缓存里.
 */
export function TrialProvider({ children }: { children: React.ReactNode }) {
  const [intent, setIntent] = React.useState<TrialIntent | null>(null);
  const [mounted, setMounted] = React.useState(false);
  // 程序化打开的弹层没有 Trigger, Radix 不知道把焦点还给谁; 自己记住
  const opener = React.useRef<HTMLElement | null>(null);

  React.useEffect(() => {
    const idle = window.requestIdleCallback ?? ((cb: () => void) => window.setTimeout(cb, 1500));
    idle(() => void loadDialog());
  }, []);

  const open = React.useCallback((i: TrialIntent) => {
    opener.current = document.activeElement as HTMLElement | null;
    setMounted(true);
    setIntent(i);
  }, []);

  return (
    <TrialContext.Provider value={open}>
      {children}
      {mounted && (
        <React.Suspense fallback={null}>
          <TrialDialog intent={intent} onClose={() => setIntent(null)} opener={opener} />
        </React.Suspense>
      )}
    </TrialContext.Provider>
  );
}
