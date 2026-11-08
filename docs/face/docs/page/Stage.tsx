import { useState, type JSX, type ReactNode } from "react";
import { BUTTON_TYPE, CodeBlock, cn } from "@hx/ui";
import { ICON, ICON_SM, ICON_XS, PHONE_PX, TOOL_BTN, TOOL_GROUP } from "../constants";

export type StageTab = "preview" | "code";
export type Device = "desktop" | "phone";

const TAB = "flex h-8 items-center gap-2 rounded-md px-3 text-[14px] text-muted-foreground transition-colors hover:text-foreground aria-selected:bg-muted aria-selected:text-foreground";
const PHONE: Device = "phone";
const DEVICES: ReadonlyArray<{ id: Device; label: string; icon: string }> = [
  { id: "desktop", label: "桌面宽度", icon: ICON.desktop },
  { id: PHONE, label: "手机宽度", icon: ICON.phone },
];

/** 预览 | 代码页签条, 右侧设备切换与 "复制给 AI". */
export function StageToolbar({
  tab,
  setTab,
  device,
  setDevice,
  onCopyAi,
}: {
  readonly tab: StageTab;
  readonly setTab: (tab: StageTab) => void;
  readonly device: Device;
  readonly setDevice: (device: Device) => void;
  readonly onCopyAi: () => void;
}): JSX.Element {
  return (
    <div className="flex flex-wrap items-center justify-between gap-2">
      <div role="tablist" aria-label="预览或代码" className={TOOL_GROUP}>
        <button type={BUTTON_TYPE} role="tab" aria-selected={tab === "preview"} onClick={() => setTab("preview")} className={TAB}>
          <span aria-hidden className={cn(ICON.eye, ICON_XS)} />
          预览
        </button>
        <button type={BUTTON_TYPE} role="tab" aria-selected={tab === "code"} onClick={() => setTab("code")} className={TAB}>
          <span aria-hidden className={cn(ICON.code, ICON_XS)} />
          代码
        </button>
      </div>
      <div className="flex items-center gap-2">
        <div className={TOOL_GROUP} role="group" aria-label="预览宽度">
          {DEVICES.map((item) => (
            <button
              key={item.id}
              type={BUTTON_TYPE}
              aria-pressed={device === item.id}
              aria-label={item.label}
              title={item.label}
              onClick={() => setDevice(item.id)}
              className={TOOL_BTN}
            >
              <span aria-hidden className={cn(item.icon, ICON_SM)} />
            </button>
          ))}
        </div>
        <button
          type={BUTTON_TYPE}
          onClick={onCopyAi}
          className={cn(TOOL_GROUP, "gap-2 px-3 text-[13.5px] text-muted-foreground transition-colors hover:text-foreground")}
        >
          <span aria-hidden className={cn(ICON.copy, ICON_XS)} />
          复制给 AI
        </button>
      </div>
    </div>
  );
}

/** 预览台: 圆角框, 右上角重播; 手机宽度时内容收进 390px 的框. */
export function StageBox({
  height,
  fill,
  device,
  onReplay,
  children,
}: {
  readonly height: number;
  readonly fill: boolean;
  readonly device: Device;
  readonly onReplay: () => void;
  readonly children: ReactNode;
}): JSX.Element {
  const inner = fill ? "size-full" : "grid size-full place-items-center overflow-hidden p-6 text-center";
  return (
    <div className="relative overflow-hidden rounded-2xl border border-border bg-background" style={{ height }}>
      <div className={cn("mx-auto h-full", device === PHONE && "border-x border-border")} style={device === PHONE ? { width: PHONE_PX, maxWidth: "100%" } : undefined}>
        <div className={inner}>{children}</div>
      </div>
      <button
        type={BUTTON_TYPE}
        aria-label="重播"
        title="重播"
        onClick={onReplay}
        className="absolute top-3 right-3 z-10 grid size-9 place-items-center rounded-lg border border-border bg-card/80 text-muted-foreground backdrop-blur transition-colors hover:text-foreground"
      >
        <span aria-hidden className={cn(ICON.replay, ICON_SM)} />
      </button>
    </div>
  );
}

/** 代码页签: 安装, 用法 (跟随 Customize 的当前值), 组件源码. */
export function CodePane({ install, usage, source, raw }: { install: string; usage: string; source?: string; raw?: string }): JSX.Element {
  const [full, setFull] = useState(false);
  return (
    <div className="flex flex-col gap-4">
      <CodeBlock code={install} lang="bash" title="安装" />
      <CodeBlock code={usage} lang="tsx" title="用法" />
      {raw ? (
        <div className="relative">
          <div className={cn("overflow-hidden rounded-xl", !full && "max-h-[420px]")}>
            <CodeBlock code={raw} lang="tsx" title={source} showLineNumbers />
          </div>
          <button
            type={BUTTON_TYPE}
            onClick={() => setFull((prev) => !prev)}
            className="mx-auto mt-2 flex h-8 items-center gap-1.5 rounded-lg border border-border bg-card px-3 text-[12.5px] text-muted-foreground transition-colors hover:text-foreground"
          >
            {full ? "收起源码" : "展开完整源码"}
          </button>
        </div>
      ) : null}
    </div>
  );
}
