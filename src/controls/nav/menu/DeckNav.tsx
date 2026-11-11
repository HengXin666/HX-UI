"use client";
// 行为规格参照 docs/research/catalog/components-1.md 的 CardNav 条目, 实现为 HX 自有.

import { useId, useLayoutEffect, useRef, type CSSProperties, type JSX, type ReactNode } from "react";
import { FOCUS_RING } from "../../../craft/tokens";
import { useReducedMotion } from "../../../hooks/browser/media/useReducedMotion";
import { cssCurve } from "../../../motion/curves";
import { cn } from "../../../primitives/utils";
import { LinkOrButton } from "../parts/link-or-button";
import { MS_PER_SECOND, PLAIN_EASE, PX, navTone, transitionOf, type NavTone, useNavMotion } from "../tokens";
import { DECK_BAR, DECK_BAR_GAP, DECK_CARD_MS, DECK_CARD_OUT_MS, DECK_COLOR_MS, DECK_CROSS_DEG, DECK_DEFAULTS, deckCard, deckLag, deckSpring } from "./parts/deck-spec";
import { useMenuOpen } from "./parts/use-menu-open";

export { DECK_BAR, DECK_DEFAULTS, deckCard, deckLag, deckSpring } from "./parts/deck-spec";

export interface DeckLink {
  readonly label: ReactNode;
  readonly href: string;
  readonly ariaLabel?: string;
}

export interface DeckCard {
  readonly label: ReactNode;
  readonly links: readonly DeckLink[];
  readonly tone?: NavTone;
  readonly textTone?: NavTone;
}

export interface DeckNavProps {
  readonly items: readonly DeckCard[];
  readonly logo?: ReactNode;
  readonly logoHref?: string;
  readonly logoLabel?: string;
  /** 右侧行动按钮. */
  readonly cta?: { readonly label: ReactNode; readonly href?: string; readonly onClick?: () => void };
  readonly surface?: "glass" | "solid";
  /** click: 点开关展开; hover: 指针进入整条展开, 离开收起. */
  readonly openOn?: "click" | "hover";
  readonly stagger?: number;
  readonly bounce?: number;
  readonly speed?: number;
  readonly cardHeight?: number;
  readonly maxWidth?: number;
  /** 开关旁显示 Menu / Close 字样. */
  readonly menuLabel?: boolean;
  readonly open?: boolean;
  readonly defaultOpen?: boolean;
  readonly onOpenChange?: (open: boolean) => void;
  readonly onLinkClick?: (href: string) => void;
  readonly ariaLabel?: string;
  readonly className?: string;
}

const H = "h";

/**
 * 卡片导航: 顶栏展开成一排卡片, 外框高度按弹簧 (0.5s / speed, 带 bounce) 撑开到内容实高, 卡片按 min(stagger, 0.7 / (n - 1)) 错峰升起.
 * 收起时卡片一起淡出, 外框弹回顶栏高度. Escape 与点外部关闭. 减弱动效时高度直接落定, 卡片无位移.
 *
 * .agents/notes/implemented/feature/2026-11-09-controls-nav.md
 */
