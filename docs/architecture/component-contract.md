# 组件契约 (Component Contract)

本文是 HX-UI 所有新组件的唯一契约来源. 新组件的 props, DOM 结构, 样式覆盖, 无障碍与文件切分都以本文为准; 本文与组件实现冲突时, 改实现或先改本文, 不允许两者长期不一致. 现有组件中违反本文的条目集中列在第 11 节, 标为待迁移, 本轮不修改.

适用范围: `src/` 下所有公开导出的 React 组件 (L2 基础件, L3 复合件, L4 Pro 层, L5 领域件). 分层定义见 `docs/reference/audit/ui-library-gap-analysis.md` 第七节. 技术栈不变: React 19 + TypeScript + radix-ui + Tailwind v4 + cva + tailwind-merge.

用词约定: "必须" 违反即不得合入; "应当" 偏离时须在组件 JSDoc 写明原因; "可以" 为可选.

## 目录

1. 统一 prop 词汇
2. 受控与非受控
3. 组合: asChild 与 render prop
4. 插槽覆盖: classNames 与 styles
5. data-slot 与 data-state
6. ref 透传与归属
7. 事件命名与阻止默认
8. 样式硬约束
9. 无障碍
10. 目录, 文件切分与废弃流程
11. 现有组件兼容说明 (待迁移)
12. 新组件自检清单

---

## 1. 统一 prop 词汇

同一概念全库只用一个 prop 名与一组取值. 取值常量放 `src/constants/ui.ts` (已有 `ORIENTATION`, `SIDE`, `ALIGN`, `SIZE`, `VARIANT`, `TONE_VARIANT`), 组件不得在本地重复声明字面量联合.

### 1.1 词汇总表

| prop | 类型与取值 | 默认 | 含义 | 落到 DOM |
|---|---|---|---|---|
| `size` | `"xs" \| "sm" \| "md" \| "lg" \| "xl"` | `"md"` | 控件尺寸档: 高度, 字号, 内边距, 图标尺寸一起变 | `data-size` |
| `variant` | 组件自定, 从 `solid / soft / outline / ghost / link / plain` 中选子集 | 组件自定 | 视觉结构: 有无底色, 有无边框 | `data-variant` |
| `tone` | `"neutral" \| "primary" \| "success" \| "warning" \| "danger" \| "info"` | `"neutral"` | 语义色: 只决定取哪组语义 token | `data-tone` |
| `radius` | `"none" \| "sm" \| "md" \| "lg" \| "full"` | 组件自定 | 圆角档, 映射 `--radius-*` 令牌 | `data-radius` |
| `density` | `"compact" \| "default" \| "comfortable"` | 继承 Provider, 否则 `"default"` | 列表, 表格, 菜单的行高与间距 | `data-density` |
| `orientation` | `"horizontal" \| "vertical"` (`ORIENTATION`) | 组件自定 | 排列方向, 同时决定方向键 | `data-orientation` + `aria-orientation` |
| `loading` | `boolean` | `false` | 正在等待异步结果 | `data-loading` + `aria-busy="true"` |
| `disabled` | `boolean` | `false` | 不可交互, 不可聚焦, 不随表单提交 | 原生 `disabled` 或 `aria-disabled` + `data-disabled` |
| `readOnly` | `boolean` | `false` | 可聚焦可选中, 值不可改, 随表单提交 | 原生 `readOnly` 或 `aria-readonly` + `data-readonly` |
| `invalid` | `boolean` | `false` | 校验未通过 | `aria-invalid="true"` + `data-invalid` |
| `required` | `boolean` | `false` | 必填 | 原生 `required` 或 `aria-required` |

规则:

- `size` 只有五档, 不得新增 `"default"`, `"icon"`, `"icon-sm"` 这类档名. 只有图标的按钮用独立布尔 `iconOnly`, 与 `size` 组合 (`size="sm" iconOnly`), 宽高相等取同档控件高度.
- `size` 各档的高度来自令牌 `--control-h-xs` 到 `--control-h-xl` (P0-04 新增), 组件内写 `h-(--control-h-md)` 之类, 不写 `h-8` 之外的魔法数, 不写 `text-[12px]`.
- `variant` 与 `tone` 正交: `variant` 管 "长什么样", `tone` 管 "什么颜色". 不得出现 `variant="destructive"` 这类把颜色塞进 variant 的取值; 危险按钮写 `variant="solid" tone="danger"`. cva 中 `tone` 用 `compoundVariants` 与 `variant` 组合.
- `density` 与 `size` 的分工: `size` 改单个控件的尺寸; `density` 改容器内重复项 (表格行, 菜单项, 列表项) 的行高与间距. 表格同时支持两者时, `size` 作用于表内控件, `density` 作用于行.
- `density` 可由上层 Provider (P1 的 `src/provider`) 下发, 组件 prop 优先于 Provider.
- `orientation` 改变时, 键盘方向键随之改变 (见第 9 节), 不另设 prop.
- 布尔 prop 一律用肯定式 (`disabled`, `loading`), 不用 `notXxx`, `noXxx`. 显示开关用 `show<Part>` (例: `showCloseButton`), 已在 Dialog 中使用, 沿用.

### 1.2 loading 的行为

- `loading` 为 true 时: 根节点写 `aria-busy="true"` 与 `data-loading`; 阻止激活 (点击, Enter, Space 不触发 `onClick` 与 `onValueChange`); 元素仍可聚焦, 读屏可读到 busy. 不写原生 `disabled`, 否则焦点会丢.
- Button 在 loading 时保持原宽度: 内容用 `invisible` 保留占位, spinner 绝对定位居中, 不得让按钮宽度跳动.
- 可提供 `loadingText` 给读屏, 默认值来自 locale (P1), 不得在组件里写死英文.

### 1.3 disabled 与 readOnly 的区别

| 维度 | `disabled` | `readOnly` |
|---|---|---|
| Tab 可达 | 否 (原生 disabled) | 是 |
| 可选中复制文本 | 否 | 是 |
| 值可改 | 否 | 否 |
| 随表单提交 | 否 | 是 |
| 视觉 | `opacity-50` + `cursor-not-allowed` | 不降透明度, 去掉 hover 反馈, 光标默认 |
| 弹层能否打开 | 否 | Select / Combobox / DatePicker 可以打开查看, 不能选择 |
| 适用 | 当前上下文不允许操作 | 展示已提交或只读权限下的值 |

非表单控件 (Button, Tabs trigger, MenuItem) 不支持 `readOnly`, 类型上就不暴露该 prop.

需要 "禁用但仍可聚焦以展示 Tooltip" 时, 用 `aria-disabled="true"` + `data-disabled`, 不写原生 `disabled`, 并在处理器里自行拦截激活. 这种模式只在组件文档里明确声明后使用.

### 1.4 同时出现时的优先级

交互态从高到低: `disabled` > `readOnly` > `loading` > 正常. 规则:

1. 只输出最高一级的交互态属性: `disabled` 为 true 时不输出 `data-readonly`, `data-loading`, `aria-readonly`, `aria-busy`.
2. `readOnly` 与 `loading` 同时为 true 时输出 `data-readonly` 与 `aria-busy` (loading 只表达忙碌, 不改变只读).
3. `invalid` 与交互态独立: 任何交互态下都照常输出 `aria-invalid`, 但 `disabled` 时不显示错误色 (CSS 用 `data-invalid:not([data-disabled])`).
4. 由 Provider 下发的 `disabled` (例如 Fieldset 整体禁用) 与组件自身 prop 取 "或".

参考实现:

```ts
// src/hooks/use-interaction-state.ts (L1, 与本文同批规划)
export type InteractionState = "disabled" | "readonly" | "loading" | "idle";

export function resolveInteraction(p: { disabled?: boolean; readOnly?: boolean; loading?: boolean }): InteractionState {
	if (p.disabled) return "disabled";
	if (p.readOnly) return "readonly";
	if (p.loading) return "loading";
	return "idle";
}
```

