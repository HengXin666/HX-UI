"use client";

/**
 * 行为规格参照 catalog/micro.md 的 PromptBar 条目, 只作出处说明; 实现与命名为 HX 自有.
 */
import { useEffect, useLayoutEffect, useRef, useState, type ChangeEvent, type JSX, type KeyboardEvent } from "react";
import { useReducedMotion } from "../../../hooks/browser/media/useReducedMotion";
import { cn } from "../../../primitives/utils";
import { useFrameLoop } from "../kinetics";
import { BUTTON_TYPE, COMPOSE_EASE_OUT, COMPOSER, CSS_PROP, HALF, transitionOf } from "../tokens";
import { ListeningBars, SendGlyph, SourcePicker, popIn, type ComposerSource } from "./composer-parts";
import { FLOW_REST, composerHeight, drawFlow, stepFlow, type Flow } from "./parts/composer-flow";

export interface ComposerFieldProps {
  readonly value?: string;
  readonly defaultValue?: string;
  readonly onValueChange?: (value: string) => void;
  /** Enter 提交 (Shift+Enter 换行, 输入法组字时不提交). */
  readonly onSubmit?: (text: string, sourceId: string | undefined) => void;
  /** 生成中: 发送键变成停止键. */
  readonly busy?: boolean;
  readonly onStop?: () => void;
  readonly placeholder?: string;
  readonly sources?: readonly ComposerSource[];
  readonly source?: string;
  readonly defaultSource?: string;
  readonly onSourceChange?: (id: string) => void;
  /** 显示收音均衡条. */
  readonly listening?: boolean;
  readonly maxRows?: number;
  /** 发送 / 停止 图形的变形时长 (ms). */
  readonly morphDuration?: number;
  /** 底边随打字加速的流光. */
  readonly ambient?: boolean;
  readonly disabled?: boolean;
  readonly ariaLabel?: string;
  readonly sendLabel?: string;
  readonly stopLabel?: string;
  readonly className?: string;
}

const KEY_ENTER = "Enter";

export { composerHeight, stepFlow } from "./parts/composer-flow";

/**
 * 输入条: 自动长高的文本域, 来源选择, 发送 / 停止 键, 底边随打字能量流动的光.
 *
 * .agents/notes/implemented/feature/2026-11-08-controls-compose.md
 */
