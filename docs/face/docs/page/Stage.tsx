import { useState, type JSX, type ReactNode } from "react";
import { BUTTON_TYPE, CodeBlock, TabsList, TabsTrigger, ToggleGroup, ToggleGroupItem, cn, type CodeBlockProps } from "@hx/ui";
import { ICON, ICON_SM, ICON_XS, PHONE_PX, STAGE_FIT, TOOL_BTN, TOOL_GROUP } from "../constants";

export type StageTab = "preview" | "code";
export type Device = "desktop" | "phone";

const TAB = "h-8 gap-2 rounded-md px-3 text-[14px] font-normal text-muted-foreground hover:text-foreground data-[state=active]:bg-muted data-[state=active]:text-foreground data-[state=active]:shadow-none dark:data-[state=active]:bg-muted";
const PHONE: Device = "phone";
const DEVICES: ReadonlyArray<{ id: Device; label: string; icon: string }> = [
  { id: "desktop", label: "桌面宽度", icon: ICON.desktop },
  { id: PHONE, label: "手机宽度", icon: ICON.phone },
];

/**
 * 预览 | 代码页签条 (库 Tabs 的 TabsList, 方向键与 aria-controls 由它给; 外层 Tabs 与两块 TabsContent 在 SpecPage),
 * 右侧设备切换 (库 ToggleGroup 单选) 与 "复制给 AI".
 */
export function StageToolbar({
  device,
  setDevice,
  onCopyAi,
}: {
  readonly device: Device;
  readonly setDevice: (device: Device) => void;
  readonly onCopyAi: () => void;
}): JSX.Element {
  return (
    <div className="flex flex-wrap items-center justify-between gap-2">
      <TabsList variant="pill" aria-label="预览或代码" className={cn(TOOL_GROUP, "rounded-lg border-border bg-muted/30")}>
        <TabsTrigger value="preview" ripple={false} className={TAB}>
          <span aria-hidden className={cn(ICON.eye, ICON_XS)} />
          预览
        </TabsTrigger>
        <TabsTrigger value="code" ripple={false} className={TAB}>
          <span aria-hidden className={cn(ICON.code, ICON_XS)} />
          代码
        </TabsTrigger>
      </TabsList>
      <div className="flex items-center gap-2">
        <ToggleGroup
          type="single"
          spacing={0.5}
          value={device}
          onValueChange={(next) => {
            if (next) setDevice(next as Device);
          }}
          aria-label="预览宽度"
          className={TOOL_GROUP}
        >
          {DEVICES.map((item) => (
            <ToggleGroupItem
              key={item.id}
              value={item.id}
              ripple={false}
              aria-label={item.label}
              title={item.label}
              className={cn(TOOL_BTN, "h-8 min-w-8 border-0 px-0 active:translate-y-0 data-[state=on]:bg-muted data-[state=on]:text-foreground")}
            >
              <span aria-hidden className={cn(item.icon, ICON_SM)} />
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
        <CopyAiButton onClick={onCopyAi} />
      </div>
    </div>
  );
}

/** "复制给 AI": 预览工具栏最右一格; 没有预览的页型 (KindPage) 也放在同一位置. */
export function CopyAiButton({ onClick }: { readonly onClick: () => void }): JSX.Element {
  return (
    <button type={BUTTON_TYPE} onClick={onClick} className={cn(TOOL_GROUP, "gap-2 px-3 text-[13.5px] text-muted-foreground transition-colors hover:text-foreground")}>
      <span aria-hidden className={cn(ICON.copy, ICON_XS)} />
      复制给 AI
    </button>
  );
}

/**
 * 文档页里的代码块: 库 CodeBlock 外包一层 data-doc-code, 门面暗色皮肤 (skin/face.css) 据此把 One Dark 底换成卡面令牌,
 * 与周围的暗色卡同一档; inset 用在卡内 (示例卡展开的代码), 落在卡内嵌板那一档.
 */
export function DocCode({ inset = false, ...props }: CodeBlockProps & { readonly inset?: boolean }): JSX.Element {
  return (
    <div data-doc-code={inset ? "inset" : "card"} className="min-w-0">
      <CodeBlock {...props} />
    </div>
  );
}

/** 预览台: 圆角框, 右上角重播; 手机宽度时内容收进 390px 的框. control 页型传 fit, 高度随内容收缩. */
export function StageBox({
  height,
  fill,
  device,
  onReplay,
  children,
  fit,
}: {
  readonly height: number;
  readonly fill: boolean;
  readonly device: Device;
  readonly onReplay: () => void;
  readonly children: ReactNode;
  /** control 页型: 高度跟内容走, 夹在 min 与 max 之间 (height 不再生效). */
  readonly fit?: { readonly min: number; readonly max: number };
}): JSX.Element {
  const inner = fill ? "size-full" : "grid size-full place-items-center overflow-hidden p-6 text-center";
  const box = fit ? { minHeight: fit.min, maxHeight: fit.max } : { height };
  return (
    <div data-demo className="relative overflow-hidden rounded-2xl border border-border bg-background" style={box}>
      <div className={cn("mx-auto", !fit && "h-full", device === PHONE && "border-x border-border")} style={device === PHONE ? { width: PHONE_PX, maxWidth: "100%" } : undefined}>
        {fit ? (
          <div className="grid place-items-center overflow-hidden px-6 text-center" style={{ minHeight: fit.min, maxHeight: fit.max, paddingBlock: STAGE_FIT.padY }}>
            {children}
          </div>
        ) : (
          <div className={inner}>{children}</div>
        )}
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
      <DocCode code={install} lang="bash" title="安装" />
      <DocCode code={usage} lang="tsx" title="用法" />
      {raw ? (
        <div className="relative">
          <div className={cn("overflow-hidden rounded-xl", !full && "max-h-[420px]")}>
            <DocCode code={raw} lang="tsx" title={source} showLineNumbers />
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
