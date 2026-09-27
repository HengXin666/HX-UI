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
];

export const GROUPS: readonly string[] = ["基础", "示例", "基础件", "版式件"];