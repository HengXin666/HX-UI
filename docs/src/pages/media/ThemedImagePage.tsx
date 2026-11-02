import type { JSX } from "react";
import { MEDIA_DOC, MEDIA_MODE } from "../../../../src/constants/media";
import { ThemedImage } from "../../../../src/media";
import { Callout, Code, H2, P, Preview } from "../../components/DocKit";
import { Props } from "../../components/DocSpec";
import { useDemoImages } from "../../components/MediaDemo";

/**
 * ThemedImage 文档页: 亮暗双图跟随 data-mode, 纯 CSS 切换无闪烁.
 *
 * .agents/notes/implemented/feature/2026-11-02-media-primitives.md
 */
export function ThemedImagePage(): JSX.Element {
  const [light] = useDemoImages(["亮色图"], "--accent");
  const [dark] = useDemoImages(["暗色图"], "--primary");
  return (
    <>
      <P>
        产品截图常有亮暗两版. <Code>ThemedImage</Code> 同时渲染两张, 由祖先的 <Code>data-mode</Code> 决定显示哪张,
        切主题不经过 JS, 首帧就是对的. 隐藏的一张为 display:none, 懒加载下不会下载.
      </P>
      <Callout title="试一试">切换右上角主题, 下面的图会跟着换.</Callout>

      <H2>跟随主题</H2>
      <Preview code={`<ThemedImage lightSrc={light} darkSrc={dark} ratio={16 / 9} alt="控制台截图" />`}>
        <div className={MEDIA_DOC.frameWidthClass}>
          {light && dark && <ThemedImage lightSrc={light.src} darkSrc={dark.src} ratio={16 / 9} alt="控制台截图" />}
        </div>
      </Preview>

      <H2>强制某一版</H2>
      <Preview code={`<ThemedImage mode="light" lightSrc={light} darkSrc={dark} width={320} height={180} alt="..." />`}>
        {light && dark && <ThemedImage mode={MEDIA_MODE.light} lightSrc={light.src} darkSrc={dark.src} width={320} height={180} alt="强制亮色" />}
      </Preview>

      <H2>属性</H2>
      <Props spec={`
ThemedImage.lightSrc ~ string ~ - ~ 亮色主题图片
ThemedImage.darkSrc ~ string ~ - ~ 暗色主题图片
ThemedImage.lightSrcSet / darkSrcSet ~ string ~ - ~ 各自的 srcSet
ThemedImage.mode ~ "light" | "dark" ~ - ~ 强制一版, 不传跟随 data-mode
ThemedImage.其余 ~ ImageProps ~ - ~ 与 Image 相同 (尺寸, 占位, 焦点...)
ThemedImage.classNames ~ { root, light, dark } ~ - ~ 插槽类名
`} />
    </>
  );
}
