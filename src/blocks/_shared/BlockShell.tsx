"use client";

import { motion, type Variants } from "motion/react";
import * as React from "react";
import {
  BLOCK_ATTR,
  BLOCK_BACKDROP,
  BLOCK_CLASS,
  BLOCK_DEFAULT,
  BLOCK_PAD_CLASS,
  BLOCK_REVEAL,
  BLOCK_SLOT,
  BLOCK_TONE_CLASS,
  BLOCK_TONE_MERGE_CLASS,
  BLOCK_WIDTH,
  BLOCK_WIDTH_CLASS,
} from "../../constants/blocks";
import { MOTION_PRESET_NAME, MOTION_STATE, REVEAL_VIEWPORT, STAGGER_GAP_S } from "../../constants/motion";
import { Backdrop } from "../../effects/Backdrop";
import { presetVariants, useMotionTokens } from "../../motion/presets";
import { cn } from "../../primitives/utils";
import { useBlocks } from "./BlocksProvider";
import type { BackdropSpec, BlockBaseProps, BlockShellState, BlockTone, SectionHeadingData, SlotClassNames, SlotStyles } from "./types";

/** 把对象或函数形态的 classNames / styles 解析成对象 (component-contract 4.1). */
export function resolveSlots<S extends string, State, V>(
  value: Partial<Record<S, V>> | ((state: State) => Partial<Record<S, V>>) | undefined,
  state: State,
): Partial<Record<S, V>> {
  if (!value) return {};
  return typeof value === "function" ? value(state) : value;
}

/** 区块外壳读写的公开上下文: 子组件 (SectionHeading) 据此对齐, 并拿到 aria-labelledby 的标题 id. */
export interface BlockShellContextValue extends BlockShellState {
  headingId: string;
}
const BlockShellContext = React.createContext<BlockShellContextValue | null>(null);

/** 读最近的 BlockShell 状态; 外壳之外返回 null. */
export function useBlockShell(): BlockShellContextValue | null {
  return React.useContext(BlockShellContext);
}

export interface BlockShellProps extends Omit<BlockBaseProps, "labels"> {
  /** 由外壳渲染的标题组: 提供后 section 以标题作可访问名称 (aria-labelledby). */
  heading?: SectionHeadingData;
  /** heading 的渲染器 (由调用方传 SectionHeading, 避免外壳与标题互相 import). */
  renderHeading?: (heading: SectionHeadingData, id: string) => React.ReactNode;
  ref?: React.Ref<HTMLElement>;
  children?: React.ReactNode;
}

function isBackdropSpec(value: unknown): value is BackdropSpec {
  return typeof value === "object" && value !== null && !React.isValidElement(value) && "variant" in value;
}

/** 背景层: 节点直接垫底; grid/dots/aurora 走 effects/Backdrop; 其余走 BlocksProvider 注入. */
function BackdropLayer({ backdrop, tone, className, style }: { backdrop: BlockBaseProps["backdrop"]; tone: BlockTone; className?: string; style?: React.CSSProperties }): React.JSX.Element | null {
  const { backdrops } = useBlocks();
  if (backdrop === undefined || backdrop === null || backdrop === false) return null;
  let layer: React.ReactNode = backdrop as React.ReactNode;
  if (isBackdropSpec(backdrop)) {
    const v = backdrop.variant;
    const Injected = backdrops[v];
    if (Injected) layer = <Injected spec={backdrop} tone={tone} />;
    else if (v === BLOCK_BACKDROP.grid || v === BLOCK_BACKDROP.dots || v === BLOCK_BACKDROP.aurora) {
      layer = <Backdrop aria-hidden variant={v} fade={backdrop.mask !== undefined} className="absolute inset-0" />;
    } else layer = null; // TODO(V0 effects): mesh / grain / beam / image 原语落地后在此内置, 目前需经 BlocksProvider.backdrops 注入.
  }
  if (!layer) return null;
  return (
    <div aria-hidden data-slot={BLOCK_SLOT.shellBackdrop} className={cn(BLOCK_CLASS.backdrop, className)} style={style}>
      {layer}
    </div>
  );
}

/** 入场编排变体. TODO(V0 motion/orchestration): ORCHESTRATION 预设落地后改为读取它. */
function useRevealVariants(reveal: BlockBaseProps["reveal"]): Variants | undefined {
  const { tokens, reduced } = useMotionTokens();
  if (!reveal) return undefined;
  if (reveal === BLOCK_REVEAL.stagger) {
    const gap = reduced ? 0 : STAGGER_GAP_S;
    return { hidden: {}, visible: { transition: { staggerChildren: gap } } };
  }
  const preset = reveal === BLOCK_REVEAL.rise ? MOTION_PRESET_NAME.fadeUp : MOTION_PRESET_NAME.fade;
  return presetVariants(preset, tokens, { reduced });
}

