import { useState, type JSX } from "react";
import { Lightbox, type MediaItem } from "../../../../src/media";
import { Button } from "../../../../src/primitives/button";
import { Callout, Code, H2, P, Preview } from "../../components/DocKit";
import { Props } from "../../components/DocSpec";
import { useDemoImages } from "../../components/MediaDemo";

const LABELS = ["甲", "乙", "丙"] as const;

/**
 * Lightbox 文档页: 独立使用 (受控 index), 左右切换, Esc 关闭, 缩放, 遮罩关闭.
 *
 * .agents/notes/implemented/feature/2026-11-02-media-primitives.md
 */
export function LightboxPage(): JSX.Element {
  const images = useDemoImages(LABELS);
  const items: MediaItem[] = images.map((image, at) => ({ src: image.src, srcSet: image.srcSet, alt: `灯箱示例 ${LABELS[at]}` }));
  const [index, setIndex] = useState<number | null>(null);
  return (
    <>
      <P>
        全屏查看. 底座是 <Code>primitives/dialog</Code>: portal, 焦点陷阱, Esc 关闭与焦点归还都交给 radix, 组件不自造 portal.
        Gallery 内置了它, 也可以像下面这样单独受控使用.
      </P>
      <Callout title="键盘与指针">
        左右方向键切换, Esc 关闭, 滚轮或右上角按钮缩放 (1 到 4 倍, 换图复位), 点击图片以外的空白处关闭.
      </Callout>

      <H2>受控打开</H2>
      <Preview
        code={`const [index, setIndex] = useState<number | null>(null);
<Button onClick={() => setIndex(0)}>查看</Button>
<Lightbox items={items} index={index} onIndexChange={setIndex} />`}
      >
        <Button onClick={() => setIndex(0)} disabled={items.length === 0}>
          查看 {items.length} 张图
        </Button>
        <Lightbox items={items} index={index} onIndexChange={setIndex} />
      </Preview>

      <H2>属性</H2>
      <Props spec={`
Lightbox.items ~ MediaItem[] ~ - ~ 至少 src 与 alt
Lightbox.index ~ number | null ~ - ~ 当前序号, null 关闭 (受控)
Lightbox.defaultIndex ~ number | null ~ null ~ 非受控初值
Lightbox.onIndexChange ~ (index: number | null) => void ~ - ~ 切换与关闭
Lightbox.loop ~ boolean ~ true ~ 首尾循环
Lightbox.onCloseAutoFocus ~ (event) => void ~ - ~ 接管关闭后的焦点
Lightbox.labels ~ { close, previous, next, zoomIn, zoomOut, counter } ~ 中文 ~ 按钮读屏文案
Lightbox.classNames ~ { content, stage, image, toolbar, counter, close-button, ... } ~ - ~ 插槽类名
`} />
    </>
  );
}
