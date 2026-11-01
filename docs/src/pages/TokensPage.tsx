import { useState, type JSX } from "react";
import { H2, H3, P } from "../components/DocKit";
import { DEMO_CLASS, NATIVE_BUTTON_TYPE, THEME_MODE, THEME_MODE_ATTR } from "../../../src/constants/docs-legacy";

/** 色板: 直接把 CSS 变量的值渲染出来, 不写死色值  换肤时这里自动跟着变。 */
const COLORS = [
  { name: "--background", use: "页面底" },
  { name: "--foreground", use: "正文" },
  { name: "--card", use: "卡片面" },
  { name: "--popover", use: "浮层面" },
  { name: "--primary", use: "主色 / 主操作" },
  { name: "--secondary", use: "次要面" },
  { name: "--muted", use: "静默面" },
  { name: "--accent", use: "hover / 选中底" },
  { name: "--muted-foreground", use: "次要文字" },
  { name: "--border", use: "所有线条" },
  { name: "--input", use: "输入控件底" },
  { name: "--ring", use: "聚焦环" },
  { name: "--destructive", use: "危险" },
];

/** 表面三级: 由低到高, 暗色越高越亮, 亮色靠阴影拉开 */
const SURFACES = [
  { name: "--surface-sunken", use: "内嵌 / 凹槽", shadow: "--shadow-inner" },
  { name: "--background", use: "页面底", shadow: "" },
  { name: "--surface-raised", use: "抬起的卡片", shadow: "--shadow-md" },
  { name: "--surface-overlay", use: "浮层 / 弹窗", shadow: "--shadow-2xl" },
];

/** 品牌辅色: subtle 是浅底, glow 是光晕, accent-2 与 primary 组成渐变 */
const BRAND = [
  { name: "--primary-subtle", use: "浅色强调底" },
  { name: "--primary-glow", use: "光晕色" },
  { name: "--accent-2", use: "第二品牌色" },
  { name: "--gradient-brand", use: "品牌渐变" },
];

const RADII = [
  { name: "--radius-sm", use: "极少用" },
  { name: "--radius-md", use: "列表项 / 小控件" },
  { name: "--radius-lg", use: "按钮 / 输入框 (最常用)" },
  { name: "--radius-xl", use: "卡片 / 面板" },
  { name: "--radius-2xl", use: "大面板 / Bento 格" },
];

const SHADOWS = ["--shadow-xs", "--shadow-sm", "--shadow-md", "--shadow-lg", "--shadow-xl", "--shadow-2xl", "--shadow-glow", "--ring-glow"];

/** 缓动对比: 同一段位移, 同一时长, 只换曲线 */
const EASINGS = [
  { name: "--ease-out", use: "进入 / 反馈" },
  { name: "--ease-in-out", use: "屏内移动" },
  { name: "--ease-emphasized", use: "强调入场" },
  { name: "--ease-spring", use: "弹簧 (linear(), 旧浏览器回退 cubic-bezier)" },
];

/** 关键帧工具类: 类名必须写全, Tailwind 才扫得到 */
const ANIMATIONS = [
  "animate-fade-in", "animate-fade-up", "animate-fade-down", "animate-scale-in", "animate-blur-in",
  "animate-slide-in-left", "animate-slide-in-right", "animate-pop", "animate-float", "animate-glow-pulse",
];

const LABEL = "font-mono text-(length:--fs-xs) text-muted-foreground";
const CAPTION = "text-(length:--fs-xs) text-muted-foreground/70";
const SWATCH_CARD = "overflow-hidden rounded-xl border border-border";
const SWATCH_INFO = "border-t border-border bg-card/40 px-3 py-2";
const GRID = "grid grid-cols-[repeat(auto-fill,minmax(200px,1fr))] gap-3";
const BUTTON = "rounded-lg border border-border px-2.5 py-1.5 text-(length:--fs-sm) transition-colors hover:bg-accent";
const TILE = "flex flex-col items-center gap-2";
const SURFACE_STAGE = "flex flex-wrap gap-6 rounded-xl bg-card/20 p-6";

/** 一块色样: 色块 + 变量名 + 用途 */
function Swatch({ name, use }: { name: string; use: string }): JSX.Element {
  return (
    <div className={SWATCH_CARD}>
      <div className="h-14" style={{ background: `var(${name})` }} />
      <div className={SWATCH_INFO}>
        <div className={LABEL}>{name}</div>
        <div className={CAPTION}>{use}</div>
      </div>
    </div>
  );
}

/**
 * 令牌页: 颜色 / 表面 / 品牌 / 圆角 / 阴影 / 动效 / 字号 / 间距.
 * .agents/notes/implemented/feature/2026-11-01-design-tokens-depth-motion.md
 */
export function TokensPage(): JSX.Element {
  const [mode, setMode] = useState<"dark" | "light">(
    () => (document.documentElement.getAttribute(THEME_MODE_ATTR) as "dark" | "light") ?? THEME_MODE.dark,
  );
  const [moved, setMoved] = useState(false);
  const [replay, setReplay] = useState(0);

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

      <H2>圆角</H2>
      <P>全部由一个 <code className="rounded-md bg-muted/60 px-1.5 py-0.5 font-mono text-(length:--fs-xs-half)">--radius</code> 派生, 改它就整站改手感。</P>
      <div className="flex flex-wrap gap-4">
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

      <H2>动效</H2>
      <P>时长五档: instant 80 / fast 120 / base 200 / slow 300 / emphasized 500 (ms)。系统减弱动效时全部归零, 弹簧退回 ease-out。</P>
      <button type={NATIVE_BUTTON_TYPE} onClick={() => setMoved((v) => !v)} className={`mb-3 ${BUTTON}`}>
        播放曲线对比
      </button>
      <div className={DEMO_CLASS.rows}>
        {EASINGS.map((e) => (
          <div key={e.name} className="flex items-center gap-4">
            <div className="w-44 shrink-0">
              <div className={LABEL}>{e.name}</div>
              <div className={CAPTION}>{e.use}</div>
            </div>
            <div className="relative h-6 flex-1 rounded-md bg-surface-sunken">
              <div
                className="absolute top-1 left-1 size-4 rounded-full bg-primary transition-transform"
                style={{
                  transform: moved ? "translateX(12rem)" : "translateX(0)",
                  transitionDuration: "var(--duration-emphasized)",
                  transitionTimingFunction: `var(${e.name})`,
                }}
              />
            </div>
          </div>
        ))}
      </div>
      <H3>关键帧</H3>
      <button type={NATIVE_BUTTON_TYPE} onClick={() => setReplay((n) => n + 1)} className={`mb-3 ${BUTTON}`}>
        重放入场
      </button>
      <div key={replay} className={GRID}>
        {ANIMATIONS.map((a) => (
          <div key={a} className={`rounded-xl border border-border bg-surface-raised p-4 shadow-md ${a}`}>
            <div className={LABEL}>{a}</div>
          </div>
        ))}
        <div className="hx-skeleton h-14" />
      </div>

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
