import type { JSX } from "react";
import { H2, H3, P } from "../../components/DocKit";
import { TOKEN_PALETTE_STEPS } from "../../../../src/constants/docs-tokens";
import { CAPTION, GRID, LABEL, SCALE_ROW, SURFACE_STAGE, TILE } from "./impl/token-classes";
import { Swatch } from "./Swatch";
import { BRAND, COLORS, PALETTE_HUES, SURFACES } from "./impl/token-data";
import { DEMO_CLASS } from "../../../../src/constants/docs-legacy";

/**
 * 令牌页颜色分区: 语义色 / 表面分层 / 玻璃 / 品牌辅色 / 原始色板.
 * .agents/notes/implemented/feature/2026-11-01-design-tokens-depth-motion.md
 */
export function ColorSections(): JSX.Element {
  return (
    <>
      <H2>颜色</H2>
      <div className={GRID}>
        {COLORS.map((c) => <Swatch key={c.name} name={c.name} use={c.use} />)}
      </div>

      <H2>表面分层</H2>
      <P>sunken &lt; background &lt; surface-raised &lt; overlay。暗色下越高越亮, 亮色下底色相同, 高度差交给阴影。</P>
      <div className={SURFACE_STAGE}>
        {SURFACES.map((s) => (
          <div key={s.name} className={TILE}>
            <div className="size-20 rounded-xl border border-border" style={{ background: `var(${s.name})`, boxShadow: s.shadow ? `var(${s.shadow})` : undefined }} />
            <div className={LABEL}>{s.name}</div>
            <div className={CAPTION}>{s.use}</div>
          </div>
        ))}
      </div>
      <H3>玻璃</H3>
      <div className="relative overflow-hidden rounded-2xl p-6" style={{ background: "var(--gradient-brand)" }}>
        <div className="rounded-xl border border-glass-border bg-surface-glass p-4 backdrop-blur-glass backdrop-saturate-150">
          <div className={LABEL}>--surface-glass + --blur-glass</div>
        </div>
      </div>

      <H2>品牌辅色</H2>
      <div className={GRID}>
        {BRAND.map((c) => <Swatch key={c.name} name={c.name} use={c.use} />)}
      </div>

      <H2>原始色板</H2>
      <P>
        第 1 层: oklch 11 阶, 50 最浅 950 最深。语义色 (--primary / --border ...) 都引用这里的某一阶,
        组件只用语义色, 不直接取色板。
      </P>
      <div className={DEMO_CLASS.rows}>
        {PALETTE_HUES.map((h) => (
          <div key={h.hue} className={SCALE_ROW}>
            <div className="w-32 shrink-0">
              <div className={LABEL}>{h.hue}</div>
              <div className={CAPTION}>{h.use}</div>
            </div>
            <div className="grid flex-1 grid-cols-11 overflow-hidden rounded-lg border border-border">
              {TOKEN_PALETTE_STEPS.map((step) => (
                <div key={step} className="h-10" title={`--palette-${h.hue}-${step}`} style={{ background: `var(--palette-${h.hue}-${step})` }} />
              ))}
            </div>
          </div>
        ))}
        <div className={SCALE_ROW}>
          <div className="w-32 shrink-0" />
          <div className="grid flex-1 grid-cols-11">
            {TOKEN_PALETTE_STEPS.map((step) => <div key={step} className={`${LABEL} text-center`}>{step}</div>)}
          </div>
        </div>
      </div>
    </>
  );
}
