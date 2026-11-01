# Agent Note: 富交互件 (时间线, 评分, 拖放上传, 标签输入, 色块选择)

Status: implemented

Decision-ID: rich-widgets

## Code

- `src/widgets/Rating.tsx`
- `src/constants/widgets.ts`
- `docs/src/pages/widgets/WidgetsPage.tsx`

## Problem

全库没有 Timeline, Rating, FileDropzone, TagInput, ColorSwatch 这类现代组件库的常见交互件 (见 docs/reference/ui-enrichment-plan.md 第一节第 4 条).
调用方每次都要自己拼, 结果是键盘可达性, 校验反馈与动效节奏各不相同, 而且最容易漏掉的恰恰是键盘流程和失败提示.

## Decision

新增 `src/widgets/` 目录, 五个组件各一个文件, 由 `index.ts` 桶导出, 只依赖已有的 motion 与库内常量, 不引入新依赖. 接进 `src/index.ts` 由集成分片 Z 负责.

- **键盘优先**: Rating 与 ColorSwatch 都是 radiogroup + roving tabindex, 整组一个 Tab 停靠点, 方向键移动即选中, Home / End 到两端, 与原生单选组一致. Rating 半星时每颗星拆成左右两个 radio, 步长 0.5, Backspace / Delete 清零.
  TagInput 回车或逗号 (含全角) 建签, 粘贴文本按逗号, 分号, 换行拆分; 输入框为空时 Backspace 删最后一个签, 光标在最前时 ArrowLeft 进入标签行, 标签之间方向键移动, Backspace / Delete 删除当前签, 越过末尾回到输入框.
  FileDropzone 的投放区本身是 button, Enter / Space 打开系统文件框, 与拖放走同一套校验.
- **失败必须可见**: FileDropzone 按 accept, maxSize, maxFiles (单选模式视为 1) 校验, 每个被拒文件连同原因列在 role=alert 区, 同时触发 onReject. TagInput 的重复, 校验失败或超额输入留在框里并标红提示, 不会悄悄丢掉.
- **动效**: Timeline 可选交错入场 (父级 staggerChildren), TagInput 与上传列表用 AnimatePresence 做进出, 都在系统减弱动效或 motion 的 useReducedMotion 下收敛.
- **颜色**: 只用语义类 (bg-primary, bg-success-emphasis, text-warning 等), 色调映射集中在 `src/constants/widgets.ts` 的 TONE_CLASSES. ColorSwatch 的色值由调用方传入, 文档示例只传 `var(--token)`.
- **常量**: 组件内重复的类名串, 键位与文案拼接符全部收进 `src/constants/widgets.ts`, 文档页的示例数据与属性表也放在这里, 避免与其他页面的 "boolean" 等字面量累计触发 PROJECT-CONST-DUP.
- 文档页 `docs/src/pages/widgets/WidgetsPage.tsx` 在 Z 接线前用相对路径引用 `src/widgets`, 接线后可改为 `@hx/ui`.

## Alternatives considered

**什么都不做, 让调用方自己拼** —— 最强理由是零维护成本, 且各业务的评分或上传需求差异很大, 通用件可能不合用. 否决: 差异主要在上传后端, 而收集, 校验, 键盘与反馈这层是共性, 恰恰也是各处自写时最常缺失的部分. 本组件只做这一层, 上传交还调用方.

**复用现有 radix (RadioGroup, ToggleGroup) 包一层** —— 最强理由是焦点管理现成. 否决: Rating 的半星需要一颗星内两个可选位叠放, ColorSwatch 需要圆形色块与选中勾, 用 radix RadioGroup.Item 要覆盖几乎全部结构和样式; 自写 roving tabindex 只有十几行, 行为可控.

**评分用 role=slider** —— 最强理由是半星在 slider 语义下更自然. 否决: 验收清单与常见读屏期望都是 radiogroup, 每一档有独立可读名 ("3.5 星"), 点击位置与 radio 一一对应.

## Consequences

`src/constants/` 直接文件数因此再加一个 (HC-DIR 警告), 这是方案指定的位置. 文档页在 Z 接入导航前不可达. FileDropzone 不做上传进度, 需要时由调用方在列表旁另行展示.
