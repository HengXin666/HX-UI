# 参与 HX-UI

## 下游项目需要 UI 时

1. 先查 HX-UI 有没有现成的: 看文档站 (`cd docs && npm run dev`, 每个组件有 `#/<组件>` 页面), `src/index.ts` 的导出, 以及现有组件能否组合出需要的界面
2. 没有就用 GitHub Issue 的 "组件需求" 模板 (`.github/ISSUE_TEMPLATE/component-request.yml`, 标题前缀 `[组件需求]`, label `component-request`) 提 issue, 写清下游项目, 使用场景, 期望的 API 或交互, 参考截图或链接, 以及目前的手搓代码位置
3. 不要直接在下游项目手搓通用控件. 等待期间确需临时实现时, 在 issue 里登记它的位置, 组件进入 HX-UI 后替换掉

## 环境

- Node 22.18 或更高 (脚本是 .ts, 由 Node 原生运行), npm 10
- 依赖从已提交的锁文件安装: 根目录 `npm ci`, 文档站 `npm --prefix docs ci`
- 首次克隆后运行 `npm run hooks:install`, 把 Git hooks 指向 `.githooks/` (已有 core.hooksPath 时不会覆盖, 原 `.git/hooks` 下的同名 hook 仍会先执行)

## 本地检查

| 命令 | 作用 |
|---|---|
| `npm run quality` | 工作区 diff 的静态检查 (规则见 docs/reference/quality/rules.md) |
| `npm run quality:done` | 完成改动时运行: 静态检查 + 一次受影响测试 |
| `npm run quality:all` | 全仓扫描, 历史违规按 baseline 标为 historical |
| `npm run test:affected` | 只跑受影响测试 |
| `npm test` | 全部注册测试 (与 PR CI 相同) |
| `npm run test:e2e` | 构建文档站并跑浏览器冒烟与外壳交互检查, 需要本机 Chromium (或设 `CHROMIUM_PATH`), 找不到时按 `--strict` 失败而不是跳过 |
| `npm run quality:probes` | 门禁自测: 每条规则的正反例与集成探针 |
| `npm run quality:audit` | 核对规则目录逐项裁决, 存在 blocked 项时失败 |
| `npm run build` / `npm run verify` | 类型检查 + 设计规约门禁 / 再加文档站构建与冒烟 |

`test:frontend` 与 `test:perf` 目前输出 blocked 原因并失败, `test:backend` 与 `test:contract` 输出 not-applicable. 报告统一写到 `scripts/.hx_code_quality/reports/` (已 gitignore), 终端在问题超过 10 条时只显示数量与类型统计.

## Git 与 CI

- pre-commit 只检查暂存区内容, pre-push 对每个推送 ref 的精确范围做静态检查和受影响测试
- push CI 选择受影响测试, PR CI 跑全量测试; code/docs/build 三个工作流互不短路, 报告作为 artifact 上传
- Warning 需要 review, 不阻断; 新增 Error 阻止完成, push 与 CI; 缺少必需环境视为失败

## 决策与例外

- 新增直接依赖, 跨大版本升级或技术栈迁移, 先在 `scripts/quality/approvals.json` 登记并取得授权
- baseline 与豁免变更必须在 PR 中单独 review. 不为了让检查通过而刷新 baseline; 修掉历史违规后删除对应条目即可
- 组件视觉类名沿用上游 open-vetta, 门禁类改动不顺手改组件视觉或行为
