import type { JSX } from "react";
import { BACKDROP_VARIANT, EFFECTS_DOC, GRAIN_BLEND, MASK_FADE_DIRECTION } from "../../../../src/constants/effects";
import { Backdrop, Beam, GradientBorder, Grain, GridLines, MaskFade, MeshGradient } from "../../../../src/effects";
import { Callout, Code, H2, P, Preview } from "../../components/DocKit";
import { Props } from "../../components/DocSpec";
import { DEMO_PREVIEW_ALIGN_STRETCH } from "../../../../src/constants/docs-demos";

const MASK_DIRECTIONS = Object.values(MASK_FADE_DIRECTION);
const MASK_ROWS = Array.from({ length: EFFECTS_DOC.maskRows }, (_, index) => index);

/** 遮罩示例的填充内容: 一列等高的卡片条, 看得出边缘怎么淡出. */
function MaskContent(): JSX.Element {
	return (
		<div className={EFFECTS_DOC.maskList}>
			{MASK_ROWS.map((row) => (
				<span key={row} className={EFFECTS_DOC.chip}>{`${EFFECTS_DOC.chips[row % EFFECTS_DOC.chips.length]}`}</span>
			))}
		</div>
	);
}

/**
 * 效果件文档页的商业页背景与遮罩一节: MeshGradient, Grain, Beam, GridLines, MaskFade, GradientBorder.
 * 由 EffectsPage 渲染在属性表之前.
 */
