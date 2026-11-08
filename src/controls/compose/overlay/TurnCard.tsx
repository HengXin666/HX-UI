"use client";

/**
 * 行为规格参照 catalog/micro.md 的 FlipCard 条目, 只作出处说明; 实现与命名为 HX 自有.
 */
import { useEffect, useMemo, useRef, useState, type JSX, type KeyboardEvent as ReactKeyboardEvent, type PointerEvent as ReactPointerEvent, type ReactNode } from "react";
import { useReducedMotion } from "../../../hooks/browser/media/useReducedMotion";
import { cn } from "../../../primitives/utils";
import { useSpringChannels } from "../kinetics";
import { HALF, PX, TURN, colorVar, type HxColor } from "../tokens";
import { TURN_AXIS, nearestFace, settleTurn, showsBack, spinOf, velocityOf, type TurnAxis, type TurnSample } from "./parts/turn-math";

export { TURN_AXIS, nearestFace, settleTurn, showsBack, spinOf, velocityOf, type TurnAxis } from "./parts/turn-math";

/** 本文件内重复出现的字面量, 只写一次. */
const TURN_KEY = "turn";
const TILT_X = "tiltX";
const TILT_Y = "tiltY";

export interface TurnCardProps {
  readonly front?: ReactNode;
  readonly back?: ReactNode;
  /** 受控翻面. */
  readonly flipped?: boolean;
  readonly defaultFlipped?: boolean;
  readonly onFlipChange?: (flipped: boolean) => void;
  readonly axis?: TurnAxis;
  readonly flipOnClick?: boolean;
  readonly draggable?: boolean;
  /** 拖满多少像素转半圈; 0 时取卡片在该轴上的尺寸. */
  readonly dragDistance?: number;
  readonly tilt?: boolean;
  readonly tiltMax?: number;
  readonly glare?: boolean;
  readonly glareOpacity?: number;
  readonly hoverScale?: number;
  readonly perspective?: number;
  readonly stiffness?: number;
  readonly damping?: number;
  readonly width?: number;
  readonly height?: number;
  readonly radius?: number;
  readonly background?: HxColor;
  readonly color?: HxColor;
  readonly shadow?: boolean;
  readonly label?: string;
  readonly className?: string;
}

const POINTER_COARSE = "touch";
const KEY_ENTER = "Enter";
const KEY_SPACE = " ";
const FULL = 100;

/**
 * 翻转卡: 点击或回车翻面, 拖动时卡片跟手转, 松手按速度甩到最近一面; 翻转是保留速度的弹簧,
 * 半路反拖不跳变. 悬停时按指针位置微倾并抬起, 一层高光跟着指针走.
 */
