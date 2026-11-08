# surface 渲染底座 (backdrop kernel)

整个 surface 层 (Backgrounds, Animations, TextAnimations) 唯一的渲染底座. 约束见同目录 AGENTS.md, 决策见 `.agents/notes/implemented/feature/2026-11-09-surface-backdrop-kernel.md`. 入口是 `index.ts`.

## 三种渲染方式

```ts
useShaderBackdrop(spec: ShaderSpec, options: SurfaceOptions): BackdropHandle   // WebGL2 全屏片元 + 乒乓离屏通道
useCanvasBackdrop(spec: CanvasSpec, options: SurfaceOptions): BackdropHandle   // Canvas2D
useDomBackdrop(spec: DomSpec, options: SurfaceOptions): BackdropHandle         // 纯 DOM, 只用调度
<BackdropShell handle={handle} fallback={cssBackground} opacity={o} canvas={true}>{children}</BackdropShell>
```

返回的 `BackdropHandle` 有 `hostRef`, `canvasRef`, `status` (pending / live / fallback), `plan` (animate / still / idle). 渲染器拿不到上下文或编译失败时 status 为 fallback, BackdropShell 铺 `fallback` 这个 CSS background 值.

## SurfaceOptions

| 字段 | 含义 |
|---|---|
| colors | 颜色 prop 列表. 裸标识符按 token 读 (`primary` 即 `var(--primary)`), 其余原样作为 CSS 颜色. 在宿主作用域解析为 sRGB 0..1, 主题切换自动重解析 |
| colorFallbacks | 与 colors 一一对应的解析失败兜底 `Rgb` |
| speed | 时钟倍率, 默认 1 |
| paused | 停在当前画面 (只画一帧) |
| reducedMotion | 覆写系统偏好, true 时只画一帧, 时钟固定为 `BACKDROP_STILL_TIME` (8 秒) |
| dpr | 像素比上限, 默认 2 |
| maxEdge | 画布最长边上限 (设备像素), 默认 2400 |
| pointer | 是否监听指针, 默认 true |
| stillTime | 减弱动效静态帧的时刻 |

公共组件 props 用 `BackdropCommonProps` (speed, paused, opacity, dpr, mouseInteraction, reducedMotion, children 及 div 属性), `splitCommon(props)` 拆成 `{ options, rest, opacity, children }`.

## BackdropFrame (每帧交给渲染器)

| 字段 | 含义 |
|---|---|
| time | 场时钟 (秒), 累计帧长乘 speed, 停帧不走 |
| dt | 真实帧长 (秒, 上限 0.05), 静态帧为 0 |
| elapsed | 出帧以来真实秒数, 给入场用; 减弱动效时为 Infinity |
| fit | `{ width, height, scale }` 设备像素尺寸与每 CSS 像素的设备像素 |
| pointer | `PointerState`: x, y (归一化, y 朝上), vx, vy, inside, down, presence (0..1 平滑), taps (最近 8 次点击, at 为 elapsed 时钟), movedAt |
| colors | colors 选项解析出的 `Rgb[]` |
| reduced, still | 是否减弱动效, 是否单独的静态帧 |

## ShaderSpec 与多通道

```ts
interface ShaderSpec {
  fragment: string;                                   // 上屏程序, fragmentSource(body, ...chunks) 拼出
  uniforms?: (frame) => UniformMap;                   // number | boolean | [x,y] | [x,y,z] | [x,y,z,w] | { list, size }
  textures?: () => Record<string, TexImageSource | null | undefined>;  // 按对象身份缓存上传
  passes?: PassSpec[];                                // 有序离屏通道
}
interface PassSpec { name: string; fragment: string; uniforms?: (frame, iteration) => UniformMap; scale?: number; iterations?: number }
```

每个通道自带一对乒乓 FBO (可用时 RGBA16F, 否则 RGBA8), 尺寸为画布乘 scale (默认 0.5). 每帧按顺序执行, 每个通道跑 iterations 次; 通道输出以 name 为 sampler2D 名, 之后的通道与上屏程序都能读, 通道读自己的 name 得到上一次输出. 所有程序另有 `u_target_res` (当前写入目标的像素尺寸).

公共头 `GLSL_HEADER` 自动声明并每帧写入:

```glsl
uniform vec2 u_res; uniform float u_time; uniform float u_dpr;
uniform vec4 u_pointer;            // xy 归一化 (y 朝上), z 在场程度, w 按下
uniform vec4 u_taps[8];            // xy 坐标, z 距今秒数, w 有效
uniform float u_tap_count;
in vec2 v_uv; out vec4 o_color;
```

公共片段: `GLSL_HASH` (hx_hash1 / hx_hash2 / hx_hash22 / hx_hash3), `GLSL_NOISE` (hx_vnoise, hx_gnoise, hx_vnoise3, hx_fbm(p, octaves)), `GLSL_UTIL` (HX_PI, HX_TAU, hx_rot, hx_centered, hx_pointer_centered, hx_grain, hx_tonemap, hx_luma). 按依赖顺序传给 fragmentSource.

## CanvasSpec 与 DomSpec

```ts
interface CanvasSpec { draw(ctx: CanvasRenderingContext2D, frame): void; resize?(fit): void }   // 设备像素坐标, 内核不清屏
interface DomSpec { render(host: HTMLElement, frame): void; resize?(fit): void }
```

## 工具

- 颜色: `cssColorOf`, `resolveColor(host, value, fallback)`, `parseColor`, `oklchToRgb`
- 兜底: `fallbackGradient(colors, angle?)`, `glowFallback(base, glow)`
- 数学: `clamp`, `mix`, `smoothstep`, `approach(cur, target, dt, tau)`, `clampDpr`, `fitCanvas`, `frameSeconds`, `seedOf`
- 字形: `createGlyphAtlas(glyphs, cell, fontFamily)` 返回 `{ canvas, columns, rows, count }`, `atlasGrid`
- 低层: `useBackdrop` (自定义工厂), `createPass` / `applyUniforms` / `bindTexture` / `drawPass`, `createPingPong` / `swapPingPong`, `planRun`, `watchView`, `attachPointer`, `kernelUniforms`
