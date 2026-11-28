# 参与 HX-UI

## 下游项目需要 UI 时

1. 先查有没有现成的: 文档站 (<https://hengxin666.github.io/HX-UI/>, 本地 `npm run dev`), `src/components/ui/` 与各拓展包, 以及现有组件能否组合出需要的界面
2. 没有就用 GitHub Issue 的「组件需求」模板 (`.github/ISSUE_TEMPLATE/component-request.yml`, label `component-request`) 提 issue: 下游项目, 使用场景, 期望的 API 或交互, 参考截图, 目前手搓代码的位置
3. 不要在下游项目手搓通用控件. 确需临时实现时在 issue 里登记位置, 组件进入 HX-UI 后替换掉

## 环境与检查

- Node 22.18+ (脚本是 `.ts`, Node 原生运行), npm 10; 依赖从锁文件装: `npm ci`
- 提交前跑一遍与 CI (`.github/workflows/ci.yml`) 相同的检查:

| 命令 | 作用 |
|---|---|
| `npx tsc -b` | 类型检查 (src + 文档站) |
| `npm run check` | 体积预算, `"use client"` 边界, 基础件逻辑用例 |
| `npm run check:bp` / `npm run check:agent` | 蓝图 / Agent 拓展包回归 |
| `npx vite build` | 文档站构建 |
| `npm run pack:check` | 构建发布包, `npm pack`, 校验产物 |

## 约定

- 规则见 [docs/guide.md](./docs/guide.md) 的「规则」与 [AGENTS.md](./AGENTS.md): 颜色只用令牌, 动效只动 transform / opacity / filter 并尊重减弱动效, 线条 1px, 滚动条用全局自定义样式
- 新组件: `src/components/ui/<name>.tsx` + 文档页 `site/src/docs/entries/<slug>.ts` 与 `<slug>.demo.tsx`, 在 `site/src/docs/registry.ts` 登记, 在浏览器里看过才算完成; 同步 `llms.txt` 与 `CHANGELOG.md`
- 提交信息遵循 Conventional Commits (`feat(ui): ...`, `fix(docs): ...`), 关联 issue 写 `Closes #<号>`
- 1.x 旧版在 `legacy/v1` 分支存档, 不再接受改动
