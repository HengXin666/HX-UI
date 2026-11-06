import type { JSX } from "react";
import { DEMO_PREVIEW_ALIGN_STRETCH } from "../../../../src/constants/docs-demos";
import { DEVICE, MEDIA_DOC } from "../../../../src/constants/media";
import { BrowserFrame, DeviceFrame, Image } from "../../../../src/media";
import { Callout, Code, H2, P, Preview } from "../../components/DocKit";
import { Props } from "../../components/DocSpec";
import { useDemoImages } from "../../components/MediaDemo";

/**
 * DeviceFrame 与 BrowserFrame 文档页: 产品截图外壳.
 */
export function FramesPage(): JSX.Element {
  const [shot] = useDemoImages(["产品截图"]);
  return (
    <>
      <P>
        两个纯装饰外壳, children 是屏幕内容 (通常是 <Code>Image</Code> 或 <Code>Video</Code>), 铺满屏幕区.
        颜色只用语义 token, 描边 1px, 不含任何图片地址.
      </P>
      <Callout title="与 hxbrowser 的关系">BrowserFrame 只借鉴了标签页外壳的结构, 不依赖其会话与输入逻辑, 地址栏只是展示文本.</Callout>

      <H2>BrowserFrame</H2>
      <Preview
        align={DEMO_PREVIEW_ALIGN_STRETCH}
        code={`<BrowserFrame address="app.example.com/dashboard" ratio={16 / 10}>
  <Image src={shot} ratio={16 / 10} alt="控制台截图" />
</BrowserFrame>`}
      >
        <BrowserFrame address="app.example.com/dashboard" ratio={16 / 10}>
          {shot && <Image src={shot.src} srcSet={shot.srcSet} ratio={16 / 10} alt="控制台截图" />}
        </BrowserFrame>
      </Preview>

      <H2>DeviceFrame</H2>
      <Preview code={`<DeviceFrame device="phone"><Image src={shot} ratio={9 / 19.5} alt="..." /></DeviceFrame>`}>
        <div className={MEDIA_DOC.stageClass}>
          <div className={MEDIA_DOC.frameWidthClass}>
            <DeviceFrame device={DEVICE.phone}>{shot && <Image src={shot.src} ratio={9 / 19.5} alt="手机截图" />}</DeviceFrame>
          </div>
          <DeviceFrame device={DEVICE.laptop}>{shot && <Image src={shot.src} ratio={16 / 10} alt="笔记本截图" />}</DeviceFrame>
        </div>
      </Preview>

      <H2>属性</H2>
      <Props spec={`
BrowserFrame.address ~ ReactNode ~ - ~ 地址栏展示文本
BrowserFrame.secure ~ boolean ~ true ~ 地址前的锁形图标
BrowserFrame.showControls ~ boolean ~ true ~ 窗口按钮圆点
BrowserFrame.actions ~ ReactNode ~ - ~ 工具栏右侧内容
BrowserFrame.ratio ~ number ~ - ~ 内容区宽高比
BrowserFrame.classNames ~ { root, toolbar, controls, control, address, address-icon, address-text, actions, content } ~ - ~ 插槽类名
DeviceFrame.device ~ "phone" | "tablet" | "laptop" ~ "phone" ~ 外框种类
DeviceFrame.ratio ~ number ~ 按设备 ~ 屏幕宽高比
DeviceFrame.classNames ~ { root, body, screen, notch, base } ~ - ~ 插槽类名
`} />
    </>
  );
}
