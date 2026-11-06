import type { JSX } from "react";
import { DEMO_PREVIEW_ALIGN_STRETCH } from "../../../../src/constants/docs-demos";
import { Gallery, type MediaItem } from "../../../../src/media";
import { Callout, Code, H2, P, Preview } from "../../components/DocKit";
import { Props } from "../../components/DocSpec";
import { useDemoImages } from "../../components/MediaDemo";

const LABELS = ["一", "二", "三", "四", "五", "六"] as const;

/**
 * Gallery 文档页: 列数与比例, 键盘焦点, 点击打开灯箱.
 */
export function GalleryPage(): JSX.Element {
  const images = useDemoImages(LABELS);
  const items: MediaItem[] = images.map((image, at) => ({
    src: image.src,
    srcSet: image.srcSet,
    sizes: "(min-width: 640px) 33vw, 50vw",
    placeholder: image.placeholder,
    alt: `示例图 ${LABELS[at]}`,
    caption: `第 ${LABELS[at]} 张`,
  }));
  return (
    <>
      <P>
        多图网格, 每格是真实的 <Code>button</Code>: Tab 进入, 方向键在格子间移动, Home / End 到首尾,
        Enter 或点击打开灯箱. 窄屏最多两列.
      </P>
      <Callout title="焦点归还">关闭灯箱后焦点回到当前图所在的格子, 即使在灯箱里翻到了别的图.</Callout>

      <H2>三列, 4 比 3</H2>
      <Preview align={DEMO_PREVIEW_ALIGN_STRETCH} code={`<Gallery items={items} columns={3} ratio={4 / 3} />`}>
        <Gallery items={items} columns={3} ratio={4 / 3} className="w-full" />
      </Preview>

      <H2>两列方图, 不开灯箱</H2>
      <Preview align={DEMO_PREVIEW_ALIGN_STRETCH} code={`<Gallery items={items} columns={2} ratio={1} lightbox={false} />`}>
        <Gallery items={items.slice(0, 4)} columns={2} ratio={1} lightbox={false} className="w-full" />
      </Preview>

      <H2>属性</H2>
      <Props spec={`
Gallery.items ~ MediaItem[] ~ - ~ src, alt, srcSet, sizes, thumbSrc, placeholder, caption
Gallery.columns ~ number ~ 3 ~ 列数 1 到 6
Gallery.ratio ~ number ~ 4 / 3 ~ 每格宽高比
Gallery.lightbox ~ boolean ~ true ~ 点击打开灯箱
Gallery.index / defaultIndex ~ number | null ~ null ~ 灯箱当前序号, null 为关闭
Gallery.onIndexChange ~ (index: number | null) => void ~ - ~ 序号变化
Gallery.onItemClick ~ (item, { index }) => void ~ - ~ 格子被激活
Gallery.classNames ~ { root, item, trigger, image, caption } ~ - ~ 插槽类名
`} />
    </>
  );
}
