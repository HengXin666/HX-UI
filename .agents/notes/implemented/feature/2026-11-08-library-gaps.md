# Agent Note: 补齐门面换库件时记下的五条库缺口 (C2 / D4 / C10 / D3 / D5)

Status: implemented

Decision-ID: library-gaps

## Code

- `src/viz/charts/Trend.tsx`
- `src/blocks/marketing/social-proof/TestimonialTracks.tsx`
- `src/primitives/radio-group.tsx`
- `src/blocks/marketing/faq/FaqList.tsx`
- `src/blocks/marketing/Faq.tsx`
- `src/constants/skins.ts`

## Problem

文档站门面 (`docs/face`) 把私有副本换成库件时, 五处库件的 API 盖不住首页的需求, 记在 `docs/research/library-gaps.md`: Trend 只会自己按时间入场, 不能由分镜时钟驱动; TestimonialMarquee 只有横向轨道; RadioGroupItem 强加圆点, 不能拿整张卡当选项; Faq 区块问答固定是 details 加分隔线, 没有部件级类名, 也换不成 Accordion; 皮肤清单里没有门面那套暗色. 门面不归库这一路改, 所以缺口只能由库补齐.

## Decision

五处都只做加法, 不传新参数时行为与 DOM 不变.

- C2: `Trend` 加受控 `progress?: number` (0..1). 截线的纯数学进 `scale.ts` 的 `revealSeries` (按点序均分, 末点和读数在相邻两点间插值). 受控时过渡为 0, 不描线, 读数不进 aria-live (逐帧变化不该打断读屏); 减弱动效时取 1.
- D4: `TestimonialMarquee` 加 `direction?: "horizontal" | "vertical"`, `durations?: number[]`, `className`. 纵向时 `rows` 是列数 (最多 4), 列网格复用 `SOCIAL_COLS_CLASS` 的容器查询档, 第 2 列起按 `MARQUEE_LANE_CLASS` 在窄容器隐藏. 相邻列反向, 悬停与焦点暂停沿用 `effects/Marquee`. `Testimonials` 的 `marquee` 配置透传这两个参数.
- C10: `RadioGroupItem` 加 `indicator?: ReactNode | false`. 给节点替换圆点; false 不渲染 Indicator 也不套圆圈外形, 调用方用 children 和 `data-[state=checked]` 画整张卡. 漫游与 aria 仍由 radix RadioGroup 管.
- D3: `Faq` 的 `classNames` 扩成外壳 slot 加部件 slot (`FAQ_SLOTS`: item / summary / answer / list / split / aside), 写法同 `CodeShowcase`; 加 `variant?: "details" | "accordion"`, accordion 用 `primitives/accordion` (多开, 关键帧高度动画). 列表渲染按职责拆到 `faq/FaqList.tsx`.
- D5: 新皮肤 `midnight`, 暗色语义令牌逐项取 `docs/face/skin/face.css` 的值; 亮色不配语义色, 只给阴影参数, 与门面切亮色时回到默认亮色令牌一致. 阴影三参数取贴近默认六档的值. 进 `SKIN` / `SKIN_LIST` / `skins/index.css`, 皮肤数文案同步.

## Alternatives considered

- 什么都不做, 门面继续用私有副本: 最强理由是零风险. 否决: 门面与库各维护一份图表, 跑马灯和配色, 违反一种能力只有一个实现.
- C10 开放 `asChild`: 最强理由是调用方可以完全换掉按钮元素. 否决: radix Item 必须是 button 才能拿到漫游与 aria, asChild 换成别的元素容易丢语义; `indicator={false}` 加 children 已能做整张卡.
- D3 另起一个 FaqAccordion 区块: 最强理由是两种形态互不干扰. 否决: 分组, 搜索, 联系卡与双栏都要复制一份, 变体开关成本更低.
- D5 命名 `face`: 最强理由是一眼看出来源. 否决: 皮肤名描述气质而不是用途, 库的使用方不认识门面; `midnight` 不与现有皮肤重名.

## Consequences

门面可以删掉 ChartFigure 私有曲线, Changelog 的裸 Marquee, Presets 的手写 radiogroup, outro Faq 与 face.css, 改用库件 (切法见 `docs/research/library-gaps.md`). Trend 受控时仍按全部 values 算 domain, 坐标轴冲击不跟 progress 走; 若门面要冲击也受控, 需要再加一档. 纵向跑马灯窄屏只露第一列的内容, 其余列在窄屏不可见 (与门面现状一致). 皮肤数从六套变七套, 依赖 `SKIN_LIST.length` 的文案会自动变化.
