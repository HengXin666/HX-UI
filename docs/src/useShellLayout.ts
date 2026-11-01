import { useEffect, useState } from "react";
import { DOC_EVENT } from "@hx/ui";

/** 文档站外壳的布局状态: 宽屏时多留一栏目录, 窄屏抽屉导航可用 Escape 关闭. 单独成文件是为了让 App.tsx 守住行数棘轮. */
export function useShellLayout(): { wide: boolean; mobileNavOpen: boolean; setMobileNavOpen: (open: boolean) => void } {
  const [wide, setWide] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  useEffect(() => {
    if (!mobileNavOpen) return;
    const onEscape = (event: KeyboardEvent): void => {
      if (event.key === DOC_EVENT.escape) setMobileNavOpen(false);
    };
    window.addEventListener(DOC_EVENT.keydown, onEscape);
    return () => window.removeEventListener(DOC_EVENT.keydown, onEscape);
  }, [mobileNavOpen]);

  // 窄屏 (>1280px 才显示右栏) 时给内容多留一点宽度
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1280px)");
    const sync = (): void => setWide(mq.matches);
    sync();
    mq.addEventListener(DOC_EVENT.change, sync);
    return () => mq.removeEventListener(DOC_EVENT.change, sync);
  }, []);

  return { wide, mobileNavOpen, setMobileNavOpen };
}
