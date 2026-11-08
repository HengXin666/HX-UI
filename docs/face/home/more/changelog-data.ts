/**
 * 更新日志的数据: 仓库 git log 的真实提交 (hash, 日期, 标题), 从最新一条往回 36 条.
 * 这是一次快照, 发版时用 git log -36 --pretty=format:%h~%ad~%s --date=short 重新生成.
 */

export interface Commit {
  readonly hash: string;
  readonly date: string;
  readonly subject: string;
}

export const COMMITS: readonly Commit[] = [
  { hash: "6ee3ca1", date: "2026-11-08", subject: "docs(stage): 文档站 #/viz 与 #/page 舞台页 (舞台/道具台/源码三栏, 重播入场)" },
  { hash: "56a08ad", date: "2026-11-08", subject: "refactor(gates): 门禁脚本 .mjs 迁 .ts, 修 git() trim 导致的 lanes 误报" },
  { hash: "c102432", date: "2026-11-08", subject: "fix(viz): Ring 回程弹簧改用卡源码原值 (stiffness 120, 阻尼按 8 度过冲反算)" },
  { hash: "1505523", date: "2026-11-08", subject: "refactor(motion,constants): 镜头语言迁入 motion/shots, 清 studio 数字别名, 区块常量按域改名" },
  { hash: "18a09b3", date: "2026-11-08", subject: "feat(viz,page): 可视化层与页面描述层, 分层子路径入口; viz 手感对齐 video-shotcraft 镜头卡" },
  { hash: "01cb8fa", date: "2026-11-07", subject: "研究并落地: 可中断弹簧, 控件分态, 重拍首页 (#43)" },
  { hash: "96ca49a", date: "2026-11-06", subject: "feat(docs): 用门面首页替换文档站外壳 (#42)" },
  { hash: "3b0ef98", date: "2026-11-06", subject: "feat(studio): 加入镜头语言, 过程可视化和两张整页 (#41)" },
  { hash: "e73a369", date: "2026-11-06", subject: "feat: 视觉还原度重建 — 六层架构 + 区块层 + 整页模板 (0.8.0) (#40)" },
  { hash: "a54ad0a", date: "2026-11-02", subject: "feat(ui): 补齐令牌深度、动效体系、布局原语与视觉效果件 (#39)" },
  { hash: "8ed4dea", date: "2026-10-31", subject: "fix(lib): 图标依赖声明为 peer, 导出 docs 常量, registry 认常量式 case" },
  { hash: "5194d61", date: "2026-10-31", subject: "fix(api): 补齐 agent 组件与常量的公共导出, 版本 0.2.1 -> 0.3.0" },
  { hash: "95d8c77", date: "2026-10-25", subject: "docs: 合并重复页并移除空演示页" },
  { hash: "6e825b1", date: "2026-10-25", subject: "feat(agent): 思考计时, 发散思考, 子代理与 TodoTree 过程组件及演示页" },
  { hash: "1f82573", date: "2026-10-31", subject: "给 CodeEditor 补上 monaco 的 DiffEditor (#38)" },
  { hash: "b07fc5c", date: "2026-10-31", subject: "把刻画从 50 抬到 85 (#37)" },
  { hash: "11e1135", date: "2026-10-31", subject: "补上相对位移、API 快照和可复原的刻画产物。 (#35)" },
  { hash: "86b325f", date: "2026-10-31", subject: "docs(issue): 公共控件缺口模板供下游 Agent 排队" },
  { hash: "3204b03", date: "2026-10-31", subject: "发布 HX-UI 专项刻画页 (#34)" },
  { hash: "7a9c2f0", date: "2026-10-25", subject: "feat(ui): 流式 Markdown / Monaco 编辑器 / Trace 双模式 / 模板页, 新增 Error 清零 (#28)" },
  { hash: "95fecb2", date: "2026-10-22", subject: "feat(ui): 流式 Markdown + Monaco 编辑器 + 模板页 + 蓝图引脚对齐 + 发布产物修复 (#21)" },
  { hash: "4549991", date: "2026-10-21", subject: "chore(release): 版本 0.1.2" },
  { hash: "09f9344", date: "2026-10-21", subject: "feat(build): 库构建与 Release 分发 (无需 npm 账号) (#19)" },
  { hash: "957b956", date: "2026-10-21", subject: "Merge pull request #17 from HengXin666/feat/agent-ui" },
  { hash: "b7b4460", date: "2026-10-21", subject: "refactor(docs): move group nav under nav/ to keep directory fan-out" },
  { hash: "04328d8", date: "2026-10-21", subject: "fix(docs): use ASCII punctuation in app comments" },
  { hash: "701f82d", date: "2026-10-21", subject: "refactor(docs): extract group nav and tighten approval semantics for line budget" },
  { hash: "05a77a4", date: "2026-10-21", subject: "refactor(agent): extract shared literals into constants pool" },
  { hash: "baabb98", date: "2026-10-21", subject: "fix(agent): drop undeclared icon from inline approval" },
  { hash: "7553417", date: "2026-10-21", subject: "refactor(agent): split overview page and reuse real agent components" },
  { hash: "2937cc0", date: "2026-10-21", subject: "feat(agent): export agent components and route their docs pages" },
  { hash: "844b97e", date: "2026-10-21", subject: "feat(agent): agent interaction components, docs grouping and overview page" },
  { hash: "a97fdb1", date: "2026-10-21", subject: "feat(agent): add DiffView and UsageMeter docs page" },
  { hash: "04b8dc5", date: "2026-10-21", subject: "feat(agent): add UsageMeter quota meter" },
  { hash: "6a59107", date: "2026-10-18", subject: "更新过期 Skill" },
  { hash: "768cc36", date: "2026-10-18", subject: "Merge pull request #15 from HengXin666/fix/docs-feedback-pages" },
];
