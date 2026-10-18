/**
 * 文档导航. 加一个组件 = 在对应分组的清单里加一行 "id ~ 标签 ~ 说明".
 * 组件分组按 shadcn/ui 的组件清单 (https://ui.shadcn.com/docs/components) 字母序排列, 一个不少;
 * HX 自有, shadcn 没有的组件放在 "HX 扩展".
 */
import { DOC } from "@hx/ui";
import { parseSpec } from "./spec";

export interface DocEntry {
  readonly id: string;
  readonly label: string;
  readonly group: string;
  readonly desc: string;
}

/** 侧栏分组名, 也是 GROUPS 的显示顺序. */
const GROUP = {
  start: "开始",
  components: "组件",
  extras: "HX 扩展",
  examples: "示例",
  blueprint: "蓝图",
} as const;

const START = `
install ~ 安装与使用 ~ 怎么装进来, 怎么接样式, 怎么换肤, 怎么部署文档站
tokens ~ 设计令牌 ~ 颜色 / 圆角 / 阴影 / 字号 / 间距 / 动效
`;

const COMPONENTS = `
accordion ~ Accordion ~ 折叠组, 双向都有高度动画
alert ~ Alert ~ 提示条, 五种语义色, 危险与警告会被读屏立即播报
alert-dialog ~ Alert Dialog ~ 警示对话框, 必须二选一, 用于不可撤销的操作
aspect-ratio ~ Aspect Ratio ~ 固定宽高比容器
attachment ~ Attachment ~ 文件 / 图片附件, 带上传进度与错误态
avatar ~ Avatar ~ 头像, 图片淡入, 叠放与状态点
badge ~ Badge ~ 标签, 三种语义原色
breadcrumb ~ Breadcrumb ~ 面包屑, 可折叠中间层级
bubble ~ Bubble ~ 消息气泡, 四种底色, 可折叠长内容
button ~ Button ~ 按钮, 七种语义 variant 与八档尺寸, 自带水波纹
button-group ~ Button Group ~ 按钮组, 相邻边框合并成一条
calendar ~ Calendar ~ 日历
card ~ Card ~ 卡片
carousel ~ Carousel ~ 轮播, 惯性拖拽与方向键切换
charts ~ Chart ~ 折线 / 面积 / 柱状 / 饼 / 雷达 + 增量动画
checkbox ~ Checkbox ~ 复选框, 支持半选
code-block ~ Code Block ~ 代码块, shiki + One Dark Pro
collapsible ~ Collapsible ~ 单块折叠, 与 Accordion 同页
combobox ~ Combobox ~ 可搜索下拉, 单选与多选
command ~ Command ~ 命令面板, 内嵌与对话框两种
context-menu ~ Context Menu ~ 右键菜单, 组合式与声明式并存
data-table ~ Data Table ~ 数据表: 粘性表头 / 空态 / 加载态 / 行点击
date-picker ~ Date Picker ~ 日期选择, 与 Calendar 同页
dialog ~ Dialog ~ 模态对话框, 缩放淡入
direction ~ Direction ~ 文字方向提供者, 支持从右到左
drawer ~ Drawer ~ 可拖拽的底部抽屉
dropdown-menu ~ Dropdown Menu ~ 下拉菜单
empty ~ Empty ~ 组合式空状态
field ~ Field ~ 组合式表单字段: 标签, 控件, 说明, 错误
form ~ Form ~ react-hook-form 绑定, 自动关联 id 与错误
hover-card ~ Hover Card ~ 悬停卡片, 延迟弹出不误触
input ~ Input ~ 输入框, 反馈全部落在边框颜色上
input-group ~ Input Group ~ 输入框加前后缀图标, 文字与按钮
input-otp ~ Input OTP ~ 一次性验证码, 支持粘贴与短信自动填充
item ~ Item ~ 列表条目: 媒体, 标题, 说明, 操作
kbd ~ Kbd ~ 键盘按键标记
label ~ Label ~ 表单标签
marker ~ Marker ~ 会话里的系统提示, 状态行与分隔线
menubar ~ Menubar ~ 桌面应用式菜单栏
message ~ Message ~ 会话消息: 头像, 头部, 正文, 底部
message-scroller ~ Message Scroller ~ 会话滚动容器, 贴底跟随与回到最新
native-select ~ Native Select ~ 原生下拉, 菜单跟随主题
navigation-menu ~ Navigation Menu ~ 站点导航菜单, 视口平滑插值
pagination ~ Pagination ~ 分页器, 翻页时整排不跳
popover ~ Popover ~ 浮层
progress ~ Progress ~ 进度条 (含不定长), 与 Skeleton / ScrollArea 同页
questionnaire ~ Questionnaire ~ 多步问卷, 切题滑动
radio-group ~ Radio Group ~ 单选组
resizable ~ Resizable ~ 可拖拽调整大小的分栏
scroll-area ~ Scroll Area ~ 细滚动条容器, 不打断圆角
select ~ Select ~ 下拉选择
separator ~ Separator ~ 分隔线, 全局 1px
sheet ~ Sheet ~ 从四边滑入的面板
sidebar ~ Sidebar ~ 组合式应用侧栏, 可收成图标条
skeleton ~ Skeleton ~ 骨架屏, 与 Progress 同页
slider ~ Slider ~ 滑块
spinner ~ Spinner ~ 行内旋转指示, 另有多形态的 Spin
switch ~ Switch ~ 开关, 两档尺寸
table ~ Table ~ 表格原语
tabs ~ Tabs ~ 标签页, 下划线 / 药丸两种形态
textarea ~ Textarea ~ 多行文本, 随内容长高
toast ~ Toast ~ 消息提醒: 右下角堆叠 + 顶部居中 (对标 Sonner)
toggle ~ Toggle ~ 两态按钮
toggle-group ~ Toggle Group ~ 一组两态按钮, 单选或多选
tooltip ~ Tooltip ~ 悬浮提示, 含一行式 TooltipHint
trace ~ Trace ~ 推理 / 工具调用轨迹
typography ~ Typography ~ 排版: 标题, 正文, 引用, 列表
`;

