/** 对标 shadcn/ui 新增的弹层与菜单类组件共用的类名; 各组件自己的布局类仍写在组件里. */
import { MENU_SEPARATOR_CLASS, SPACE, UI_CLASSES } from "../constants";

/**
 * 弹层进出场: 淡入 + 95% 缩放 + 沿弹出方向滑入 2 个单位, 时长取动效令牌.
 * 令牌在 prefers-reduced-motion 下归零, 因此这里不需要再判断减弱动效.
 *
 * .agents/notes/implemented/feature/2026-10-18-shadcn-parity-components.md
 */
export const POPUP_MOTION = [
	"duration-(--duration-fast) ease-out",
	"data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95",
	"data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95",
	"data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2",
	"data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
].join(SPACE);

/** 浮层面板外观 (与 Popover / DropdownMenu 同一套: popover 底 + 1px 边框). */
export const POPUP_SURFACE = "no-drag z-50 rounded-xl border border-border bg-popover text-popover-foreground shadow-md outline-hidden";

/** 菜单容器. */
export const MENU_CONTENT = "min-w-[10rem] overflow-hidden p-1";

/** 菜单项: 与 DropdownMenuItem 同尺寸, 另支持 data-variant=destructive 与 data-inset. */
export const MENU_ITEM = [
	"relative flex cursor-default select-none items-center gap-2 rounded-lg px-3 py-2 text-[13px] outline-hidden transition-colors",
	"focus:bg-accent/60 data-highlighted:bg-accent/60 data-disabled:pointer-events-none data-disabled:opacity-50",
	"data-[variant=destructive]:text-danger-fg data-[variant=destructive]:focus:bg-danger/10 data-[inset]:pl-8",
	UI_CLASSES.svgSlot,
].join(SPACE);

/** 勾选 / 单选菜单项: 左侧留出指示位. */
export const MENU_CHECK_ITEM = "pl-8";

/** 菜单项左侧的勾选指示位. */
export const MENU_INDICATOR = "pointer-events-none absolute left-2.5 flex size-3.5 items-center justify-center text-link";

/** 菜单内分组标题. */
export const MENU_LABEL = "px-3 pb-1 pt-2 text-[11px] font-medium text-muted-foreground data-[inset]:pl-8";

/** 菜单内分隔线. */
export const MENU_SEPARATOR = MENU_SEPARATOR_CLASS;

/** 菜单项右侧的快捷键提示. */
export const MENU_SHORTCUT = "ml-auto pl-4 font-mono text-[11px] tracking-widest text-muted-foreground";

/** 子菜单触发项展开时保持高亮. */
export const MENU_SUB_OPEN = "data-[state=open]:bg-accent/60";

/**
 * 模态遮罩: 页面底色半透明加轻微模糊, 不用黑色原色 (PROJECT-UI-BW), 换肤时跟着走.
 */
export const MODAL_OVERLAY = [
	"no-drag fixed inset-0 z-50 bg-background/60 supports-backdrop-filter:backdrop-blur-xs",
	"duration-(--duration-base) data-open:animate-in data-open:fade-in-0 data-closed:animate-out data-closed:fade-out-0",
].join(SPACE);

/** 模态面板的进出场: 淡入 + 缩放, 退出用 ease-in. */
export const MODAL_MOTION = [
	"duration-(--duration-base) ease-out data-closed:ease-in",
	"data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95",
	"data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95",
].join(SPACE);

/** 可聚焦控件的焦点环: 1px 边框转 ring 色, 不加粗 (PROJECT-UI-LINE-1PX). */
export const FOCUS_RING = "outline-none focus-visible:border-ring focus-visible:ring-1 focus-visible:ring-ring/50";

/** 输入类控件外框: 与 Input 同一套边框反馈. */
export const FIELD_FRAME = [
	"rounded-lg border border-border/60 bg-transparent shadow-none transition-[border-color,background-color] duration-(--duration-fast)",
	"hover:border-border dark:bg-input/20",
].join(SPACE);