export function EffectsBackgrounds(): JSX.Element {
	return (
		<>
			<H2>商业页背景与遮罩</H2>
			<P>
				六个落地页常用的质感层: 多色 mesh, 噪点颗粒, 光束光晕, 网格准星, 边缘淡出与静态渐变描边.
				颜色只接受语义令牌名 (例如 <Code>"accent-2"</Code>), 拼色在纯 ts 里完成, 不会出现字面色值.
			</P>
			<Callout title="减弱动效">mesh 漂移与光束呼吸在减弱动效时静止; 颗粒, 网格, 遮罩与描边本身就是静态的.</Callout>

			<H2>MeshGradient</H2>
			<P>
				每个令牌一团径向光, 至少三色. <Code>intensity</Code> 0..1 调混入比例, <Code>animated</Code> 控制漂移.
			</P>
			<Preview
				align={DEMO_PREVIEW_ALIGN_STRETCH}
				code={`<MeshGradient className="h-56 rounded-xl border" />
<MeshGradient colors={["primary", "accent-2", "success", "warning"]} intensity={0.85} animated={false} />`}
			>
				<div className="grid w-full gap-3 md:grid-cols-2">
					<MeshGradient className={EFFECTS_DOC.stageTall}>
						<span className={EFFECTS_DOC.tileTitle}>默认三色, 漂移</span>
					</MeshGradient>
					<MeshGradient colors={EFFECTS_DOC.meshTokens} intensity={EFFECTS_DOC.meshIntensityStrong} animated={false} className={EFFECTS_DOC.stageTall}>
						<span className={EFFECTS_DOC.tileTitle}>四色, 强, 静止</span>
					</MeshGradient>
				</div>
			</Preview>

			<H2>Grain</H2>
			<P>
				SVG feTurbulence 灰阶噪声, 不引图片. 放在宿主最后, 盖在内容上但不拦截点击; 叠在 mesh 上最能去掉渐变的塑料感.
			</P>
			<Preview
				align={DEMO_PREVIEW_ALIGN_STRETCH}
				code={`<MeshGradient className="relative h-56 rounded-xl border">
  ...
  <Grain opacity={0.2} blend="soft-light" />
</MeshGradient>`}
			>
				<MeshGradient className={EFFECTS_DOC.stageTall}>
					<span className={EFFECTS_DOC.tileTitle}>mesh + grain</span>
					<Grain opacity={EFFECTS_DOC.grainOpacityStrong} blend={GRAIN_BLEND.softLight} />
				</MeshGradient>
			</Preview>

			<H2>Beam</H2>
			<P>
				光源处一团光晕, 向下投出一道模糊光锥. <Code>angle</Code> 偏转, <Code>x / y</Code> 定光源, <Code>color</Code> 传令牌名.
				垫在内容下面, 放进 isolate 宿主 (Backdrop, MeshGradient, GridLines) 里用.
			</P>
			<Preview
				align={DEMO_PREVIEW_ALIGN_STRETCH}
				code={`<Backdrop variant="dots" className="h-56 rounded-xl border">
  <Beam x={30} angle={-24} />
  <Beam x={70} angle={24} color="success" animated />
</Backdrop>`}
			>
				<Backdrop variant={BACKDROP_VARIANT.dots} className={EFFECTS_DOC.stageTall}>
					<Beam x={EFFECTS_DOC.beamLeftX} angle={EFFECTS_DOC.beamAngleLeft} />
					<Beam x={EFFECTS_DOC.beamRightX} angle={EFFECTS_DOC.beamAngleRight} color="success" animated />
					<span className={EFFECTS_DOC.tileTitle}>双光束</span>
				</Backdrop>
			</Preview>

			<H2>GridLines</H2>
			<P>
				1px 网格, 每隔 <Code>crossEvery</Code> 格在交点画一个十字准星. <Code>size</Code> 调格距, <Code>fade</Code> 向四周渐隐.
			</P>
			<Preview
				align={DEMO_PREVIEW_ALIGN_STRETCH}
				code={`<GridLines className="h-56 rounded-xl border" />
<GridLines size={24} crossEvery={3} fade={false} />`}
			>
				<div className="grid w-full gap-3 md:grid-cols-2">
					<GridLines className={EFFECTS_DOC.stageTall}>
						<span className={EFFECTS_DOC.tileTitle}>默认 32px, 每 4 格</span>
					</GridLines>
					<GridLines size={EFFECTS_DOC.gridSize} crossEvery={3} fade={false} className={EFFECTS_DOC.stageTall}>
						<span className={EFFECTS_DOC.tileTitle}>20px, 每 3 格, 不淡化</span>
					</GridLines>
				</div>
			</Preview>

			<H2>MaskFade</H2>
			<P>
				用 <Code>mask-image</Code> 让子内容在指定边淡出. 长度默认读 <Code>--mask-fade</Code> 令牌, <Code>length</Code> 可按实例覆盖.
			</P>
			<Preview
				align={DEMO_PREVIEW_ALIGN_STRETCH}
				code={`<MaskFade direction="bottom"><List /></MaskFade>
<MaskFade direction="radial" length="4rem"><List /></MaskFade>`}
			>
				<div className="grid w-full gap-3 md:grid-cols-4">
					{MASK_DIRECTIONS.map((direction) => (
						<div key={direction} className="flex flex-col gap-2">
							<span className={EFFECTS_DOC.tileText}>{direction}</span>
							<MaskFade direction={direction} length={EFFECTS_DOC.maskFadeLength} className="h-40 overflow-hidden rounded-xl border border-border">
								<MaskContent />
							</MaskFade>
						</div>
					))}
				</div>
			</Preview>

			<H2>GradientBorder</H2>
			<P>
				静态渐变描边, 叠在宿主的 1px 边框上; <Code>padding: 1px</Code> 加 mask 挖空, 永远只有 1px.
			</P>
			<Preview
				code={`<div className="relative rounded-xl border border-transparent bg-card p-4">
  <GradientBorder />
</div>
<div className="relative rounded-xl ..."><GradientBorder colors={["success", "accent-2", "primary"]} angle={90} /></div>`}
			>
				<div className={`relative ${EFFECTS_DOC.tile}`}>
					<GradientBorder />
					<span className={EFFECTS_DOC.tileTitle}>主色到青色</span>
					<span className={EFFECTS_DOC.tileText}>默认 135deg</span>
				</div>
				<div className={`relative ${EFFECTS_DOC.tile}`}>
					<GradientBorder colors={EFFECTS_DOC.gradientBorderTokens} angle={90} />
					<span className={EFFECTS_DOC.tileTitle}>三色</span>
					<span className={EFFECTS_DOC.tileText}>90deg, 令牌名传入</span>
				</div>
			</Preview>

			<H2>背景与遮罩属性</H2>
			<Props spec={`
MeshGradient.colors ~ string[] ~ ["primary", "accent-2", "success"] ~ 语义令牌名, 每个一团光
MeshGradient.intensity ~ number ~ 0.6 ~ 强度 0..1
MeshGradient.animated ~ boolean ~ true ~ 漂移
MeshGradient.fade ~ boolean ~ false ~ 中心向四周渐隐
Grain.opacity ~ number ~ 0.12 ~ 颗粒不透明度
Grain.blend ~ "normal" | "overlay" | "soft-light" | "multiply" | "screen" ~ "overlay" ~ 混合方式
Beam.angle ~ number ~ 18 ~ 偏转角 (deg)
Beam.x / Beam.y ~ number ~ 50 / 0 ~ 光源位置 (%)
Beam.width ~ number ~ 180 ~ 光束宽度 (px)
Beam.color ~ string ~ "primary" ~ 语义令牌名
Beam.intensity ~ number ~ 0.7 ~ 强度 0..1
Beam.animated ~ boolean ~ false ~ 呼吸
GridLines.size ~ number ~ 32 ~ 格距 (px)
GridLines.crossEvery ~ number ~ 4 ~ 准星间隔格数, 0 关闭
GridLines.fade ~ boolean ~ true ~ 中心向四周渐隐
MaskFade.direction ~ "top" | "bottom" | "left" | "right" | "x" | "y" | "radial" ~ "bottom" ~ 淡出方向
MaskFade.length ~ number | string ~ --mask-fade ~ 淡出长度, 数字按 px
GradientBorder.colors ~ string[] ~ ["primary", "accent-2"] ~ 色标令牌名
GradientBorder.angle ~ number ~ 135 ~ 渐变角度 (deg)
`} />
		</>
	);
}