---

## 2. 受控与非受控

### 2.1 命名规则

每个可由用户改变的状态 `x` 必须同时支持受控与非受控, 三件套固定命名:

| 状态 | 受控值 | 非受控初值 | 变更回调 |
|---|---|---|---|
| 主值 (输入框文本, 选中项, 滑块值, 当前 tab) | `value` | `defaultValue` | `onValueChange(value, details)` |
| 勾选 (Checkbox, Switch, Toggle) | `checked` | `defaultChecked` | `onCheckedChange(checked, details)` |
| 展开 / 打开 (Dialog, Popover, Accordion 单项) | `open` | `defaultOpen` | `onOpenChange(open, details)` |
| 其他具名状态 | `<x>` | `default<X>` | `on<X>Change(next, details)` |

其他具名状态示例: `expandedIds / defaultExpandedIds / onExpandedIdsChange`, `page / defaultPage / onPageChange`, `sorting / defaultSorting / onSortingChange`, `rowSelection / defaultRowSelection / onRowSelectionChange`, `searchValue / defaultSearchValue / onSearchValueChange`.

- 回调第一个参数永远是新值本身, 不是事件. 第二个参数 `details` 可选, 形如 `{ reason: "item-press" | "keyboard" | "clear" | ...; event?: Event }`, 供调用方区分来源.
- 空值: 单选类组件用 `null` 表示 "未选择", 不用 `undefined`. 因为 `value === undefined` 被定义为 "非受控", 用 `undefined` 表示空会让组件意外切回非受控.
- 不得用函数式更新签名 (`(prev) => next`) 作为回调参数; 回调只接收确定的新值.

### 2.2 onChange 与 onValueChange 的分工

- `onChange` 只保留给原生语义: 组件根节点就是原生表单元素 (`<input>`, `<textarea>`, `<select>`), 且把原生 `ChangeEvent` 原样透传时, 才使用 `onChange`. 例: `Input`, `Textarea`, `NativeSelect`.
- 只要回调参数是值而不是原生事件, 就必须叫 `onValueChange` (或 2.1 表中对应的 `on<X>Change`). 例: Select, Combobox, Slider, Tabs, SegmentedControl, Rating, TagInput, ColorSwatch.
- 原生元素组件可以同时提供 `onValueChange` 作为便利回调, 两者都会被调用, 先 `onChange` 后 `onValueChange`; 若 `onChange` 中调用了 `event.preventDefault()`, 不再调用 `onValueChange`.
- 同一组件不得出现两个语义相同的回调 (例如同时有 `onChange(value)` 和 `onValueChange(value)`).

### 2.3 受控时内部不得保存状态

判定: `const isControlled = props.value !== undefined`. 受控时:

- 组件渲染只读 `props.value`, 不得把它复制进 `useState`, 不得用 `useEffect` 同步 "props -> state".
- 用户操作只调用 `onValueChange(next)`, 不改任何内部值; 调用方不更新 `value` 时, 界面必须保持原值 (这是受控的定义).
- 中间态 (例如输入法组合中, 拖拽中) 可以有内部临时状态, 但必须在提交时回到 `props.value`, 并在 JSDoc 写明.
- 组件生命周期内不得在受控与非受控之间切换. 开发环境检测到切换时 `console.error` 一次, 文案包含组件名与 prop 名.

统一使用 L1 hook, 不在组件内手写:

```ts
// src/hooks/use-controllable-state.ts
export function useControllableState<T>(opts: {
	value: T | undefined;
	defaultValue: T;
	onChange?: (next: T, details?: ChangeDetails) => void;
	name: string; // 组件名, 用于开发期警告
}): readonly [T, (next: T, details?: ChangeDetails) => void] {
	const isControlled = opts.value !== undefined;
	const [inner, setInner] = React.useState(opts.defaultValue);
	const current = isControlled ? (opts.value as T) : inner;
	const set = React.useCallback(
		(next: T, details?: ChangeDetails) => {
			if (Object.is(next, current)) return;
			if (!isControlled) setInner(next); // 受控时不写内部状态
			opts.onChange?.(next, details);
		},
		[current, isControlled, opts.onChange],
	);
	return [current, set] as const;
}
```

- 组件包 radix 时, radix 自带受控逻辑, 直接把 `value / defaultValue / onValueChange` 原样交给 radix, 不再套一层 `useControllableState` (现有 `tabs.tsx` 的写法即正确示范).
- 只读旁听非受控值 (例如 Tabs 指示器需要知道当前值) 时, 只能在回调里记录, 不得反向写回 radix.

---

## 3. 组合: asChild 与 render prop

### 3.1 asChild

用途: 保留组件的行为与样式, 把根元素换成调用方提供的单个元素. 典型场景: Button 渲染成路由 `<Link>`, DialogTrigger 包一个已有按钮, TooltipTrigger 包一个图标.

实现: `const Comp = asChild ? Slot.Root : "button"` (radix-ui 的 Slot, 现有 Button 即此写法).

注意事项:

- `asChild` 时 children 必须恰好是一个 React 元素, 不能是文本, Fragment 或数组. 组件内部不得在 Slot 外再包任何节点, 否则行为错位.
- 被包元素必须接受并透传 `ref`, `className`, `style` 与所有事件处理器; 自定义组件当子元素时, 由调用方保证 (React 19 下 ref 为普通 prop, 自定义组件需把 `ref` 透传到 DOM).
- 合并规则: className 用 `cn` 合并 (组件类在前, 子元素类在后); style 浅合并, 子元素优先; 事件处理器两者都调用, 不得依赖先后顺序, 需要拦截时用 `event.preventDefault()` + `event.defaultPrevented` 判断.
- `data-slot`, `data-state`, aria 属性由组件写到 Slot 上, 最终落在子元素; 子元素不得自带冲突的 `data-slot`.
- `asChild` 换成非 button 元素时, 组件负责补 `role` 与键盘激活吗? 不负责. asChild 的语义责任在调用方: 换成 `<a>` 时它就是链接. 组件只在文档里写清楚.
- 原生 button 的 `type`: `asChild` 为 false 时适用第 7.3 节; 为 true 时不写 `type` (子元素未必是 button).
- 只有渲染单一根元素的部件才提供 `asChild`. 多部件组件 (DataTable, Select 整体) 不提供根级 `asChild`, 由其子部件 (SelectTrigger) 各自提供.

### 3.2 render prop

用途: 调用方需要拿到组件内部状态来决定渲染什么, 或者要替换的不是根元素而是某个内部部件的内容.

命名:

| 形态 | 签名 | 场景 |
|---|---|---|
| `render` | `(props: PartProps, state: PartState) => React.ReactElement` | 替换整个部件元素并读状态, 调用方必须把 `props` 展开到返回元素上 |
| `render<Part>` | `(item: T, state: { selected; highlighted; disabled; index }) => React.ReactNode` | 替换列表项或部件内容, 组件仍负责外层元素与 aria |
| `children` 作为函数 | 不使用 | 与普通 children 类型冲突, 不进入本库 API |

示例: `renderOption`, `renderValue`, `renderEmpty`, `renderCell`, `renderTag`.

注意事项:

- `render` 返回的元素必须展开组件给出的 `props` (含 ref, aria, data-*, 事件). 漏展开会丢失无障碍与行为, 组件在开发环境检测返回元素缺失 `data-slot` 时警告.
- `render<Part>` 只替换内容, 组件保留外层 `role="option"` 等语义, 调用方不得在返回值里再写交互元素 (button, a) 嵌套在可交互项内.
- 同一部件上 `asChild` 与 `render` 互斥, 类型上用联合类型禁止同时传; 运行时不做优先级兜底.
- render 函数会在每次渲染调用, 组件不得假定其稳定, 不得放进依赖数组导致循环.