export function TurnCard({
  front = null,
  back = null,
  flipped,
  defaultFlipped = false,
  onFlipChange,
  axis = TURN_AXIS.y,
  flipOnClick = true,
  draggable = true,
  dragDistance = 0,
  tilt = true,
  tiltMax = TURN.tiltMax,
  glare = true,
  glareOpacity = TURN.glareOpacity,
  hoverScale = TURN.hoverScale,
  perspective = TURN.perspective,
  stiffness = TURN.stiffness,
  damping = TURN.damping,
  width = TURN.width,
  height = TURN.height,
  radius = TURN.radius,
  background = "card",
  color = "card-foreground",
  shadow = true,
  label,
  className,
}: TurnCardProps): JSX.Element {
  const reduced = useReducedMotion();
  const controlled = flipped !== undefined;
  const [inner, setInner] = useState(defaultFlipped);
  const isBack = controlled ? flipped : inner;
  const [face, setFace] = useState(isBack);
  const rootRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const glareRef = useRef<HTMLDivElement>(null);
  const drag = useRef<{ id: number; x: number; y: number; from: number; moved: boolean; history: TurnSample[] } | null>(null);
  const glarePos = useRef({ x: FULL / HALF, y: FULL / HALF });

  const specs = useMemo(
    () => ({ turn: { stiffness, damping, mass: 1 }, tiltX: TURN.tiltSpring, tiltY: TURN.tiltSpring, lift: TURN.liftSpring, sheen: TURN.liftSpring }),
    [stiffness, damping],
  );
  const start = isBack ? TURN.halfTurn : 0;
  const channels = useSpringChannels({ turn: start, tiltX: 0, tiltY: 0, lift: 1, sheen: 0 }, specs, (v) => {
    const card = cardRef.current;
    if (card) {
      card.style.transform = `scale(${v.lift}) rotateX(${v.tiltX}deg) rotateY(${v.tiltY}deg) ${spinOf(axis, v.turn)}`;
    }
    if (glareRef.current) {
      const g = glarePos.current;
      glareRef.current.style.opacity = String(v.sheen * glareOpacity);
      glareRef.current.style.background = `radial-gradient(circle at ${g.x}% ${g.y}%, var(--background), transparent 60%)`;
    }
    const nowBack = showsBack(v.turn);
    setFace((was) => (was === nowBack ? was : nowBack));
  }, reduced);

  // 外部改 flipped 时转到对应一面.
  useEffect(() => {
    if (drag.current?.moved) return;
    channels.to(TURN_KEY, nearestFace(channels.get(TURN_KEY), isBack));
  }, [isBack, channels]);

  const commit = (back: boolean): void => {
    if (!controlled) setInner(back);
    if (back !== isBack) onFlipChange?.(back);
  };

  const flip = (): void => {
    const next = !isBack;
    channels.to(TURN_KEY, nearestFace(channels.get(TURN_KEY), next));
    commit(next);
  };

  const span = (): number => dragDistance || (axis === TURN_AXIS.y ? width : height);

  const onPointerDown = (e: ReactPointerEvent<HTMLDivElement>): void => {
    if (e.button !== 0) return;
    drag.current = { id: e.pointerId, x: e.clientX, y: e.clientY, from: channels.get(TURN_KEY), moved: false, history: [] };
  };

  const onPointerMove = (e: ReactPointerEvent<HTMLDivElement>): void => {
    const d = drag.current;
    const rect = rootRef.current?.getBoundingClientRect();
    if (rect && rect.width > 0 && !reduced) {
      const nx = (e.clientX - rect.left) / rect.width - 1 / HALF;
      const ny = (e.clientY - rect.top) / rect.height - 1 / HALF;
      glarePos.current = { x: (nx + 1 / HALF) * FULL, y: (ny + 1 / HALF) * FULL };
      if (tilt && !d?.moved) {
        channels.to(TILT_X, -ny * HALF * tiltMax);
        channels.to(TILT_Y, nx * HALF * tiltMax);
      }
    }
    if (!d || d.id !== e.pointerId || !draggable) return;
    const delta = axis === TURN_AXIS.y ? e.clientX - d.x : d.y - e.clientY;
    const slop = e.pointerType === POINTER_COARSE ? TURN.slop.coarse : TURN.slop.fine;
    if (!d.moved) {
      if (Math.abs(delta) < slop) return;
      d.moved = true;
      e.currentTarget.setPointerCapture?.(e.pointerId);
      channels.to(TILT_X, 0);
      channels.to(TILT_Y, 0);
    }
    const turn = d.from + (delta / span()) * TURN.halfTurn;
    const now = e.timeStamp || performance.now();
    d.history.push({ t: now, turn });
    d.history = d.history.filter((sample) => now - sample.t <= TURN.historyMs);
    channels.jump(TURN_KEY, turn);
  };

  const end = (e: ReactPointerEvent<HTMLDivElement>): void => {
    const d = drag.current;
    drag.current = null;
    if (!d || d.id !== e.pointerId) return;
    if (!d.moved) {
      if (flipOnClick) flip();
      return;
    }
    const now = e.timeStamp || performance.now();
    const velocity = velocityOf(d.history, now);
    const target = settleTurn(channels.get(TURN_KEY), velocity);
    channels.to(TURN_KEY, target, velocity);
    commit(showsBack(target));
  };

  const onKeyDown = (e: ReactKeyboardEvent<HTMLDivElement>): void => {
    if (e.key !== KEY_ENTER && e.key !== KEY_SPACE) return;
    e.preventDefault();
    flip();
  };

  const faceClass = "absolute inset-0 overflow-hidden border border-border [backface-visibility:hidden]";
  const faceStyle = { borderRadius: radius, background: colorVar(background), color: colorVar(color) };
  const backSpin = spinOf(axis, TURN.halfTurn);

  return (
    <div
      ref={rootRef}
      role="button"
      tabIndex={0}
      aria-pressed={isBack}
      aria-label={label}
      data-slot="turn-card"
      data-face={face ? "back" : "front"}
      className={cn("relative touch-none select-none outline-none focus-visible:ring-1 focus-visible:ring-ring", className)}
      style={{ width, height, perspective: `${perspective}${PX}`, borderRadius: radius }}
      onPointerEnter={() => {
        if (reduced) return;
        channels.to("lift", hoverScale);
        if (glare) channels.to("sheen", 1);
      }}
      onPointerLeave={() => {
        channels.to("lift", 1);
        channels.to("sheen", 0);
        channels.to(TILT_X, 0);
        channels.to(TILT_Y, 0);
      }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={end}
      onPointerCancel={end}
      onKeyDown={onKeyDown}
    >
      <div
        ref={cardRef}
        className={cn("relative size-full [transform-style:preserve-3d]", shadow && "shadow-lg")}
        style={{ borderRadius: radius, transform: spinOf(axis, start) }}
      >
        <div className={faceClass} style={faceStyle} aria-hidden={face}>
          {front}
        </div>
        <div className={faceClass} style={{ ...faceStyle, transform: backSpin }} aria-hidden={!face}>
          {back}
        </div>
        {glare ? (
          <div
            ref={glareRef}
            aria-hidden
            className="pointer-events-none absolute inset-0"
            style={{ borderRadius: radius, opacity: 0 }}
          />
        ) : null}
      </div>
    </div>
  );
}
