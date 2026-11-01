# Agent Note: 布局原语 (Stack / Grid / Container / Bento / SplitView)

Status: implemented

Decision-ID: layout-box-primitives

## Code

- `src/box/Stack.tsx`
- `src/constants/box.ts`
- `docs/src/pages/box/BoxPage.tsx`

## Problem

`src/layout/` 里是版式件 (SettingChrome, ProxyChain, SessionStatusDot 等业务形态), 没有任何页面都要用的通用布局件.
每个页面各写一遍 `flex flex-col gap-*` 与 `mx-auto max-w-*`, 间距档与最大宽度档因页面而异, 整站没有统一节奏;
可拖拽分栏只有 primitives/resizable 的裸件, 刷新后尺寸丢失, 每个使用方都要自己接存储.

## Decision

新增 `src/box/` 目录 (与 src/layout/ 平行, 不挪动既有版式件), 五个文件各管一类排布:

- `Stack.tsx`: Stack / HStack / VStack / Spacer. cva 变体 direction / gap / align / justify / wrap / divided / stackBelow, 可渲染为语义标签 (ul, nav, section...).
- `Grid.tsx`: Grid 的列数写进 `--grid-cols(-sm/-md/-lg)` 变量, 由固定的 `repeat(var(), minmax(0,1fr))` 类消费; AutoGrid 用 `repeat(auto-fill|auto-fit, minmax(min(var(--box-min),100%),1fr))`, 按容器而不是视口换列.
- `Container.tsx`: 宽度档 `BOX_WIDTH` (prose / sm / md / lg / xl / full) 定义在这里, Container / Section / Center 只认这一套. Section 有标题时以 aria-labelledby 成为具名区域.
- `Bento.tsx`: Bento (role=list) 与 BentoItem (role=listitem). 跨度只写 lg 起的值, sm 最多 2, 手机单列; `grid-flow-row-dense` 回填空洞; 可点磁贴用覆盖整块的透明链接 / 按钮热区, Tab 可达, 有焦点环与可访问名称.
- `SplitView.tsx`: 包 primitives/resizable, 用 react-resizable-panels 的 `useDefaultLayout` 持久化; 只在用户拖动或键盘调整后写回 (onlySaveAfterUserInteractions), localStorage 读写异常时退回不持久化. 拖拽条沿用库的 role=separator 与方向键 / Home / End / Enter.

统一档位: 间距 `BOX_GAP` (none..2xl, 4px 基数), Section 纵向留白 `BOX_PAD_Y` (与间距同名同序), AutoGrid 最小列宽 `BOX_MIN_COL`, Bento 行高 `BENTO_ROW` 都在 `src/constants/box.ts`; 组件只接受档名, 不接受任意值.
颜色只用语义 token (border / muted / card / primary / ring), 线条 1px, 过渡只写 transition-colors.

文档页 `docs/src/pages/box/BoxPage.tsx` 与 `BentoPage.tsx` 暂以相对路径引用 src/box (公共导出与导航由集成分片 Z 接线, 接线后可改为 `@hx/ui`).

## Alternatives considered

**什么都不做, 继续在页面里手写 flex 与 grid** —— 最强理由: 零新增 API, Tailwind 类本身已经足够表达, 读代码的人不必再学一层封装.
否决: 档位分散在上百处, 改一次节奏要全仓搜索; 手写里不同页面的 gap / max-w 已经不一致, 这正是 "粗糙" 观感的来源之一.

**复用现有 src/layout/ 或 primitives/resizable, 不建新目录** —— 最强理由: 少一个目录与桶文件, 使用方 import 路径不变.
否决: layout/ 是业务版式件, 混入通用原语会让两类东西互相牵制; 分片计划要求新能力进独立目录以便并行与集成.
resizable 保持裸件不动, SplitView 只在其上加持久化与语义, 不改它的默认行为.

**每个组件各自定义 gap / max-w 映射** —— 最强理由: 组件自包含, 改一个不影响另一个.
否决: 这正是要消除的问题, 档位必须只有一份.

**Grid 用 grid-cols-1..12 的 cva 映射** —— 最强理由: 类名直观, 无 CSS 变量.
否决: 每个断点十二个类, 四个断点近五十个字面量, 且列数受限; 变量方案类名固定, 列数任意.

## Consequences

页面排布有了统一入口与一套节奏. 代价: 档位是封闭集合, 需要特殊间距时用 className 覆盖 (twMerge 会合并).
src/box 的导出要等集成分片 Z 在 src/index.ts 与 constants/index.ts 接线后才进入公共 API; 文档页路由同理.
Bento 的可点磁贴热区覆盖整块, 磁贴内部不宜再放独立的可交互控件.