### 3.3 选择原则

| 需求 | 用 |
|---|---|
| 换根元素标签, 不需要状态 | `asChild` |
| 换根元素且需要内部状态 (open, selected) 改变外观 | `render` |
| 定制列表项, 选中值, 空态, 单元格的内容 | `render<Part>` |
| 只改样式 | `classNames` / `styles` (第 4 节), 不用 render |

---

## 4. 插槽覆盖: classNames 与 styles

对标 antd v6 semantic `classNames` / `styles` 与 Mantine Styles API. 目的: 调用方不读源码, 只凭本节的 slot 表就能精确改任意内部部件的样式, 不需要写后代选择器.

### 4.1 类型

```ts
// src/constants/slots.ts 中为每个组件导出 slot 元组, 类型从元组推导
export const DIALOG_SLOTS = ["root", "overlay", "content", "header", "title", "description", "body", "footer", "close-button"] as const;
export type DialogSlot = (typeof DIALOG_SLOTS)[number];

export type SlotClassNames<S extends string, State = void> =
	| Partial<Record<S, string>>
	| ((state: State) => Partial<Record<S, string>>);

export type SlotStyles<S extends string, State = void> =
	| Partial<Record<S, React.CSSProperties>>
	| ((state: State) => Partial<Record<S, React.CSSProperties>>);

interface DialogProps {
	classNames?: SlotClassNames<DialogSlot, { open: boolean }>;
	styles?: SlotStyles<DialogSlot, { open: boolean }>;
}
```

- slot 名一律 kebab-case, 键需要引号时照写: `classNames={{ "close-button": "top-3" }}`.
- 每个组件必须有 `root` slot. `className` 与 `style` 等价于 `classNames.root` 与 `styles.root`.
- 函数形态接收组件的公开状态 (与 data-state 一致), 用于按状态改样式; 只做纯计算, 不得有副作用.
- slot 元组是公开 API, 进 API 快照; 删除或改名 slot 是破坏性变更, 走第 10.5 节废弃流程.

### 4.2 合并顺序

同一 slot 的类名与内联样式按以下顺序合并, 后者覆盖前者 (类名用 `cn`, 即 tailwind-merge 去冲突):

1. 组件内置类 (cva 产出)
2. Provider 下发的全局默认 `classNames` / `styles` (P1 `src/provider`, 按组件名索引)
3. 根组件的 `classNames[slot]` / `styles[slot]`
4. 部件自身的 `className` / `style` (复合组件的子部件, 例如 `<DialogContent className>`)
5. 对 root 而言, 根组件的 `className` / `style` 最后合并

### 4.3 复合组件如何下发

复合组件 (Dialog, Select, Tabs, Drawer, Card) 在根组件接收 `classNames` / `styles`, 通过 Context 下发; 每个子部件读取自己 slot 的值再与自身 `className` 合并. 组件内部渲染而用户不直接写出的部件 (Dialog 的 overlay 与 close-button, Select 的 icon 与 scroll 按钮, Drawer 的 handle) 只能通过 `classNames` 覆盖, 不再新增 `overlayClassName` 这类单点 prop.

```tsx
const DialogSlotsContext = React.createContext<SlotResolver<DialogSlot>>(emptyResolver);

function DialogContent({ className, style, ...props }: DialogContentProps) {
	const slot = React.useContext(DialogSlotsContext);
	return (
		<DialogPrimitive.Content
			data-slot="dialog-content"
			className={cn(CONTENT_BASE, slot.className("content"), className)}
			style={{ ...slot.style("content"), ...style }}
			{...props}
		/>
	);
}
```

### 4.4 slot 名与 data-slot 的对应

- 一个 slot 对应一个 DOM 节点 (或同类节点的集合, 例如每个 `option`).
- DOM 上 `data-slot` 的值 = `<组件名 kebab>-<slot 名>`; `root` slot 的 `data-slot` 就是组件名本身. 例: Dialog 的 `content` slot 渲染为 `data-slot="dialog-content"`, root 为 `data-slot="dialog"`. 这与现有 primitives 的取值一致.
- 无 DOM 的 radix 根 (Dialog Root, Select Root) 仍写 `data-slot` 透传给 radix, 不渲染节点时 `root` 的样式无处生效, slot 表中注明 "无 DOM".

### 4.5 标准 slot 命名表

下表为公共组件的标准 slot 名. 新组件或迁移后的组件必须使用这些名称; 表外部件按 4.6 的命名规则补, 并同步补到本表.

#### Button

| slot | data-slot | DOM 部件 |
|---|---|---|
| `root` | `button` | 原生 `<button>` (或 asChild 子元素) |
| `icon-start` | `button-icon-start` | 文字前的图标包裹 `<span>` |
| `label` | `button-label` | 文字包裹 `<span>`, loading 时变 invisible 保留宽度 |
| `icon-end` | `button-icon-end` | 文字后的图标包裹 `<span>` |
| `spinner` | `button-spinner` | loading 时绝对定位的 spinner `<span>` |

#### Input

| slot | data-slot | DOM 部件 |
|---|---|---|
| `root` | `input-root` | 外层 `<div>`, 承担边框, 焦点环, hover; 无前后缀时可省略, 此时 root 即 input |
| `prefix` | `input-prefix` | 前缀区 `<span>` (图标或文字) |
| `input` | `input` | 原生 `<input>`, ref 指向此处 |
| `suffix` | `input-suffix` | 后缀区 `<span>` |
| `clear-button` | `input-clear-button` | 清除按钮 `<button type="button">` |
| `counter` | `input-counter` | 字数统计 `<span>` |

说明: Input 的 `data-slot="input"` 保持指向原生 input (与现有一致), 外层用 `input-root`, 这是 4.4 规则的唯一例外, 理由是存量 CSS 已大量使用 `[data-slot=input]` 选择原生框.

#### Select

| slot | data-slot | DOM 部件 |
|---|---|---|
| `root` | `select` | radix Root, 无 DOM |
| `trigger` | `select-trigger` | 触发器 `<button role="combobox">` |
| `value` | `select-value` | 触发器内当前值 `<span>` |
| `placeholder` | `select-placeholder` | 未选择时的占位 `<span>` |
| `icon` | `select-icon` | 触发器右侧箭头 `<span>` |
| `content` | `select-content` | 弹层面板 `<div role="listbox">` 外层 |
| `viewport` | `select-viewport` | 可滚动视口 `<div>` |
| `group` | `select-group` | 选项分组 `<div role="group">` |
| `group-label` | `select-group-label` | 分组标题 `<div>` |
| `item` | `select-item` | 每个选项 `<div role="option">` |
| `item-indicator` | `select-item-indicator` | 选中勾 `<span>` |
| `item-text` | `select-item-text` | 选项文字 `<span>` |
| `separator` | `select-separator` | 分隔线 `<div role="separator">` |
| `scroll-up-button` | `select-scroll-up-button` | 顶部滚动按钮 `<div>` |
| `scroll-down-button` | `select-scroll-down-button` | 底部滚动按钮 `<div>` |
| `empty` | `select-empty` | 无选项时的空态 `<div>` |

#### Dialog

| slot | data-slot | DOM 部件 |
|---|---|---|
| `root` | `dialog` | radix Root, 无 DOM |
| `trigger` | `dialog-trigger` | 触发按钮 |
| `overlay` | `dialog-overlay` | 遮罩 `<div>` |
| `content` | `dialog-content` | 对话框面板 `<div role="dialog">` |
| `header` | `dialog-header` | 头部 `<div>` |
| `title` | `dialog-title` | 标题 `<h2>` |
| `description` | `dialog-description` | 描述 `<p>` |
| `body` | `dialog-body` | 正文滚动区 `<div>` |
| `footer` | `dialog-footer` | 底部操作区 `<div>` |
| `close-button` | `dialog-close-button` | 右上角关闭 `<button type="button">` |

