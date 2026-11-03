# Agent Note: 皮肤层 data-skin 与密度 data-density, 只覆盖语义令牌

Status: implemented

Decision-ID: skins-density

## Code

- `src/skins/index.ts`
- `src/constants/skins.ts`
- `docs/src/pages/skins/SkinsPage.tsx`
- `src/index.ts`

## Problem

审计 P1 到 P4: 库只有 data-mode 明暗切换, 没有皮肤机制, 没有密度, 没有 display 字体位, 所有页面长一个样 (GitHub Dimmed 灰底蓝调).
要求: 六套皮肤 (default / mono / linear / fintech / emerald / retail) 各带亮暗两份值, 三档密度, 现有组件在不加属性时外观完全不变, 不改任何组件类名.

## Decision

皮肤样式在 `src/skins/*.css` (foundation, 五套皮肤, density, index 入口). 它们是受保护的非 AST 资源, 不当 Code 锚点, 改动按 resource-review 走人工核对.

- 皮肤以 `[data-skin="<name>"]` 覆盖语义令牌: 颜色 (background / foreground / card / popover / primary / link / secondary / muted / accent / heading / control-hover / border / input / ring / surface-* / primary-subtle / primary-glow / accent-2*), `--radius`, `--font-display`, `--effect-intensity`. 状态色 (success / warning / danger / done) 不随皮肤变, 它们是语义信息.
- 特异度一律 0,2,0: 明暗无关维度用 `[data-skin="x"][data-skin]`, 暗色 `[data-skin="x"]:not([data-mode="light"])`, 亮色 `[data-skin="x"][data-mode="light"]` 与 `[data-mode="light"] [data-skin="x"]`. 胜过 tokens.css 的 `[data-mode="light"]` (0,1,0), 不依赖引入顺序; 子树局部换肤同样成立.
- 阴影与渐变不逐套手写: foundation.css 用三参数 (`--skin-shadow` 色相三元组, `--skin-shadow-a` 透明度倍率, `--skin-shadow-blur` 模糊倍率) 推导六档双层阴影, 光晕与聚焦光环乘 `--effect-intensity`, 渐变与玻璃在皮肤元素上重新声明. 每套皮肤只给参数, 层次关系与默认皮肤一致.
- 新令牌 `--font-display` / `--effect-intensity` / `--gradient-hero` 在 :root 给默认值, 现有组件不读取, 默认外观不变.
- retail 两档圆角: 默认 sharp (0), `data-skin-variant="round"` 为 1.5rem.
- 密度: `--density` 倍率 (0.875 / 1 / 1.25) 只在 `[data-density]` 下改写 Tailwind v4 的 `--spacing`, 现有组件的 h-* / p-* / gap-* 随之收放; 另给 `--density-space`, `--control-h-xs..xl`, `--space-2xs..2xl`. compact 与 HxProvider 的 compact 间距同值.
- `src/skins/index.ts` 只读写 documentElement 的 data 属性 (applySkin / applyDensity / readSkin / readSkinVariant / readDensity), 无依赖, SSR 安全. default 皮肤移除属性而不是写值.
- `src/skins/index.css` 由集成任务接进 `src/styles.css`, 桶文件由集成任务接进 `src/index.ts`; 文档页集成前从源码相对路径引入, 离开页面时还原属性.

## Alternatives considered

**什么都不做, 用 HxProvider 的运行时换强调色** - 最强理由是已有运行时主题层, 能换主色, 圆角与密度. 否决: 它只从一个主色推导, 换不了底色, 边框, 阴影色相与字体, 做不出 Vercel 黑白与 Apple 强对比这类整体气质差异.

**复用 tokens.css, 在原文件里追加皮肤段** - 理由是令牌只有一个来源. 否决: tokens.css 已六百多行, 五套皮肤再加四百多行会让默认令牌难以审阅; 皮肤是可选层, 单独目录可按需引入.

**每套皮肤逐档手写全部阴影与渐变** - 理由是完全可控. 否决: 五套乘亮暗乘九个阴影令牌, 重复且容易破坏六档层次; 参数化后每套只差三个数.

**直接给组件加 skin 变体类名** - 否决: 违反不改组件类名与默认外观不变的硬约束.

## Consequences

皮肤与密度在集成任务接线前只在文档页可见. 密度改写的是全局间距单位, 用 Tailwind 间距写的固定宽度 (w-64 之类) 也会随之缩放, 这是"同一套组件整体收放"的代价. `--font-display` 列出的商业字体 (Geist / Sohne / Circular) 未打包, 缺席时回退到 Inter 与系统黑体.
