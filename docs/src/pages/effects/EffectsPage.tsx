import type { JSX } from "react";
import { BACKDROP_VARIANT, BEAM_TONE, EFFECTS_DOC, GLASS_TINT } from "../../../../src/constants/effects";
import { Backdrop, BorderBeam, GlassPanel, Marquee, SpotlightCard } from "../../../../src/effects";
import { Callout, Code, H2, P, Preview } from "../../components/DocKit";
import { Props } from "../../components/DocSpec";
import { EffectsBackgrounds } from "./EffectsBackgrounds";
import {
  DEMO_BEAM_SLOW_SECONDS,
  DEMO_GLASS_BLUR_STRONG,
  DEMO_PANEL_PADDING_CLASS,
  DEMO_PREVIEW_ALIGN_STRETCH,
  DEMO_STACK_COLUMN_CLASS,
  DEMO_TECH_STACK_LABEL,
} from "../../../../src/constants/docs-demos";

const BACKDROPS = Object.values(BACKDROP_VARIANT);

/** 跑马灯示例的一行标签. */
function Chips(): JSX.Element {
  return (
    <>
      {EFFECTS_DOC.chips.map((chip) => (
        <span key={chip} className={EFFECTS_DOC.chip}>{chip}</span>
      ))}
    </>
  );
}

/**
 * 视觉效果件文档页: SpotlightCard, BorderBeam, Marquee, Backdrop, GlassPanel,
 * 以及 EffectsBackgrounds 一节 (MeshGradient, Grain, Beam, GridLines, MaskFade, GradientBorder).
 * 集成前从源码相对路径引入, 集成分片接好公共导出后可改为从 @hx/ui 引入.
 *
 * .agents/notes/implemented/feature/2026-11-01-visual-effects.md
 */