AlertDialog, ConfirmDialog, Sheet 沿用同一组 slot 名, 只把前缀换成组件名 (`alert-dialog-content`, `sheet-overlay`). AlertDialog 另有 `action` 与 `cancel` 两个 slot.

#### Drawer

| slot | data-slot | DOM 部件 |
|---|---|---|
| `root` | `drawer` | vaul Root, 无 DOM |
| `trigger` | `drawer-trigger` | 触发按钮 |
| `overlay` | `drawer-overlay` | 遮罩 `<div>` |
| `content` | `drawer-content` | 抽屉面板 `<div role="dialog">` |
| `handle` | `drawer-handle` | 拖拽把手 `<div aria-hidden>` (上下方向时显示) |
| `header` | `drawer-header` | 头部 `<div>` |
| `title` | `drawer-title` | 标题 `<h2>` |
| `description` | `drawer-description` | 描述 `<p>` |
| `body` | `drawer-body` | 正文滚动区 `<div>` |
| `footer` | `drawer-footer` | 底部操作区 `<div>` |
| `close-button` | `drawer-close-button` | 关闭 `<button type="button">` |

#### Tabs

| slot | data-slot | DOM 部件 |
|---|---|---|
| `root` | `tabs` | 外层 `<div>` |
| `list` | `tabs-list` | 标签栏 `<div role="tablist">` |
| `trigger` | `tabs-trigger` | 每个标签 `<button role="tab" type="button">` |
| `trigger-icon` | `tabs-trigger-icon` | 标签内图标 `<span>` |
| `indicator` | `tabs-indicator` | 选中指示器 `<span aria-hidden>` (underline / animated) |
| `content` | `tabs-content` | 面板 `<div role="tabpanel">` |

#### Card

| slot | data-slot | DOM 部件 |
|---|---|---|
| `root` | `card` | 卡片外层 `<div>` (可 asChild 成 `<article>` / `<a>`) |
| `header` | `card-header` | 头部 `<div>` |
| `title` | `card-title` | 标题 `<div>` (语义标题级别由调用方用 asChild 决定) |
| `description` | `card-description` | 描述 `<div>` |
| `action` | `card-action` | 头部右侧操作区 `<div>` |
| `content` | `card-content` | 正文 `<div>` |
| `footer` | `card-footer` | 底部 `<div>` |
| `cover` | `card-cover` | 顶部封面媒体容器 `<div>` |

#### DataTable

| slot | data-slot | DOM 部件 |
|---|---|---|
| `root` | `data-table` | 最外层 `<div>`, ref 指向此处 |
| `toolbar` | `data-table-toolbar` | 标题与操作区 `<div>` |
| `title` | `data-table-title` | 表格标题 `<div>` |
| `actions` | `data-table-actions` | 右上角操作区 `<div>` |
| `scroll` | `data-table-scroll` | 横纵滚动容器 `<div>` (承担 maxHeight) |
| `table` | `data-table-table` | `<table>` |
| `header` | `data-table-header` | `<thead>` |
| `header-row` | `data-table-header-row` | 表头 `<tr>` |
| `header-cell` | `data-table-header-cell` | 每个 `<th>` |
| `sort-button` | `data-table-sort-button` | 表头内排序 `<button type="button">` |
| `body` | `data-table-body` | `<tbody>` |
| `row` | `data-table-row` | 每个数据 `<tr>` |
| `cell` | `data-table-cell` | 每个 `<td>` |
| `selection-cell` | `data-table-selection-cell` | 勾选列 `<td>` / `<th>` |
| `expand-row` | `data-table-expand-row` | 展开行 `<tr>` |
| `empty` | `data-table-empty` | 空态 `<tr><td colSpan>` 内的容器 |
| `loading` | `data-table-loading` | 骨架行容器 |
| `footer` | `data-table-footer` | `<tfoot>` 或表格下方分页区 `<div>` |

列级覆盖: `DataTableColumn` 不再提供 `headerClassName` / `cellClassName`, 改为 `classNames?: { "header-cell"?: string; cell?: string }`, 按 4.2 顺序在表级之后合并.

#### Checkbox / Switch / Tooltip / Popover / Accordion (补充)

| 组件 | slot | data-slot | DOM 部件 |
|---|---|---|---|
| Checkbox | `root` | `checkbox` | `<button role="checkbox" type="button">` |
| Checkbox | `indicator` | `checkbox-indicator` | 勾或横线 `<span>` |
| Checkbox | `label` | `checkbox-label` | 关联 `<label>` |
| Switch | `root` | `switch` | `<button role="switch" type="button">` |
| Switch | `thumb` | `switch-thumb` | 滑块 `<span>` |
| Switch | `label` | `switch-label` | 关联 `<label>` |
| Tooltip | `trigger` | `tooltip-trigger` | 触发元素 |
| Tooltip | `content` | `tooltip-content` | 浮层 `<div role="tooltip">` |
| Tooltip | `arrow` | `tooltip-arrow` | 箭头 `<svg>` |
| Popover | `trigger` | `popover-trigger` | 触发按钮 |
| Popover | `content` | `popover-content` | 浮层 `<div role="dialog">` |
| Popover | `arrow` | `popover-arrow` | 箭头 `<svg>` |
| Popover | `close-button` | `popover-close-button` | 关闭按钮 |
| Accordion | `item` | `accordion-item` | 每项 `<div>` |
| Accordion | `trigger` | `accordion-trigger` | 标题按钮 `<button type="button">` (外包 `<h3>`) |
| Accordion | `trigger-icon` | `accordion-trigger-icon` | 展开箭头 `<svg>` |
| Accordion | `content` | `accordion-content` | 面板 `<div role="region">` |

### 4.6 新 slot 命名规则

1. kebab-case, 名词, 描述部件职能而非外观: `close-button` 而不是 `x-icon`, `indicator` 而不是 `underline`.
2. 优先复用已有名: `root`, `trigger`, `content`, `overlay`, `header`, `title`, `description`, `body`, `footer`, `item`, `label`, `icon`, `indicator`, `empty`, `loading`, `close-button`, `separator`, `arrow`.
3. 子部件用 "父-子": `item-text`, `group-label`, `header-cell`.
4. 位置用 `start / end`, 不用 `left / right` (RTL 下语义不变).
5. 不使用组件名作前缀 (slot 名是组件内局部名, 前缀由 data-slot 规则自动加).

---

## 5. data-slot 与 data-state

### 5.1 data-slot

- 组件渲染的每一个 DOM 节点都必须带 `data-slot`, 包括装饰节点 (handle, indicator, spinner). 无例外.
- 取值按 4.4 规则: `<组件名>-<slot 名>`, 全小写 kebab.
- `data-slot` 是公开的样式钩子, 父组件可以用 `*:data-[slot=select-value]:...` 或 `in-data-[slot=button-group]:...` 选择子部件 (现有 Button 与 Select 已在用). 改名属于破坏性变更.
- 调用方传入的 `data-slot` 不得覆盖组件写入的值: 组件在展开 `...props` 之后写 `data-slot`, 或在类型中 `Omit<..., "data-slot">`.

### 5.2 data-state 与其他状态属性

状态一律以 data 属性暴露给 CSS, 组件内部不得用 JS 拼接状态类名 (例如 `open ? "bg-accent" : ""`), 而是写 `data-[state=open]:bg-accent`.

`data-state` 只放 "互斥的枚举状态", 每个节点最多一个:

| 场景 | 取值 |
|---|---|
| 打开类 (Dialog, Popover, Select content, Accordion item, Collapsible) | `open` / `closed` |
| 勾选类 (Checkbox, Switch, Toggle) | `checked` / `unchecked` / `indeterminate` |
| 激活类 (Tabs trigger 与 content, Toggle group item) | `active` / `inactive` |
| 选择类 (DataTable row, Tree item) | `selected` / `unselected` |
| Tooltip | `closed` / `delayed-open` / `instant-open` (沿用 radix) |

