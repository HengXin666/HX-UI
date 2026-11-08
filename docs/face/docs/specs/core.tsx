import {
  Button,
  DataTable,
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  Switch,
  type DataTableColumn,
} from "@hx/ui";
import buttonRaw from "../../../../src/primitives/button.tsx?raw";
import switchRaw from "../../../../src/primitives/switch.tsx?raw";
import dialogRaw from "../../../../src/primitives/dialog.tsx?raw";
import tableRaw from "../../../../src/layout/DataTable.tsx?raw";
import { range, select, text, toggle, type PageSpec, type Values } from "./types";

/**
 * 样板批的四个组件页: Button, Switch (可调单件), Dialog, DataTable (复合组件).
 * 名称, 说明与分组沿用导航条目; Props 的类型与默认值来自源码类型, 这里只补中文说明.
 * .agents/notes/implemented/feature/2026-11-08-docs-component-pages.md
 */

const VARIANTS = ["default", "primary", "outline", "secondary", "ghost", "destructive", "link", "gradient"];
const SIZES = ["default", "xs", "sm", "lg"];
const NL = "\n";
const INDENT = "  ";

/** 一个 JSX 标签的用法代码: 只写与 base 不同的属性, 布尔 true 写成裸属性. */
function tag(name: string, props: Values, base: Values, children?: string): string {
  const attrs = Object.entries(props)
    .filter(([key, value]) => value !== base[key])
    .map(([key, value]) => (value === true ? key : typeof value === "string" ? `${key}=${JSON.stringify(value)}` : `${key}={${JSON.stringify(value)}}`));
  const open = [name, ...attrs].join(" ");
  return children === undefined ? `<${open} />` : `<${open}>${children}</${name}>`;
}

function indent(code: string, depth: number): string {
  return code
    .split(NL)
    .map((line) => INDENT.repeat(depth) + line)
    .join(NL);
}

function demo(imports: readonly string[], body: string, head = ""): string {
  return `import { ${imports.join(", ")} } from "@hx/ui";${head}\n\nexport function Demo() {\n  return (\n${indent(body, 2)}\n  );\n}`;
}

// ── Button ──────────────────────────────────────────────────────────
const BUTTON_BASE: Values = { variant: "default", size: "default", press: false, ripple: true, loading: false, disabled: false };
const SEARCH_ICON = "icon-[solar--magnifer-line-duotone] size-4";