export function DeckNav({
  items,
  logo,
  logoHref = "#",
  logoLabel = "Home",
  cta,
  surface = "glass",
  openOn = "click",
  stagger = DECK_DEFAULTS.stagger,
  bounce = DECK_DEFAULTS.bounce,
  speed = DECK_DEFAULTS.speed,
  cardHeight = DECK_DEFAULTS.cardHeight,
  maxWidth = DECK_DEFAULTS.maxWidth,
  menuLabel = true,
  open,
  defaultOpen,
  onOpenChange,
  onLinkClick,
  ariaLabel = "Main",
  className,
}: DeckNavProps): JSX.Element {
  const reduced = useReducedMotion();
  const panelId = useId();
  const root = useRef<HTMLElement>(null);
  const toggle = useRef<HTMLButtonElement>(null);
  const frame = useRef<HTMLDivElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  const menu = useMenuOpen({ open, defaultOpen, onOpenChange, exitMs: DECK_CARD_OUT_MS, reduced, root, toggle });
  const motion = useNavMotion((m) => {
    if (frame.current) frame.current.style.height = m.get(H, DECK_BAR) + PX;
  }, reduced);

  useLayoutEffect(() => {
    const target = menu.open ? DECK_BAR + (panel.current?.scrollHeight ?? 0) : DECK_BAR;
    motion.spring(H, target, deckSpring(bounce, speed));
    // 只随开合与阶段重算目标高度
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [menu.open, menu.phase]);

  const lag = deckLag(stagger, items.length) * MS_PER_SECOND;
  const ease = cssCurve("outQuint");
  const cardStyle = (card: DeckCard, i: number): CSSProperties => ({
    minHeight: cardHeight,
    backgroundColor: navTone(card.tone ?? "muted"),
    color: navTone(card.textTone ?? "foreground"),
    ...deckCard(menu.shown || reduced, cardHeight),
    transition: menu.shown
      ? transitionOf([["transform", DECK_CARD_MS, ease, i * lag], ["opacity", DECK_CARD_MS, ease, i * lag]], reduced)
      : transitionOf([["opacity", DECK_CARD_OUT_MS, PLAIN_EASE]], reduced),
  });
  const line = (sign: number): CSSProperties => ({
    transform: menu.open ? `translateY(${sign * DECK_BAR_GAP}px) rotate(${sign * DECK_CROSS_DEG}deg)` : "none",
    transition: transitionOf([["transform", DECK_CARD_MS, ease]], reduced),
  });

  return (
    <nav
      ref={root}
      aria-label={ariaLabel}
      data-slot="deck-nav"
      className={cn("relative mx-auto w-full", className)}
      style={{ maxWidth }}
      onPointerEnter={openOn === "hover" ? () => menu.setOpen(true) : undefined}
      onPointerLeave={openOn === "hover" ? () => menu.setOpen(false) : undefined}
    >
      <div ref={frame} className={cn("overflow-hidden rounded-xl border border-border", surface === "glass" ? "bg-background/70 backdrop-blur-md" : "bg-card")} style={{ height: DECK_BAR }}>
        <div className="flex items-center justify-between gap-3 px-3" style={{ height: DECK_BAR }}>
          <button
            ref={toggle}
            type="button"
            aria-expanded={menu.open}
            aria-controls={panelId}
            aria-label={menu.open ? "Close menu" : "Open menu"}
            data-slot="deck-nav-toggle"
            onClick={menu.toggleOpen}
            className={cn("inline-flex h-9 items-center gap-2 rounded-md px-2 text-sm text-foreground hover:bg-muted", FOCUS_RING)}
            style={{ transition: transitionOf([["background-color", DECK_COLOR_MS, PLAIN_EASE]], reduced) }}
          >
            <span aria-hidden className="flex w-5 flex-col gap-[5px]">
              <span className="block h-px w-full bg-current" style={line(1)} />
              <span className="block h-px w-full bg-current" style={line(-1)} />
            </span>
            {menuLabel ? <span aria-hidden>{menu.open ? "Close" : "Menu"}</span> : null}
          </button>
          <a href={logoHref} aria-label={logoLabel} className={cn("inline-flex items-center rounded-md text-foreground no-underline", FOCUS_RING)}>
            {logo ?? logoLabel}
          </a>
          {cta ? (
            <LinkOrButton href={cta.href} onClick={cta.onClick} className={cn("inline-flex h-9 items-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground no-underline", FOCUS_RING)}>
              {cta.label}
            </LinkOrButton>
          ) : (
            <span />
          )}
        </div>
        <div ref={panel} id={panelId} data-slot="deck-nav-panel" data-phase={menu.phase} hidden={!menu.mounted} className="grid gap-2 p-2 pt-0 [grid-template-columns:repeat(auto-fit,minmax(180px,1fr))]">
          {menu.mounted
            ? items.map((card, i) => (
                <div key={i} data-slot="deck-nav-card" className="flex flex-col gap-2 rounded-lg p-4" style={cardStyle(card, i)}>
                  <span className="text-lg font-medium">{card.label}</span>
                  <ul className="m-0 mt-auto flex list-none flex-col gap-1 p-0">
                    {card.links.map((link) => (
                      <li key={link.href}>
                        <a
                          href={link.href}
                          aria-label={link.ariaLabel}
                          onClick={() => {
                            onLinkClick?.(link.href);
                            menu.setOpen(false);
                          }}
                          className={cn("rounded-sm text-sm text-inherit no-underline opacity-80 hover:opacity-100", FOCUS_RING)}
                        >
                          {link.label}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              ))
            : null}
        </div>
      </div>
    </nav>
  );
}