可与 `data-state` 并存的布尔或维度属性 (布尔属性为真时写空字符串, 为假时不写):

| 属性 | 含义 |
|---|---|
| `data-disabled` / `data-readonly` / `data-loading` / `data-invalid` | 交互态, 按 1.4 优先级输出 |
| `data-highlighted` | 键盘或指针高亮的选项 (radix 已有) |
| `data-placeholder` | 显示占位文字 |
| `data-orientation` | `horizontal` / `vertical` |
| `data-side` / `data-align` | 弹层实际方位与对齐 (radix 已有) |
| `data-size` / `data-variant` / `data-tone` / `data-radius` / `data-density` | 维度 prop 当前值 |
| `data-sorted` | 表头排序方向 `asc` / `desc` |
| `data-expanded` | 行或树节点展开 (与 aria-expanded 同步) |

- 包 radix 的部件沿用 radix 写入的 `data-state`, 不重复写.
- 状态属性与 aria 属性必须同步: `data-state="open"` 的触发器必有 `aria-expanded="true"`; `data-state="checked"` 必有 `aria-checked="true"`.
- Tailwind 写法: `data-[state=open]:`, `data-open:` (v4 内置), `data-disabled:`, `group-data-[state=open]/item:`. 不在组件里写 `[data-state="open"] &` 形式的全局 CSS.

---

## 6. ref 透传与归属

### 6.1 React 19 写法

- 新组件不使用 `forwardRef`. React 19 中 `ref` 是普通 prop, props 类型用 `React.ComponentProps<"button">` (含 ref) 或 `React.ComponentProps<typeof RadixPart>`, 解构后原样传给目标 DOM. 现有 primitives 已是这种写法.
- 需要同时自用和透传 ref 时用 L1 的 `useMergedRefs(ref, localRef)`, 不手写回调合并. 回调 ref 可以返回清理函数 (React 19), 不得依赖 "以 null 再调用一次".
- 泛型组件 (DataTable<T>) 直接把 `ref?: React.Ref<HTMLDivElement>` 写在 props 里, 不用 forwardRef 的类型体操.

### 6.2 ref 归属表

规则: `ref` 指向 "调用方最可能要聚焦, 测量或滚动的那个节点", 每个组件只有一个 `ref`.

| 组件 | `ref` 指向 |
|---|---|
| Button | 原生 `<button>` (asChild 时为子元素) |
| Input / Textarea | 原生 `<input>` / `<textarea>`, 不是外层 root |
| Select | 根组件无 DOM, 不接收 ref; `SelectTrigger` 的 ref 指向触发按钮 |
| Dialog / Drawer / Popover | 根组件不接收 ref; `<X>Content` 的 ref 指向面板 |
| Tabs | `Tabs` 的 ref 指向 root `<div>`; 各子部件各自 ref 到自身 |
| Card | root `<div>` |
| DataTable | root `<div>`; 滚动容器用 `scrollRef` 单独暴露 |
| Checkbox / Switch | `<button role=checkbox/switch>` |

- 内部部件的 ref 只能通过两种方式取得: 复合组件导出的子部件自带 ref; 或根组件显式命名的 `<part>Ref` prop (例: `scrollRef`, `inputRef`). 不提供 `refs={{ ... }}` 这类集合 prop.
- 命令式能力 (滚动到某行, 聚焦某项, 打开) 用 `apiRef: React.Ref<XxxApi>` + `useImperativeHandle` 暴露, 不挂在 DOM ref 上. `XxxApi` 接口导出并进 API 快照.

---

## 7. 事件命名与阻止默认

### 7.1 命名

| 类型 | 规则 | 例 |
|---|---|---|
| 状态变更 | `on<State>Change`, 参数为新值 (见第 2 节) | `onValueChange`, `onOpenChange`, `onSortingChange` |
| 动作 | `on<Verb>`, 动词原形 | `onSubmit`, `onCancel`, `onClear`, `onRetry`, `onSelect` |
| 部件上的原生事件 | `on<Part><Event>` | `onRowClick`, `onRowDoubleClick`, `onTagRemove`, `onStepClick` |
| 意图预取 | `on<Thing>Intent` (hover / focus 先于点击) | `onTabIntent` |
| 可拦截的触发源 | `on<Source>` 接收事件对象 | `onEscapeKeyDown`, `onPointerDownOutside`, `onInteractOutside` |

- 驼峰, `on` 前缀, 不用 `handleXxx` 作 prop 名, 不用过去式 (`onChanged`, `onClosed`).
- 参数顺序: 业务值在前, 细节或事件在后: `onRowClick(row, { index, event })`.
- 不新增与原生同名但语义不同的事件 (例如 `onClick(value)`).

### 7.2 阻止默认的约定

- 组件内部的默认行为与调用方处理器组合时, 调用方先执行, 组件后执行, 并检查 `event.defaultPrevented`:

```ts
// src/hooks/compose-event-handlers.ts
export function composeEventHandlers<E extends { defaultPrevented: boolean }>(
	user: ((e: E) => void) | undefined,
	internal: (e: E) => void,
): (e: E) => void {
	return (e) => {
		user?.(e);
		if (!e.defaultPrevented) internal(e);
	};
}
```

- 调用方阻止组件默认行为的唯一方式是 `event.preventDefault()`, 不使用返回 `false`, 不使用 `stopPropagation` 作为信号.
- 非 DOM 来源的可拦截动作 (例如关闭前确认) 通过可拦截事件暴露: `onEscapeKeyDown(event)`, `onCloseAutoFocus(event)`; 组件自建的可拦截事件对象需实现 `preventDefault()` 与 `defaultPrevented`.
- 组件内部不得无条件 `preventDefault()` 用户可感知的原生行为 (例如对话框的初始聚焦), 需要时作为默认值并允许调用方覆盖, 且在 JSDoc 写明.
- 组件内部尽量不 `stopPropagation`; 必须时 (嵌套可交互部件, 例如行内按钮不触发 `onRowClick`) 用目标判定替代, 参照现有 DataTable 的 `isInteractiveTarget`.

### 7.3 原生 button 必须写 type

- 组件内渲染的每个原生 `<button>` 必须显式写 `type` (门禁 PROJECT-UI-BUTTON-TYPE, AST 判定). 组件内部的非提交按钮 (关闭, 清除, 排序, 展开, tab) 写 `type={BUTTON_TYPE}` (值 `"button"`, 来自 constants).
- 新的按钮类公共组件 (不含存量 Button, 见第 11 节) 默认 `type="button"`, 允许调用方传 `type="submit"` 覆盖. 理由: 库内组件被放进表单时意外提交比漏提交更难排查.
- `asChild` 为 true 时不写 `type`.

---

## 8. 样式硬约束

以下约束由 `scripts/quality` 的 PROJECT-UI-* 规则执行 (见 `docs/reference/quality/rules.md`), 违反即构建失败. 本节写的是新组件的落地写法.

| 约束 | 必须 | 禁止 | 门禁 |
|---|---|---|---|
| 颜色来源 | 语义 token 工具类: `bg-primary`, `text-muted-foreground`, `border-border`, `bg-danger/10`; CSS 中 `var(--语义名)` | hex, `rgb()` / `hsl()` / `oklch()` 等函数色值, 调色盘类 (`bg-slate-500`, `text-blue-600`), `bg-white` / `bg-black` | PROJECT-UI-HEX, -RGB, -PALETTE, -BW |
| 任意值颜色 | 无 | `text-[#abb2bf]`, `bg-[rgba(...)]`, `shadow-[0_0_0_1px_#000]` 等任何方括号内写色值 | PROJECT-UI-HEX, -RGB |
| 线宽 | `border`, `ring-1`, `outline-1`, `divide-y` (都为 1px) | `border-2`, `ring-2`, `border-[0.5px]`, `outline-[3px]` | PROJECT-UI-LINE-1PX |
| 过渡 | 列出具体属性: `transition-[color,background-color,border-color]`, `transition-colors`, `transition-opacity` | `transition-all`, CSS `transition: all` | PROJECT-UI-TRANSITION-ALL |
| 时长与缓动 | `duration-(--duration-fast)` 等令牌, `ease-out` | 新代码写死 `duration-100`, `duration-[250ms]` | review |
| 尺寸, 字号, 圆角 | 令牌或 Tailwind 标准档: `h-(--control-h-md)`, `text-sm`, `rounded-(--radius-md)` | 新代码写 `text-[12px]`, `rounded-[min(...)]`, `w-[100px]` | review |

