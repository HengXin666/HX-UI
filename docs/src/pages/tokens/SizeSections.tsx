import type { JSX } from "react";
import { H2, H3, P } from "../../components/DocKit";
import { DEMO_CLASS, NATIVE_BUTTON_TYPE } from "../../../../src/constants/docs-legacy";
import {
  TOKEN_CONTROL_SIZES,
  TOKEN_DENSITY,
  TOKEN_SPACE_COUNT,
  TOKEN_TOGGLE_CLASS,
  type TokenDensity,
} from "../../../../src/constants/docs-tokens";
import { BUTTON, LABEL, SCALE_ROW, STAGE, TILE } from "./impl/token-classes";

/** 密度切换的三个取值, 顺序即按钮顺序 */
const DENSITIES = Object.values(TOKEN_DENSITY);
const SCALE_NAME = "w-40 shrink-0";

/**
 * 令牌页尺寸分区: 控件高度档 / 密度切换 / 间距全档. 密度由页面外壳持有, 容器节奏分区共用同一个值.
 * .agents/notes/implemented/feature/2026-11-01-design-tokens-depth-motion.md
 */
export function SizeSections({ density, onDensity }: { density: TokenDensity; onDensity: (d: TokenDensity) => void }): JSX.Element {
  return (
    <>
      <H2>尺寸档与密度</H2>
      <P>
        控件高度 --control-h-xs .. --control-h-xl 对齐 Button 的 24 / 28 / 32 / 36 / 40px。
        在任意节点写 data-density="compact" 或 "comfortable", 子树的控件高度, 间距, 区块留白一起按 --density 缩放。
      </P>
      <div className="mb-3 flex flex-wrap gap-2">
        {DENSITIES.map((d) => (
          <button
            key={d}
            type={NATIVE_BUTTON_TYPE}
            onClick={() => onDensity(d)}
            className={`${BUTTON} ${d === density ? TOKEN_TOGGLE_CLASS.active : TOKEN_TOGGLE_CLASS.idle}`}
          >
            {d}
          </button>
        ))}
      </div>
      <div data-density={density} className={STAGE}>
        <div className="flex flex-wrap items-end gap-4">
          {TOKEN_CONTROL_SIZES.map((size) => (
            <div key={size} className={TILE}>
              <div
                className="flex w-24 items-center justify-center rounded-lg border border-border bg-secondary text-(length:--fs-sm) text-foreground"
                style={{ height: `var(--control-h-${size})` }}
              >
                {size}
              </div>
              <div className={LABEL}>--control-h-{size}</div>
            </div>
          ))}
        </div>
      </div>

      <H3>间距</H3>
      <P>--space-0 .. --space-24, 4px 基准乘 --density-space; 档名与 Tailwind 的 p-N 一一对应。上方切换密度这里同步收放。</P>
      <div data-density={density} className={`${STAGE} ${DEMO_CLASS.rows}`}>
        {Array.from({ length: TOKEN_SPACE_COUNT }, (_, n) => n).map((n) => (
          <div key={n} className={SCALE_ROW}>
            <div className={`${LABEL} ${SCALE_NAME}`}>--space-{n}</div>
            <div className="h-3 rounded-sm bg-primary/70" style={{ width: `var(--space-${n})` }} />
          </div>
        ))}
      </div>
    </>
  );
}
