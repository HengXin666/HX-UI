# HX-UI 2 定位

> 一句话: **给要上线的产品用的界面库. 底层控件稳, 中层交互能当卖点, 顶层整页拿来就能发.**

参考: Aceternity UI 的 Interactions (成品交互件), MotionSites (整站方向 + 提示词). 只借思路, 不搬代码和素材 (两者 Pro 内容有授权限制).

## 三层, 三种契约

| 层 | 是什么 | 用户怎么用 | 好坏标准 | 不做什么 |
|---|---|---|---|---|
| **L1 控件 Foundation** | 令牌, 原子控件 (shadcn 底), 表格, 图表, 动效原语 | `import { Button } from "@hx/ui"` | API 稳, 无障碍, 可摇树, 首屏轻 | 不追求好看到出圈, 不放特效 |
| **L2 交互 Interactions** | 一个完整的, 带动效的产品瞬间: 发送, 确认, 计数, 对比, 排队, 上传 | 文档里实时把玩 + 调参, 一键复制单文件 (shadcn registry) | 第一眼想用, 解决一个真实交互, 每件有性能预算 | 不做纯装饰背景 (光晕, 流星, 极光) |
| **L3 成品 Sites** | 一整套页面, 有自己的美术方向: 字体, 色板, 招牌视觉, 文案 | 拷贝整个模板目录, 或把附带的提示词丢给 AI 生成同款 | 像真产品官网 / 后台, Lighthouse ≥90 | 不做 "通用模板换个色" |

区块 (Hero, Pricing, FAQ...) 不单独成层: 它是 L3 的零件, 放在 `sites/_blocks`, 跟着成品页走.

## 每层的规则

**L1 控件**
- 只做 shadcn 没有或需要统一的: 表格, 图表动画, Spin, 主题切换, 数字滚动.
- 只用语义令牌; 不带营销味的视觉.
- 首屏 JS gzip ≤ 90KB 的预算记在这一层.

**L2 交互**
- 每件一个目录: `interactions/<name>/{index.tsx, meta.ts, demo.tsx}`. `meta.ts` 描述可调参数, 文档自动生成调参面板.
- 必须: 键盘可用, `prefers-reduced-motion` 有静态版本, 只动 transform / opacity (Canvas / WebGL 件单独标注), 懒加载, 单件 gzip ≤ 8KB (WebGL 件 ≤ 25KB, 需说明).
- 每件附一个真实场景演示, 不是空盒子.

**L3 成品**
- 每套一个目录: `sites/<name>/{art.css, page.tsx, prompt.md, cover.png}`. `art.css` 只覆盖令牌和字体; `prompt.md` 是这套页面的完整设计说明, 也是给 AI 的提示词.
- 分两类: **网站** (发布页, 商城, 作品集) 和 **应用** (运营后台, 数据看板).
- 每套只有一个招牌视觉 (见 design-references.md).

## 现有代码怎么归位

| 现在 | 去向 |
|---|---|
| `components/ui`, `data/*`, `motion/*`, `hooks`, `styles` | L1 |
| `motion/animated-number`, `components/ui/spin`, ThemeToggle 圆形转场, `data/charts/animation` | L1 原语, 同时包成 L2 演示 |
| `effects/*` (shimmer, beam, magnetic, spotlight, tilt, marquee, backdrop) | 逐个审: 能变成产品瞬间的重做成 L2, 纯装饰的删或降级为内部工具 |
| `blocks/marketing`, `blocks/commerce` | `sites/_blocks` |
| `blocks/dashboard`, `blocks/analytics`, `blocks/shell` | `sites/_blocks/app` |
| `site/src/templates/launch, shop, ops, analytics` + `demos/tally` | L3 四套成品, 各自补 `art.css` 和 `prompt.md` |

入口: `@hx/ui` (L1), `@hx/ui/interactions` (L2, 按件导出), 成品页不打包进 npm, 走 registry 拷贝.

## 首批 L2 交互 (参考 Aceternity Interactions 挑的)

| 名称 | 参考 | 场景 |
|---|---|---|
| 滚动计数 Speed Counter | Speed Counter | 金额, 指标变化 |
| 发送确认 Send | Paper Plane Send | 表单提交 / 反馈发送后的状态流 |
| 灵动岛 Notch | Fluid Notch | 全局通知, 需要决策的提示 |
| 前后对比 Compare | Compare Slider | 改版前后, 修图前后 |
| 候补登记 Waitlist | Gooey Waitlist | 发布页邮箱收集 |
| 有状态按钮 Stateful Button | Stateful Button | 提交中 → 成功 → 复原 |
| 方向感知选区 | Direction Aware Selection | 列表 / 表格悬停 |
| 预览滑块 Preview Slider | Preview Slider | 作品集, 商品图 |

## 首批 L3 成品

1. **Tally 发布页** (已有, d97a26a): 补暖白底 + 产品窗口画面背景 + prompt.md.
2. **商城**: 商品列表 + 详情 + 购物车抽屉, 画面以摄影为主.
3. **运营后台**: 侧栏 + 表格 + 详情面板, Linear 式暗色.
4. **数据看板**: 指标 + 图表增量动画.

## 文档站结构

顶部三栏: 控件 / 交互 / 成品. 交互页是网格, 每格可直接玩; 成品页是封面墙, 点开全屏预览 + 复制提示词.

## 里程碑 (替换原 M2–M5)

- **R1** 目录重排 + 入口 + 文档站三栏 (不改视觉).
- **R2** 首批 8 个交互 + 调参面板.
- **R3** 四套成品各自美术方向 + prompt.md.
- **R4** registry + llms.txt, 替换旧入口, 收紧门禁, 处理 `--no-verify` 豁免.
