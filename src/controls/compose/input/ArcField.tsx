"use client";
// 行为规格参照 docs/research/catalog/components-1.md 的 CurvedInput 条目, 实现为 HX 自有.

import { useId, useLayoutEffect, useRef, useState, type ChangeEvent, type JSX, type KeyboardEvent, type ReactNode, type SyntheticEvent } from "react";
import { FOCUS_RING, PRESS_SCALE } from "../../../craft/tokens";
import { useReducedMotion } from "../../../hooks/browser/media/useReducedMotion";
import { cn } from "../../../primitives/utils";
import { BUTTON_TYPE, COMPOSE_EASE_OUT, CSS_PROP, HALF, NONE, PRESS_MS, colorVar, transitionOf, type HxColor } from "../tokens";
import { ARC_CHAR_EM, ARC_DEFAULTS, ARC_GAP, ARC_INSET, ARC_MS, ARC_PAD_X, arcAngle, arcMeanSag, arcOutline, arcSag, arcSelectable, arcShadow, arcSlice, type ArcShadow } from "./parts/arc-geometry";

export { ARC_DEG, ARC_SHADOWS, arcAngle, arcMeanSag, arcOutline, arcSag, arcSlice, arcSlope, type ArcShadow } from "./parts/arc-geometry";

/** 外框线宽. 规格默认 1.5, 本库线条一律 1px. */
const STROKE = 1;
const LINE_EM = 1.6;
/** 画出的光标半高, 以字号计. */
const CARET_EM = 0.6;
const CARET_BLINK = "1.06s";
const KEY_ENTER = "Enter";

export interface ArcFieldProps {
  readonly value?: string;
  readonly defaultValue?: string;
  readonly onChange?: (value: string) => void;
  /** Enter 或点按钮提交 (输入法组字时不提交). */
  readonly onSubmit?: (value: string) => void;
  readonly placeholder?: string;
  /** 按钮文字; 给 null 不画按钮. */
  readonly buttonText?: ReactNode;
  /** 按钮里文字右侧的图标. */
  readonly icon?: ReactNode;
  readonly type?: string;
  readonly name?: string;
  readonly ariaLabel?: string;
  readonly width?: number;
  /** 中点相对两端下垂的像素, 负值上拱. */
  readonly bend?: number;
  readonly height?: number;
  readonly cornerRadius?: number;
  readonly fontSize?: number;
  readonly surfaceColor?: HxColor;
  readonly textColor?: HxColor;
  readonly placeholderColor?: HxColor;
  readonly borderColor?: HxColor;
  readonly buttonColor?: HxColor;
  readonly buttonTextColor?: HxColor;
  readonly shadowSize?: ArcShadow;
  readonly disabled?: boolean;
  readonly className?: string;
}

interface Caret {
  readonly x: number;
  readonly y: number;
  readonly angle: number;
}

/**
 * 弯曲的单行输入框: 外框, 文字与按钮沿同一条下垂曲线排布.
 * 文字沿曲线显示; 光标不在末尾, 有选区或文字超出曲线长度时, 换回原生直排以便编辑, 交替淡入淡出.
 *
 * .agents/notes/implemented/feature/2026-11-08-controls-compose.md
 */
