import type { JSX } from "react";
import { Marquee, SKIN_ATTR, SKIN_LIST } from "@hx/ui";
import { springAt } from "../shots/stage";
import { SPRING_THUMB } from "../../../../src/craft/tokens";
import { CATALOG as DOCS } from "../../docs/catalog";

/** 图区里出现的组件名: 从导航数据里取, 两行交错滚动. */
const CHIP_ROWS = 2;
const CHIPS_PER_ROW = 14;
const CHIP_OFFSET = 40;

function Chip({ label }: { readonly label: string }): JSX.Element {
  return <span className="inline-flex h-7 items-center whitespace-nowrap rounded-md border border-border-muted bg-card px-3 text-[12px] text-muted-foreground">{label}</span>;
}

/** 组件文档: 两行真实页名跑马灯. */
export function ChipsArt(): JSX.Element {
  const rows = Array.from({ length: CHIP_ROWS }, (_, row) => DOCS.slice(CHIP_OFFSET + row * CHIPS_PER_ROW, CHIP_OFFSET + (row + 1) * CHIPS_PER_ROW));
  return (
    <div className="flex h-full flex-col justify-center gap-2.5">
      {rows.map((row, index) => (
        <Marquee key={index} reverse={index % 2 === 1} fade gap="10px" duration={40}>
          {row.map((entry) => <Chip key={entry.id} label={entry.label} />)}
        </Marquee>
      ))}
    </div>
  );
}

/** 皮肤: 每格真的挂一套 data-skin, 色块读的是那套皮肤自己的主色与底色. */
export function SkinsArt(): JSX.Element {
  return (
    <div className="flex h-full items-center justify-center gap-2.5">
      {SKIN_LIST.slice(1, 6).map((skin) => (
        <span key={skin.name} {...{ [SKIN_ATTR.skin]: skin.name }} title={skin.label} className="grid size-10 place-items-center rounded-xl border border-border bg-background">
          <span className="size-4 rounded-full bg-primary" />
        </span>
      ))}
    </div>
  );
}

const ORBIT = [
  "icon-[solar--text-field-linear]",
  "icon-[solar--tuning-linear]",
  "icon-[solar--window-frame-linear]",
  "icon-[solar--chat-square-linear]",
  "icon-[solar--calendar-linear]",
  "icon-[solar--card-linear]",
  "icon-[solar--layers-linear]",
  "icon-[solar--code-square-linear]",
] as const;
const RING_R = 92;
const FULL = 360;

/** 分组: 分组图标绕着一个中心排一圈. */
export function OrbitArt(): JSX.Element {
  return (
    <div className="relative h-full">
      <span aria-hidden className="absolute left-1/2 top-1/2 size-[184px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-border-muted" />
      <span aria-hidden className="absolute left-1/2 top-1/2 size-[300px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-border-muted" />
      <span className="absolute left-1/2 top-1/2 grid size-12 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border border-border bg-card">
        <img src="./logo.svg" alt="" width={22} height={22} />
      </span>
      {ORBIT.map((icon, index) => {
        const a = ((index / ORBIT.length) * FULL * Math.PI) / (FULL / 2);
        return (
          <span
            key={icon}
            aria-hidden
            className="absolute grid size-9 place-items-center rounded-full border border-border bg-card text-muted-foreground"
            style={{ left: `calc(50% + ${Math.cos(a) * RING_R}px - 18px)`, top: `calc(50% + ${Math.sin(a) * RING_R}px - 18px)` }}
          >
            <span className={`${icon} size-4 bg-current`} />
          </span>
        );
      })}
    </div>
  );
}

const TOKENS = ["background", "card", "primary", "muted-foreground", "border"] as const;

/** 语义令牌: 五行令牌名与当前取值的色块. */
export function TokensArt(): JSX.Element {
  return (
    <ul className="m-0 grid list-none gap-0 p-3">
      {TOKENS.map((token) => (
        <li key={token} className="flex h-8 items-center gap-3 border-b border-border-muted px-2 font-mono text-[12px] text-muted-foreground last:border-b-0">
          <span className="size-3 rounded-full border border-border" style={{ background: `var(--${token})` }} />
          --{token}
        </li>
      ))}
    </ul>
  );
}

const SNIPPET = [
  ["1", "import { Button } from \"@hx/ui\";"],
  ["2", ""],
  ["3", "<Button variant=\"primary\" loading>保存</Button>"],
] as const;

/** 源码即文档: 一段能直接贴进去的调用. */
export function SourceArt(): JSX.Element {
  return (
    <div className="flex h-full items-end p-3">
      <pre className="m-0 w-full rounded-lg border border-border-muted bg-background px-3 py-2.5 font-mono text-[12px] leading-[22px] text-foreground">
        {SNIPPET.map(([n, line]) => (
          <span key={n} className="block whitespace-pre">
            <span className="mr-4 text-muted-foreground/60">{n}</span>
            {line}
          </span>
        ))}
      </pre>
    </div>
  );
}

const CURVE_W = 300;
const CURVE_H = 150;
const CURVE_MS = 600;
const CURVE_STEPS = 60;
const PAD = 14;

/** 可中断弹簧: 拇指弹簧 0 到 1 的真实曲线 (同一个积分器), 过冲一点再停. */
export function SpringArt(): JSX.Element {
  const points = Array.from({ length: CURVE_STEPS + 1 }, (_, i) => {
    const t = (i / CURVE_STEPS) * CURVE_MS;
    const v = springAt(SPRING_THUMB, t);
    return `${(i / CURVE_STEPS) * CURVE_W},${CURVE_H - PAD - v * (CURVE_H - PAD * 3)}`;
  });
  return (
    <svg viewBox={`0 0 ${CURVE_W} ${CURVE_H}`} preserveAspectRatio="none" className="absolute inset-0 size-full text-foreground" aria-hidden>
      <line x1={0} x2={CURVE_W} y1={PAD * 2} y2={PAD * 2} stroke="currentColor" strokeOpacity={0.15} strokeDasharray="3 4" vectorEffect="non-scaling-stroke" />
      <polyline points={points.join(" ")} fill="none" stroke="currentColor" strokeWidth={1} vectorEffect="non-scaling-stroke" />
    </svg>
  );
}
