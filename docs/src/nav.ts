/**
 * 文档导航. 加一个页面 = 在对应分组的清单里加一行 "id ~ 标签 ~ 说明".
 * 标签一律用中文, 不写尖括号形式; 分组顺序即侧栏顺序.
 *
 * 分组按"用户找东西的方式"切, 不按源码目录切: 组件目录里的 primitives/ 与 layout/
 * 与读者无关, 一个表单控件和一个浮层混在同一组里才是真的难找.
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
/**
 * .agents/notes/implemented/feature/2026-10-22-docs-nav-groups-and-templates.md
 */
const GROUP = {
  start: "上手",
  gallery: "展示画廊",
  actions: "按钮与操作",
  form: "表单输入",
  picker: "选择器",
  overlay: "浮层与菜单",
  feedback: "反馈与状态",
  data: "数据展示",
  navigation: "导航",
  box: "布局容器",
  motion: "动效与质感",
  type: "排版",
  media: "媒体",
  blocks: "区块",
  conversation: "会话",
  layout: "页面版式",
  charts: "图表",
  agent: "AI 交互",
  templates: "模板",
  blueprint: "蓝图",
} as const;

const START = `
install ~ 安装与使用 ~ 引入组件, 接入样式, 切换主题, 部署文档站
tokens ~ 设计令牌 ~ 颜色, 圆角, 阴影, 字号, 间距与动效
skins ~ 皮肤与密度 ~ 六套皮肤一键换气质, 紧凑 / 舒适 / 宽松三档密度
`;

const GALLERY = `
gallery ~ 展示画廊 ~ 用动效, 便当格, 光斑与指标卡拼成的落地页与仪表盘, 亮暗两套主题
`;

const ACTIONS = `
button ~ 按钮 ~ 七种语义样式与八档尺寸, 自带点按波纹
button-group ~ 按钮组 ~ 相邻边框合并成一条
toggle-group ~ 两态按钮 ~ 单个与成组, 单选或多选
segmented-control ~ 分段控件 ~ 指示器滑动, 单选分段
`;

const FORM = `
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
widgets ~ 富交互件 ~ 时间线, 评分, 拖放上传, 标签输入与色块选择
`;

const PICKER = `
select ~ 下拉选择 ~ 单选与分组
native-select ~ 原生下拉 ~ 菜单跟随主题
combobox ~ 组合框 ~ 可搜索下拉, 单选与多选
calendar ~ 日历与日期选择 ~ 单日, 区间与弹出式日期选择
time-picker ~ 时间选择 ~ 时与分输入, 受控但中间态不卡手
`;

const OVERLAY = `
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
`;

const FEEDBACK = `
alert ~ 提示条 ~ 五种语义色, 危险与警告会被读屏播报
toast ~ 消息提醒 ~ 右下角堆叠与顶部居中
badge ~ 徽标 ~ 三种语义色
skeleton ~ 骨架屏 ~ 方块占位与多行
spinner ~ 旋转指示 ~ 行内加载
spin ~ 多形态加载 ~ 多种加载指示
progress ~ 进度条 ~ 含不定长, 带标题与数值
empty ~ 空状态 ~ 组合式空状态
`;

const DATA = `
table ~ 表格 ~ 表格原语
avatar ~ 头像 ~ 图片淡入, 叠放与状态点
item ~ 列表条目 ~ 媒体, 标题, 说明与操作
pagination ~ 分页器 ~ 翻页时整排不跳
`;

const NAVIGATION = `
breadcrumb ~ 面包屑 ~ 可折叠中间层级
tabs ~ 标签页 ~ 下划线或药丸两种形态
accordion ~ 折叠面板 ~ 折叠组与单块折叠, 双向都有高度动画
collapse-panel ~ 可折叠面板 ~ 面板折叠
`;

const BOX = `
box ~ 布局原语 ~ Stack, Grid, Container 与可拖拽分栏, 统一间距与宽度档
bento ~ 便当格 ~ 不等大磁贴拼出的看板与落地页版块
separator ~ 分隔线 ~ 全局 1px
carousel ~ 轮播 ~ 惯性拖拽与方向键切换
resizable ~ 可调整分栏 ~ 拖拽调整大小
scroll-area ~ 滚动区域 ~ 细滚动条容器
aspect-ratio ~ 宽高比 ~ 固定宽高比容器
direction ~ 文字方向 ~ 支持从右到左
`;

