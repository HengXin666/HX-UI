import type { JSX } from "react";
import { BUTTON_TYPE, DOC } from "@hx/ui";
import type { DocEntry } from "../nav";

/**
 * 上一页 / 下一页: 页面多, 靠侧栏点很累, 顺序阅读时的基本配置.
 * 从 App.tsx 拆出, 让 App.tsx 守住行数棘轮.
 */
export function PageNav({ prev, next, onGo }: { prev?: DocEntry; next?: DocEntry; onGo: (id: string) => void }): JSX.Element {
  return (
    <nav className="mt-14 grid grid-cols-2 gap-3" aria-label="页面导航">
      {prev ? (
        <button
          type={BUTTON_TYPE}
          onClick={() => onGo(prev.id)}
          className="group flex flex-col gap-0.5 rounded-xl border border-border/50 px-4 py-3 text-left transition-colors hover:border-primary/40 hover:bg-card/40"
        >
          <span className={DOC.caption}>上一页</span>
          <span className={DOC.strongLine}>← {prev.label}</span>
        </button>
      ) : <span />}
      {next ? (
        <button
          type={BUTTON_TYPE}
          onClick={() => onGo(next.id)}
          className="group flex flex-col items-end gap-0.5 rounded-xl border border-border/50 px-4 py-3 text-right transition-colors hover:border-primary/40 hover:bg-card/40"
        >
          <span className={DOC.caption}>下一页</span>
          <span className={DOC.strongLine}>{next.label} →</span>
        </button>
      ) : <span />}
    </nav>
  );
}
