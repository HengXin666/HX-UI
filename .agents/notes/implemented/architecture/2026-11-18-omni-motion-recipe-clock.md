# Agent Note: 运动层用数据化镜头配方加统一时钟, 组件只读 0..1 进度

Status: implemented

Decision-ID: omni-motion-recipe-clock

## Code

- `src/motion/recipe.ts`
- `src/motion/drive/use-clock.ts`

## Problem

omni 1.0 要把库从控件库升级成 "页面导演库" (docs/architecture/omni-1.0.md). 运动是所有上层的地基, 但现在有五处来源: `src/craft`, `src/motion` 的 drive / frame / shots / presets / orchestration, `src/primitives/motion.ts`, `src/studio/sequence`, kits 各族 tokens. 进视口一次, 滚动, 帧循环, 受控进度各写一套; video-shotcraft 的镜头卡只以注释和散落常量的形式进库, 没有可单测, 可按名字取用的形状. 区块和页面层没法说 "这一拍用 deck-deal", 只能各自写时长和缓动, 这正是页面统一 fade-up 的根源.

## Decision

- `src/motion/recipe.ts` (配方形状与读数) 与 `src/motion/recipe-cards.ts` (第一批配方): 镜头配方是数据. 一张配方 = 若干段 `{ name, frames, curve }`, 帧按 30fps 记, 曲线只引用 craft `EASE` 的名字或 linear, 末段必须是静止 (hold). `recipeAt(recipe, progress)` 把 0..1 进度翻成 "哪一段, 段内进度, 缓动值"; `validateRecipe` 检查帧数, 末段静止与幅度下限 (位移 8px, 缩放 0.02); `dealOffsets` 给发牌式加速间隔. 第一批 11 张配方的帧数照 `docs/research/video-shotcraft.md` 各卡的时长行收录, 卡上只给总长的拆分在 summary 里注明本库定.
- `src/motion/drive/clock.ts` 与 `src/motion/drive/use-clock.ts`: `useClock(ref, { driver })` 一个时钟四种驱动 (view, scroll, loop, controlled), 返回 0..1 的 MotionValue, 不触发重渲染; 建在既有 `useFrameLoop` 上, loop 驱动离开视口或标签页隐藏即停帧; 减弱动效时恒为 1.
- `src/motion/drive/use-recipe.ts`: `useRecipe(progress, recipe)` 与 `usePhase(progress, recipe, index)` 把时钟接上配方, 全是派生 MotionValue; 纯函数 `phaseAt` 给某一段的缓动值 (段前 0, 段后 1).
- `Stagger` 加 `rhythm`: `even` (默认, 旧行为) 或 `deal`, 后者把 delayChildren 换成 `dealDelayChildren` (不叫 dealDelay: `src/motion/shots.ts` 已有同名的按序号求延迟的函数, `@hx/ui/motion` 两者都 `export *` 会撞名) (首个间隔 120ms 线性收紧到 40ms, 即 craft 的 DEAL_FIRST_MS / DEAL_LAST_MS). 默认值这一批不翻, 避免既有页面的节奏一起变; P7 品味门禁转 error 时再议.
- 时间轴数字与驱动名收在 `src/constants/motion-recipe.ts` (PROJECT-CONST-DUP).
- 两者经 `src/motion/index.ts` 转出, 因而进 `@hx/ui/motion`.

## Alternatives considered

- 什么都不做 / 复用现有 `src/motion/shots.ts` 与 `orchestration.ts`: 最强理由是它们已经覆盖 hold / dolly / rise / pan / glide 五种运镜和区块内的角色先后, 文档站与工作室整页在用. 否决: 那是 "怎么动" 的姿态表, 没有段与帧, 没法表达预备, 冲击, 静止这些镜头卡的核心, 也没法做合同测试; 保留它们, 由配方在其上补时间轴.
- 直接用 motion/react 的 `useScroll` / `useInView` 做时钟: 最强理由是少写代码. 否决: 四种驱动会变成四种 API, controlled 与 loop 还得另写, 而且 loop 不会在离屏时停帧.
- 把配方写成 CSS keyframes: 最强理由是零 JS. 否决: 滚动驱动与受控进度要在 JS 里拿到段与缓动, 合同测试也需要可采样的函数.

## Consequences

上层 (页面导演的 beat, 数据图表的入场, 流程图的播放) 都按 "时钟给进度, 配方给段" 的方式接. craft 的物理迁入与 kits tokens 链收口是 P1 后续批次; 第二批配方 (数据, 交互类卡) 等对应组件落地时再补, 不预先填数字. `@hx/ui/motion` 新增导出, api 快照需要更新.
