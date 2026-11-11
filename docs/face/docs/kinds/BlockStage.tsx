import { useState, type JSX, type ReactNode } from "react";
import { SKIN_ATTR, SKIN_LIST, SegmentedControl, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, cn } from "@hx/ui";
import { CARD, INSET } from "../constants";

/** 区块舞台的两档宽: 桌面 1440 与手机 390. */
const WIDTHS = [
  { key: "1440", label: "1440" },
  { key: "390", label: "390" },
] as const;
type Width = (typeof WIDTHS)[number]["key"];
const DEFAULT_SKIN = SKIN_LIST[0]?.name ?? "";

/**
 * block 页型的舞台: 内容按选定宽度 (1440 / 390) 排版, 舞台本身铺满中栏, 宽于中栏时在舞台内横滚,
 * 页面不横向溢出; 皮肤选择写到舞台根的皮肤属性上, 只影响舞台里的内容.
 */
export function BlockStage({ children }: { readonly children: ReactNode }): JSX.Element {
  const [width, setWidth] = useState<Width>("1440");
  const [skin, setSkin] = useState<string>(DEFAULT_SKIN);
  return (
    <div className={cn(CARD, "flex flex-col")}>
      <div className="flex flex-wrap items-center justify-between gap-3 px-3 pt-3">
        <SegmentedControl items={[...WIDTHS]} value={width} onChange={setWidth} aria-label="舞台宽度" />
        <Select value={skin} onValueChange={setSkin}>
          <SelectTrigger aria-label="皮肤" className="h-9 w-[160px] text-[13px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {SKIN_LIST.map((item) => (
              <SelectItem key={item.name} value={item.name}>
                {item.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className={cn(INSET, "overflow-x-auto")}>
        <div data-stage-width={width} {...{ [SKIN_ATTR.skin]: skin }} style={{ width: `${width}px` }} className="mx-auto max-w-none bg-background p-4 text-foreground">
          {children}
        </div>
      </div>
    </div>
  );
}
