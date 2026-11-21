# Agent Note: 页面导演层先落拍 (beat) 的类型与纯函数校验, 渲染不动

Status: implemented

Decision-ID: omni-page-beats

## Code

- `src/page/beat.ts`

## Problem

`definePage` 只检查区块名与 props, 说不出 "这一屏的主角是谁, 用哪个镜头, 节奏快慢". 于是页面容易全部居中, 节奏一个样, 重效果叠满, 图片缺 alt, 这些都是 omni 1.0 要去掉的 AI 味 (docs/architecture/omni-1.0.md 第 5 节). 品味门禁和 Page Studio 都需要一个能在纯数据上跑的判据.

## Decision

- `src/page/beat.ts` 定义 `Beat` (id, lead, shot, layout, pace, media, heavy), `Direction` 与第一批六套 `DIRECTIONS` (镜头白名单 + 重效果预算), `defineBeats` 做类型化书写.
- `validateBeats(beats, direction?)` 返回问题列表: 空页, 缺主角, id 重复, 同节奏三连, 居中三连, 方向不收的镜头, 图片缺 alt (装饰图放行), 重效果超预算. 只读数据, 不碰 DOM.
- 词表, 上限与白名单放 `src/constants/page-beat.ts`; shot 用 `ShotRecipeName`, 拼错在编译期报.
- `PageSpec` (`src/page/define.ts`) 加 `story?: StoryBeat[]` 与 `direction?`, `sections` 改为可选. `StoryBeat` = `Beat` 加这一拍要渲染的 `sections`. `Page` 有 story 时走 `BeatPage`, 拍内仍由 `PageComposer` (as div) 渲染区块, 所以语言, 文案, 密度照旧; 只写 sections 时行为不变. 只写 sections 但给了 direction 时, `sectionsToBeats` (`src/page/story.ts`) 先转成一区块一拍: 主角写区块名, 镜头取方向白名单第一张 (无方向用 craneRiseReveal), 版式 stack, 节奏 even / fast / slow 轮转, 保证过 validateBeats 的节奏与镜头两项. `storyOf(spec)` 给出该按哪些拍渲染.
- `BeatStage` (`src/page/BeatStage.tsx`) 是一拍的舞台: 按 beat.shot 取配方, 起 useClock (默认 view, 可 scroll / controlled), 经 `useBeat` 把进度, 段名, 缓动值交给子元素; 自身不动画, 只写 id 与 data-beat / data-layout / data-pace / data-direction.
- 方向令牌组放在 `src/tokens.css` 的 hx.tokens 层: `--dir-type-ratio`, `--dir-display-tracking`, `--dir-measure`, `--dir-gutter`, `--dir-radius`, `--dir-image-filter`, 页根写 data-direction 切换; 区块只读令牌, 不认方向名.
- 版式语法先做六种 (split, center, bleed, grid, rail, stack), 在 `src/page/beat-layout.ts` 用内联样式实现 (`beatStyle`): 不依赖使用方的 Tailwind 扫描, 不新增 CSS 入口, auto-fit / minmax 自适应不写断点, 节奏决定上下留白. `BeatPage` 按拍渲染整页, 根节点写 data-direction 与 data-beat-issues, 校验不阻断渲染.

## Alternatives considered

- 什么都不做 / 继续只用 `definePage`: 最强理由是零新概念, 现有样板页都在用. 否决: 它只管 "能不能渲染", 管不了 "像不像模板", 去 AI 味的规则无处落地.
- 第一批就扩展 `PageSpec` 加 beats 并改渲染: 最强理由是一步到位. 否决: 先让判据与舞台独立可测, 渲染接线放到批 6 单独一个 diff, 牵动 layered-entries 的 `Page` 时只改一处.
- 给 story 另开一个 `StoryPage` 组件, 不动 `Page`: 最强理由是零回归风险. 否决: 使用方要在两个组件间选, 旧 spec 升级还得换组件; 现在 `Page` 按 spec 内容分流, 旧 spec 一字不改照旧渲染.
- 把规则写进 lint 脚本: 最强理由是门禁统一. 否决: Page Studio 要在浏览器里实时提示, 需要库内纯函数; 门禁再调同一个函数.

## Consequences

`@hx/ui/page` 多出 beat, `StoryBeat`, `sectionsToBeats`, `storyOf` 导出, api 快照需要更新. `PageSpec.sections` 变为可选, 读它的代码要处理 undefined (库内只有 `Page`). `PageSpec` 后续又加了 `meta` (见 omni-page-meta 决策, `2026-11-19-page-meta-jsonld.md`). 方向的字体阶, 栅格, 图片处理等 direction 令牌组随后补; TASTE-* 门禁以 warning 接入 validateBeats.
