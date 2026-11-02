import type { JSX } from "react";
import { H2, H3, P } from "../../components/DocKit";
import { DEMO_CLASS } from "../../../../src/constants/docs-legacy";
import { TOKEN_GRID_DEMO_COLUMNS, type TokenDensity } from "../../../../src/constants/docs-tokens";
import { CAPTION, LABEL, ROW, STAGE } from "./impl/token-classes";
import { CONTAINERS, RHYTHMS } from "./impl/token-data";

/**
 * 令牌页版式分区: 容器宽度 / 12 栏栅格 / 区块纵向节奏. 节奏随密度收放, 所以接收外壳的 density.
 * .agents/notes/implemented/feature/2026-11-01-design-tokens-depth-motion.md
 */
export function LayoutSections({ density }: { density: TokenDensity }): JSX.Element {
  return (
    <>
      <H2>容器与页面节奏</H2>
      <P>
        页面用 --container-* 定宽, 左右留白 --container-padding-x, 12 栏栅格 (--grid-cols) 之间隔 --grid-gutter;
        区块之间用 --section-space-y 拉开  这是商业落地页与工具界面观感差别最大的地方。
      </P>
      <div className={`${STAGE} ${DEMO_CLASS.rows}`}>
        {CONTAINERS.map((c) => (
          <div key={c.name}>
            <div className="h-6 rounded-md border border-border bg-primary-subtle" style={{ width: `min(100%, var(${c.name}))` }} />
            <div className={LABEL}>{c.name}</div>
            <div className={CAPTION}>{c.use}</div>
          </div>
        ))}
      </div>
      <H3>12 栏栅格</H3>
      <div
        className={`${STAGE} grid`}
        style={{ gridTemplateColumns: "repeat(var(--grid-cols), minmax(0, 1fr))", columnGap: "var(--grid-gutter)" }}
      >
        {Array.from({ length: TOKEN_GRID_DEMO_COLUMNS }, (_, i) => (
          <div key={i} className="h-16 rounded-sm bg-accent-2-subtle" />
        ))}
      </div>
      <div className={LABEL}>--grid-cols × --grid-gutter</div>
      <H3>纵向节奏</H3>
      <div className={ROW}>
        {RHYTHMS.map((r) => (
          <div key={r.name} className="min-w-60 flex-1">
            <div data-density={density} className={STAGE}>
              <div className="h-10 rounded-md bg-surface-raised" />
              <div className="border-x border-dashed border-primary/60" style={{ height: `var(${r.name})` }} />
              <div className="h-10 rounded-md bg-surface-raised" />
            </div>
            <div className={LABEL}>{r.name}</div>
            <div className={CAPTION}>{r.use}</div>
          </div>
        ))}
      </div>
    </>
  );
}