/**
 * 区块外壳: 统一 tone, 纵向留白, 内容宽度, 对齐, 入场编排, 背景层与锚点.
 * 输出 data-block-tone / data-block-pad, 相邻同 tone 的区块由 CSS 兄弟选择器合并留白 (无 JS 测量).
 * reveal="stagger" 时内容层只下发 hidden/visible, 区块用 motion 的 StaggerItem 包子项.
 * ref 作为普通 prop 指向根元素 (React 19, component-contract 6.1), 不使用 forwardRef.
 *
 * .agents/notes/implemented/feature/2026-11-02-blocks-shared-base.md
 */
export function BlockShell({
  id,
  className,
  style,
  classNames,
  styles,
  tone = BLOCK_DEFAULT.tone,
  pad = BLOCK_DEFAULT.pad,
  width = BLOCK_DEFAULT.width,
  align = BLOCK_DEFAULT.align,
  reveal = false,
  backdrop,
  as = BLOCK_DEFAULT.tag,
  slots,
  heading,
  renderHeading,
  ref,
  children,
  "aria-label": ariaLabel,
  "aria-labelledby": ariaLabelledBy,
}: BlockShellProps): React.JSX.Element {
  const headingId = React.useId();
  const state: BlockShellState = { tone, pad, width, align };
  const cls = resolveSlots<string, BlockShellState, string>(classNames as SlotClassNames<string, BlockShellState>, state);
  const sty = resolveSlots<string, BlockShellState, React.CSSProperties>(styles as SlotStyles<string, BlockShellState>, state);
  const variants = useRevealVariants(reveal);
  const context = React.useMemo(() => ({ tone, pad, width, align, headingId }), [tone, pad, width, align, headingId]);
  const Root = as as React.ElementType;
  const showHeading = heading !== undefined && renderHeading !== undefined;
  const labelledBy = ariaLabelledBy ?? (showHeading && ariaLabel === undefined ? headingId : undefined);
  const contentClass = cn(BLOCK_CLASS.contentQuery, align === "center" ? BLOCK_CLASS.alignCenter : BLOCK_CLASS.alignStart, cls.content);
  const content = (
    <>
      {showHeading && renderHeading(heading, headingId)}
      {slots?.before}
      {children}
      {slots?.after}
    </>
  );
  const attrs = { [BLOCK_ATTR.width]: width, [BLOCK_ATTR.align]: align, [BLOCK_ATTR.reveal]: reveal || undefined };
  return (
    <BlockShellContext.Provider value={context}>
      <Root
        ref={ref}
        id={id}
        aria-label={ariaLabel}
        aria-labelledby={labelledBy}
        data-slot={BLOCK_SLOT.shell}
        data-block-tone={tone}
        data-block-pad={pad}
        {...attrs}
        className={cn(BLOCK_CLASS.host, "w-full", BLOCK_TONE_CLASS[tone], BLOCK_PAD_CLASS[pad], BLOCK_TONE_MERGE_CLASS[tone], cls.root, className)}
        style={{ ...sty.root, ...style }}
      >
        <BackdropLayer backdrop={backdrop} tone={tone} className={cls.backdrop} style={sty.backdrop} />
        <div
          data-slot={BLOCK_SLOT.shellContainer}
          className={cn(BLOCK_CLASS.container, width !== BLOCK_WIDTH.bleed && BLOCK_CLASS.gutter, BLOCK_WIDTH_CLASS[width], cls.container)}
          style={sty.container}
        >
          {variants ? (
            <motion.div
              data-slot={BLOCK_SLOT.shellContent}
              className={contentClass}
              style={sty.content}
              variants={variants}
              initial={MOTION_STATE.hidden}
              whileInView={MOTION_STATE.visible}
              viewport={{ once: true, amount: REVEAL_VIEWPORT.amount, margin: REVEAL_VIEWPORT.margin }}
            >
              {content}
            </motion.div>
          ) : (
            <div data-slot={BLOCK_SLOT.shellContent} className={contentClass} style={sty.content}>
              {content}
            </div>
          )}
        </div>
      </Root>
    </BlockShellContext.Provider>
  );
}
