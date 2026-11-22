import * as React from "react";
import { AlignCenter, AlignLeft, AlignRight, Bold, Italic, Underline, LayoutGrid, List } from "lucide-react";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import type { DemoProps } from "../types";

/** 两个真实场景: 编辑器工具栏 (多选) 和视图切换 (单选) */
export default function ToggleDemo({ values }: DemoProps) {
  const [view, setView] = React.useState("grid");
  const variant = values.variant as "default" | "outline";
  const size = values.size as "sm" | "default" | "lg";
  return (
    <div className="grid w-full max-w-md gap-4 rounded-2xl border bg-background/85 p-5 shadow-float backdrop-blur">
      <div className="flex flex-wrap items-center gap-2">
        <ToggleGroup type="multiple" variant={variant} size={size} defaultValue={["bold"]} aria-label="文字样式">
          <ToggleGroupItem value="bold" aria-label="粗体"><Bold /></ToggleGroupItem>
          <ToggleGroupItem value="italic" aria-label="斜体"><Italic /></ToggleGroupItem>
          <ToggleGroupItem value="underline" aria-label="下划线"><Underline /></ToggleGroupItem>
        </ToggleGroup>
        <ToggleGroup type="single" variant={variant} size={size} defaultValue="left" aria-label="对齐">
          <ToggleGroupItem value="left" aria-label="左对齐"><AlignLeft /></ToggleGroupItem>
          <ToggleGroupItem value="center" aria-label="居中"><AlignCenter /></ToggleGroupItem>
          <ToggleGroupItem value="right" aria-label="右对齐"><AlignRight /></ToggleGroupItem>
        </ToggleGroup>
      </div>
      <div className="flex items-center justify-between border-t pt-4">
        <p className="text-sm text-muted-foreground">128 个商品</p>
        <ToggleGroup type="single" variant={variant} size={size} value={view} onValueChange={(v) => v && setView(v)} aria-label="视图">
          <ToggleGroupItem value="grid"><LayoutGrid />{values.labels ? "网格" : <span className="sr-only">网格</span>}</ToggleGroupItem>
          <ToggleGroupItem value="list"><List />{values.labels ? "列表" : <span className="sr-only">列表</span>}</ToggleGroupItem>
        </ToggleGroup>
      </div>
    </div>
  );
}
