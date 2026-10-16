# Agent Note: 暗色换成 GitHub Dark Dimmed, 补语义状态色, 动效令牌与水波纹

Status: implemented

Decision-ID: dark-dimmed-retheme

## Code

- `src/primitives/ripple.tsx`
- `src/layout/NavTabs.tsx`
- `src/index.ts`

## Problem

暗色主题原来是接近纯黑的蓝黑底 (rgb(20, 22, 30)) 加靛紫主色, 默认按钮是前景色实底的反相白按钮. 用户确认的目标观感是 GitHub Dark Dimmed: 灰底, 层级靠三档灰与 1px 边框, 强调色是 Primer 蓝, 默认按钮是低调的灰底描边. 同时组件里散落着二十多处 emerald / amber / red 调色盘色, 它们不随换肤变化, 亮色与暗色下都是同一个绿和黄; 状态色没有令牌, 每个组件各写一份. 动效只有时长令牌, 没有点按反馈, 按钮, 标签页, 菜单项点下去没有任何过程.

## Decision

- tokens.css 暗色整组换成 Dark Dimmed 取值, 保持 rgb() 写法并在行尾注释 Primer 十六进制; 新增 --link, --heading, --border-muted, --control-hover 与 success / warning / danger 三组 (base / -emphasis / -fg) 以及 --done. 亮色同步换成 GitHub Light 的对应档位, 语义一一对应. 蓝图 --bp-* 不动, 它们是按数据类型编码的信息.
- styles.css 的 @theme inline 桥接全部新令牌, 组件里写 text-success-fg, bg-warning/15, border-danger/40. 原来的调色盘色全部换成这些类名; 重复三次以上的状态文字色收进 src/constants 的 TONE.
- 动效令牌改为 --duration-fast / -base / -slow / -ripple, 旧名 --dur-* 保留为别名; --ease-out 改成 cubic-bezier(0.2, 0, 0, 1). prefers-reduced-motion 下所有时长令牌归零.
- 新增 primitives/ripple.tsx: useRipple 返回要展开到宿主上的 data-ripple 与两个事件回调, Ripple 组件用 Slot 给任意单个子元素加波纹. 波纹 span 直接插入 DOM 并在 animationend 后移除, 不走 React state. 默认接入 Button (link 除外), TabsTrigger, DropdownMenuItem / RadioItem, SelectItem, SidebarNavItemButton, NavTabs, SegmentedControl, 均可用 ripple={false} 关闭. 复选框, 开关, 单选, 输入框, 链接与表格行不接.
- Button 的 default 变体改成 secondary 灰底 + 1px 边框, destructive 改成 danger 浅底 + danger-fg 文字; variant 与 size 的名字不变.
- 补 Checkbox, RadioGroup, Pagination, Kbd, Alert 五个基础件并从 src/index.ts 导出.

## Alternatives considered

- 什么都不做 / 复用现有: 最强理由是 README 承诺视觉类名沿用 open-vetta, 不改就不会和上游产生差异. 否决: 用户已经确认了新的观感, 而调色盘色不随换肤这一点在现有设计下本身就是缺陷, 不改它亮色主题永远是暗色的绿和黄.
- 只改 tokens.css, 组件类名一个不动: 改动最小, 与上游最可对照. 否决: 默认按钮的反相白和调色盘色都写在组件类名里, 只改令牌改不到它们.
- 波纹用 React state 渲染子节点: 写法更 React. 否决: 每次点击都会多一次宿主重渲染, 且 asChild 与 radix 的 Item 没有地方放额外子节点.
- 波纹用 CSS :active 伪元素: 不需要 JS. 否决: 伪元素拿不到按下位置, 只能从中心扩散, 且键盘触发没有 :active.

## Consequences

换肤范围从颜色扩展到状态色与动效, 组件里不再出现调色盘色 (蓝图示例里按类型编码的 bg-amber-400 除外). 代价是 primitives 与部分 layout 的类名与 open-vetta 上游不再逐字一致, 之后同步上游时这些文件要手工合并. 水波纹给宿主加了 overflow: hidden, 宿主内需要溢出显示的内容 (例如外挂角标) 要么放到宿主外, 要么对该宿主传 ripple={false}.