export function EffectsPage(): JSX.Element {
  return (
    <>
      <P>
        五个纯表现型部件, 都是可选的装饰层: 不改宿主布局, 不拦截点击, 颜色全部来自语义令牌.
        样式在 <Code>effects.css</Code>, 组件里只有类名与 CSS 变量.
      </P>
      <Callout title="减弱动效">
        系统开启 "减弱动效" 时: 光斑不跟随, 流光停转成淡色描边, 跑马灯停住并隐藏复制件, 极光静止.
        状态与信息不丢, 只是不再有过程.
      </Callout>

      <H2>SpotlightCard</H2>
      <P>
        指针跟随的径向光斑. 坐标直接写到元素的 <Code>--spot-x / --spot-y</Code>, 不走 React state, 每帧最多写一次.
        触屏, 触控笔与低核数设备不注册跟随; Tab 聚焦时光斑在中心静态亮起.
      </P>
      <Preview
        code={`<SpotlightCard className="rounded-xl border border-border bg-card p-4">
  <h3>指针光斑</h3>
  <p>鼠标移入看光斑跟随</p>
</SpotlightCard>`}
      >
        {EFFECTS_DOC.spotItems.map((item) => (
          <SpotlightCard key={item.title} tabIndex={0} className={EFFECTS_DOC.tile}>
            <span className={EFFECTS_DOC.tileTitle}>{item.title}</span>
            <span className={EFFECTS_DOC.tileText}>{item.text}</span>
          </SpotlightCard>
        ))}
      </Preview>

      <H2>BorderBeam</H2>
      <P>
        沿宿主 1px 边框流动的一段光. 放进任意 <Code>relative</Code> 带圆角的容器, 光环用 mask 挖空,
        宽度恒等于边框, 不会加粗. 多条光束用 <Code>delay</Code> 错开, <Code>reverse</Code> 反向.
      </P>
      <Preview
        code={`<div className="relative rounded-xl border border-border bg-card p-4">
  <BorderBeam />
  主色流光
</div>
<div className="relative rounded-xl border border-border bg-card p-4">
  <BorderBeam tone="accent" duration={8} reverse />
  辅色, 反向, 8 秒一圈
</div>`}
      >
        <div className={`relative ${EFFECTS_DOC.tile}`}>
          <BorderBeam />
          <span className={EFFECTS_DOC.tileTitle}>主色流光</span>
          <span className={EFFECTS_DOC.tileText}>默认 6 秒一圈</span>
        </div>
        <div className={`relative ${EFFECTS_DOC.tile}`}>
          <BorderBeam tone={BEAM_TONE.accent} duration={DEMO_BEAM_SLOW_SECONDS} reverse />
          <span className={EFFECTS_DOC.tileTitle}>辅色反向</span>
          <span className={EFFECTS_DOC.tileText}>8 秒一圈, 逆时针</span>
        </div>
      </Preview>

      <H2>Marquee</H2>
      <P>
        无限滚动. 内容渲染多份并同步平移, 首尾无缝; 只有第一份进入可访问性树, 复制件带
        <Code>aria-hidden</Code> 与 <Code>inert</Code>. 键盘焦点进入时总是暂停, 悬停暂停由 <Code>pauseOnHover</Code> 打开.
      </P>
      <Preview
        align={DEMO_PREVIEW_ALIGN_STRETCH}
        code={`<Marquee pauseOnHover fade>
  {items.map((item) => <Chip key={item}>{item}</Chip>)}
</Marquee>
<Marquee reverse fade duration={24}>...</Marquee>`}
      >
        <div className={DEMO_STACK_COLUMN_CLASS}>
          <Marquee pauseOnHover fade aria-label={DEMO_TECH_STACK_LABEL}>
            <Chips />
          </Marquee>
          <Marquee reverse fade duration={EFFECTS_DOC.marqueeSeconds}>
            <Chips />
          </Marquee>
        </div>
      </Preview>

      <H2>Backdrop</H2>
      <P>
        三种底纹: <Code>grid</Code> 网格线, <Code>dots</Code> 点阵, <Code>aurora</Code> 极光.
        底纹垫在子内容下面, 默认从中心向四周渐隐; aurora 的漂移只动 transform.
      </P>
      <Preview
        align={DEMO_PREVIEW_ALIGN_STRETCH}
        code={`<Backdrop variant="grid" className="h-48 rounded-xl border">...</Backdrop>
<Backdrop variant="dots" size={20}>...</Backdrop>
<Backdrop variant="aurora">...</Backdrop>`}
      >
        <div className="grid w-full gap-3 md:grid-cols-3">
          {BACKDROPS.map((variant) => (
            <Backdrop key={variant} variant={variant} size={EFFECTS_DOC.gridSize} className={EFFECTS_DOC.stage}>
              <span className={EFFECTS_DOC.tileTitle}>{variant}</span>
            </Backdrop>
          ))}
        </div>
      </Preview>

      <H2>GlassPanel</H2>
      <P>
        毛玻璃面板: backdrop-blur 加半透明表面与 1px 描边. 只有压在底纹, 图片或渐变上才看得出效果;
        不支持 backdrop-filter 的环境回退为不透明表面.
      </P>
      <Preview
        align={DEMO_PREVIEW_ALIGN_STRETCH}
        code={`<Backdrop variant="aurora" className="h-48 rounded-xl border">
  <GlassPanel className="p-4">默认</GlassPanel>
  <GlassPanel blur="lg" tint="primary" className="p-4">主色染色</GlassPanel>
</Backdrop>`}
      >
        <Backdrop variant={BACKDROP_VARIANT.aurora} fade={false} className={`${EFFECTS_DOC.stage} gap-4`}>
          <GlassPanel className={DEMO_PANEL_PADDING_CLASS}>
            <span className={EFFECTS_DOC.tileTitle}>默认玻璃</span>
          </GlassPanel>
          <GlassPanel blur={DEMO_GLASS_BLUR_STRONG} tint={GLASS_TINT.primary} className={DEMO_PANEL_PADDING_CLASS}>
            <span className={EFFECTS_DOC.tileTitle}>主色染色</span>
          </GlassPanel>
        </Backdrop>
      </Preview>

      <EffectsBackgrounds />

      <H2>属性</H2>
      <Props spec={`
SpotlightCard.size ~ number ~ 320 ~ 光斑直径 (px)
BorderBeam.duration ~ number ~ 6 ~ 绕边一圈的秒数
BorderBeam.delay ~ number ~ 0 ~ 起步延迟 (秒)
BorderBeam.tone ~ "primary" | "accent" ~ "primary" ~ 光束取色
BorderBeam.reverse ~ boolean ~ false ~ 逆时针流动
Marquee.pauseOnHover ~ boolean ~ false ~ 悬停暂停 (焦点进入总是暂停)
Marquee.reverse ~ boolean ~ false ~ 反向滚动
Marquee.vertical ~ boolean ~ false ~ 纵向滚动
Marquee.repeat ~ number ~ 2 ~ 内容份数, 至少 2
Marquee.duration ~ number ~ 40 ~ 滚完一份的秒数
Marquee.gap ~ string ~ 1rem ~ 间距, 任意 CSS 长度
Marquee.fade ~ boolean ~ false ~ 两端渐隐
Backdrop.variant ~ "grid" | "dots" | "aurora" ~ "grid" ~ 底纹种类
Backdrop.size ~ number ~ 24 ~ 格距 / 点距 (px)
Backdrop.fade ~ boolean ~ true ~ 中心向四周渐隐
Backdrop.animated ~ boolean ~ true ~ aurora 漂移
GlassPanel.blur ~ "sm" | "md" | "lg" ~ "md" ~ 模糊档
GlassPanel.tint ~ "neutral" | "primary" ~ "neutral" ~ 染色
`} />
    </>
  );
}
