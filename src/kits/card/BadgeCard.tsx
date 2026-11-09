"use client";
// 行为规格参照 docs/research/catalog/components-1.md 的 ProfileCard 条目, 实现为 HX 自有.

import { useEffect, useRef, type JSX, type PointerEvent } from "react";
import { useReducedMotion } from "../../hooks/browser/media/useReducedMotion";
import { prefersReducedMotion } from "../../primitives/motion";
import { cn } from "../../primitives/utils";
import * as P from "./parts/badge-spec";
import { TILT_FOLLOW, TILT_SETTLE, tiltTarget } from "./parts/tilt";
import { KIT_FOCUS, cardPoint, follow, kitTone, transitionOf, useKitMotion, type KitTone } from "./tokens";

export { BADGE_DEFAULTS, badgeHolo, badgeIntro, badgeParallax } from "./parts/badge-spec";

export interface BadgeCardProps {
  readonly avatarUrl?: string;
  readonly miniAvatarUrl?: string;
  readonly name?: string;
  readonly title?: string;
  readonly handle?: string;
  readonly status?: string;
  readonly statusTone?: KitTone;
  readonly contactText?: string;
  readonly showUserInfo?: boolean;
  readonly onContactClick?: () => void;
  readonly holoTones?: readonly KitTone[];
  readonly radius?: number;
  readonly holo?: number;
  readonly glare?: number;
  readonly enableTilt?: boolean;
  readonly tiltStrength?: number;
  readonly parallax?: number;
  readonly intro?: boolean;
  readonly className?: string;
}

/**
 * 名片卡: 头像, 姓名与头衔, 底部信息条 (小头像, @handle, 状态点, 联系按钮). 指针在卡上时卡面倾向指针 (tiltStrength 度),
 * 跟手弹簧劲度 120 阻尼 16, 离开归位用 24 / 9; 全息彩带与高光随指针移, 头像逆向视差 parallax px.
 * intro 时挂上扫一次光. 减弱动效时不倾斜, 无视差与扫光, 全息层静止.
 *
 * .agents/notes/implemented/feature/2026-11-10-kits-card.md
 */
