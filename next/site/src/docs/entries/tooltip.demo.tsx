import { Bold, Italic, Link2, Undo2, Redo2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Kbd } from "@/components/ui/kbd";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import type { DemoProps } from "../types";

const TOOLS = [
  { icon: Undo2, label: "撤销", key: "⌘Z" },
  { icon: Redo2, label: "重做", key: "⇧⌘Z" },
  { icon: Bold, label: "粗体", key: "⌘B" },
  { icon: Italic, label: "斜体", key: "⌘I" },
  { icon: Link2, label: "插入链接", key: "⌘K" },
];

/** 真实场景: 编辑器工具栏. 只有图标的按钮, 悬停或键盘聚焦时说明它是什么、快捷键是什么 */
export default function TooltipDemo({ values }: DemoProps) {
  return (
    <TooltipProvider delayDuration={Number(values.delay)}>
      <div className="flex items-center gap-1 rounded-xl border bg-background/85 p-1.5 shadow-float backdrop-blur" role="toolbar" aria-label="格式">
        {TOOLS.map((t) => (
          <Tooltip key={t.label}>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" aria-label={t.label}><t.icon /></Button>
            </TooltipTrigger>
            <TooltipContent side={values.side as "top"}>
              {t.label}{values.shortcut ? <Kbd className="ml-1">{t.key}</Kbd> : null}
            </TooltipContent>
          </Tooltip>
        ))}
      </div>
    </TooltipProvider>
  );
}