### 8.1 减弱动效

- 时长令牌在 `tokens.css` 的 `@media (prefers-reduced-motion: reduce)` 中已归零, 所以 "只用 `duration-(--duration-*)` 的 CSS transition" 自动满足; 这是首选写法.
- 关键帧动画 (`animate-*`, `@keyframes`), 位移与缩放 (`translate`, `scale`), 循环动画必须额外写减弱分支: Tailwind 用 `motion-reduce:animate-none`, `motion-reduce:translate-y-0`, `motion-reduce:scale-100`; CSS 文件里写 `@media (prefers-reduced-motion: reduce)` 落到终态 (参照 `motion.css`).
- JS 动画 (motion/react 弹簧) 用 `useReducedMotion()`, 减弱时改为瞬时 transition (参照 `tabs.tsx` 的 `INDICATOR_INSTANT`).
- 循环类动画 (spinner, shimmer, marquee) 在减弱动效下必须停止或改为静态指示, loading 语义仍由 `aria-busy` 表达.

### 8.2 焦点环

- 只用 `focus-visible:` 触发, 不用 `focus:` (避免鼠标点击出环).
- 焦点环为 1px: `focus-visible:border-ring` (有边框的控件) 或 `focus-visible:outline-1 focus-visible:outline-ring focus-visible:outline-offset-2` (无边框的控件). 不用 `ring-2` / `ring-[3px]`.
- 不得 `outline-none` 后不给替代焦点样式.

### 8.3 其他

- 视觉类名: L2 中源自 open-vetta 的组件沿用上游类名, 本契约的样式条目只约束新增类; 新目录下的组件不受上游类名约束 (见 gap analysis 第八节).
- 组件 cva 的默认档渲染结果是 API 快照的一部分, 改默认外观需要单独决策, 不在契约迁移中顺手改.

---

## 9. 无障碍

### 9.1 必写的 aria 属性

| 组件 | 角色 | 必写属性 |
|---|---|---|
| Button | 原生 button | 仅图标时 `aria-label`; 切换按钮 `aria-pressed`; 打开弹层时 `aria-haspopup` + `aria-expanded` + `aria-controls`; loading 时 `aria-busy` |
| Input / Textarea | 原生 | 关联 `<label for>` 或 `aria-label`; `aria-invalid`; 错误与说明用 `aria-describedby` 指向 Field 的 description / error id; `aria-required` (非原生 required 时) |
| Select / Combobox | `combobox` + `listbox` + `option` | 触发器 `aria-expanded`, `aria-controls`, `aria-haspopup="listbox"`; 选项 `aria-selected`, `aria-disabled`; Combobox 输入框 `aria-activedescendant`, `aria-autocomplete` |
| Dialog / AlertDialog / Drawer / Sheet | `dialog` / `alertdialog` | `aria-modal="true"`, `aria-labelledby` 指向 title, `aria-describedby` 指向 description; 无可见标题时用视觉隐藏的 Title, 不得省略 |
| Tabs | `tablist` + `tab` + `tabpanel` | tab 的 `aria-selected`, `aria-controls`; panel 的 `aria-labelledby`; 竖排时 tablist `aria-orientation="vertical"` |
| Checkbox / Switch | `checkbox` / `switch` | `aria-checked` (含 `mixed`); 关联 label |
| Accordion | button + `region` | trigger `aria-expanded`, `aria-controls`; region `aria-labelledby` |
| Tooltip | `tooltip` | 触发器 `aria-describedby` 指向 tooltip; Tooltip 不承载唯一的可访问名称 |
| Card | 无或 `article` / `region` | 可点击卡片的点击目标必须是卡片内真实的 `<a>` / `<button>` (可扩展点击区), 不得给 `<div>` 挂 onClick |
| DataTable | 原生 table | `<caption>` 或 `aria-label`; 表头 `scope="col"`; 排序列 `aria-sort`; 可选行 `aria-selected`; 加载中 `aria-busy`; 可点击行需提供行内可聚焦目标 |
| Slider | `slider` | `aria-valuemin`, `aria-valuemax`, `aria-valuenow`, 必要时 `aria-valuetext` |

通用规则:

- 可交互元素必须有可访问名称. 组件内置的文字 (关闭, 清除, 加载中) 通过 `labels` prop 或 locale 提供, 不在组件里写死英文 `Close`.
- 装饰性图标写 `aria-hidden="true"`.
- 不用 `role` 修补可用原生元素解决的问题 (能用 `<button>` 就不用 `div role="button"`).

### 9.2 键盘交互表 (对齐 WAI-ARIA APG)

#### Button / Toggle

| 键 | 行为 |
|---|---|
| Enter | 激活 |
| Space | 激活 (keyup 时触发), Toggle 切换 pressed |

#### Select (APG Select-Only Combobox)

| 键 | 焦点在触发器 | 弹层打开时 |
|---|---|---|
| Enter / Space | 打开并高亮当前选中项 | 选中高亮项并关闭 |
| ArrowDown / ArrowUp | 打开, 高亮当前项或首 / 末项 | 移动高亮, 不循环 |
| Home / End | 打开并高亮首 / 末项 | 高亮首 / 末项 |
| 可打印字符 | 按首字母跳到匹配项 (typeahead) | 同左 |
| Escape | 无 | 关闭, 焦点回触发器, 不改值 |
| Tab | 移出 | 选中高亮项 (与 radix 一致则关闭不选), 关闭并移出 |

#### Combobox (APG Editable Combobox with List Autocomplete)

| 键 | 行为 |
|---|---|
| ArrowDown | 打开列表 / 高亮下一项 |
| ArrowUp | 高亮上一项 |
| Enter | 选中高亮项并关闭 |
| Escape | 有弹层时关闭; 无弹层时清空输入 (可配置) |
| Alt + ArrowDown | 打开列表不移动高亮 |
| Home / End | 输入框内移动光标 |

#### Dialog / AlertDialog / Drawer / Sheet (APG Modal Dialog)

| 键 | 行为 |
|---|---|
| Tab / Shift + Tab | 焦点在对话框内循环 (焦点陷阱) |
| Escape | 关闭 (AlertDialog 可通过 `onEscapeKeyDown` preventDefault 禁用) |
| 打开时 | 焦点移到第一个可聚焦元素或 `initialFocus` 指定元素; AlertDialog 默认聚焦 Cancel |
| 关闭时 | 焦点归还触发器 (见 9.3) |

#### Tabs (APG Tabs)

| 键 | 行为 |
|---|---|
| ArrowRight / ArrowLeft | 水平时移到下一个 / 上一个 tab, 循环; RTL 下方向相反 |
| ArrowDown / ArrowUp | 竖排时同上 |
| Home / End | 首 / 末 tab |
| Enter / Space | 手动激活模式下激活当前 tab |
| Tab | 从 tablist 进入当前 tabpanel |

默认自动激活 (焦点即选中); 面板内容昂贵时提供 `activationMode="manual"`.

#### Checkbox / Switch

| 键 | 行为 |
|---|---|
| Space | 切换 |
| Enter | Switch 切换; Checkbox 不响应 (APG) |