const BUTTON: PageSpec = {
  id: "button",
  kind: "single",
  importName: "Button",
  source: "src/primitives/button.tsx",
  raw: buttonRaw,
  deps: ["class-variance-authority", "radix-ui"],
  controls: [
    text("label", "文字", "立即开始", "按钮文字 (children)."),
    select("variant", "变体", VARIANTS, "primary", "", "语义色. 主操作用 primary, 危险操作用 destructive; gradient 是品牌渐变, 一屏最多一个."),
    select("size", "尺寸", SIZES, "default", "", "尺寸档. 图标按钮用 icon / icon-xs / icon-sm / icon-lg."),
    toggle("press", "按压缩放", false, "按下缩到 97%, 减弱动效时不缩放. 可与任何变体叠加."),
    toggle("ripple", "水波纹", true, "点按水波纹, link 变体始终不出."),
    toggle("loading", "加载中", false, "文字让位给旋转指示, 宽度仍由文字占住, 不跳."),
    toggle("disabled", "禁用", false, "原生 disabled, 不可聚焦也不响应点击."),
  ],
  propDesc: { asChild: "把样式交给唯一的子元素渲染 (Radix Slot), 用来把链接做成按钮外观." },
  propsNote: "其余属性透传给原生 <button>. type 不补默认值: 表单里不写 type 仍是 submit, 表单外的按钮请传 type=\"button\".",
  toProps: ({ label, ...rest }) => ({ ...rest, children: label }),
  render: (props) => <Button {...props} />,
  usage: ({ label, ...rest }) => demo(["Button"], tag("Button", rest, BUTTON_BASE, String(label))),
  examples: [
    {
      id: "variants",
      title: "语义变体",
      desc: "主操作 primary, 次要按场景选 outline / secondary / ghost, 危险操作 destructive.",
      code: `<Button variant="primary">主操作</Button>\n<Button>默认</Button>\n<Button variant="outline">次要</Button>\n<Button variant="secondary">浅面</Button>\n<Button variant="ghost">幽灵</Button>\n<Button variant="destructive">删除</Button>\n<Button variant="link">链接</Button>`,
      render: () => (
        <>
          <Button variant="primary">主操作</Button>
          <Button>默认</Button>
          <Button variant="outline">次要</Button>
          <Button variant="secondary">浅面</Button>
          <Button variant="ghost">幽灵</Button>
          <Button variant="destructive">删除</Button>
          <Button variant="link">链接</Button>
        </>
      ),
    },
    {
      id: "sizes",
      title: "尺寸与图标按钮",
      desc: "带图标时内边距由子元素决定; 只有图标的按钮必须给 aria-label.",
      code: `<Button size="lg" variant="primary">大</Button>\n<Button variant="outline">中</Button>\n<Button size="sm" variant="outline">小</Button>\n<Button size="xs" variant="outline">极小</Button>\n<Button size="icon" variant="outline" aria-label="搜索">\n  <span className="${SEARCH_ICON}" />\n</Button>`,
      render: () => (
        <>
          <Button size="lg" variant="primary">大</Button>
          <Button variant="outline">中</Button>
          <Button size="sm" variant="outline">小</Button>
          <Button size="xs" variant="outline">极小</Button>
          <Button size="icon" variant="outline" aria-label="搜索">
            <span aria-hidden className={SEARCH_ICON} />
          </Button>
        </>
      ),
    },
    {
      id: "states",
      title: "加载与禁用",
      desc: "loading 时宽度不变, 提交按钮不会在点下后缩一截.",
      code: `<Button variant="primary" loading>保存</Button>\n<Button variant="primary" disabled>不可用</Button>\n<Button variant="outline" disabled>不可用</Button>`,
      render: () => (
        <>
          <Button variant="primary" loading>保存</Button>
          <Button variant="primary" disabled>不可用</Button>
          <Button variant="outline" disabled>不可用</Button>
        </>
      ),
    },
  ],
  keyboard: [
    { keys: ["Tab"], action: "聚焦到按钮; 禁用的按钮跳过." },
    { keys: ["Enter"], action: "触发点击." },
    { keys: ["Space"], action: "触发点击; 打开 press 时按住期间保持按下的缩放." },
  ],
};

// ── Switch ──────────────────────────────────────────────────────────
const SWITCH_BASE: Values = { size: "default", defaultChecked: false, disabled: false };

const SWITCH: PageSpec = {
  id: "switch",
  kind: "single",
  importName: "Switch",
  source: "src/primitives/switch.tsx",
  raw: switchRaw,
  deps: ["radix-ui", "motion"],
  controls: [
    select("size", "尺寸", ["default", "sm"], "default", "", "两档尺寸, 缩略块的位移量随尺寸走."),
    toggle("defaultChecked", "默认打开", true, "非受控的初始状态; 受控时改用 checked 与 onCheckedChange."),
    toggle("disabled", "禁用", false, "禁用, 透明度降到 50%."),
  ],
  propDesc: {
    checked: "受控的选中态, 与 onCheckedChange 成对使用.",
    defaultChecked: "非受控的初始选中态.",
    onCheckedChange: "选中态变化时回调, 参数是新值.",
    required: "表单校验时必须打开.",
    asChild: "把行为交给唯一的子元素渲染.",
  },
  propsNote: "其余属性 (name, value, disabled, aria-*) 透传给 Radix Switch 的根元素.",
  render: (props) => <Switch aria-label="演示开关" {...props} />,
  usage: (values) => demo(["Switch"], tag("Switch", { "aria-label": "接收通知", ...values }, { ...SWITCH_BASE, "aria-label": "" })),
  examples: [
    {
      id: "states",
      title: "尺寸与状态",
      code: `<Switch defaultChecked aria-label="开" />\n<Switch aria-label="关" />\n<Switch size="sm" defaultChecked aria-label="小号开" />\n<Switch size="sm" aria-label="小号关" />\n<Switch disabled defaultChecked aria-label="禁用" />`,
      render: () => (
        <>
          <Switch defaultChecked aria-label="开" />
          <Switch aria-label="关" />
          <Switch size="sm" defaultChecked aria-label="小号开" />
          <Switch size="sm" aria-label="小号关" />
          <Switch disabled defaultChecked aria-label="禁用" />
        </>
      ),
    },
    {
      id: "label",
      title: "带文字标签",
      desc: "用 label 包住或用 htmlFor 关联, 点文字也能切换, 读屏器读出标签.",
      code: `<label className="flex items-center gap-3 text-sm">\n  <Switch defaultChecked />\n  接收通知\n</label>`,
      render: () => (
        <label className="flex items-center gap-3 text-sm text-foreground">
          <Switch defaultChecked />
          接收通知
        </label>
      ),
    },
  ],
  keyboard: [
    { keys: ["Tab"], action: "聚焦到开关." },
    { keys: ["Space"], action: "切换开与关." },
    { keys: ["Enter"], action: "切换开与关 (根元素是 role=\"switch\" 的 button)." },
  ],
};

