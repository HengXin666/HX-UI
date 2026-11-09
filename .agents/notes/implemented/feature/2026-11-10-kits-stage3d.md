# Agent Note: 立体族 (kits/stage3d) 不引 three, 用 DOM 3D 变换与自写积分近似

Status: implemented

Decision-ID: kits-stage3d

## Code

- `src/kits/stage3d/tokens.ts`, `src/kits/stage3d/index.ts`
- `src/kits/stage3d/SwingLanyard.tsx`, `src/kits/stage3d/parts/rope.ts` (react-bits Components/Lanyard)

## Problem

L5 kits 层缺三件立体舞台件: 挂绳工牌, 模型查看器, 球面菜单. 行为规格在 docs/research/catalog/components-1.md 的 Lanyard, ModelViewer, InfiniteMenu 条目里. 规格三件都建立在 three / @react-three/fiber 或自写 WebGL 上 (顶点通道, 网格, 模型加载), 目录裁决为 "不做"; 用户裁定照计划落地但不引 three, 缺口标 ENGINE-GAP 并写清缺什么. 上游许可不允许移植再分发, 只把条目里的常数, props 和行为描述当规格, 用本库引擎重写, 组件名换成本库自己的.

## Decision

不引 three, 不引 WebGL. 交互与运动 (绳的积分, 拖拽转动, 惯性, 自转, 缩放, 吸附) 按规格常数用 TypeScript 自写, 画面用 DOM 的 CSS 3D 变换 (preserve-3d, rotateX / rotateY / translateZ) 与 SVG. 规格的指数衰减写法用族内 decayToward (rate 单位 1/s), 弹簧用 craft 弹簧 (omegaSpring 换算). 颜色只用语义 token 与 color-mix, 焦点环用 FOCUS_RING. 规格里没给出数值的常数标 "HX 自定". 减弱动效时不做入场, 不自转, 不起风, 拖拽跟手但不甩.

每件段落以 ENGINE-GAP 写明缺的顶点通道, 网格, 模型加载与光照, 以及补上需要什么.

kits 的总出口 src/kits/index.ts 与 ./kits 子路径在收口一步统一接, 本批只维护本族 index.ts.

## SwingLanyard (规格 Components/Lanyard)

挂绳工牌: 容器顶端挂点按 anchor 取横向 0.27 / 0.5 / 0.73 (规格 ANCHORS), 垂下 4 节绳 (规格 JOINTS), 绳长 strapLength (0.5) × 容器高 height (560). 绳用位置积分 (verlet) 加距离约束解: 子步 1/960s, 约束迭代 2 次 (规格 MAX_STEP, ITERATIONS), 单帧上限 0.05s, 子步上限 48 (HX 自定); 末端是卡, 质量为绳节 4 倍; 重力 gravity (1) × 2400px/s², 阻尼 damping (0.5) 每子步衰减 0.004 × damping, elasticity (0.5) 让约束变软 (1 - 0.6 e), breeze (0.5) 为周期 3.2s 的横向风 160px/s² (以上换算 HX 自定, 规格的刚体参数在 3D 世界单位里). 卡按末段方向摆, 尺寸 size (0.6) × 300px, 竖版 1:1.4, 横版 1.4 宽 0.63 高 (HX 自定), 圆角 cornerRadius (0.3) × 40px. 拖卡时末端钉在指针上 (pointer capture, touch-none), 松手带速度甩回; 移动不超过 6px 算点一下, 翻面 (rotateY 180, 弹簧 omega 9 规格 FLIP_SPIN, zeta 0.7 HX 自定); Enter / 空格也翻面, 卡为 role=button aria-pressed. intro 时绳先收成左右交错的折线, 卡从高处落下拉直. 绳是 SVG 折线, 颜色 strapTone 语义色, 线宽 strapWidth (0.65) × 24px. 正反面可放 front / back 内容或 frontImage / backImage. interactive 为 false 时不可拖不可聚焦. 减弱动效时不落下, 不起风, 直接下垂; 拖动跟手但不甩, 翻面到位. 规格的 cardColor, strapColor 换成 token; strapImage (绳面贴图), finish (glossy 等漆面), metal (金属扣色), imageFit 未做.

ENGINE-GAP: 规格是 three 场景 (FOV 24) 里的 3D 刚体: 卡是有厚度 (THICKNESS 0.018) 与倒角 (BEVEL 0.007) 的盒体网格, 绳是带宽度的扁带网格 (STRAP_WIDTH 0.36, 按 SAMPLES 72 采样曲线), 金属环与夹扣是环面与圆柱网格 (RING_RADIUS, RING_TUBE, EYELET_RADIUS, CLAMP_BODY), 刚体有转动惯量 (applyInverseInertia, 冲量求解), 卡可绕绳轴扭转, 箔面是片元着色器 (foilStrength 等 uniform), 正面按 FACE_WIDTH 1024 渲成纹理. 本件只在屏幕平面解绳: 卡不能绕竖轴扭转 (除了翻面), 没有厚度, 倒角与金属扣, 绳是等宽折线不是扁带, 没有光照与箔面. 补上需要顶点通道: 一个 3D 渲染器 (WebGL2 网格: 盒体, 扁带, 环面) 加刚体求解 (位置, 四元数朝向, 惯量张量); 在 DOM 里扭转只能用 rotateY 假装, 扁带的扭曲和自遮挡做不到.
