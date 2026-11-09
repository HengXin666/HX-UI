# Agent Note: 玻璃族 (kits/glass) 用 DOM, backdrop-filter 与 SVG 滤镜近似

Status: implemented

Decision-ID: kits-glass

## Code

- `src/kits/glass/tokens.ts`, `src/kits/glass/index.ts`
- `src/kits/glass/LensGlass.tsx`, `src/kits/glass/parts/lens-spec.ts` (react-bits Components/FluidGlass)
- `src/kits/glass/FrostPanel.tsx`, `src/kits/glass/parts/frost-spec.ts` (react-bits Components/GlassSurface)

## Problem

L5 kits 层缺两件玻璃质感件: 跟随指针的玻璃镜片与磨砂玻璃面板. 行为规格在 docs/research/catalog/components-1.md 的 FluidGlass 与 GlassSurface 条目里. 目录对两件的裁决都是 "不做" (全屏着色器场), 计划已由用户确认, 照计划落地. 上游许可不允许移植再分发, 只把条目里的常数, props 和行为描述当规格, 用本库引擎重写, 组件名换成本库自己的.

## Decision

不引 WebGL 与 three. 玻璃的模糊, 饱和与明暗用 CSS backdrop-filter, 折射近似用 SVG feDisplacementMap; 运动用 craft 弹簧经叠放族的 omegaSpring 换算 (规格多以 omega / zeta 写). 颜色只用语义 token 与 CSS 颜色关键字, 不写色值; 曲线引用 CURVE, 焦点环用 FOCUS_RING. 规格里没给出数值的常数标 "HX 自定". 减弱动效时不做弹簧形变, 晃动, 自转与闲置漂移.

着色器才能做到的部分 (真实折射光路, 色散, 焦散, 菲涅尔边光, 阴影场) 不做, 各件段落以 ENGINE-GAP 写明缺什么, 以及补上需要什么.

kits 的总出口 src/kits/index.ts 与 ./kits 子路径在收口一步统一接, 本批只维护本族 index.ts.

## LensGlass (规格 Components/FluidGlass)

一块玻璃镜片盖在台面内容上 (children, 或 src 图片按 fit 铺, 或 text 大字, 默认 "Look closer.", 字重 600). 镜片是 backdrop-filter 层: frost 加模糊 (满 14px), refraction 加饱和 (1 + 0.45 r) 与对比 (1 + 0.12 r), reflection 提亮 (1 + 0.08 r) 并加左上高光, tint 按 tintTone 染色, shadow 控投影浓度; 系数 HX 自定. 形状 lens / blob / cube / pill / torus / prism / diamond, 尺寸 size (260px) 乘规格 EXTENT 外延比例; torus 用径向遮罩挖出 30% 内孔, prism 用三角裁切, diamond 转 45 度, 各形状长宽比 HX 自定. interaction: follow 跟指针, 时间常数 0.02 + smoothness × 0.2 s (smoothness 0.5, HX 自定); drag 只在按住时跟手; static 停在中心. 移动时沿速度方向拉伸 (2000px/s 满 0.22, 乘 wobble × 2 封顶 1) 并朝运动方向倾斜 (1500px/s 满 14 度), 按下时按规格 vstretch -= 2.5 × wobble 反向一晃; 拉伸, 倾斜, 显隐三组弹簧规格只给了 omega / zeta 写法, 数值 HX 自定 (2pi × 2.2 / 0.42, 2pi × 1.6 / 0.7, 2pi × 1.8 / 0.65). 挂上时从 0 弹出. idle 时无指针镜片沿李萨如曲线 (周期 9s, 幅度台面 0.22) 绕中心漂移; spin 让 torus, cube, prism, diamond 自转 (spin × 60 deg/s). 帧间隔上限 0.05s (规格同). 离屏 (IntersectionObserver) 与页面隐藏时停帧. 颜色全用 var(--background) / var(--foreground) / tone 与 color-mix, 不写色值. 规格的 color (#ffffff) 换成语义色 tintTone, textColor 与 fontFamily, fontSize 交给 children 自定, shapes (多形状切换) 未做. 减弱动效时镜片直接贴指针, 无拉伸, 倾斜, 晃动, 自转与漂移.

ENGINE-GAP: 规格是 WebGL 光线步进 (SDF 形体, 折射率 uIor, 焦散, 菲涅尔边光 rim, 阴影场 SHADOW_SIZE 160, PIXEL_BUDGET 5e6). 本件没有光路: 镜片下的内容不折射, 不放大, 不变形, 无 dispersion 色散 (规格 0.35), 无焦散与边缘内反射, 投影是固定的 box-shadow. 补上需要一个 WebGL2 着色器层 (把台面内容渲成纹理, 按 SDF 法线做折射与分色偏移), 或在 Chromium 上用 backdrop-filter: url(#svg) 的 feDisplacementMap 做近似折射 (Safari 与 Firefox 不支持).

## FrostPanel (规格 Components/GlassSurface)

磨砂玻璃面板, 默认 200 × 80, 圆角 20px. Chromium 上 backdrop-filter 用一个 SVG 滤镜: feImage 读一张按面板实际尺寸 (ResizeObserver) 生成的位移图, 红绿蓝三道各用 feDisplacementMap 按 distortionScale (-180) 加 redOffset / greenOffset / blueOffset (0 / 10 / 20) 位移, 通道选择 xChannel / yChannel (R / G), feColorMatrix 各取一道后 screen 合成, 再按 displace 高斯模糊, 最后接 saturate(saturation). 位移图: 黑底上横向红渐变与纵向蓝渐变按 mixBlendMode (difference) 叠合, 中间一块圆角矩形按 brightness (50) × opacity (0.93) 的不透明度提亮并模糊 blur (11px), 让位移集中在宽 borderWidth (0.07) × 短边 × 0.5 的边缘一圈 (规格中心块为 hsl 灰, 这里用 white + fill-opacity 等价, 颜色全用 CSS 关键字). 其他浏览器 (CSS.supports 不认 url(), 或 Safari 与 Firefox 认语法但不渲染) 退回 blur(blur) saturate(saturation × 1.8) brightness(1.1), 系数 HX 自定. renderer 可强制 svg 或 fallback. 面板底色为 var(--background) 按 backgroundOpacity (0) 混入, 内描边与阴影用 token. 出现时淡入 0.26s ease-out (规格同). 规格没有减弱动效, 本件补上: 减弱动效时不淡入. 规格的 backdrop (自定义背景源) 与 shape (非矩形外形) 未做, WebGL 渲染路径 (renderer 的着色器分支) 不做.

ENGINE-GAP: 折射是静态位移图近似, 不随内容深度或视角变化; 色散只是三道固定偏移, 不按波长连续分色; 无随形的明暗, 高光与边缘内反射. 补上需要 WebGL 着色器把背景渲成纹理 (规格 uBackdrop) 按法线折射, 而跨元素读背景在 DOM 里只有 backdrop-filter 一条路, 所以 Safari 与 Firefox 上只剩模糊退回.
