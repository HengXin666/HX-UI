/**
 * 文档导航. 加一个页面 = 在对应分组的清单里加一行 "id ~ 标签 ~ 说明".
 * 标签一律用中文, 不写尖括号形式; 分组顺序即侧栏顺序.
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
  start: "上手",
  basics: "基础件",
  layout: "版式",
  charts: "图表",
  agent: "AI 交互",
  blueprint: "蓝图",
} as const;

const START = `
install ~ 安装与使用 ~ 引入组件, 接入样式, 切换主题, 部署文档站
tokens ~ 设计令牌 ~ 颜色, 圆角, 阴影, 字号, 间距与动效
`;

const BASICS = `
button ~ 按钮 ~ 七种语义样式与八档尺寸, 自带点按波纹
button-group ~ 按钮组 ~ 相邻边框合并成一条
toggle ~ 两态按钮 ~ 按下与弹起两种状态
toggle-group ~ 两态按钮组 ~ 一组两态按钮, 单选或多选
segmented-control ~ 分段控件 ~ 指示器滑动, 单选分段
input ~ 输入框 ~ 反馈全部落在边框颜色上
textarea ~ 多行输入 ~ 随内容长高
input-group ~ 输入组 ~ 输入框加前后缀图标, 文字与按钮
input-otp ~ 验证码输入 ~ 一次性验证码, 支持粘贴与短信自动填充
field ~ 表单字段 ~ 标签, 控件, 说明与错误的组合
form ~ 表单 ~ 表单校验与错误关联
label ~ 表单标签 ~ 关联控件与说明
checkbox ~ 复选框 ~ 支持半选
radio-group ~ 单选组 ~ 一组互斥选项
switch ~ 开关 ~ 两档尺寸
slider ~ 滑块 ~ 单值与区间
select ~ 下拉选择 ~ 单选与分组
native-select ~ 原生下拉 ~ 菜单跟随主题
combobox ~ 组合框 ~ 可搜索下拉, 单选与多选
calendar ~ 日历 ~ 单日与区间选择
date-picker ~ 日期选择 ~ 与日历同页
time-picker ~ 时间选择 ~ 时与分输入, 受控但中间态不卡手
dialog ~ 对话框 ~ 模态对话框, 缩放淡入
alert-dialog ~ 警示对话框 ~ 必须二选一, 用于不可撤销的操作
confirm-dialog ~ 确认框 ~ 命令式等待与声明式两用
drawer ~ 抽屉 ~ 可拖拽的底部抽屉
sheet ~ 侧滑面板 ~ 从四边滑入的面板
popover ~ 浮层 ~ 锚定元素的浮层
hover-card ~ 悬停卡片 ~ 延迟弹出不误触
tooltip ~ 悬浮提示 ~ 含一行式提示
dropdown-menu ~ 下拉菜单 ~ 菜单与分组
context-menu ~ 右键菜单 ~ 组合式与声明式并存
menubar ~ 菜单栏 ~ 桌面应用式菜单栏
navigation-menu ~ 导航菜单 ~ 站点导航, 视口平滑插值
command ~ 命令面板 ~ 内嵌与对话框两种
table ~ 表格 ~ 表格原语
badge ~ 徽标 ~ 三种语义色
avatar ~ 头像 ~ 图片淡入, 叠放与状态点
kbd ~ 按键 ~ 键盘按键标记
separator ~ 分隔线 ~ 全局 1px
skeleton ~ 骨架屏 ~ 方块占位与多行
spinner ~ 旋转指示 ~ 行内加载
spin ~ 多形态加载 ~ 多种加载指示
progress ~ 进度条 ~ 含不定长, 带标题与数值
pagination ~ 分页器 ~ 翻页时整排不跳
breadcrumb ~ 面包屑 ~ 可折叠中间层级
tabs ~ 标签页 ~ 下划线或药丸两种形态
accordion ~ 折叠面板 ~ 折叠组, 双向都有高度动画
collapsible ~ 折叠块 ~ 单块折叠
collapse-panel ~ 可折叠面板 ~ 面板折叠
carousel ~ 轮播 ~ 惯性拖拽与方向键切换
resizable ~ 可调整分栏 ~ 拖拽调整大小
scroll-area ~ 滚动区域 ~ 细滚动条容器
aspect-ratio ~ 宽高比 ~ 固定宽高比容器
direction ~ 文字方向 ~ 支持从右到左
typography ~ 排版 ~ 标题, 正文, 引用与列表
empty ~ 空状态 ~ 组合式空状态
attachment ~ 附件 ~ 文件与图片附件, 带上传进度与错误态
item ~ 列表条目 ~ 媒体, 标题, 说明与操作
bubble ~ 气泡 ~ 消息气泡, 四种底色, 可折叠长内容
message ~ 消息 ~ 头像, 头部, 正文与底部
message-scroller ~ 消息滚动 ~ 贴底跟随与回到最新
marker ~ 标记行 ~ 系统提示, 状态行与分隔线
trace ~ 轨迹 ~ 推理与工具调用轨迹
questionnaire ~ 问卷 ~ 多步问卷, 切题滑动
alert ~ 提示条 ~ 五种语义色, 危险与警告会被读屏播报
toast ~ 消息提醒 ~ 右下角堆叠与顶部居中
`;

const LAYOUT = `
card ~ 卡片 ~ 内容容器
code-block ~ 代码块 ~ 语法高亮与复制
stat-card ~ 指标卡 ~ 指标卡与栅格, 数字等宽不抖
data-table ~ 数据表 ~ 粘性表头, 空态, 加载态与行点击
empty-state ~ 空态页 ~ 空, 错误与加载三态
page-header ~ 页头 ~ 标题, 说明与右侧操作位
setting-chrome ~ 设置页版式 ~ 一张卡里一行一个设置项
app-frame ~ 应用外壳 ~ 外留白与两块圆角面板
sidebar-nav ~ 侧栏导航 ~ 带数字与文本角标
sidebar ~ 侧栏 ~ 组合式应用侧栏, 可收成图标条
stepper ~ 步骤条 ~ 步骤条与日志框, 含联动示例
proxy-chain ~ 代理链路 ~ 入口, 策略与实体
browser-live ~ 浏览器预览 ~ 多副本实时预览与远程操作
settings-demo ~ 设置页示例 ~ 照上游复刻的三级布局整页
`;

const CHARTS = `
charts ~ 图表 ~ 折线, 面积, 柱状, 饼与雷达图
`;

const AGENT = `
agent-overview ~ 交互总览 ~ 发消息, 工具调用, 流式回复, 确认与变更预览
agent-chat ~ 对话 ~ 多轮会话与消息流
agent-toolcall ~ 工具调用 ~ 调用卡片, 参数与结果
agent-trace ~ 执行轨迹 ~ 推理与工具步骤时间线
agent-approval ~ 审批确认 ~ 高风险操作的人工确认
agent-stream ~ 流式回复 ~ 逐字输出与停止生成
agent-usage ~ 用量统计 ~ token 与费用用量
agent-diff ~ 变更对比 ~ 代码差异预览
agent-log ~ 运行日志 ~ 运行日志与过滤
agent-model ~ 模型选择 ~ 模型与参数切换
agent-prompt ~ 提示词 ~ 提示词编辑与版本
`;

const BLUEPRINT = `
blueprint ~ 蓝图编辑器 ~ 节点图编辑器: 自定义节点, 连接判定与执行流
blueprint-dsh ~ 智能体循环蓝图 ~ 把智能体循环画成一张蓝图
`;

/** 把一段 "id ~ 标签 ~ 说明" 清单解析成导航条目. */
function section(group: string, list: string): DocEntry[] {
  return parseSpec(list, DOC.navColumns).map(([id, label, desc]) => ({ id, label, desc, group }));
}

export const DOCS: readonly DocEntry[] = [
  ...section(GROUP.start, START),
  ...section(GROUP.basics, BASICS),
  ...section(GROUP.layout, LAYOUT),
  ...section(GROUP.charts, CHARTS),
  ...section(GROUP.agent, AGENT),
  ...section(GROUP.blueprint, BLUEPRINT),
];

export const GROUPS: readonly string[] = Object.values(GROUP);

/** AI 交互分组名, 供路由判断页面是否由 agent 页面集提供. */
export const AGENT_GROUP: string = GROUP.agent;

/** 整页示例所在页面, 内容区放宽到 1720px. */
export const WIDE_PAGES: ReadonlySet<string> = new Set(["settings-demo"]);
