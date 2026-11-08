# Agent Note: 文本动效族的字形意图 (surface/text/glyph, DOM 件)

Status: implemented

Decision-ID: surface-text-glyph

## Code

- `src/surface/text/glyph/tokens.ts`
- `src/surface/text/glyph/ScrambleText.tsx`
- `src/surface/text/glyph/parts/use-scramble-pointer.ts`
- `src/surface/text/glyph/FlapText.tsx`
- `src/surface/text/glyph/TypeText.tsx`
- `src/surface/text/glyph/SheenText.tsx`
- `src/surface/text/glyph/ShiftText.tsx`
- `src/surface/text/glyph/index.ts`
- `tests/surface/text/glyph.test.tsx`

## Problem

docs/research/catalog/textanimations.md 里有八个条目改的是 "每一格显示什么字形, 或字形怎么着色": DecryptedText, ScrambledText, Shuffle, SplitFlapText, TextType, GradientText, ShinyText, GlitchText. 原裁决多为 "只留错峰公式, 模糊中点和按位停格, 不把解密或扫光当正文"; 范围扩大后这些件都要落成可用组件. 上游许可是 MIT 加 Commons Clause, 只把条目的常数, props 和行为描述当规格, 用本库引擎重写.

## Decision

条目到落点:

| 条目 | 落点 | 参数 |
| --- | --- | --- |
| DecryptedText | `ScrambleText` | `mode="settle"` (默认): `speed` 50ms 一拍, `maxIterations` 10, `sequential`, `revealDirection` (内核 StaggerFrom), `characters`, `useOriginalCharsOnly`, `animateOn` hover / view / mount / click / manual, `loop`, `loopDelay` 2000ms, `encryptedClassName` |
| ScrambledText | `ScrambleText` | `mode="pointer"`: `radius` 100px, `duration` 1.2s (中心处乱码时长, 随距离线性减到 0), 字符表默认 ".:"; 按下时半径加倍 (clickBurst) |
| Shuffle | `ScrambleText` | `mode="settle"` 加 `sequential`, `revealDirection="evenodd"` (先奇位后偶位), `stepMs` 30, `leadMs` = shuffleTimes x 350ms |
| SplitFlapText | `FlapText` | `flipDuration` 0.12s (下限 0.04s), `stagger` 0.06s, `cycleDelay` 2400ms, `flipsPerChar` 8, `padTo` 12, `charset` alphanumeric / alpha / numeric / 自定, `loop`, `intro`, `align`, `order`, `gap` 6, `tileRadius` 8, `tileClassName` |
| TextType | `TypeText` | `typingSpeed` 50, `deletingSpeed` 30, `pauseDuration` 2000, `initialDelay`, `deleteMode` backspace / clear, `loop`, `variableSpeed`, `showCursor`, `hideCursorWhileTyping`, `cursorCharacter`, `cursorBlinkDuration` 0.5s, `textClassNames` (每句的 token 类), `prefix`, `startOnVisible`, `onSentenceComplete` |
| GradientText | `SheenText` | `variant="gradient"` (默认): `colors` (token 名, 落成 var(--name)), `animationSpeed` 8s, `direction` horizontal 90 / vertical 180 / diagonal 135, `scale` 3, `yoyo`, `pauseOnHover`, `followPointer` (刚度 160 临界阻尼, 进出用 1/6s 一阶跟随) |
| ShinyText | `SheenText` | `variant="shine"`: `speed` 2s, `delay`, `angle` 120, `shineWidth` 40%, `shineTone`, `baseClassName`, `sweep` left / right, `trigger` loop / hover, `yoyo`, `followPointer` (刚度 220 临界阻尼), `disabled` |
| GlitchText | `ShiftText` | `speed` 0.5, `offset` 10px, `intensity` 0.5, `enableShadows`, `skew`, `flicker`, `mode` slices / shadow, `trigger` always / hover / click, `burstDuration` 0.6s, `shadowClassNames` |

做法:

- 乱码, 洗牌, 翻牌, 打字的状态都是时间的纯函数: 内核 `settleAt` / `rollGlyph` / `lockTimes`, 以及本批的 `typeFrame` / `typeCycle`; 内核 `usePlayhead` 只提供时间, 中途重播从头再来, 同一时刻永远同一帧.
- 指针乱码按 "每格乱到何时" 记账 (`scrambleUntil`), 帧循环在还有格没到点时继续排帧, 然后自停.
- 流光与错位每帧只写样式, 不重渲染; 帧循环一律 `motion/frame/use-frame-loop`, 指针跟随走 `motion/drive/axis` 加 `stepSpringExact`, 刚度按条目换算成临界阻尼 (`springFromStiffness(k, 0)`), 进出过渡用 `motion/spring/follow` 的 `approach`. 光标闪烁走 `motion/frame/play-loop`.
- 颜色只用语义 token: 类 (`text-muted-foreground`, `text-danger`, `text-primary`, `bg-muted`) 或 `var(--primary)` 一类 token 变量.
- 读屏: 每件都有 sr-only 原文 (FlapText 与 TypeText 读全部词或句), 视觉层 aria-hidden. 减弱动效: ScrambleText 与 ShiftText 只显示原文; FlapText 静止显示第一个词; TypeText 直接显示第一句, 光标不闪; SheenText 渐变静止, 光带不出现.

## Alternatives considered

- 解密与洗牌分两件: 否决, 两者只差停格时刻表 (整体停, 逐位停, 先奇后偶加前导乱码), 合成一件只差参数.
- 翻牌用 CSS 关键帧: 最强理由是条目原本就是 CSS 动画. 否决: 关键帧没法按格算 "从哪个字翻到哪个字, 翻几页", 中途换词会跳; 改为 rollGlyph 纯函数给出当前字, 下一字和翻页相位.
- 渐变与扫光用 CSS @keyframes: 否决, 跟随指针要在自动相位与指针之间连续过渡, 关键帧做不到保速.

## Consequences

- 没有落的视觉: DecryptedText 的 canvas 淡入特效与 hoverRadius, Shuffle 的 SVG 模糊步与颜色渐变, SplitFlapText 的 glare / depth / tileStyle 皮肤, TextType 的 mistakes 与 typeEffect, GradientText 的 glow 与描边框, ShinyText 的 bands / glow / softness, GlitchText 的字形替换模式. 这些都是皮肤, 状态机已在.
- 画布件 (ASCIIText, FuzzyText, ParticleText, WarpText) 不在本批, 下一批按协调改用 `src/surface/backdrop/kernel` 再落.
- ENGINE-GAP: 无新增. 本批所需的帧循环, 弹簧与一阶跟随 src/motion 都已有.
