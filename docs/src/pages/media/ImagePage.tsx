import type { JSX } from "react";
import { DEMO_PREVIEW_ALIGN_STRETCH } from "../../../../src/constants/docs-demos";
import { IMAGE_PLACEHOLDER, MEDIA_DOC } from "../../../../src/constants/media";
import { Image } from "../../../../src/media";
import { Callout, Code, H2, P, Preview } from "../../components/DocKit";
import { Props } from "../../components/DocSpec";
import { useDemoImages } from "../../components/MediaDemo";

const LABELS = ["16 / 9", "焦点 20%", "固定宽高"] as const;

/**
 * Image 文档页: srcSet / sizes, 懒加载, 优先级, 占位, 焦点裁切, 淡入, 失败兜底.
 * 示例图由 useDemoImages 用 canvas 现画, 不引用任何外部地址.
 *
 * .agents/notes/implemented/feature/2026-11-02-media-primitives.md
 */
export function ImagePage(): JSX.Element {
  const images = useDemoImages(LABELS);
  const [wide, focal, fixed] = images;
  return (
    <>
      <P>
        响应式图片原语. <Code>srcSet</Code> 与 <Code>sizes</Code> 原样透传, 默认 <Code>loading="lazy"</Code> 与
        <Code>decoding="async"</Code>; 首屏大图传 <Code>priority</Code> 改为 eager 并加 <Code>fetchpriority="high"</Code>.
      </P>
      <Callout title="防止布局抖动">
        尺寸二选一且必填: 传 <Code>width</Code> + <Code>height</Code> 预留固定比例, 或只传 <Code>ratio</Code> 由 AspectRatio 撑满父宽.
      </Callout>

      <H2>宽高比与模糊占位</H2>
      <P>placeholder 传低清 data URI 时先显示放大模糊的小图, 原图加载完淡入; 减弱动效下直接显示.</P>
      <Preview
        align={DEMO_PREVIEW_ALIGN_STRETCH}
        code={`<Image src={src} srcSet={srcSet} sizes="(min-width: 768px) 50vw, 100vw" ratio={16 / 9} placeholder={tinyDataUri} alt="..." />`}
      >
        <div className={MEDIA_DOC.stageClass}>
          {wide && <Image src={wide.src} srcSet={wide.srcSet} sizes="(min-width: 768px) 50vw, 100vw" ratio={16 / 9} placeholder={wide.placeholder} alt="16 比 9 示例图" />}
          {focal && <Image src={focal.src} srcSet={focal.srcSet} ratio={1} objectPosition="20% 50%" placeholder={focal.placeholder} alt="焦点裁切示例图" />}
        </div>
      </Preview>

      <H2>固定宽高与浅色底</H2>
      <Preview code={`<Image src={src} width={320} height={180} alt="..." priority />`}>
        {fixed && <Image src={fixed.src} width={320} height={180} alt="固定宽高示例图" priority />}
      </Preview>

      <H2>失败兜底</H2>
      <P>加载失败时换成浅色底加图标, 读屏读到 alt. 可用 <Code>fallback</Code> 传自定义内容.</P>
      <Preview code={`<Image src="missing.png" width={240} height={135} alt="缺失的图片" />`}>
        <Image src="missing.png" width={240} height={135} alt="缺失的图片" placeholder={IMAGE_PLACEHOLDER.color} />
      </Preview>

      <H2>属性</H2>
      <Props spec={`
Image.src ~ string ~ - ~ 图片地址, 由调用方传入
Image.alt ~ string ~ - ~ 替代文字, 装饰图传空串
Image.srcSet ~ string ~ - ~ 原样透传
Image.sizes ~ string ~ - ~ 原样透传
Image.width / height ~ number ~ - ~ 与 ratio 二选一, 预留尺寸
Image.ratio ~ number ~ - ~ 宽 / 高, 用 AspectRatio 包一层
Image.priority ~ boolean ~ false ~ eager + fetchpriority=high
Image.loading ~ "lazy" | "eager" ~ "lazy" ~ 原生懒加载
Image.placeholder ~ "color" | "none" | data URI ~ "color" ~ 浅色底或模糊占位
Image.objectPosition ~ string ~ - ~ 焦点裁切
Image.fit ~ "cover" | "contain" ~ "cover" ~ object-fit
Image.fallback ~ ReactNode ~ - ~ 失败时的内容
Image.classNames ~ { root, placeholder, img, fallback, fallback-icon } ~ - ~ 插槽类名
`} />
    </>
  );
}
