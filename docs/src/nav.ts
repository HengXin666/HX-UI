/** 文档导航。加一个组件 = 加一行。 */
export interface DocEntry {
  readonly id: string;
  readonly label: string;
  readonly group: string;
  readonly desc: string;
}

export const DOCS: readonly DocEntry[] = [
  { id: "install", label: "安装与使用", group: "基础", desc: "怎么装进来、怎么接样式、怎么换肤" },
  { id: "tokens", label: "设计令牌", group: "基础", desc: "颜色 / 圆角 / 阴影 / 字号 / 间距" },

  { id: "settings-demo", label: "完整设置页", group: "示例", desc: "照 open-vetta 复刻的三级布局整页" },

  { id: "button", label: "Button", group: "基础件", desc: "按钮, 七种语义 variant 与八档尺寸" },
  { id: "input", label: "Input", group: "基础件", desc: "输入框, 反馈全部落在边框颜色上" },
  { id: "switch", label: "Switch", group: "基础件", desc: "开关, 两档尺寸" },
  { id: "select", label: "Select", group: "基础件", desc: "下拉选择" },
  { id: "dialog", label: "Dialog", group: "基础件", desc: "模态对话框" },
  { id: "drawer", label: "Drawer", group: "基础件", desc: "抽屉" },
  { id: "dropdown-menu", label: "DropdownMenu", group: "基础件", desc: "下拉菜单" },
  { id: "popover", label: "Popover", group: "基础件", desc: "浮层" },
  { id: "calendar", label: "Calendar / DatePicker", group: "基础件", desc: "日历与日期选择" },
  { id: "slider", label: "Slider", group: "基础件", desc: "滑块" },
  { id: "spin", label: "Spin", group: "基础件", desc: "加载指示" },
  { id: "tooltip", label: "Tooltip", group: "基础件", desc: "悬浮提示, 含一行式 TooltipHint" },
  { id: "textarea", label: "Textarea", group: "基础件", desc: "多行文本, 随内容长高" },
  { id: "time-picker", label: "TimePicker", group: "基础件", desc: "时:分 输入, 受控但中间态不卡手" },
  { id: "confirm-dialog", label: "ConfirmDialog", group: "基础件", desc: "确认框, 命令式 await 与声明式两用" },
  { id: "tabs", label: "Tabs", group: "基础件", desc: "标签页, 下划线/药丸两种形态" },
  { id: "accordion", label: "Accordion / Collapsible", group: "基础件", desc: "折叠组与单块折叠, 双向都有动画" },
  { id: "scroll-area", label: "ScrollArea", group: "基础件", desc: "细滚动条容器, 不打断圆角" },
  { id: "progress", label: "Progress / Skeleton", group: "基础件", desc: "进度条(含不定长)与骨架屏" },

  { id: "charts", label: "Charts", group: "版式件", desc: "折线/面积/柱状/饼/雷达 + 增量动画" },
  { id: "stepper", label: "Stepper / LogViewer", group: "版式件", desc: "步骤条 + 日志框, 含 HTTP/WS 联动示例" },
  { id: "toast", label: "Toast", group: "版式件", desc: "消息提醒: 右下角堆叠 + 顶部居中" },
  { id: "code-block", label: "CodeBlock", group: "版式件", desc: "代码块, shiki + One Dark Pro" },
  { id: "card", label: "Card", group: "版式件", desc: "卡片, 上游用约定代替了组件" },
  { id: "badge", label: "Badge", group: "版式件", desc: "标签, 三种语义原色" },
  { id: "sidebar-nav", label: "SidebarNavItem", group: "版式件", desc: "侧栏导航项, 带数字与文本角标" },
  { id: "segmented-control", label: "SegmentedControl", group: "版式件", desc: "分段控件, 指示器滑动" },
  { id: "collapse-panel", label: "CollapsePanel", group: "版式件", desc: "可折叠面板" },
  { id: "setting-chrome", label: "SettingSection / Row", group: "版式件", desc: "设置页版式: 一张卡里一行一个设置项" },
  { id: "app-frame", label: "AppFrame", group: "版式件", desc: "应用外壳: 外留白 + 两块圆角面板" },
  { id: "proxy-chain", label: "ProxyChain", group: "版式件", desc: "代理服务链路: 入口 → 策略 → 实体, 杜绝概念混淆" },
  { id: "data-table", label: "DataTable", group: "版式件", desc: "数据表: 粘性表头 / 空态 / 加载态 / 行点击" },
  { id: "stat-card", label: "StatCard / StatGrid", group: "版式件", desc: "指标卡与栅格, 数字等宽不抖" },
  { id: "empty-state", label: "EmptyState / DataBoundary", group: "版式件", desc: "空/错误/加载三态, 顺序固定" },
  { id: "page-header", label: "PageHeader", group: "版式件", desc: "页头: 标题 + 说明 + 右侧操作位" },
];

export const GROUPS: readonly string[] = ["基础", "示例", "基础件", "版式件"];