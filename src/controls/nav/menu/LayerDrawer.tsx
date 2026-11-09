"use client";
// 行为规格参照 docs/research/catalog/components-2.md 的 StaggeredMenu 条目, 实现为 HX 自有.

import { useId, useRef, type CSSProperties, type JSX, type ReactNode } from "react";
import { FOCUS_RING } from "../../../craft/tokens";
import { useReducedMotion } from "../../../hooks/browser/media/useReducedMotion";
import { cssCurve } from "../../../motion/curves";
import { cn } from "../../../primitives/utils";
import { LinkOrButton } from "../parts/link-or-button";
import { PLAIN_EASE, navTone, transitionOf, type NavTone, type NavTransition } from "../tokens";
import * as D from "./parts/drawer-spec";
import { useMenuOpen } from "./parts/use-menu-open";

export { DRAWER_EXIT_MS, DRAWER_ICON_DEG, drawerTimeline, type DrawerTimeline } from "./parts/drawer-spec";

export interface DrawerItem {
  readonly label: ReactNode;
  readonly href?: string;
  readonly ariaLabel?: string;
  readonly onSelect?: () => void;
}

export interface DrawerSocial {
  readonly label: ReactNode;
  readonly href: string;
}

export interface LayerDrawerProps {
  readonly items: readonly DrawerItem[];
  readonly socials?: readonly DrawerSocial[];
  readonly position?: "left" | "right";
  /** 面板前依次滑过的色层. */
  readonly layerTones?: readonly NavTone[];
  readonly panelTone?: NavTone;
  readonly accentTone?: NavTone;
  readonly displaySocials?: boolean;
  /** 社交区标题. */
  readonly socialsLabel?: ReactNode;
  readonly displayItemNumbering?: boolean;
  readonly logo?: ReactNode;
  /** 面板盖住视口一侧, 否则落在最近的定位祖先里. */
  readonly fixed?: boolean;
  readonly closeOnClickAway?: boolean;
  readonly open?: boolean;
  readonly defaultOpen?: boolean;
  readonly onOpenChange?: (open: boolean) => void;
  readonly ariaLabel?: string;
  readonly className?: string;
}

const FULL = 100;

/**
 * 层叠抽屉: 开关一按, 几层色板依次从侧边滑入, 面板压在最后, 条目文字从下方转正升起, 序号与社交区随后淡入.
 * 收起时所有层一起 0.32s inQuart 滑出. 开关的加号转到 225 度成叉. 减弱动效时没有位移与延迟, 直接显隐.
 *
 * .agents/notes/implemented/feature/2026-11-09-controls-nav.md
 */