#### Accordion (APG Accordion)

| 键 | 行为 |
|---|---|
| Enter / Space | 展开 / 收起当前项 |
| ArrowDown / ArrowUp | 移到下一个 / 上一个标题 |
| Home / End | 首 / 末标题 |

#### Menu (DropdownMenu, ContextMenu, Menubar)

| 键 | 行为 |
|---|---|
| Enter / Space | 激活项, 关闭菜单 |
| ArrowDown / ArrowUp | 移动高亮, 循环 |
| ArrowRight / ArrowLeft | 打开 / 关闭子菜单 |
| Escape | 关闭, 焦点回触发器 |
| 可打印字符 | typeahead |

#### Tooltip

| 键 | 行为 |
|---|---|
| 触发器获焦 | 显示 |
| Escape | 隐藏, 焦点不动 |

#### DataTable (APG Grid, 仅在开启单元格导航时)

| 键 | 行为 |
|---|---|
| Tab | 默认模式: 按 DOM 顺序进入行内可聚焦元素; 网格模式: 整张表只占一个 Tab 停靠点 |
| ArrowUp / ArrowDown | 网格模式: 移到上 / 下一行同列 |
| ArrowLeft / ArrowRight | 网格模式: 移到左 / 右单元格 |
| Home / End | 行首 / 行尾单元格 |
| Ctrl + Home / Ctrl + End | 首行首格 / 末行末格 |
| Space | 选择模式下切换当前行选中 |
| Enter | 触发 `onRowClick` 或进入单元格编辑 |
| 表头 Enter / Space | 切换该列排序 |

#### Slider (APG Slider)

| 键 | 行为 |
|---|---|
| ArrowRight / ArrowUp | 增加一步 |
| ArrowLeft / ArrowDown | 减少一步 |
| PageUp / PageDown | 增减十步 (或 `largeStep`) |
| Home / End | 最小 / 最大值 |

### 9.3 焦点环与焦点归还

- 焦点环样式见 8.2. 所有可聚焦部件必须有可见焦点环, 包括 asChild 渲染出的元素 (组件类名会落到子元素上).
- 弹层类 (Dialog, Drawer, Popover, Menu, Select) 关闭时焦点归还打开它的触发器. 触发器已卸载时归还到 `finalFocus` 指定元素, 再不行归还到最近的可聚焦祖先, 不允许焦点落到 `body` 后无处可去.
- 提供 `initialFocus` 与 `finalFocus` (类型 `React.RefObject<HTMLElement> | false`), 也允许通过 radix 的 `onOpenAutoFocus` / `onCloseAutoFocus` preventDefault 自行接管; 接管时必须自行聚焦一个合理目标.
- 删除型操作 (删除列表项, 移除 tag) 后焦点移到相邻项, 列表为空时移到列表容器或新增按钮.
- 焦点陷阱只在 modal 弹层内开启; 非 modal 的 Popover 不陷阱, Tab 离开即关闭.
- 弹层打开时外部内容设置 `inert` 或 `aria-hidden` (radix 已处理), 自研弹层必须同样处理.

---

## 10. 目录, 文件切分与废弃流程

### 10.1 文件规模

| 约束 | 阈值 | 来源 |
|---|---|---|
| 单个 `.tsx` | 不超过 250 行 | gates line-budget (HC-SIZE 上限为 500, 本库取更严的 250) |
| 单个 `.ts` | 不超过 300 行 | HC-SIZE |
| 单目录直接文件数 | 不超过 6 个 | HC-DIR |
| 文件头连续注释 | 不超过 10 行 | HC-COMMENT |

### 10.2 新组件目录模板

新组件 (L3 及以上, 或拆分后超过一个文件的 L2 组件) 一个组件一个目录, 目录名 kebab-case, 直接文件不超过 6 个:

```
src/<layer>/<component>/
  index.ts            公开导出, 只做 re-export
  <component>.tsx     根组件与 Context
  parts.tsx           子部件 (超过 250 行时再拆 parts-<group>.tsx 或子目录)
  slots.ts            slot 元组与 SlotResolver
  types.ts            公开 props 与状态类型
  use-<component>.ts  状态逻辑 hook (受控, 键盘)
```

- 超过 6 个文件时按职能开子目录 (例: `data-grid/columns/`, `data-grid/selection/`), 不得把文件堆平.
- 组件目录内不放测试夹具与文档示例; 文档示例在 `docs/src/`.
- 单文件 L2 组件 (例如 `primitives/kbd.tsx`) 保持单文件, 不为套模板而拆.

### 10.3 常量

- 同一字符串或数字字面量在库与文档站代码池中出现 3 次及以上, 必须提取到 `src/constants/<领域>.ts` 并引用 (PROJECT-CONST-DUP). 脚本工具放 `scripts/constants/`.
- prop 取值 (`size`, `tone`, `variant`, `orientation`), slot 元组, 默认 labels 的键, 时长与阈值数字, 一律放 constants, 并 `as const` 保留字面量类型.

### 10.4 agent note 双链

- 每个新组件目录必须有一篇决策 note: `.agents/notes/<implemented|proposed|rejected>/<class>/YYYY-MM-DD-topic.md`, 含 `Decision-ID`, `## Code`, `## Problem`, `## Decision`, `## Alternatives considered`, `## Consequences`.
- `## Code` 逐行列仓库相对精确路径, 每个直接父目录只选一个代表文件; 代表文件在声明紧邻上方的多行块注释里写该 note 的完整相对路径 (反向引用). 禁止 glob 与花括号.
- `## Alternatives considered` 必须包含 "什么都不做 / 复用现有", 先写最强理由再否决.
- 代码与 note 在同一 diff 配对修改; 完成后运行 `uv run scripts/redlines/agent_notes.py --diff`. 规则全文见 `.agents/notes/AGENTS.md`.
- 新组件的 note 在 `## Decision` 中写明 "遵循 docs/architecture/component-contract.md", 偏离本文的条目逐条列出理由.

### 10.5 废弃流程

1. 标记: 在被废弃的 prop, 组件, slot 或导出上写 JSDoc `@deprecated 自 <版本> 起废弃, 改用 <替代>. 最早于 <下一 minor> 移除.`
2. 运行时: 开发环境首次使用时 `console.warn` 一次 (模块级 Set 去重), 文案含组件名, 旧名, 新名; 生产构建不输出.
3. 兼容: 废弃期内旧名必须仍然工作, 新旧同时传时新名优先, 并在警告中说明.
4. 保留期: 至少保留一个 minor. 例: 0.6.0 标记废弃, 0.7.0 起才可删除; 0.x 阶段同样适用.
5. 记录: 同一 diff 更新 API 快照, CHANGELOG 的 Deprecated 段 (P0-11 建立后), 以及本文第 11 节对应条目.
6. 移除: 删除代码, 删除警告, 在 CHANGELOG 的 Removed 段写迁移示例; API 快照与版本号联动由门禁检查.

---

## 11. 现有组件兼容说明 (待迁移)

以下条目基于 2026-11-02 读取的 `src/primitives`, `src/layout`, `src/widgets` 源码整理. 全部标为 **待迁移**, 本轮不修改任何源码; 迁移时按第 10.5 节走废弃流程, 不得静默改变默认行为.

### 11.1 prop 词汇

| 组件 | 违反项 | 契约要求 | 状态 |
|---|---|---|---|
| Button | `size` 取值 `default / xs / sm / lg / icon / icon-xs / icon-sm / icon-lg` | `xs..xl` + `iconOnly` | 待迁移 |
| Button | `variant="destructive"` 把颜色放进 variant | `variant` + `tone="danger"` | 待迁移 |
| SelectTrigger | `size` 取值 `sm / default` | `xs..xl` | 待迁移 |
| Card | `variant` / `interactive` / `lift` 无 `radius`, `tone` | 按 1.1 补齐 | 待迁移 |
| 全部存量件 | 无 `density`, 无 `data-size` 以外的维度 data 属性 | 1.1 表 | 待迁移 (依赖 P0-04 令牌与 P1 Provider) |