const MOTION = `
motion ~ 动效 ~ 视口入场, 交错, 数字滚动与页面转场, 尊重减弱动效
effects ~ 视觉效果 ~ 光斑卡, 流光边框, 跑马灯, 背景底纹与毛玻璃
`;

const TYPE = `
typography ~ 排版 ~ 标题, 正文, 引用与列表
display-type ~ 营销排版 ~ Display, Eyebrow, Kicker, Lead, 渐变字与 Prose 正文容器, 中日韩自动收紧
kbd ~ 按键 ~ 键盘按键标记
`;

const MEDIA = `
media-image ~ 图片 ~ 响应式图片, 占位与加载失败兜底
media-themed-image ~ 亮暗双图 ~ 跟随主题切换的两张图
media-video ~ 视频 ~ 封面, 静音自动播与减弱动效
media-gallery ~ 画廊 ~ 网格与瀑布排布, 点开进灯箱
media-lightbox ~ 灯箱 ~ 全屏查看, 方向键与滑动切换
media-frames ~ 设备与浏览器外框 ~ 手机, 平板, 笔记本与浏览器窗口外框
`;

const BLOCKS = `
blocks-site ~ 站点区块 ~ 顶栏, 大菜单面板, 移动导航, 公告条与页脚
blocks-hero ~ 首屏与转化条 ~ Hero, 标志墙, 行动条与邮件订阅
blocks-features ~ 特性区块 ~ 特性栅格, 左右交替, 便当格, 指标带, 展示与图表栅格
blocks-social-proof ~ 社会证明 ~ 用户评价, 案例, 更新日志与推文墙
blocks-pricing ~ 定价与对比 ~ 定价卡, 对比矩阵与常见问题
blocks-developer ~ 开发者区块 ~ 代码展示与安装命令
blocks-commerce-browse ~ 电商浏览 ~ 商品卡, 栅格, 横滑轨道, 类目, 活动首屏与促销条
blocks-commerce-trade ~ 电商交易 ~ 商品详情, 购物车, 结账步骤与搜索结果
blocks-docs ~ 文档站区块 ~ 文档外壳, 目录, 上下页, API 表与提示框
blocks-portfolio ~ 作品集区块 ~ 个人首屏, 粘性侧栏, 经历时间线, 项目栅格与文章列表
page ~ 整页描述 ~ 用 definePage 描述一整页: 调区块顺序, 开关区块, 改标题, 源码即描述对象
`;

const CONVERSATION = `
attachment ~ 附件 ~ 文件与图片附件, 带上传进度与错误态
bubble ~ 气泡 ~ 消息气泡, 四种底色, 可折叠长内容
message ~ 消息 ~ 头像, 头部, 正文与底部
message-scroller ~ 消息滚动 ~ 贴底跟随与回到最新
marker ~ 标记行 ~ 系统提示, 状态行与分隔线
questionnaire ~ 问卷 ~ 多步问卷, 切题滑动
`;

const LAYOUT = `
card ~ 卡片 ~ 内容容器
code-block ~ 代码块 ~ 语法高亮与复制
code-editor ~ 代码编辑器 ~ Monaco 单文件与 diff, One Dark Pro Darker, 本地 worker 无 CDN
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
`;

/**
 * 图表组末尾的 viz 是可视化层的舞台页: 舞台, 道具台, 源码三截.
 * .agents/notes/implemented/feature/2026-11-08-docs-viz-page-stage.md
 */
const CHARTS = `
charts ~ 图表 ~ 折线, 面积, 柱状, 饼与雷达图
viz ~ 数据可视化 ~ 趋势线, 柱状, 环形, 流程图, 漏斗与时间线的舞台: 拖道具看中断与回程, 源码一键复制
`;

const AGENT = `
agent-overview ~ 交互总览 ~ 发消息, 工具调用, 流式回复与变更预览串成一个完整示例
agent-toolcall ~ 工具调用卡 ~ 调用状态, 入参与结果可折叠
agent-stream ~ 流式回复 ~ 先思考再回复, 逐字 Markdown 与中断
agent-usage ~ 用量计量 ~ 已用 / 上限 / 速率
agent-diff ~ 变更对比 ~ 逐行增删, 行首带符号
agent-process ~ 思考与过程 ~ 思考计时, 发散思考, 子代理与分层待办的实时展示
trace ~ 轨迹 ~ 推理与工具调用轨迹
`;