export function ComposerField({
  value,
  defaultValue = "",
  onValueChange,
  onSubmit,
  busy = false,
  onStop,
  placeholder = "Ask anything",
  sources = [],
  source,
  defaultSource,
  onSourceChange,
  listening = false,
  maxRows = COMPOSER.maxRows,
  morphDuration = COMPOSER.morphMs,
  ambient = true,
  disabled = false,
  ariaLabel = "Message",
  sendLabel = "Send",
  stopLabel = "Stop",
  className,
}: ComposerFieldProps): JSX.Element {
  const reduced = useReducedMotion();
  const [own, setOwn] = useState(defaultValue);
  const text = value ?? own;
  const [ownSource, setOwnSource] = useState(defaultSource ?? sources[0]?.id);
  const sourceId = source ?? ownSource;
  const [rows, setRows] = useState(1);
  const [focused, setFocused] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const mirrorRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const flow = useRef<Flow>(FLOW_REST);

  useLayoutEffect(() => popIn(rootRef.current, COMPOSER.popMs, reduced), []);

  useLayoutEffect(() => {
    const mirror = mirrorRef.current;
    if (!mirror) return;
    const inner = mirror.scrollHeight - COMPOSER.edge * HALF;
    setRows(Math.max(1, Math.round(inner / COMPOSER.line)));
  }, [text]);

  const kick = useFrameLoop(ambient && !reduced, (dt) => {
    flow.current = stepFlow(flow.current, dt);
    drawFlow(canvasRef.current, flow.current);
    const idle = flow.current.energy < COMPOSER.idle && flow.current.pulse < COMPOSER.idle;
    if (idle && !focused) {
      canvasRef.current?.getContext?.("2d")?.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
      return false;
    }
    return true;
  });

  useEffect(() => {
    if (focused) kick();
  }, [focused, kick]);

  const setText = (next: string): void => {
    if (value === undefined) setOwn(next);
    onValueChange?.(next);
  };

  const submit = (): void => {
    if (busy) {
      onStop?.();
      return;
    }
    const trimmed = text.trim();
    if (!trimmed || disabled) return;
    onSubmit?.(trimmed, sourceId);
    flow.current = { ...flow.current, pulse: 1 };
    kick();
  };

  const onChange = (event: ChangeEvent<HTMLTextAreaElement>): void => {
    setText(event.target.value);
    flow.current = { ...flow.current, energy: Math.min(1, flow.current.energy + COMPOSER.keyEnergy) };
    kick();
  };

  const onKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>): void => {
    if (event.key !== KEY_ENTER || event.shiftKey || event.nativeEvent.isComposing) return;
    event.preventDefault();
    submit();
  };

  const height = composerHeight(rows, maxRows);
  const canSend = busy || text.trim().length > 0;

  return (
    <div
      ref={rootRef}
      data-slot="composer-field"
      data-busy={busy ? "" : undefined}
      className={cn(
        "relative flex w-full flex-col overflow-visible rounded-2xl border border-border bg-card text-card-foreground focus-within:border-ring",
        disabled && "opacity-50",
        className,
      )}
    >
      <div className="relative">
        <div
          ref={mirrorRef}
          aria-hidden
          className="pointer-events-none invisible absolute inset-x-0 top-0 whitespace-pre-wrap break-words text-sm"
          style={{ padding: COMPOSER.edge, lineHeight: `${COMPOSER.line}px` }}
        >
          {`${text} `}
        </div>
        <span
          aria-hidden
          className="pointer-events-none absolute left-0 top-0 text-sm text-muted-foreground"
          style={{
            padding: COMPOSER.edge,
            lineHeight: `${COMPOSER.line}px`,
            opacity: text.length === 0 ? 1 : 0,
            transition: transitionOf([[CSS_PROP.opacity, reduced ? 0 : COMPOSER.placeholderMs]]),
          }}
        >
          {placeholder}
        </span>
        <textarea
          data-slot="composer-input"
          aria-label={ariaLabel}
          value={text}
          rows={1}
          disabled={disabled}
          onChange={onChange}
          onKeyDown={onKeyDown}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          className="block w-full resize-none bg-transparent text-sm outline-none placeholder:text-transparent disabled:cursor-not-allowed"
          style={{
            height,
            padding: COMPOSER.edge,
            lineHeight: `${COMPOSER.line}px`,
            overflowY: rows > maxRows ? "auto" : "hidden",
            transition: reduced ? undefined : transitionOf([[CSS_PROP.height, COMPOSER.slideMs, COMPOSE_EASE_OUT]]),
          }}
        />
      </div>
      <div className="flex items-center gap-2" style={{ padding: `0 ${COMPOSER.edge}px ${COMPOSER.edge}px` }}>
        {sources.length > 0 ? (
          <SourcePicker
            sources={sources}
            value={sourceId ?? ""}
            reduced={reduced}
            disabled={disabled}
            onChange={(id) => {
              if (source === undefined) setOwnSource(id);
              onSourceChange?.(id);
            }}
          />
        ) : null}
        <span className="flex-1" />
        {listening ? <ListeningBars reduced={reduced} /> : null}
        <button
          type={BUTTON_TYPE}
          data-slot="composer-send"
          aria-label={busy ? stopLabel : sendLabel}
          disabled={disabled || !canSend}
          onClick={submit}
          className="inline-flex size-8 items-center justify-center rounded-full bg-primary text-primary-foreground outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:bg-muted disabled:text-muted-foreground motion-safe:active:scale-[0.94]"
          style={{
            transition: transitionOf([
              [CSS_PROP.background, COMPOSER.sendColorMs],
              [CSS_PROP.color, COMPOSER.sendColorMs],
              [CSS_PROP.transform, COMPOSER.pressMs, COMPOSE_EASE_OUT],
            ]),
          }}
        >
          <SendGlyph busy={busy} morphMs={reduced ? 0 : morphDuration} />
        </button>
      </div>
      {ambient ? (
        <canvas
          ref={canvasRef}
          aria-hidden
          data-slot="composer-glow"
          className="pointer-events-none absolute inset-x-4 -bottom-px h-px text-primary"
        />
      ) : null}
    </div>
  );
}