### 11.2 受控与非受控

| 组件 | 违反项 | 状态 |
|---|---|---|
| SegmentedControl | 回调名 `onChange`, 签名接受函数式更新 `(value \| (prev) => value)`; 仅受控 | 待迁移 |
| NavTabs | `onChange(id)`; 仅受控, 无 `defaultValue` | 待迁移 |
| SettingsFormFields | 多个字段 `onChange(v)`, 开关用 `checked` + `onChange`; 仅受控 | 待迁移 |
| DatePicker | `onChange(value)` | 待迁移 |
| ColorSwatch / Rating / TagInput | `onChange(value)` | 待迁移 |
| TreeNav | `expandedIds` 配 `onToggle`, `selectedId` 配 `onSelect`, 初值名 `defaultExpanded` | 待迁移, 目标 `expandedIds / defaultExpandedIds / onExpandedIdsChange` 与 `selectedId / defaultSelectedId / onSelectedIdChange` |
| CollapsePanel | `open` 必传, 无 `defaultOpen` / `onOpenChange` | 待迁移 |
| MotionSelect | 回调名正确, 但仅受控, 无 `defaultValue` | 待迁移 |
| Combobox | 文件内私有 `useControllable(value, fallback, onChange)` | 待迁移到 L1 `useControllableState` |

### 11.3 插槽与 data-slot

| 组件 | 违反项 | 状态 |
|---|---|---|
| 全部存量件 | 无 `classNames` / `styles` | 待迁移 |
| DialogContent, DrawerContent | 单点 prop `overlayClassName` | 待迁移到 `classNames.overlay` |
| DataTable | `tableClassName`, 列级 `headerClassName` / `cellClassName` | 待迁移到 `classNames` |
| Dialog / Sheet | 关闭按钮 data-slot 为 `dialog-close` / `sheet-close`, 与 `DialogClose` 部件同名 | 待迁移为 `dialog-close-button` |
| Drawer | 拖拽把手 `<div>` 无 data-slot | 待迁移为 `drawer-handle` |
| 缺 data-slot 的文件 | `layout/` 下 AppFrame, Badge, Card, ChatStream, CodeBlock, CollapsePanel, CollapsibleRail, DataTable, DragDrop, EmptyState, Icon, InlineRename, LogViewer, MotionSelect, NavTabs, PageHeader, ProxyChain, SegmentedControl, SessionStatusDot, SettingChrome, SettingsFormFields, SettingsSidebarView, SidebarNav, StatCard, StateDot, Stepper, Toast, TreeNav, tree-parts; `primitives/` 下 confirm-dialog, date-picker, time-picker; `widgets/` 下 ColorSwatch, FileDropzone, Rating, TagInput, Timeline | 待迁移 |

说明: `primitives/` 下 direction, motion-list, presence, ripple 为无 DOM 或工具性模块, 迁移时逐个判定是否需要 data-slot.

### 11.4 ref

| 组件 | 违反项 | 状态 |
|---|---|---|
| SidebarNavItemButton | 使用 `forwardRef` | 待迁移到 ref 作为 prop |

### 11.5 事件与 button type

| 组件 | 违反项 | 状态 |
|---|---|---|
| Button | `type` 原样透传不补默认值 (PROJECT-UI-BUTTON-TYPE 豁免点), 与 7.3 新组件默认 `type="button"` 不一致 | 保留现状, 记为已知差异; 改默认值会静默改变下游表单提交行为, 需单独决策 |
| DialogContent | 无条件 `onOpenAutoFocus={(e) => e.preventDefault()}`, 打开时焦点不进入对话框 | 待迁移: 改为默认聚焦首个可聚焦元素, 并提供 `initialFocus` |
| SettingsSidebarView | `onSelectTab` / `onSelectChild` 命名不符 `on<State>Change` | 待迁移 |

### 11.6 样式

| 组件 | 违反项 | 状态 |
|---|---|---|
| CodeBlock | 任意值颜色 `text-[#abb2bf]` | 待迁移到语义 token (code 领域令牌) |
| 任意值字号 `text-[..px/rem]` | Badge, Card, ChatStream, CodeBlock, InlineRename, LogViewer, ProxyChain, SegmentedControl, SettingChrome, SettingsFormFields, SettingsSidebarView, SidebarNav, Stepper, Toast, tree-parts, alert, avatar, breadcrumb, button-group, button, calendar, combobox, command, date-picker, dropdown-menu, empty, field, form, input-group, input-otp, item, kbd, label, menubar, native-select, navigation-menu, select, sidebar-menu, sidebar-parts, table, toggle | 待迁移到字号令牌 (多数为上游 open-vetta 原样类名, 与 P0-04 一起处理) |
| 任意值圆角 `rounded-[..]` | SegmentedControl, button, checkbox, input-group, kbd, scroll-area, tabs, tooltip | 待迁移到 `--radius-*` |
| 写死时长 `duration-<数字>` | CollapsePanel, CollapsibleRail, SegmentedControl, SettingsSidebarView, accordion, dropdown-menu, input-otp, popover, progress, scroll-area, select, tooltip | 待迁移到 `--duration-*` 令牌 (写死时长不随减弱动效归零) |
| Drawer | 把手宽度 `w-[100px]` | 待迁移 |

### 11.7 无障碍

| 组件 | 违反项 | 状态 |
|---|---|---|
| Dialog / Sheet | 关闭按钮读屏文字写死英文 `Close` | 待迁移到 labels / locale |
| DialogContent | 初始焦点被阻止 (见 11.5) | 待迁移 |
| 自研件 Rating, TagInput, TreeNav, DataTable, Stepper | 文档无键盘交互表, 无自动化 a11y 校验 | 待迁移 (测试由 P3 承接) |
| DataTable | 无 `aria-sort` (尚无排序), 可点击行依赖 `onRowClick` 无行内焦点目标 | 待迁移 |

---

## 12. 新组件自检清单

合入前逐条确认, 在 PR 正文贴出本清单并勾选:

- [ ] prop 只使用第 1 节词汇, `size` 五档, `variant` 与 `tone` 分离, `disabled > readOnly > loading` 优先级正确
- [ ] 每个可变状态有 `x / defaultX / onXChange` 三件套, 值回调叫 `onValueChange` 而非 `onChange`, 受控时无内部副本
- [ ] `asChild` 只出现在单根部件, `render` / `render<Part>` 签名符合 3.2, 两者互斥
- [ ] 有 `classNames` / `styles`, slot 元组在 `src/constants/slots.ts`, slot 名与第 4.5 节一致, 新 slot 已补进本文
- [ ] 每个 DOM 节点有 `data-slot`, 状态用 `data-state` 与 data 布尔属性表达, 无 JS 拼状态类名
- [ ] 未使用 `forwardRef`, `ref` 归属符合 6.2, 命令式能力走 `apiRef`
- [ ] 事件命名符合 7.1, 内部处理器经 `composeEventHandlers` 尊重 `defaultPrevented`, 每个原生 button 写了 `type`
- [ ] 颜色只来自语义 token, 无任意值颜色, 线宽 1px, 无 `transition-all`, 时长用令牌, 关键帧与位移有 `motion-reduce` 分支
- [ ] aria 属性按 9.1 齐全, 键盘交互按 9.2 实现, 焦点环可见, 弹层关闭焦点归还
- [ ] tsx 不超过 250 行, 目录直接文件不超过 6 个, 3 次以上字面量进 constants, agent note 双链通过 `--diff`
- [ ] 若废弃旧 API: JSDoc `@deprecated`, 开发期单次警告, 保留至少一个 minor, 第 11 节已更新
- [ ] `npm run quality:done` 无新增 Error
