import type { JSX, ReactNode } from "react";
import { ActivityIcon, BoxesIcon, GaugeIcon, LayersIcon, MoonStarIcon, SparklesIcon, WandSparklesIcon } from "lucide-react";
import {
  AnimatedNumber,
  Backdrop,
  Bento,
  BentoItem,
  BorderBeam,
  GlassPanel,
  Marquee,
  Reveal,
  SpotlightCard,
  Stagger,
  StaggerItem,
} from "@hx/ui";
import {
  BENTO_GRID,
  BENTO_TILES,
  CTA_SURFACE,
  DEMO_FIGURES,
  FIGURE_SPRING,
  GALLERY_CLS as CLS,
  HERO_ANCHOR,
  HERO_REVEAL,
  HERO_SURFACE,
  MINI_BAR_HEIGHTS,
  PRINCIPLE_COPY,
  PRINCIPLE_PRESET,
  SECTION_COPY,
  SECTION_REVEAL_AMOUNT,
  TECH_MARQUEE,
  TECH_STACK,
} from "../../../../src/constants/gallery";
import { DashboardShowcase } from "./DashboardShowcase";

/**
 * 展示画廊: 用 UI 丰富度改造的新件 (动效, 布局原语, 视觉效果, 指标卡) 拼一张落地页.
 * 不是组件清单, 而是 "这库能不能直接做出一张好看的首页" 的答卷: 每个新件只出现在它该出现的位置.
 * 颜色全部来自语义令牌 (primary / accent-2 / muted / border 与 --gradient-brand 系列), 线条 1px,
 * 动效全部经 motion 组件或带 reduced-motion 兜底的工具类, 系统减弱动效时页面直接落到终态.
 * 类名, 数字, 节奏与文案取自 src/constants/gallery.ts, 这里只管结构.
 */

/** 三条设计原则的图标, 按文案的 key 配; 做成光斑卡: 指针移过时才亮, 平时只是安静的 1px 卡片. */
const PRINCIPLE_ICONS: Record<(typeof PRINCIPLE_COPY)[number]["key"], ReactNode> = {
  theme: <MoonStarIcon />,
  motion: <GaugeIcon />,
  stroke: <LayersIcon />,
};

/** 磁贴里的迷你柱形: 主色与辅色两段渐变, 只用令牌. */
function MiniBars(): JSX.Element {
  return (
    <div className={CLS.miniBars} aria-hidden>
      {MINI_BAR_HEIGHTS.map((height, index) => (
        <div
          key={index}
          className={CLS.miniBar}
          style={{ height: `${height}%` }}
        />
      ))}
    </div>
  );
}

/** 区块标题: 小号眉题 + 标题 + 引言, 整组用 Reveal 浮现. */
function SectionHead({ eyebrow, title, children }: { eyebrow: string; title: string; children: ReactNode }): JSX.Element {
  return (
    <Reveal className={CLS.sectionHead}>
      <span className={CLS.eyebrow}>{eyebrow}</span>
      <h2 className={CLS.heading}>{title}</h2>
      <p className={CLS.lead}>{children}</p>
    </Reveal>
  );
}

/** 首屏: 极光底纹 + 渐变标题 + 流光边框的数字条. */
function Hero(): JSX.Element {
  return (
    <Backdrop variant={HERO_SURFACE.backdrop} className={CLS.hero}>
      <div className={CLS.heroInner}>
        <Reveal {...HERO_REVEAL.badge}>
          <span className={CLS.chip}>
            <SparklesIcon className={CLS.chipIcon} aria-hidden />
            UI 丰富度改造 · 第三阶段
          </span>
        </Reveal>
        <Reveal {...HERO_REVEAL.title}>
          <h1 className={CLS.heroTitle}>
            一套令牌, 两种光线,
            <span className={CLS.heroAccent}> 处处有质感</span>
          </h1>
        </Reveal>
        <Reveal {...HERO_REVEAL.lead}>
          <p className={CLS.leadCentered}>
            入场, 交错, 弹簧数字, 便当格, 光斑与流光, 都只是组件的一个属性. 这一页没有一行自定义色值.
          </p>
        </Reveal>
        <Reveal {...HERO_REVEAL.actions} className={CLS.heroActions}>
          <a href={HERO_ANCHOR.install} className={`${CLS.link} ${CLS.linkPrimary}`}>
            <WandSparklesIcon className={CLS.linkIcon} aria-hidden />
            开始使用
          </a>
          <a href={HERO_ANCHOR.effects} className={`${CLS.link} ${CLS.linkSecondary}`}>
            看视觉效果
          </a>
        </Reveal>
      </div>

      <Reveal {...HERO_REVEAL.figures} className={CLS.heroFigures}>
        <GlassPanel blur={HERO_SURFACE.glassBlur} className={CLS.heroFigurePanel}>
          <BorderBeam duration={HERO_SURFACE.beamDuration} />
          {DEMO_FIGURES.map((item) => (
            <div key={item.label} className={CLS.figureCell}>
              <span className={CLS.figure}>
                <AnimatedNumber value={item.value} from={0} spring={FIGURE_SPRING} />
              </span>
              <span className={CLS.muted}>{item.label}</span>
            </div>
          ))}
        </GlassPanel>
      </Reveal>
    </Backdrop>
  );
}

