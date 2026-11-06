# Agent Note: 视觉效果件 (光斑卡, 流光边框, 跑马灯, 背景底纹, 毛玻璃)

Status: implemented

Decision-ID: visual-effects

## Code

- `src/effects/SpotlightCard.tsx`
- `src/constants/effects.ts`
- `docs/src/pages/effects/EffectsPage.tsx`

## Problem

库里没有任何表现型装饰件: SpotlightCard, BorderBeam, Marquee, 背景底纹, GlassPanel 全库检索为零.
做出来的落地页与空状态只能靠纯色块与 1px 边框, 观感偏平. 同时这类效果最容易踩项目红线:
tsx 内函数色值 (PROJECT-UI-RGB), 加粗描边 (PROJECT-UI-LINE-1PX), 以及在触屏与低性能设备上
用指针事件抢主线程.

## Decision

效果件的颜色与关键帧都在 `src/effects.css`. 它是受保护的非 AST 资源, 不当 Code 锚点, 改动按 resource-review 走人工核对.

新增 `src/effects/` 目录, 五个组件各自只做一件事, 全部是不改宿主布局的装饰层:

- 颜色只写在 `src/effects.css`, 经 `var(--...)` 与 `color-mix` 从语义令牌派生; 设计令牌分片的新令牌
  (`--primary-glow`, `--accent-2`, `--surface-overlay` 等) 缺席时回退到 `--primary` / `--card`.
  组件 tsx 只拼类名与 CSS 变量. 规则放在 `@layer components`, 调用方的工具类可以覆盖.
- SpotlightCard: 坐标直接写元素的 `--spot-x / --spot-y`, 不进 React state; requestAnimationFrame 合并,
  矩形只在指针进入时读一次. 只响应 `pointerType === "mouse"`, 且要求 `(hover: hover) and (pointer: fine)`,
  未开启减弱动效, 逻辑核数大于 2. 键盘聚焦时光斑在中心静态亮起.
- BorderBeam: conic-gradient 加 `padding: 1px` 与 mask 的 content-box 挖空, 光环宽度恒等于 1px 边框.
  角度经 `@property` 登记后用关键帧插值.
- Marquee: 内容渲染 repeat 份 (至少 2) 同步平移一份宽度加间距; 复制件带 `aria-hidden` 与 `inert`.
  焦点进入总是暂停, 悬停暂停可选.
- Backdrop: grid / dots 用 1px 渐变线与点, aurora 画在超出宿主的伪元素上, 漂移只动 transform.
- GlassPanel: Tailwind backdrop-blur 档位加 `.hx-glass` 表面, 不支持 backdrop-filter 时回退不透明.
- 商业页背景与遮罩 (V0-06, 审计 E1-E6): MeshGradient (≥3 个令牌名各一团 radial-gradient, intensity 与漂移开关),
  Grain (内联 SVG feTurbulence 灰阶噪声, opacity 与 mix-blend), Beam (光源光晕 + 模糊光锥, 角度与位置),
  GridLines (内联 SVG 两个 pattern: 1px 格线与交点十字准星, 线色 currentColor), MaskFade (mask-image 边缘淡出,
  方向 top/bottom/left/right/x/y/radial, 长度读 `--mask-fade` 令牌, 默认值挂 `:where(:root)` 零特异性),
  GradientBorder (静态渐变, 同 BorderBeam 的 `padding: 1px` + mask 挖空, 不写 2px 边). 调用方只传令牌名,
  拼色在纯 ts `src/effects/effect-color.ts` 里, 只产出 `var(--令牌)` 与 `color-mix`; 每个效果一个文件, 不并入 Backdrop,
  Backdrop 只在 fade 遮罩规则的选择器列表里多挂了两个类, 四种行为不变.
- 减弱动效: effects.css 末尾的媒体查询让所有效果停在静止态 (流光退化为淡色描边, 跑马灯隐藏复制件并可手动滚动).

`effects.css` 由集成分片在 `src/styles.css` 里 `@import`, 公共导出也由集成分片接到 `src/index.ts`;
文档页集成前从源码相对路径引入.

## Alternatives considered

**什么都不做, 继续用现有 Card 与纯色底** - 最强理由是零维护成本, 且符合上游 "工具冷淡风" 约定.
否决: 评估结论里观感偏平的直接原因之一就是缺这类部件, 每个页面各自手写光晕与渐变会把色值散进 tsx, 反而更容易违反红线.

**复用现有组件, 给 Card 加 spotlight / beam 变体** - 理由是少一个目录, 调用方只改一个 prop.
否决: Card 由另一分片负责且约定默认外观逐字节不变; 效果件要能叠在任意宿主上 (按钮, 图片, 区块), 绑死在 Card 上限制用法.

**背景新效果做成 Backdrop 的新 variant** - 理由是复用宿主与 fade 逻辑, 少导出几个名字.
否决: mesh 要多色 props, grain 要盖在内容上方, MaskFade 是包内容的容器, 语义各不相同; 塞进 Backdrop 会让它的 props 互相冲突且改动已有 variant 的风险变大.

**直接引入 magicui / aceternity 源码** - 理由是现成且效果成熟. 否决: 它们大量在 tsx 内写 rgba 与固定色值,
依赖 motion 驱动逐帧动画, 也不处理减弱动效与触屏, 改造成本不低于自写.

**光斑坐标用 React state** - 理由是写法直观. 否决: 每次指针移动都会重渲染整张卡片及其子树, 在低端设备上直接掉帧.

## Consequences

新增一个 css 入口与五个导出, 需要集成分片接线后才在公共包里可用. 效果的强弱完全由语义令牌决定,
换肤或调整 `--primary-glow` 会同时影响所有效果件. conic 光束在很宽的矩形上沿长边移动更快, 这是用中心角驱动的代价.
src/effects/ 直接文件因此超过 6 个 (HC-DIR Warning): 映射工作区不能建子目录, 待集成分片按职责拆 backgrounds/ 子目录.