const TEMPLATES = `
templates-chat ~ AI 对话工作台 ~ 会话列表 + 流式回复 + 轨迹 + 输入框, 整页可复制
templates-settings ~ 设置页 ~ 二级设置栏 + 一行一个设置项, 整页可复制
templates-dashboard ~ 数据看板 ~ 指标卡 + 面积图 + 数据表, 整页可复制
templates-console ~ 链路控制台 ~ 代理链路 + 步骤条 + 日志框, 整页可复制
page-saas ~ SaaS 落地页 ~ 复刻 vercel / linear / stripe 型 SaaS 落地页: 主视觉 + 客户墙 + 便当格 + 定价 + 问答, 三套皮肤
page-opensource ~ 开源项目站 ~ 复刻 tailwindcss / astro / bun 型开源项目主页: 安装命令 + 代码展示 + 案例 + 更新日志, 三套皮肤
page-pricing ~ 定价页 ~ 复刻 linear / vercel 型定价页: 月年切换套餐 + 功能对比表 + 分组问答, 三套皮肤
page-commerce-home ~ 电商首页 ~ 复刻 nike / apple / shopify 型电商首页: 大菜单 + 轮播 + 分类 + 商品网格. 演示里顶栏未吸顶, 真实项目里传 sticky: true
page-product ~ 商品详情 ~ 复刻 apple / nike 型商品详情页: 画廊 + 购买面板 + 规格对比 + 评价. 演示里顶栏未吸顶, 真实项目里传 sticky: true
page-portfolio ~ 个人主页 ~ 复刻 brittanychiang.com 型个人主页: 粘性双栏, 经历 + 项目 + 文章
page-docsite ~ 文档站 ~ 复刻 mantine / shadcn / ant.design 型组件文档站: 首页 + 侧栏目录 + 正文 + 属性表
page-dashboard ~ 仪表盘 ~ 复刻 SaaS 后台型仪表盘: 侧栏 + 指标行 + 双图表 + 动态流 + 上手清单
page-clone-linear ~ linear 复刻 ~ 逐块对拽 linear.app 深色首屏: 零自定义 class, 缺口如实留在画面上
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
  ...section(GROUP.gallery, GALLERY),
  ...section(GROUP.actions, ACTIONS),
  ...section(GROUP.form, FORM),
  ...section(GROUP.picker, PICKER),
  ...section(GROUP.overlay, OVERLAY),
  ...section(GROUP.feedback, FEEDBACK),
  ...section(GROUP.data, DATA),
  ...section(GROUP.navigation, NAVIGATION),
  ...section(GROUP.box, BOX),
  ...section(GROUP.motion, MOTION),
  ...section(GROUP.type, TYPE),
  ...section(GROUP.media, MEDIA),
  ...section(GROUP.blocks, BLOCKS),
  ...section(GROUP.conversation, CONVERSATION),
  ...section(GROUP.layout, LAYOUT),
  ...section(GROUP.charts, CHARTS),
  ...section(GROUP.agent, AGENT),
  ...section(GROUP.templates, TEMPLATES),
  ...section(GROUP.blueprint, BLUEPRINT),
];

export const GROUPS: readonly string[] = Object.values(GROUP);

/** AI 交互分组名, 供路由判断页面是否由 agent 页面集提供. */
export const AGENT_GROUP: string = GROUP.agent;

/** 模板分组名, 顶栏的 "模板" 入口用它定位. */
export const TEMPLATE_GROUP: string = GROUP.templates;

/** 整页示例所在页面, 内容区放宽到 1720px. */
export const WIDE_PAGES: ReadonlySet<string> = new Set([
  "gallery",
  "page",
  "templates-chat",
  "templates-settings",
  "templates-dashboard",
  "templates-console",
  "page-saas",
  "page-opensource",
  "page-pricing",
  "page-commerce-home",
  "page-product",
  "page-portfolio",
  "page-docsite",
  "page-dashboard",
  "page-clone-linear",
]);
