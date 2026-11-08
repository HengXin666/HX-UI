# Agent Note: 文本动效族的错峰入场意图 (surface/text/stagger) 与现有件补缺

Status: implemented

Decision-ID: surface-text-stagger

## Code

- `src/surface/text/stagger/tokens.ts`
- `src/surface/text/stagger/StaggerText.tsx`
- `src/surface/text/stagger/TraceText.tsx`
- `src/surface/text/stagger/FocusText.tsx`
- `src/surface/text/stagger/DropText.tsx`
- `src/surface/text/stagger/index.ts`
- `src/motion/SplitText.tsx`
- `src/motion/RotatingText.tsx`
- `src/motion/AnimatedNumber.tsx`
- `src/craft/NumberRoll.tsx`
- `docs/face/docs/props/props.gen.json`
- `tests/surface/text/stagger.test.tsx`

## Problem

docs/research/catalog/textanimations.md 里有九个条目的核心是 "拆开, 按名次错开, 逐个进场": BlurText, FoldText, MaskedHeading, StrokeText, TrueFocus, FallingText, SplitText, RotatingText, CountUp. 其中 SplitText, RotatingText, CountUp 与本库已有的 src/motion/SplitText, src/motion/RotatingText, src/motion/AnimatedNumber (加 src/craft/NumberRoll 数字槽) 重叠. 上游许可是 MIT 加 Commons Clause, 只能把条目的常数, props 和行为描述当规格, 用本库引擎重写.

## Decision

条目到落点:

| 条目 | 落点 | 参数 |
| --- | --- | --- |
| BlurText | `StaggerText` | `variant="blur"` (默认): 间隔 200ms, 每段 0.35s 共两段经模糊中点 (kernel `midpoint`), blur 10, distance 50, 按词; `from` / `direction` / `trigger` / `loop` / `loopDelay` (默认 2s) / `threshold` 0.1 / `onComplete` |
| FoldText | `StaggerText` | `variant="fold"`: 间隔 45ms, 0.65s, `foldAngle` 92, `perspective` 700, `hinge` top / bottom, 前 30% 进度淡入 |
| MaskedHeading | `StaggerText` | `variant="mask"`: 词间隔 90ms, 1.1s, 词套裁切从 110% 升起; 按字时字间隔取词间隔的 0.35 |
| StrokeText | `TraceText` | `drawDuration` 1.6, `fillDelay` 0.2, `stagger` 0.05, `strokeWidth` 1.4, `fillMode` wipe / fade / none, `wipeFrom`, `reverse`, `strokeStyle` solid / dashed, `dashLength` 10, `trigger` (hover 即悬停重描) |
| TrueFocus | `FocusText` | `animationDuration` 0.5 与 bounce 0.38 经 `springFromVisualDuration` 换成焦点框弹簧 (`easing="smooth"` 时 bounce 0), `blurAmount` 5, `pauseBetweenAnimations` 1, `cornerSize` 16, 框距 10px, `manualMode`, `order`, `focusScale`, `unfocusedOpacity`, 滤镜过渡 0.3s |
| FallingText | `DropText` | `bounciness` 0.2, `scatter` 0.5, `stagger` 0.03, `gravity`, `order` random / start / together, `trigger` auto / click / hover / view, `split`, `highlightWords`, `draggable`, `restoreDelay` |
| SplitText | `src/motion/SplitText` 新增可选 prop | `staggerFrom` (start / end / center, 经 motion 的 `stagger(interval, { from })`), `mask` (每单元套裁切) |
| RotatingText | `src/motion/RotatingText` 新增可选 prop | `stagger` (秒, 0 时整词换, 与原先一致), `staggerFrom` first / last / center (延迟公式 `rotateCharDelay`) |
| CountUp | `src/motion/AnimatedNumber` 新增可选 prop, `src/craft/NumberRoll` 新增可选 `duration` | `duration` (定时计数, ease-out), `delay`, `roll` (数字槽), `prefix` / `suffix`; 数字槽位间错峰按 CountUp 的封顶规则 (不超过 70ms, 总量不超过时长 40%, 与内核 `cappedStep` 同式), `gapFor` 随 `duration` 重算 |

做法:

- 一条 kernel `usePlayhead` 驱动全部单元, 单元进度由 kernel `staggerRanks` / `unitProgress` 切出; 帧循环只走 `motion/frame/use-frame-loop`.
- 焦点框四路 (x, y, w, h) 用 `motion/drive/use-spring-channels`, 中途换词保留速度. 坠落用 `motion/drive/channels` 的 SpringChannels 加 `stepSpringExact`, 弹簧由 `springFromDuration(0.9s / sqrt(gravity), bounciness)` 换算, 带名次延迟; 拖起时 `jump`, 松手再 `aim` 回地面.
- 颜色只用语义 token 类: 描边 `stroke-primary`, 焦点框 `border-primary`, 高亮 `text-primary`, 都可由 `*ClassName` 覆盖. 框线为 1px.
- 读屏: 新件都有 sr-only 原文, 拆出的单元在 aria-hidden 层里. 减弱动效: StaggerText 与 TraceText 直接渲染原文; DropText 不落; FocusText 焦点框直接落位, 去掉滤镜过渡.
- 现有件的新 prop 都可选, 不给时渲染与原先一致; docs-props 已重新生成.

## Alternatives considered

- 每个条目各做一个组件: 否决, BlurText / FoldText / MaskedHeading 只是单元样式函数不同, 拆成三件会复制同一套播放头与错峰.
- StrokeText 用 SVG 文字整体量长度: 否决, SVG `<text>` 没有 getTotalLength; 改为用正文层逐字量位置, 描边长度按字号乘 4 估, 足以让描边从无到有.
- FallingText 引物理引擎: 否决, 不得新增依赖, 也不得自写积分; 落地回弹用换算出的欠阻尼弹簧近似, 不做词与词的碰撞.
- CountUp 新起一件: 否决, AnimatedNumber 与 NumberRoll 已覆盖数值与数字槽, 只缺定时计数, 延迟, 前后缀和时长可调的错峰.

## Consequences

- 规格里的演示皮肤没有落: FoldText 的 foldStyle / creaseShading, MaskedHeading 的图片或视频填充, 视差与聚光, StrokeText 的投影与行进虚线, FallingText 的主题与线框. CountUp 的列速度运动模糊 (测量指示器) 也没有落, NumberRoll 不做模糊.
- DropText 的落地是弹簧近似, 词之间会重叠, 不会堆叠.
- ENGINE-GAP: craft EASE 没有 power3 / expo 一类的命名曲线, 本批的 power3.out 与 expo.out 都用 `ease("out")` 近似.
- ENGINE-GAP: src/motion 没有逐帧写 DOM 的错峰时间轴; StaggerText 每帧重渲染, 对标题量级足够, 长段落应改走 SpringChannels 直写.