/**
 * 质感画廊: 首屏, 跑马灯, 便当格, 光斑卡, 仪表盘与收尾.
 */
export function TextureStage(): JSX.Element {
  return (
    <div className={CLS.page}>
      <Hero />

      <Marquee pauseOnHover fade duration={TECH_MARQUEE.duration} aria-label={TECH_MARQUEE.label}>
        {TECH_STACK.map((name) => (
          <span key={name} className={CLS.chip}>{name}</span>
        ))}
      </Marquee>

      <section className={CLS.section}>
        <SectionHead {...SECTION_COPY.features}>
          Bento 负责跨度与回填, 磁贴自带图标, 标题与底栏槽位; 小屏自动收成单列.
        </SectionHead>
        <Reveal amount={SECTION_REVEAL_AMOUNT}>
          <Bento cols={BENTO_GRID.cols} rowHeight={BENTO_GRID.rowHeight} gap={BENTO_GRID.gap} aria-label={BENTO_GRID.label}>
            <BentoItem {...BENTO_TILES.motion} icon={<SparklesIcon />}>
              <div className={CLS.bentoFooter}>
                <MiniBars />
              </div>
            </BentoItem>
            <BentoItem {...BENTO_TILES.layout} icon={<BoxesIcon />} />
            <BentoItem {...BENTO_TILES.stat} icon={<ActivityIcon />} />
            <BentoItem {...BENTO_TILES.effects} icon={<WandSparklesIcon />} />
            <BentoItem {...BENTO_TILES.theme} icon={<MoonStarIcon />} />
          </Bento>
        </Reveal>
      </section>

      <section className={CLS.section}>
        <SectionHead {...SECTION_COPY.principles}>
          把指针移过卡片: 光斑只在需要时出现, 键盘聚焦时在中心静态亮起.
        </SectionHead>
        <Stagger className={CLS.principles}>
          {PRINCIPLE_COPY.map((item) => (
            <StaggerItem key={item.key} preset={PRINCIPLE_PRESET}>
              <SpotlightCard tabIndex={0} className={CLS.tile}>
                <span className={CLS.tileIcon} aria-hidden>
                  {PRINCIPLE_ICONS[item.key]}
                </span>
                <span className={CLS.tileTitle}>{item.title}</span>
                <span className={CLS.muted}>{item.text}</span>
              </SpotlightCard>
            </StaggerItem>
          ))}
        </Stagger>
      </section>

      <section className={CLS.section}>
        <SectionHead {...SECTION_COPY.dashboard}>
          StatCard 的趋势与迷你折线, Stagger 依次入场, 图表与毛玻璃面板压在点阵底纹上.
        </SectionHead>
        <Reveal amount={SECTION_REVEAL_AMOUNT}>
          <DashboardShowcase />
        </Reveal>
      </section>

      <Reveal>
        <Backdrop variant={CTA_SURFACE.backdrop} size={CTA_SURFACE.size} className={CLS.cta}>
          <BorderBeam tone={CTA_SURFACE.beamTone} duration={CTA_SURFACE.beamDuration} reverse />
          <div className={CLS.ctaInner}>
            <h2 className={CLS.heading}>装上就能拼</h2>
            <p className={CLS.lead}>所有新件都从公共入口导出, 样式随 styles.css 一起进来.</p>
            <code className={CLS.install}>
              npm i @hx/ui
            </code>
          </div>
        </Backdrop>
      </Reveal>
    </div>
  );
}