export function ArcField({
  value,
  defaultValue = "",
  onChange,
  onSubmit,
  placeholder = "Enter your email",
  buttonText = "Get Started",
  icon = null,
  type = "email",
  name,
  ariaLabel,
  width = ARC_DEFAULTS.width,
  bend = ARC_DEFAULTS.bend,
  height = ARC_DEFAULTS.height,
  cornerRadius = ARC_DEFAULTS.cornerRadius,
  fontSize = ARC_DEFAULTS.fontSize,
  surfaceColor = "card",
  textColor = "foreground",
  placeholderColor = "muted-foreground",
  borderColor = "border",
  buttonColor = "primary",
  buttonTextColor = "primary-foreground",
  shadowSize = "md",
  disabled = false,
  className,
}: ArcFieldProps): JSX.Element {
  const reduced = useReducedMotion();
  const pathId = `arc-${useId().replace(/[^a-zA-Z0-9-]/g, "")}`;
  const [own, setOwn] = useState(defaultValue);
  const text = value ?? own;
  const [focused, setFocused] = useState(false);
  const [atEnd, setAtEnd] = useState(true);
  const [overflow, setOverflow] = useState(false);
  const [pressed, setPressed] = useState(false);
  const [caret, setCaret] = useState<Caret | null>(null);
  const hasButton = buttonText !== null && buttonText !== undefined && buttonText !== false;
  const estimate = hasButton ? String(typeof buttonText === "string" ? buttonText : "").length * fontSize * ARC_CHAR_EM + ARC_PAD_X * HALF : 0;
  const [buttonWidth, setButtonWidth] = useState(estimate);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const pathRef = useRef<SVGPathElement>(null);
  const textRef = useRef<SVGTextElement>(null);

  const total = height + Math.max(0, bend);
  const lift = Math.max(0, -bend);
  const mid = height / HALF + lift;
  const cx = width - ARC_INSET - buttonWidth / HALF;
  const textEnd = hasButton ? cx - buttonWidth / HALF - ARC_GAP : width - ARC_PAD_X;
  const lineHeight = fontSize * LINE_EM;
  const caretHalf = fontSize * CARET_EM;
  const straight = focused && (!atEnd || overflow);

  useLayoutEffect(() => {
    if (hasButton && buttonRef.current) setButtonWidth(buttonRef.current.offsetWidth || estimate);
  }, [buttonText, fontSize, hasButton, estimate]);

  useLayoutEffect(() => {
    const path = pathRef.current;
    const node = textRef.current;
    if (!path || !node || typeof path.getTotalLength !== "function" || typeof node.getComputedTextLength !== "function") {
      setCaret(null);
      return;
    }
    const length = text ? node.getComputedTextLength() : 0;
    const room = path.getTotalLength();
    setOverflow(length > room);
    const at = Math.min(length, room);
    const point = path.getPointAtLength(at);
    setCaret({ x: point.x, y: point.y, angle: arcAngle(point.x, width, bend) });
  }, [text, width, bend, fontSize, textEnd]);

  const syncCaret = (event: SyntheticEvent<HTMLInputElement>, moved: boolean): void => {
    const el = event.currentTarget;
    if (arcSelectable(type) && el.selectionStart !== null) setAtEnd(el.selectionStart === el.selectionEnd && el.selectionEnd === el.value.length);
    else if (moved) setAtEnd(false);
  };

  const setText = (event: ChangeEvent<HTMLInputElement>): void => {
    if (value === undefined) setOwn(event.target.value);
    onChange?.(event.target.value);
    if (!arcSelectable(type)) setAtEnd(true);
    else syncCaret(event, false);
  };

  const submit = (): void => {
    if (!disabled) onSubmit?.(text);
  };

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>): void => {
    if (event.key === KEY_ENTER && !event.nativeEvent.isComposing) {
      event.preventDefault();
      submit();
    }
  };

  const fade = (on: boolean): number => (on ? 1 : 0);
  const swapMs = reduced ? 0 : ARC_MS.swap;
  const textTransition = reduced ? NONE : transitionOf([[CSS_PROP.opacity, swapMs], [CSS_PROP.color, swapMs]]);
  const inputTop = height / HALF + lift + arcMeanSag(ARC_PAD_X, textEnd, width, bend) - lineHeight / HALF;
  const cy = mid + arcSag(cx, width, bend);

  return (
    <div
      data-slot="arc-field"
      data-mode={straight ? "straight" : "arc"}
      className={cn("relative inline-block", disabled && "opacity-[0.45]", className)}
      style={{ width, height: total, fontSize }}
    >
      <svg aria-hidden className="pointer-events-none absolute inset-0 overflow-visible" width={width} height={total} viewBox={`0 ${-lift} ${width} ${total}`}>
        <path d={arcOutline(width, height, bend, cornerRadius, STROKE)} strokeWidth={STROKE} style={{ fill: colorVar(surfaceColor), stroke: colorVar(focused ? textColor : borderColor), filter: arcShadow(shadowSize), transition: reduced ? NONE : transitionOf([[CSS_PROP.filter, ARC_MS.button]]) }} />
        <path ref={pathRef} id={pathId} d={arcSlice(ARC_PAD_X, Math.max(ARC_PAD_X, textEnd), height / HALF, width, bend)} fill="none" />
        <text ref={textRef} dominantBaseline="central" style={{ fill: colorVar(text ? textColor : placeholderColor), opacity: fade(!straight), transition: textTransition }}>
          <textPath href={`#${pathId}`}>{text || placeholder}</textPath>
        </text>
        {focused && !straight && caret ? (
          <line data-slot="arc-caret" x1={caret.x} y1={caret.y - caretHalf} x2={caret.x} y2={caret.y + caretHalf} strokeWidth={STROKE} transform={`rotate(${caret.angle} ${caret.x} ${caret.y})`} style={{ stroke: colorVar(textColor) }}>
            {reduced ? null : <animate attributeName="opacity" values="1;1;0;0" dur={CARET_BLINK} repeatCount="indefinite" />}
          </line>
        ) : null}
      </svg>
      <input
        data-slot="arc-input"
        type={type}
        name={name}
        value={text}
        placeholder={placeholder}
        aria-label={ariaLabel ?? placeholder}
        disabled={disabled}
        onChange={setText}
        onKeyDown={onKeyDown}
        onSelect={(event) => syncCaret(event, false)}
        onKeyUp={(event) => syncCaret(event, event.key !== KEY_ENTER)}
        onPointerDown={(event) => syncCaret(event, true)}
        onFocus={() => setFocused(true)}
        onBlur={() => {
          setFocused(false);
          setAtEnd(true);
        }}
        className="absolute bg-transparent outline-none placeholder:text-transparent disabled:cursor-not-allowed"
        style={{
          left: ARC_PAD_X,
          top: inputTop,
          width: Math.max(0, textEnd - ARC_PAD_X),
          height: lineHeight,
          lineHeight: `${lineHeight}px`,
          color: straight ? colorVar(textColor) : "transparent",
          caretColor: straight ? colorVar(textColor) : "transparent",
          transition: textTransition,
        }}
      />
      {hasButton ? (
        <button
          ref={buttonRef}
          type={BUTTON_TYPE}
          data-slot="arc-submit"
          disabled={disabled}
          onClick={submit}
          onPointerDown={() => setPressed(true)}
          onPointerUp={() => setPressed(false)}
          onPointerCancel={() => setPressed(false)}
          onPointerLeave={() => setPressed(false)}
          className={cn("absolute left-0 top-0 inline-flex items-center gap-1.5 whitespace-nowrap font-medium disabled:cursor-not-allowed", FOCUS_RING)}
          style={{
            height: height - ARC_INSET * HALF,
            paddingInline: ARC_PAD_X,
            borderRadius: Math.max(0, cornerRadius - ARC_INSET),
            backgroundColor: colorVar(buttonColor),
            color: colorVar(buttonTextColor),
            transform: `translate(${cx}px, ${cy}px) translate(-50%, -50%) rotate(${arcAngle(cx, width, bend)}deg) scale(${pressed && !reduced ? PRESS_SCALE : 1})`,
            transition: reduced ? NONE : transitionOf([[CSS_PROP.transform, PRESS_MS, COMPOSE_EASE_OUT], [CSS_PROP.filter, ARC_MS.button], [CSS_PROP.opacity, ARC_MS.button]]),
          }}
        >
          {buttonText}
          {icon}
        </button>
      ) : null}
    </div>
  );
}
