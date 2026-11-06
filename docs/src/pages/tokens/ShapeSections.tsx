import type { JSX } from "react";
import { H2, H3, P } from "../../components/DocKit";
import { CAPTION, LABEL, ROW, SURFACE_STAGE, TILE } from "./impl/token-classes";
import { RADII, SHADOWS } from "./impl/token-data";

/**
 * 令牌页形状分区: 圆角全档与双层阴影.
 * .agents/notes/implemented/feature/2026-11-01-design-tokens-depth-motion.md
 */
export function ShapeSections(): JSX.Element {
  return (
    <>
      <H2>圆角</H2>
      <P>sm..2xl 由一个 <code className="rounded-md bg-muted/60 px-1.5 py-0.5 font-mono text-(length:--fs-xs-half)">--radius</code> 派生, 改它就整站改手感; none / xs / full 是固定档。</P>
      <div className={ROW}>
        {RADII.map((r) => (
          <div key={r.name} className={TILE}>
            <div className="size-20 border border-border bg-card/40" style={{ borderRadius: `var(${r.name})` }} />
            <div className={LABEL}>{r.name}</div>
            <div className={CAPTION}>{r.use}</div>
          </div>
        ))}
      </div>

      <H2>阴影</H2>
      <P>
        每档都是双层: 近处锐影定接触边, 远处柔影给高度; 亮色透明度更低。默认卡片仍然无阴影,
        浮层用 lg 以上, 弹窗用 shadow-2xl, 强调卡用 glow, 聚焦用 ring-glow。
      </P>
      <div className={SURFACE_STAGE}>
        {SHADOWS.map((s) => (
          <div key={s} className={TILE}>
            <div className="size-16 rounded-xl border border-border bg-surface-raised" style={{ boxShadow: `var(${s})` }} />
            <div className={LABEL}>{s}</div>
          </div>
        ))}
      </div>
    </>
  );
}
