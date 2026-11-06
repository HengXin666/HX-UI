# Agent Note: 营销与正文版式件 (Display, Eyebrow, Kicker, Lead, GradientText, Prose)

Status: implemented

Decision-ID: typography-marketing

## Code

- `src/typography/Display.tsx`
- `src/constants/typography.ts`
- `docs/src/pages/typography/TypographyPage.tsx`

## Problem

`src/primitives/typography.tsx` 是文档尺度 (H1 30px), 审计 T3 (版式层级组件), T8 (正文 prose 基线), E7 (文字渐变) 判定为 "勉强":
落地页首屏大字, 眉标, 导语, 渐变字与博客正文容器都要各页手写, 字号与色值容易散进 tsx. 中文标题沿用拉丁文的收紧字距与大写会显得挤或无效.

## Decision

遵循 docs/architecture/component-contract.md. 新增 `src/typography/` (6 个直接文件):

- Display: size sm..2xl 映射 `--fs-display-sm..2xl` (V0-01 提供), 默认 `text-wrap: balance`, `as` 换标签.
- Eyebrow / Kicker (同文件): 小号大写眉标; 标识行带 1px 短竖线或图标 (子 slot icon / bar / label).
- Lead: 比正文大一号 (`--fs-lg` / `--fs-lead` / `--fs-xl`), leading-relaxed, `measure` 控制最大行宽.
- GradientText: 色标只接受语义令牌名, 经 `--hx-text-gradient` 传入; 默认 `--gradient-brand`; 强制色模式退回文字色.
- Prose: 后代任意变体给标题, 段落, 列表, 引用, 代码, 表格, 图片, hr 基线, 全部令牌, 线宽 1px, 无过渡.
- 中文回退: `cjk` = auto / true / false; auto 依据 lang 与直接文本判定, 命中写 `data-cjk`, 样式用 `data-cjk:` 变体
  切到 `--tracking-display-cjk`, 取消大写与伪斜体, 关闭字重合成.

偏离契约之处:

- size: Display 用 sm..2xl (与令牌一一对应), 文字件用 sm / md / lg 子集; 营销标题没有 xs 用途, 需要 2xl.
- 根元素切换用 `as` 而非 `asChild`: 任务要求按标签切换语义级别, 版式件无行为需要保留.
- ref: 契约 6.1 规定 React 19 下 ref 为普通 prop, 不使用 forwardRef; 任务描述中的 "forwardRef" 按此落地为 ref 透传.
- slot 元组放 `src/constants/typography.ts` 而非尚不存在的 `src/constants/slots.ts`, slots.ts 建立后迁入.

导出接入 `src/index.ts` 与文档注册 (nav.ts, App.tsx, navIcons.ts) 由集成分片完成.

## Alternatives considered

**什么都不做 / 复用现有 TypographyH1..Lead** - 最强理由: 已有组件且令牌化, 零新增 API. 否决: 尺寸上限 30px 与文档节奏绑定,
改大会破坏文档页; 也没有 Prose 容器与中文回退.

**引入 @tailwindcss/typography** - 理由: 成熟的 prose. 否决: 默认调色盘色值与灰阶不走语义令牌, 覆盖成本接近自写, 且多一个依赖.

**Prose 样式写进独立 CSS 文件** - 理由: 选择器更易读. 否决: 需要改 styles.css 入口 (归集成分片), 后代任意变体也能被 tailwind-merge 覆盖.

## Consequences

`--fs-display-*` 与 `--tracking-display-cjk` 未落地前 Display 字号回落为继承值, 中文字距为默认; V0-01 合入后自动生效.
CJK 自动判定只看直接文本, 文本嵌在子元素中时需显式传 lang 或 cjk.
