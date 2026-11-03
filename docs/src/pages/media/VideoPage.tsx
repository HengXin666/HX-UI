import { useState, type JSX } from "react";
import { DEMO_PREVIEW_ALIGN_STRETCH } from "../../../../src/constants/docs-demos";
import { MEDIA_DOC } from "../../../../src/constants/media";
import { Video } from "../../../../src/media";
import { Callout, Code, H2, P, Preview } from "../../components/DocKit";
import { Props } from "../../components/DocSpec";
import { useDemoImages } from "../../components/MediaDemo";

/**
 * Video 文档页: 静音自动循环, poster, 暂停按钮, 减弱动效静止.
 * 文档站不打包视频文件, 示例视频地址由读者粘贴; 未填时只显示 poster.
 */
export function VideoPage(): JSX.Element {
  const [poster] = useDemoImages(["poster"]);
  const [src, setSrc] = useState("");
  return (
    <>
      <P>
        首屏背景视频与产品演示. 默认 <Code>muted</Code> + <Code>loop</Code> + <Code>playsInline</Code> 自动播放,
        右下角按钮可暂停. <Code>title</Code> 必填, 作为读屏名称.
      </P>
      <Callout title="减弱动效">
        系统开启减弱动效时不自动播放, 只预取元数据并停在 poster, 用户按播放键才播.
        自动播放由 effect 调用 play(), 不写 autoplay 属性, 所以服务端渲染也不会先播起来.
      </Callout>

      <H2>示例</H2>
      <P>粘贴一个 mp4 / webm 地址试播 (示例里不内置任何视频地址).</P>
      <Preview
        align={DEMO_PREVIEW_ALIGN_STRETCH}
        code={`<Video
  title="产品演示"
  poster={poster}
  sources={[{ src: webm, type: "video/webm" }, { src: mp4, type: "video/mp4" }]}
  className="aspect-video"
/>`}
      >
        <div className="flex w-full flex-col gap-3">
          <input
            aria-label="视频地址"
            value={src}
            onChange={(event) => setSrc(event.target.value)}
            className={MEDIA_DOC.fieldClass}
          />
          <Video
            key={src}
            title="产品演示"
            poster={poster?.src}
            sources={src ? [{ src }] : []}
            rootClassName="aspect-video w-full rounded-(--radius-md)"
          />
        </div>
      </Preview>

      <H2>属性</H2>
      <Props spec={`
Video.title ~ string ~ - ~ 读屏名称 (aria-label), 必填
Video.sources ~ { src, type?, media? }[] ~ - ~ 多格式源
Video.src ~ string ~ - ~ 单一源
Video.poster ~ string ~ - ~ 封面
Video.autoPlay ~ boolean ~ true ~ 静音自动播放, 减弱动效时忽略
Video.muted / loop / playsInline ~ boolean ~ true ~ 原生属性
Video.showToggle ~ boolean ~ true ~ 暂停 / 播放按钮
Video.labels ~ { play, pause } ~ 播放 / 暂停 ~ 按钮读屏文案
Video.classNames ~ { root, media, toggle, toggle-icon } ~ - ~ 插槽类名
`} />
    </>
  );
}