export function BadgeCard({
  avatarUrl,
  miniAvatarUrl,
  name = "",
  title = "",
  handle,
  status,
  statusTone = "success",
  contactText = "Contact",
  showUserInfo = true,
  onContactClick,
  holoTones = ["primary", "accent", "secondary", "success"],
  radius = P.BADGE_DEFAULTS.radius,
  holo = P.BADGE_DEFAULTS.holo,
  glare = P.BADGE_DEFAULTS.glare,
  enableTilt = true,
  tiltStrength = P.BADGE_DEFAULTS.tiltStrength,
  parallax = P.BADGE_DEFAULTS.parallax,
  intro = true,
  className,
}: BadgeCardProps): JSX.Element {
  const still = useReducedMotion();
  const root = useRef<HTMLElement>(null);
  const s = useRef({ in: false, light: 0, lx: 0.5, ly: 0.5, tx: 0.5, ty: 0.5, intro: -1 });

  const motion = useKitMotion(
    (m) => {
      const node = root.current;
      if (!node) return;
      const st = s.current;
      node.style.setProperty("--rx", `${m.get("rx").toFixed(2)}deg`);
      node.style.setProperty("--ry", `${m.get("ry").toFixed(2)}deg`);
      node.style.setProperty("--px", `${(st.lx * 100).toFixed(1)}%`);
      node.style.setProperty("--py", `${(st.ly * 100).toFixed(1)}%`);
      node.style.setProperty("--light", st.light.toFixed(3));
      node.style.setProperty("--ax", `${m.get("ax").toFixed(2)}px`);
      node.style.setProperty("--ay", `${m.get("ay").toFixed(2)}px`);
    },
    still,
    (dtMs) => {
      const st = s.current;
      const dt = dtMs / 1000;
      if (st.intro >= 0) {
        st.intro += dt;
        st.lx = P.badgeIntro(st.intro);
        st.light = Math.sin(Math.min(1, st.intro / (2 * P.BADGE_INTRO_LEG_S)) * Math.PI);
        if (st.intro >= 2 * P.BADGE_INTRO_LEG_S) Object.assign(st, { intro: -1, light: 0, lx: 0.5 });
        return true;
      }
      const target = st.in ? 1 : 0;
      st.light = still ? target : follow(st.light, target, dt, P.BADGE_LIGHT_S);
      const k = still ? 0 : 0.08;
      st.lx = follow(st.lx, st.tx, dt, k);
      st.ly = follow(st.ly, st.ty, dt, k);
      return st.light !== target || st.lx !== st.tx || st.ly !== st.ty;
    },
  );
  useEffect(() => {
    motion.paint();
    if (!intro || still || prefersReducedMotion()) return;
    s.current.intro = 0;
    motion.wake();
  }, [intro, still, motion]);

  const onMove = (event: PointerEvent<HTMLElement>): void => {
    const p = cardPoint(event.currentTarget.getBoundingClientRect(), event.clientX, event.clientY);
    const st = s.current;
    Object.assign(st, { in: true, intro: -1, tx: (p.nx + 1) / 2, ty: (p.ny + 1) / 2 });
    const t = enableTilt && !still ? tiltTarget(p.nx, p.ny, tiltStrength) : { rx: 0, ry: 0 };
    const a = still ? { x: 0, y: 0 } : P.badgeParallax(p.nx, p.ny, parallax);
    motion.spring("rx", t.rx, TILT_FOLLOW);
    motion.spring("ry", t.ry, TILT_FOLLOW);
    motion.spring("ax", a.x, TILT_FOLLOW);
    motion.spring("ay", a.y, TILT_FOLLOW);
    motion.wake();
  };
  const onLeave = (): void => {
    Object.assign(s.current, { in: false, tx: 0.5, ty: 0.5 });
    for (const id of ["rx", "ry", "ax", "ay"]) motion.spring(id, 0, TILT_SETTLE);
    motion.wake();
  };
  const press = transitionOf([["filter", P.BADGE_PRESS_MS, "ease"]], still);

  return (
    <article ref={root} data-slot="badge-card" aria-label={name || undefined} onPointerMove={onMove} onPointerLeave={onLeave} onPointerCancel={onLeave} className={cn("relative w-72 [perspective:900px]", className)}>
      <div
        data-slot="badge-card-face"
        className="relative isolate aspect-[5/7] overflow-hidden border border-border bg-card text-card-foreground active:brightness-95"
        style={{ borderRadius: radius, transform: "rotateX(var(--rx, 0deg)) rotateY(var(--ry, 0deg))", transition: press }}
      >
        {avatarUrl ? <img src={avatarUrl} alt="" draggable={false} className="absolute inset-x-0 bottom-0 mx-auto h-4/5 object-contain" style={{ transform: "translate(var(--ax, 0px), var(--ay, 0px))" }} /> : null}
        <span
          aria-hidden
          data-slot="badge-card-holo"
          className="pointer-events-none absolute inset-0"
          style={{ background: P.badgeHolo(holoTones.map(kitTone)), backgroundSize: "300% 300%", backgroundPosition: "var(--px, 50%) var(--py, 50%)", mixBlendMode: "color-dodge", opacity: `calc(${holo} * (0.25 + 0.5 * var(--light, 0)))` }}
        />
        {glare > 0 ? (
          <span aria-hidden data-slot="badge-card-glare" className="pointer-events-none absolute inset-0" style={{ background: "radial-gradient(circle at var(--px, 50%) var(--py, 50%), color-mix(in oklab, white 60%, transparent), transparent 55%)", mixBlendMode: "overlay", opacity: `calc(${glare} * var(--light, 0))` }} />
        ) : null}
        <header className="relative grid gap-1 p-6 text-center">
          <h3 className="text-2xl font-semibold">{name}</h3>
          {title ? <p className="text-sm text-muted-foreground">{title}</p> : null}
        </header>
        {showUserInfo ? (
          <footer data-slot="badge-card-info" className="absolute inset-x-3 bottom-3 flex items-center gap-3 rounded-xl border border-border bg-background/70 p-2.5 backdrop-blur">
            {miniAvatarUrl || avatarUrl ? <img src={miniAvatarUrl ?? avatarUrl} alt="" className="size-8 rounded-full object-cover" /> : null}
            <div className="grid min-w-0 flex-1 text-xs">
              {handle ? <span className="truncate font-medium">@{handle}</span> : null}
              {status ? (
                <span className="flex items-center gap-1.5 text-muted-foreground">
                  <span aria-hidden className="size-1.5 rounded-full" style={{ background: kitTone(statusTone) }} />
                  {status}
                </span>
              ) : null}
            </div>
            <button type="button" onClick={onContactClick} className={cn("rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-medium", KIT_FOCUS)}>
              {contactText}
            </button>
          </footer>
        ) : null}
      </div>
    </article>
  );
}
