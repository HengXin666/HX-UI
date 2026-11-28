import { Kbd, KbdGroup } from "@/components/ui/kbd";
import type { DemoProps } from "../types";

const KEYS: [string, string[], string[]][] = [
  ["打开命令面板", ["⌘", "K"], ["Ctrl", "K"]],
  ["新建项目", ["⌘", "N"], ["Ctrl", "N"]],
  ["保存", ["⌘", "S"], ["Ctrl", "S"]],
  ["切换侧栏", ["⌘", "\\"], ["Ctrl", "\\"]],
  ["搜索", ["/"], ["/"]],
];

/** 真实场景: 设置页的快捷键列表 */
export default function KbdDemo({ values }: DemoProps) {
  const mac = values.platform === "mac";
  return (
    <div className="w-full max-w-sm rounded-2xl border bg-background/85 p-5 shadow-float backdrop-blur">
      <p className="mb-3 font-medium">快捷键</p>
      <dl className="divide-y text-sm">
        {KEYS.map(([label, m, w]) => (
          <div key={label} className="flex items-center justify-between py-2.5">
            <dt className="text-muted-foreground">{label}</dt>
            <dd>
              <KbdGroup>
                {(mac ? m : w).map((k, i) => (
                  <span key={k + i} className="contents">
                    {i > 0 && values.plus ? <span aria-hidden className="text-xs text-muted-foreground">+</span> : null}
                    <Kbd>{k}</Kbd>
                  </span>
                ))}
              </KbdGroup>
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