// ── Dialog ──────────────────────────────────────────────────────────
function DialogDemo(props: Record<string, unknown>) {
  const { title, description, showCloseButton, footer, modal } = props as Record<string, string & boolean>;
  return (
    <Dialog modal={modal}>
      <DialogTrigger asChild>
        <Button variant="outline">打开对话框</Button>
      </DialogTrigger>
      <DialogContent showCloseButton={showCloseButton}>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        {footer ? (
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">取消</Button>
            </DialogClose>
            <Button variant="destructive">删除</Button>
          </DialogFooter>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

function dialogUsage(values: Values): string {
  const footer = values.footer
    ? `\n    <DialogFooter>\n      <DialogClose asChild>\n        <Button variant="outline">取消</Button>\n      </DialogClose>\n      <Button variant="destructive">删除</Button>\n    </DialogFooter>`
    : "";
  const root = values.modal ? "<Dialog>" : "<Dialog modal={false}>";
  const content = values.showCloseButton ? "<DialogContent>" : "<DialogContent showCloseButton={false}>";
  const body = `${root}\n  <DialogTrigger asChild>\n    <Button variant="outline">打开对话框</Button>\n  </DialogTrigger>\n  ${content}\n    <DialogHeader>\n      <DialogTitle>${String(values.title)}</DialogTitle>\n      <DialogDescription>${String(values.description)}</DialogDescription>\n    </DialogHeader>${footer}\n  </DialogContent>\n</Dialog>`;
  const parts = ["Button", "Dialog", ...(values.footer ? ["DialogClose"] : []), "DialogContent", "DialogDescription", ...(values.footer ? ["DialogFooter"] : []), "DialogHeader", "DialogTitle", "DialogTrigger"];
  return demo(parts, body);
}

const DIALOG: PageSpec = {
  id: "dialog",
  kind: "composite",
  importName: "Dialog",
  parts: ["DialogContent", "DialogFooter"],
  source: "src/primitives/dialog.tsx",
  raw: dialogRaw,
  deps: ["radix-ui", "lucide-react"],
  controls: [
    text("title", "标题", "删除这个会话?", "DialogTitle 的内容, 也是对话框的可访问名称."),
    text("description", "说明", "删除后无法恢复, 会话里的附件一并移除.", "DialogDescription 的内容, 读屏器在标题后读出."),
    toggle("showCloseButton", "右上角关闭键", true, "DialogContent 是否带右上角的关闭键."),
    toggle("footer", "页脚按钮", true, "加一行 DialogFooter: 取消 (DialogClose) 与主操作."),
    toggle("modal", "模态", true, "模态时锁住页面滚动与外部交互."),
  ],
  propDesc: {
    children: "触发器与内容.",
    open: "受控的打开状态, 与 onOpenChange 成对使用.",
    defaultOpen: "非受控的初始打开状态.",
    onOpenChange: "打开状态变化时回调 (Esc, 点遮罩, 关闭键都会触发).",
    modal: "模态时锁住页面滚动与外部交互. 默认 true.",
    forceMount: "始终挂载, 由外部动画库控制进出场.",
    asChild: "把内容交给唯一的子元素渲染.",
    deferPointerDownOutside: "点外部关闭推迟到 pointerup, 拖动起点在面板内时不误关.",
    onEscapeKeyDown: "按 Esc 时回调, preventDefault 可阻止关闭.",
    onPointerDownOutside: "在面板外按下指针时回调, preventDefault 可阻止关闭.",
    onFocusOutside: "焦点移到面板外时回调.",
    onInteractOutside: "面板外的任何交互 (指针或焦点) 时回调.",
    onOpenAutoFocus: "打开时的自动聚焦; 本库已默认阻止, 焦点留在面板上, 不会弹出输入法.",
    onCloseAutoFocus: "关闭后焦点回到触发器之前回调, preventDefault 可改去别处.",
    overlayClassName: "遮罩层的类名.",
    showCloseButton: "是否自动补一个关闭按钮.",
  },
  hideProps: ["onOpenAutoFocus"],
  propsNote: "面板固定 max-w-[min(24rem,calc(100%-2rem))], 想更宽就在 DialogContent 上覆盖这个值, 不要叠 max-w-lg.",
  toProps: (values) => ({ ...values }),
  render: (props) => <DialogDemo {...props} />,
  usage: dialogUsage,
  examples: [
    {
      id: "basic",
      title: "只有说明",
      desc: "最小形态: 触发器, 标题, 说明. 关闭键默认就在.",
      code: `<Dialog>\n  <DialogTrigger asChild>\n    <Button variant="outline">打开说明</Button>\n  </DialogTrigger>\n  <DialogContent>\n    <DialogHeader>\n      <DialogTitle>关于本地模型</DialogTitle>\n      <DialogDescription>模型权重从本地目录加载, 不经过网络.</DialogDescription>\n    </DialogHeader>\n  </DialogContent>\n</Dialog>`,
      render: () => <DialogDemo title="关于本地模型" description="模型权重从本地目录加载, 不经过网络." showCloseButton footer={false} modal />,
    },
  ],
  keyboard: [
    { keys: ["Enter"], action: "在触发器上打开对话框." },
    { keys: ["Esc"], action: "关闭对话框, 焦点回到触发器." },
    { keys: ["Tab"], action: "在面板内循环聚焦, 不会跑到页面上." },
    { keys: ["Shift", "Tab"], action: "反向循环聚焦." },
  ],
};

// ── DataTable ───────────────────────────────────────────────────────
interface Account {
  readonly user: string;
  readonly region: string;
  readonly age: number;
}

const ACCOUNTS: readonly Account[] = [
  { user: "deepstack0914", region: "SG-01", age: 57.4 },
  { user: "nahida_leaf", region: "JP-03", age: 133.1 },
  { user: "kfx_builder", region: "US-07", age: 27.2 },
  { user: "mizuki_q", region: "SG-02", age: 79.8 },
  { user: "settlement_dev", region: "DE-01", age: 96.3 },
];

const COLUMNS: readonly DataTableColumn<Account>[] = [
  { key: "user", header: "用户名", cellClassName: "font-mono text-[12px]" },
  { key: "region", header: "出口", cellClassName: "text-muted-foreground" },
  { key: "age", header: "年龄", numeric: true, render: (row) => `${row.age.toFixed(1)}d` },
];

const COLUMNS_CODE = `const columns: DataTableColumn<Account>[] = [\n  { key: "user", header: "用户名" },\n  { key: "region", header: "出口" },\n  { key: "age", header: "年龄", numeric: true, render: (r) => r.age.toFixed(1) + "d" },\n];`;

function tableProps(values: Values): Record<string, unknown> {
  return {
    title: values.title || undefined,
    rows: ACCOUNTS.slice(0, Number(values.count)),
    loading: values.loading,
    bare: values.bare,
    onRowClick: values.clickable ? () => undefined : undefined,
  };
}

function tableUsage(values: Values): string {
  const attrs = [
    "columns={columns}",
    Number(values.count) === ACCOUNTS.length ? "rows={rows}" : `rows={rows.slice(0, ${Number(values.count)})}`,
    "rowKey={(r) => r.user}",
    ...(values.title ? [`title=${JSON.stringify(values.title)}`] : []),
    ...(values.loading ? ["loading"] : []),
    ...(values.bare ? ["bare"] : []),
    ...(values.clickable ? ["onRowClick={(r) => open(r.user)}"] : []),
  ];
  return demo(["DataTable", "type DataTableColumn"], `<DataTable\n${attrs.map((line) => INDENT + line).join(NL)}\n/>`, `\n\n${COLUMNS_CODE}`);
}

const DATA_TABLE: PageSpec = {
  id: "data-table",
  kind: "composite",
  importName: "DataTable",
  source: "src/layout/DataTable.tsx",
  raw: tableRaw,
  deps: [],
  height: 420,
  controls: [
    text("title", "标题", "账号池", "卡头标题; 不给时没有卡头."),
    range("count", "行数", [0, ACCOUNTS.length, 1], ACCOUNTS.length, "演示数据的行数, 调到 0 看空态."),
    toggle("loading", "加载中", false, "渲染成骨架行, 表格高度不会在数据到达时跳一下."),
    toggle("bare", "去掉卡片", false, "不包 Card, 直接是一张表, 放进已有容器时用."),
    toggle("clickable", "整行可点", false, "传 onRowClick 后整行可点, 也可以用键盘聚焦与回车."),
  ],
  propDesc: {
    columns: "列定义: key, header, render, width, align, numeric.",
    rows: "数据. 组件不筛选不排序, 给什么渲染什么.",
    rowKey: "行 key. 不给时退回 row.id 或下标, 有重复 key 的风险.",
    onRowClick: "整行可点, 同时让行可聚焦, Enter 与 Space 触发. 点到行内的链接与按钮不会触发.",
    loadingRows: "加载态的骨架行数.",
    empty: "自定义空态节点, 给了就不用 emptyText.",
    emptyText: "默认空态 (EmptyState) 的文字.",
    maxHeight: "表体最大高度, 超出时表头吸顶并纵向滚动.",
    actions: "卡头右侧的操作区.",
    tableClassName: "<table> 本身的类名.",
  },
  toProps: tableProps,
  render: (props) => (
    <div className="mx-auto w-full max-w-[640px] p-6">
      <DataTable columns={COLUMNS} rowKey={(row) => row.user} {...(props as { rows: readonly Account[] })} />
    </div>
  ),
  usage: tableUsage,
  examples: [
    {
      id: "empty",
      title: "空态与自定义文案",
      desc: "空态直接复用 EmptyState, 不用每页自己写一句 \"暂无数据\".",
      code: `<DataTable columns={columns} rows={[]} emptyText="该筛选条件下没有账号" />`,
      align: "stretch",
      render: () => (
        <div className="p-6">
          <DataTable columns={COLUMNS} rows={[]} emptyText="该筛选条件下没有账号" />
        </div>
      ),
    },
    {
      id: "scroll",
      title: "限高滚动",
      desc: "maxHeight 限住表体, 表头吸顶.",
      code: `<DataTable columns={columns} rows={rows} maxHeight="160px" bare />`,
      align: "stretch",
      render: () => (
        <div className="p-6">
          <DataTable columns={COLUMNS} rows={ACCOUNTS} rowKey={(row) => row.user} maxHeight="160px" bare />
        </div>
      ),
    },
  ],
  keyboard: [
    { keys: ["Tab"], action: "传了 onRowClick 时逐行聚焦; 行内的链接与按钮照常可聚焦." },
    { keys: ["Enter"], action: "在聚焦的行上触发 onRowClick." },
    { keys: ["Space"], action: "同 Enter, 不滚动页面." },
  ],
};

export const CORE_PAGES: readonly PageSpec[] = [BUTTON, SWITCH, DIALOG, DATA_TABLE];