const EXTRAS = `
spin ~ Spin ~ 多形态加载指示 (LDRS)
time-picker ~ TimePicker ~ 时:分 输入, 受控但中间态不卡手
confirm-dialog ~ ConfirmDialog ~ 确认框, 命令式 await 与声明式两用
stepper ~ Stepper / LogViewer ~ 步骤条 + 日志框, 含 HTTP/WS 联动示例
segmented-control ~ SegmentedControl ~ 分段控件, 指示器滑动
collapse-panel ~ CollapsePanel ~ 可折叠面板
setting-chrome ~ SettingSection / Row ~ 设置页版式: 一张卡里一行一个设置项
app-frame ~ AppFrame ~ 应用外壳: 外留白 + 两块圆角面板
sidebar-nav ~ SidebarNavItem ~ 侧栏导航项, 带数字与文本角标
proxy-chain ~ ProxyChain ~ 代理服务链路: 入口 → 策略 → 实体
stat-card ~ StatCard / StatGrid ~ 指标卡与栅格, 数字等宽不抖
empty-state ~ EmptyState / DataBoundary ~ 空/错误/加载三态, 顺序固定
page-header ~ PageHeader ~ 页头: 标题 + 说明 + 右侧操作位
browser-live ~ BrowserLive ~ hx-browser 多副本实时预览与远程操作
`;

const EXAMPLES = `
settings-demo ~ 完整设置页 ~ 照 open-vetta 复刻的三级布局整页
`;

const BLUEPRINT = `
blueprint ~ Blueprint ~ 节点图编辑器: 自定义节点 / 连接合法性判定 / 执行流
blueprint-dsh ~ dsh agent loop ~ 把 dsh 的整个 agent loop 画成一张蓝图 (使用方演示包)
`;

/** 把一段 "id ~ 标签 ~ 说明" 清单解析成导航条目. */
function section(group: string, list: string): DocEntry[] {
  return parseSpec(list, DOC.navColumns).map(([id, label, desc]) => ({ id, label, desc, group }));
}

export const DOCS: readonly DocEntry[] = [
  ...section(GROUP.start, START),
  ...section(GROUP.components, COMPONENTS),
  ...section(GROUP.extras, EXTRAS),
  ...section(GROUP.examples, EXAMPLES),
  ...section(GROUP.blueprint, BLUEPRINT),
];

export const GROUPS: readonly string[] = Object.values(GROUP);

/** 宽页面 (整页示例) 所在的分组. */
export const WIDE_GROUP: string = GROUP.examples;
