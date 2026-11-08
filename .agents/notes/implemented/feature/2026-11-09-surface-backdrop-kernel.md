# Agent Note: surface 层渲染底座 (src/surface/backdrop/kernel) 直接用 WebGL2 与 Canvas2D 自写

Status: implemented

Decision-ID: surface-backdrop-kernel

## Code

- `src/surface/backdrop/kernel/use-backdrop.ts`

## Problem

react-bits 的 Backgrounds 族 (docs/research/catalog/backgrounds-1.md 38 件, backgrounds-2.md 26 件) 要全量落地. 上游每件各自起 ogl 或 three 的渲染器, 各自写 rAF, DPR, resize 和离屏判断; react-bits.md 对着色器类的结论是只借鉴 "单画布 + DPR 上限 + 离屏停帧". 上游是 MIT 加 Commons Clause, HX-UI 以 Apache-2.0 发包, 不能移植, 也不能新增 three / ogl / gsap 依赖. 需要一个所有背景件共用, 并且 surface 层 Animations 与 TextAnimations 两路也会改用的渲染底座.

## Decision

`src/surface/backdrop/kernel/` 是整个 surface 层唯一的渲染底座, WebGL2 与 Canvas2D 都归它, 纯 DOM 件也用它的调度. 分层如下.

调度核心 `useBackdrop(options)` (use-backdrop.ts): 单画布; 像素比取 min(devicePixelRatio, dpr prop, 默认 2), 最长边上限 2400 设备像素 (math.ts 的 clampDpr / fitCanvas); ResizeObserver 跟尺寸; IntersectionObserver (64px 余量) 离屏停帧; 帧循环只走 `src/motion/frame/use-frame-loop` 并开 pauseWhenHidden, 页面隐藏停帧; 运行方式由纯函数 planRun 判定为 animate / still / idle, 减弱动效 (系统偏好或 reducedMotion prop) 与 paused 只画一帧静态画面, 减弱动效的静态帧时钟固定为 8 秒且 elapsed 为无穷 (入场视为已完成, 不带点击); 颜色 prop 在宿主作用域解析 (color.ts: token 名读成 var(--name), 计算值经 1x1 画布像素回读, 回读不了时解析 hex / rgb / oklch / color(srgb), 最后用兜底色), 并用 MutationObserver 跟随根元素的 class / data-mode / data-theme / data-skin 切换主题; 指针 (pointer.ts) 每个事件重新量矩形, pointercancel 与 pointerleave 同按离开处理, 记录在场程度 (进 0.35s, 出 0.6s 时间常数), 速度与最近 8 次点击.

渲染器是工厂 `(canvas, host, fail) => { resize, render, dispose } | null`, 返回 null 时宿主退到 CSS 渐变, 运行中上下文丢失调用 fail 同样退化. 三种工厂:

- `useShaderBackdrop(spec, options)`: WebGL2 全屏三角. spec.fragment 上屏; spec.passes 是有序的离屏通道, 每个通道自带一对乒乓 FBO (支持 EXT_color_buffer_float 时 RGBA16F, 否则 RGBA8), 按 scale (默认 0.5) 缩小, 每帧跑 iterations 次; 通道输出以其 name 为采样器名, 后续通道与上屏程序都能读, 通道读自己的 name 拿到上一次输出. 拖尾, 流体 (平流 / 散度 / 压力迭代 / 染料) 都用它. spec.uniforms(frame) 与 spec.textures() 每帧读最新, 纹理按对象身份缓存上传. 片元源码由 `fragmentSource(body, ...chunks)` 拼: 公共头 GLSL_HEADER 声明 u_res, u_time, u_dpr, u_pointer (xy 归一化 y 朝上, z 在场, w 按下), u_taps[8] (xy, 距今秒数, 有效位), u_tap_count, 离屏通道与上屏都另有 u_target_res; 公共片段 GLSL_HASH (整数混洗哈希), GLSL_NOISE (值噪声, 梯度噪声, 3D 值噪声, fbm), GLSL_UTIL (旋转, 居中坐标, 颗粒, 色调压缩).
- `useCanvasBackdrop({ draw(ctx, frame), resize? }, options)`: Canvas2D, 坐标是设备像素, frame.fit.scale 换 CSS 像素; 内核不替它清屏.
- `useDomBackdrop({ render(host, frame), resize? }, options)`: 纯 DOM 件, 只用调度, 指针与颜色.

`BackdropShell` 是宿主组件: relative isolate 撑满父元素, 画布与兜底层在 -z-10 垫底且 aria-hidden, data-backdrop-status / data-backdrop-plan 暴露内核状态. `BackdropCommonProps` + `splitCommon` 统一公共 props: speed, paused, opacity, dpr, mouseInteraction, reducedMotion. `fallbackGradient` / `glowFallback` 只拼 var(--token) 与 color-mix, 不在 JS 里算色. `createGlyphAtlas` 用 Canvas2D 画白字图集给字符类着色器. 完整 API 见 `src/surface/backdrop/kernel/README.md`.

## Alternatives considered

- 什么都不做 / 复用现有: 最强理由是 src/effects 已有 MeshGradient, Beam 等纯 CSS 背景, 零运行时开销. 否决: CSS 渐变做不出着色器场, 也没有指针, 点击和模拟; 64 件各写一套 rAF 与 resize 又正是 react-bits.md 要避免的.
- 引入 ogl 或 three: 最强理由是上游就建在它们上面, 3D 件 (Ballpit, Hyperspeed, 粒子球) 照搬最省事. 否决: brief 禁止新增依赖, weight 门禁也不让重依赖进安装图; 背景场 90% 是单个全屏片元, 几百行 WebGL2 就够, 3D 件改写为简化版并标 ENGINE-GAP.
- 每件自管 requestAnimationFrame: 最强理由是各件节奏不同, 自管最灵活. 否决: L1 规定帧循环只有 src/motion/frame 一个; 离屏停帧, 隐藏停帧, 减弱动效一帧这三条若分散写, 64 件里必然有漏的.

## Consequences

另一路 backgrounds-2 与 surface 的 Animations / TextAnimations 都建在本内核上, 改公共头的 uniform 名或 BackdropFrame 字段会牵动全部件, 只能加不能改. 调度测试 (tests/surface/backdrop/kernel-runtime.test.tsx) 用假 IntersectionObserver, 假 2d 上下文与记录调用名的假 WebGL2 覆盖退化, 减弱动效, 离屏停帧与多通道顺序; jsdom 没有真实 WebGL, 着色器本身只在浏览器里验证. 半精度浮点渲染目标不可用的设备退到 8 位状态缓冲, 流体类精度下降. 主线接入时从 `src/surface/backdrop/kernel/index.ts` 导出, 本次不改 src/entry 与 src/index.ts.

内核提交: 177284e (feat(surface): backdrop 内核).  backgrounds-2 与 Animations, TextAnimations 两路从这个提交起可以直接建在内核上.