export function LayerDrawer({
  items,
  socials = [],
  position = "right",
  layerTones = ["muted", "secondary"],
  panelTone = "background",
  accentTone = "primary",
  displaySocials = true,
  socialsLabel = "Socials",
  displayItemNumbering = true,
  logo,
  fixed = false,
  closeOnClickAway = true,
  open,
  defaultOpen,
  onOpenChange,
  ariaLabel = "Main",
  className,
}: LayerDrawerProps): JSX.Element {
  const reduced = useReducedMotion();
  const panelId = useId();
  const root = useRef<HTMLDivElement>(null);
  const toggle = useRef<HTMLButtonElement>(null);
  const menu = useMenuOpen({ open, defaultOpen, onOpenChange, exitMs: D.DRAWER_EXIT_MS, reduced, closeOnClickAway, root, toggle });
  const on = menu.shown;
  const side = position === "right" ? 1 : -1;
  const time = D.drawerTimeline(layerTones.length, items.length);
  const outQuint = cssCurve("outQuint");
  const exit = cssCurve("inQuart");
  const motion = (enter: readonly NavTransition[], props: readonly string[]): string =>
    transitionOf(on ? enter : props.map((p): NavTransition => [p, D.DRAWER_EXIT_MS, exit]), reduced);
  const slide = (ms: number, delay: number): CSSProperties => ({
    transform: on ? "translateX(0%)" : `translateX(${side * FULL}%)`,
    transition: motion([["transform", ms, outQuint, delay]], ["transform"]),
  });
  const sheet = cn("absolute inset-y-0 w-[clamp(260px,38vw,420px)]", position === "right" ? "right-0" : "left-0");

  return (
    <div ref={root} data-slot="layer-drawer" className={cn("relative", className)}>
      <div className="relative z-20 flex items-center justify-between gap-3">
        {logo ?? <span />}
        <button
          ref={toggle}
          type="button"
          aria-expanded={menu.open}
          aria-controls={panelId}
          aria-label={menu.open ? "Close menu" : "Open menu"}
          data-slot="layer-drawer-toggle"
          onClick={menu.toggleOpen}
          className={cn("inline-flex items-center gap-2 rounded-md px-2 py-1 text-sm font-medium", FOCUS_RING)}
          style={{ color: navTone(menu.open ? accentTone : "foreground"), transition: transitionOf([["color", D.DRAWER_COLOR_MS, PLAIN_EASE]], reduced) }}
        >
          <span aria-hidden>{menu.open ? "Close" : "Menu"}</span>
          <span
            aria-hidden
            data-slot="layer-drawer-icon"
            className="relative block size-3.5"
            style={{
              transform: `rotate(${menu.open ? D.DRAWER_ICON_DEG : 0}deg)`,
              transition: transitionOf([["transform", menu.open ? D.DRAWER_ICON_OPEN_MS : D.DRAWER_ICON_CLOSE_MS, cssCurve(menu.open ? "outQuint" : "inOutQuart")]], reduced),
            }}
          >
            <span className="absolute inset-x-0 top-1/2 h-px bg-current" />
            <span className="absolute inset-y-0 left-1/2 w-px bg-current" />
          </span>
        </button>
      </div>
      {menu.mounted ? (
        <div data-slot="layer-drawer-sheet" data-phase={menu.phase} className={cn("z-10 overflow-hidden", fixed ? "fixed inset-0" : "absolute inset-0")} style={{ pointerEvents: "none" }}>
          {layerTones.map((tone, i) => (
            <div key={i} aria-hidden data-slot="layer-drawer-layer" className={sheet} style={{ backgroundColor: navTone(tone), ...slide(D.DRAWER_LAYER_MS, time.layer(i)) }} />
          ))}
          <nav
            id={panelId}
            aria-label={ariaLabel}
            data-slot="layer-drawer-panel"
            className={cn(sheet, "flex flex-col gap-8 overflow-y-auto border-border px-8 pb-8 pt-20", position === "right" ? "border-l" : "border-r")}
            style={{ backgroundColor: navTone(panelTone), pointerEvents: "auto", ...slide(D.DRAWER_PANEL_MS, time.panel) }}
          >
            <ul className="m-0 flex list-none flex-col gap-2 p-0">
              {items.map((item, i) => (
                <li key={i} className="relative overflow-hidden">
                  <LinkOrButton
                    href={item.href}
                    aria-label={item.ariaLabel}
                    data-slot="layer-drawer-item"
                    onClick={() => {
                      item.onSelect?.();
                      menu.setOpen(false);
                    }}
                    className={cn("group inline-flex items-start gap-3 rounded-sm text-left text-4xl font-semibold uppercase leading-none text-foreground no-underline", FOCUS_RING)}
                  >
                    <span
                      className="inline-block origin-bottom-left"
                      style={{
                        transform: on ? "translateY(0%) rotate(0deg)" : `translateY(${D.DRAWER_ITEM_FROM_PERCENT}%) rotate(${D.DRAWER_ITEM_FROM_DEG}deg)`,
                        transition: motion([["transform", D.DRAWER_ITEM_MS, outQuint, time.item(i)]], ["transform"]),
                      }}
                    >
                      {item.label}
                    </span>
                    {displayItemNumbering ? (
                      <span
                        aria-hidden
                        className="text-sm font-normal tabular-nums"
                        style={{ color: navTone(accentTone), opacity: on ? 1 : 0, transition: motion([["opacity", D.DRAWER_INDEX_MS, cssCurve("outCubic"), time.index(i)]], ["opacity"]) }}
                      >
                        {String(i + 1).padStart(2, "0")}
                      </span>
                    ) : null}
                  </LinkOrButton>
                </li>
              ))}
            </ul>
            {displaySocials && socials.length > 0 ? (
              <div className="mt-auto flex flex-col gap-3">
                <span className="text-sm" style={{ color: navTone(accentTone), opacity: on ? 1 : 0, transition: motion([["opacity", D.DRAWER_SOCIAL_TITLE_MS, cssCurve("outCubic"), time.social(0)]], ["opacity"]) }}>
                  {socialsLabel}
                </span>
                <ul className="m-0 flex list-none flex-wrap gap-4 p-0">
                  {socials.map((social, i) => (
                    <li key={social.href}>
                      <a
                        href={social.href}
                        data-slot="layer-drawer-social"
                        className={cn("inline-block rounded-sm text-base text-foreground no-underline", FOCUS_RING)}
                        style={{
                          opacity: on ? 1 : 0,
                          transform: on ? "translateY(0px)" : `translateY(${D.DRAWER_SOCIAL_FROM_PX}px)`,
                          transition: motion([["opacity", D.DRAWER_SOCIAL_MS, cssCurve("outQuart"), time.social(i + 1)], ["transform", D.DRAWER_SOCIAL_MS, cssCurve("outQuart"), time.social(i + 1)]], ["opacity", "transform"]),
                        }}
                      >
                        {social.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </nav>
        </div>
      ) : null}
    </div>
  );
}
