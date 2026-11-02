import { useState, type JSX } from "react";
import { H2, H3, P } from "../components/DocKit";
import { DEMO_CLASS, NATIVE_BUTTON_TYPE, THEME_MODE, THEME_MODE_ATTR } from "../../../src/constants/docs-legacy";
import { TOKEN_DENSITY, type TokenDensity } from "../../../src/constants/docs-tokens";
import { ColorSections } from "./tokens/ColorSections";
import { LayoutSections } from "./tokens/LayoutSections";
import { MotionSections } from "./tokens/MotionSections";
import { ShapeSections } from "./tokens/ShapeSections";
import { SizeSections } from "./tokens/SizeSections";
import { BUTTON } from "./tokens/impl/token-classes";

/**
 * 令牌页外壳: 主题切换, 密度状态, 各分区按顺序拼装; 字号与按容器角色的间距表仍留在这里.
 * 分区在 ./tokens/ 下按职责拆分: 颜色与色板 / 尺寸与间距 (--control-h-* 与 --space-*) / 圆角与阴影 / 容器与节奏 / 动效.
 * .agents/notes/implemented/feature/2026-11-01-design-tokens-depth-motion.md
 */
export function TokensPage(): JSX.Element {
  const [mode, setMode] = useState<"dark" | "light">(
    () => (document.documentElement.getAttribute(THEME_MODE_ATTR) as "dark" | "light") ?? THEME_MODE.dark,
  );
  const [density, setDensity] = useState<TokenDensity>(TOKEN_DENSITY.default);

  const flip = (): void => {
    const next = mode === THEME_MODE.dark ? THEME_MODE.light : THEME_MODE.dark;
    setMode(next);
    document.documentElement.setAttribute(THEME_MODE_ATTR, next);
  };

  return (
    <>
      <P>
        所有颜色、圆角、阴影、动效曲线都来自 CSS 变量。组件里出现任何硬编色值都是错的 
        换肤只需改这一层, 组件代码一行不动。
      </P>
      <button type={NATIVE_BUTTON_TYPE} onClick={flip} className={`mb-2 ${BUTTON}`}>
        切到{mode === THEME_MODE.dark ? "亮色" : "暗色"}
      </button>

      <ColorSections />
      <SizeSections density={density} onDensity={setDensity} />
      <ShapeSections />
      <LayoutSections density={density} />
      <MotionSections />

      <H2>字号</H2>
      <P>只放行七档。不要自创中间值。</P>
      <div className={DEMO_CLASS.rows}>
        {[
          { cls: "text-[20px]", label: "20px", use: "页面标题 / 统计数字" },
          { cls: "text-[15px]", label: "15px", use: "分组标题" },
          { cls: "text-[14px]", label: "14px", use: "卡片标题" },
          { cls: "text-[13px]", label: "13px", use: "正文 (最常用)" },
          { cls: DEMO_CLASS.fontSize12, label: "12px", use: "说明文字" },
          { cls: "text-[11px]", label: "11px", use: "标签 / 角标" },
          { cls: "text-[10px]", label: "10px", use: "极少用" },
        ].map((t) => (
          <div key={t.label} className="flex items-baseline gap-4 border-b border-border/40 pb-2 last:border-0">
            <span className={`${t.cls} w-24 shrink-0 text-foreground`}>{t.label}</span>
            <span className="text-(length:--fs-sm) text-muted-foreground">{t.use}</span>
          </div>
        ))}
      </div>

      <H2>间距</H2>
      <H3>按容器角色</H3>
      <div className="overflow-hidden rounded-xl border border-border text-(length:--fs-sm)">
        {[
          ["紧凑列表项 (h≈40)", "px-3 py-2.5"],
          ["标准卡片", "px-3.5 pt-3 pb-3"],
          ["宽松卡片 / 设置面板", DEMO_CLASS.padLoose],
          ["页面外层", "px-8"],
          ["Popover 内菜单项", "px-2.5 py-1.5"],
        ].map(([use, cls]) => (
          <div key={cls} className="flex items-center justify-between border-b border-border/40 px-3 py-2 last:border-0">
            <span className={DEMO_CLASS.mutedText}>{use}</span>
            <code className="font-mono text-link">{cls}</code>
          </div>
        ))}
      </div>
    </>
  );
}
