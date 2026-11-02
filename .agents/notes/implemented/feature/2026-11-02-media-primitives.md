# Agent Note: 媒体原语 (Image, ThemedImage, Video, Gallery, Lightbox, DeviceFrame, BrowserFrame)

Status: implemented

Decision-ID: media-primitives

## Code

- `src/media/video.tsx`
- `src/media/image/image.tsx`
- `src/media/gallery/gallery.tsx`
- `src/media/frames/browser-frame.tsx`
- `src/constants/media.ts`
- `docs/src/pages/media/ImagePage.tsx`
- `docs/src/components/MediaDemo.tsx`

## Problem

视觉审计 C1 到 C5: 全库 0 处 srcset, 0 处 loading=, 0 处 video, 无画廊, 灯箱, 设备框.
24 个参考商业站里 22 个靠大图或视频撑首屏, 没有媒体原语就拼不出商业页.

## Decision

遵循 docs/architecture/component-contract.md. 新目录 `src/media/` (直接文件 3 个, 其余按职能分 image/ gallery/ frames/).

- Image: srcSet / sizes 透传; loading 默认 lazy, priority 切 eager + fetchPriority="high"; decoding="async";
  尺寸类型上二选一必填 (width + height, 或 ratio 走 primitives/aspect-ratio); placeholder 为 "color" 浅色底,
  "none", 或低清 data URI 模糊层; objectPosition 焦点裁切; 加载状态写 data-state, 淡入只过渡 opacity 且有
  motion-reduce 分支; 失败换兜底节点 (role=img + alt). 水合前已加载完的图由回调 ref 读 complete 补状态.
- ThemedImage: 两张图同时渲染, 由祖先 data-mode 经 Tailwind `in-data-[mode=light]` 切换 display, 首帧正确无闪烁;
  隐藏图 display:none + lazy 不下载. 可用 mode 强制.
- Video: muted / loop / playsInline 默认开, 自动播放由 effect 调 play() 而非 autoplay 属性 (服务端不知道减弱动效偏好);
  减弱动效时不播, preload=none 停在 poster; sources 数组; title 必填落到 aria-label; 暂停按钮.
- Gallery: ul > li > button 网格, 列数写 CSS 变量, 方向键 / Home / End 移动焦点, 内置 Lightbox,
  关闭后焦点回到当前图对应的格子.
- Lightbox: 底座是 primitives/dialog (Dialog, DialogContent, DialogClose, DialogTitle), 不自造 portal;
  方向键切换, Esc 与焦点归还由 radix 负责, 滚轮与按钮缩放 (1 到 4 倍), 点击空白关闭; index 三件套, null 为关闭.
- DeviceFrame / BrowserFrame: 纯装饰外壳, 语义 token 颜色, 1px 描边; BrowserFrame 只借鉴 hxbrowser 外壳结构, 不导入它.
- slot 元组与 SlotClassNames 类型放 `src/constants/media.ts` (仓库尚无 `src/constants/slots.ts`, 集成时可迁过去).

偏离契约的条目:
- 任务单写 "forwardRef", 契约第 6 节规定新组件不用 forwardRef, ref 作普通 prop; 按契约执行.
- 内置文案用 `labels` prop + `MEDIA_LABELS` 默认值, 尚未进 locale 包 (改 locale 类型属于集成范围).
- Lightbox 透传 primitives/dialog 的 `overlayClassName` 设遮罩深度, 因为 DialogContent 尚未迁到 classNames.overlay.

## Alternatives considered

- 什么都不做 / 复用现有: 最强理由是 aspect-ratio + carousel + dialog 已能手拼. 否决: 懒加载, 占位, 淡入,
  减弱动效, 焦点归还每个调用方都要重写一遍, 审计已证明没人这么做 (0 处 loading=).
- 引入第三方 lightbox / image 库: 否决, 颜色与 data-slot 契约无法满足, 且会重复造 portal.
- ThemedImage 用 useTheme 读 resolvedMode 只渲染一张: 否决, 服务端与首帧拿不到模式, 会闪.

## Consequences

- src/index.ts 尚未导出 media, 由集成任务接入; 文档页尚未注册进 docs 路由.
- 文档示例图由 canvas 按语义 token 现画, 文档站不需要任何静态资源; Video 示例需读者粘贴地址.
