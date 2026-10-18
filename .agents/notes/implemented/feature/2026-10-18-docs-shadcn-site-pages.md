# Agent Note: 文档站对齐 shadcn 文档的结构, 覆盖全部组件并可部署到 GitHub Pages

Status: implemented

Decision-ID: docs-shadcn-site-pages

## Code

- `docs/src/App.tsx`
- `docs/src/components/DocKit.tsx`
- `docs/src/pages/InstallPage.tsx`
- `docs/src/pages/parity/basics.tsx`
- `scripts/check-smoke.ts`
- `scripts/gates/frontend/check-docs-registry.mjs`

## Problem

文档站要做成 https://ui.shadcn.com/docs 那样的中文页面: 包含 shadcn 清单里的全部组件 (新旧都要有), 每个组件有页面, 并能部署到 GitHub Pages 的仓库子路径 (`https://<user>.github.io/HX-UI/`). 约束: 文档站是 hash 路由的 Vite 应用; 产物里的资源与站内链接不能假设部署在域名根路径; Pages 发布只能来自评审过的 main, 构建步骤不能拿到部署令牌; docs 引用父仓兄弟目录 HX-Blueprint-Demo, 单独 clone 时也必须能构建.

## Decision

- 侧栏分组改为 "开始 / 组件 / HX 扩展 / 示例 / 蓝图". "组件" 组按 shadcn 当前清单 (2026-10-18 共 67 个) 字母序逐一列出, 已有页面沿用原 id (charts, empty-state 等), 同页的别名 (collapsible, date-picker, skeleton) 单独成条; shadcn 没有的 HX 自有组件放 "HX 扩展". 导航清单写成 "id ~ 标签 ~ 说明" 的多行文本, 由 `docs/src/spec.ts` 解析, 属性表 `Props` 用同一格式; 浏览器冒烟脚本 `scripts/check-smoke.ts` 从 nav.ts 读页面 id, 同时认旧的对象写法与新的清单写法. 注册表对账门禁 `scripts/gates/frontend/check-docs-registry.mjs` (属于 `npm run verify`) 用同一判据读 nav.ts, 路由一侧把 App.tsx 的 `case` 与 `PARITY_PAGES` 的键合并对账 (同一 id 两处都有算违规), 带 index.ts 的页面子目录 (parity/) 按目录名视为已引用, 其中每个 .tsx 必须被该 index.ts 引用; 组件模块扫描目录加入 `src/chat`, 目录入口以目录名导出视为已导出. 不改门禁就无法区分 "新写法" 与 "页面全部丢失", 原脚本会报 127 处违规.
- 门禁指纹 `scripts/gates/gate-fingerprint.json` 有意更新两条: `thresholds:check-docs-registry` (上一条的解析改动; 没有放松任何规则, 反而多了 case-and-parity 与子目录页面文件检查, 并把 src/chat 纳入模块扫描) 与 `wiring:checkpoints` (新增 `.github/workflows/pages.yml` 让 CI 工作流清单变了; 它只构建并发布文档站, 不摘任何既有门禁).
- 新组件页面放在 `docs/src/pages/parity/`, 按主题分文件, 每页固定结构: 说明, 安装 (从 @hx/ui 引入的名字与底层依赖), 可选的用法, 示例 (预览 / 代码标签页), 属性表, 必要时一段与已有组件的分工说明. App.tsx 的 switch 不再加分支, 默认分支按 id 查 `PARITY_PAGES`.
- `Preview` 传入 `code` 时显示 "预览 / 代码" 两个标签页 (库自己的 Tabs, 切换时淡入); 未传 `code` 的旧调用保持只显示预览, 调用方式不变. 示例代码字符串必须与实际渲染一致 (同一组取值, 变量名与无障碍属性), 读者照抄即可运行.
- `docs/src/spec.ts` 的 `parseSpec(text, columns)` 按列数解析: 前 columns - 1 个 `~` 分列, 其余 `~` 留在最后一列 (说明里可写 "0~100"), 列数不足时抛错带出该行, 不静默截断.
- 注册表门禁同时检查页面组入口本身被 App.tsx 引用 (规则 page-group-unused), 否则整组页面是不会渲染的死代码.
- 站内到独立页面的链接 (蓝图独立页) 用 `new URL("blueprint.html", document.baseURI)` 解析, 根路径与仓库子路径部署都能打开; 跨仓的 HXLoLis DshDemo 自己的链接由该仓按同一原则修改.
- 单文件行数门禁 (tsx 250 行, App.tsx 冻结只降不升): 组件页的 `Usage` 与 `Props` 放在 `docs/src/components/DocSpec.tsx`, 上一页 / 下一页导航放在 `docs/src/components/PageNav.tsx`, DocKit.tsx 与 App.tsx 因此回到上限以内.
- 部署: vite `base` 默认 `./` (可用环境变量 HX_DOCS_BASE 覆盖), 配合已有的 hash 路由, 同一份 dist 在仓库名子路径, 自定义域名根路径和 file:// 下都能打开, 不需要 404.html 回退. 新增 `.github/workflows/pages.yml`: push 到 main (或手动触发) 时 npm ci 根目录与 docs, 构建 docs, 用 upload-pages-artifact + deploy-pages 发布. checkout 设 `persist-credentials: false`, 依赖安装与构建脚本读不到令牌; deploy 作业限定 `github.ref == 'refs/heads/main'`, 其他分支的手动运行只构建不发布. 需要仓库所有者把 Settings > Pages > Source 设为 GitHub Actions.
- HX-Blueprint-Demo: vite.config.ts 已在兄弟目录缺席时退到 `docs/src/blueprint-demo-fallback`, 本次在没有该目录的沙箱里构建通过, CI 同样走替身, 不改这一机制.
- react-hook-form 加入 vite 的 dedupe, 保证库里的 Form 与文档示例的 useForm 是同一份; zod 与 @hookform/resolvers 只进 docs/package.json.

## Alternatives considered

- 什么都不做 / 复用现有: 最强理由是现有文档站已经能看所有旧组件, 结构也清楚. 否决: 用户要的是 shadcn 式的完整组件目录和可公开访问的站点, 现状既缺页面也无法部署到 Pages 子路径.
- 改成 history 路由加 404.html 回退: URL 更干净. 否决: 需要把 index.html 复制成 404.html 并让 Pages 返回 404 状态码, 刷新与分享在部分爬虫和预览器里表现不一致; hash 路由已经满足 "能分享, 能后退, 刷新停在原页".
- 每个新组件一页一个文件: 与旧页面一致. 否决: 40 多个新文件让目录难以浏览, 也会让同主题页面的示例数据重复; 按主题分 13 个文件, 每个守在 tsx 250 行上限内 (超过就按页面拆出同目录的新文件).
- 用 MDX 写文档: 写作体验好. 否决: 要新增 MDX 工具链依赖, 且现有页面全是 TSX, 两套写法并存.

## Consequences

文档站共 86 个导航页, 其中 "组件" 组 67 个与 shadcn 清单一一对应, 预览与代码在同一卡片内切换. Pages 部署在合并到 main 后自动进行, 前提是仓库设置把 Pages 来源切到 GitHub Actions. 代价是 Preview 多一层标签页, 代码不再默认展开; 导航清单改成文本格式后, 加组件时要遵守 "id ~ 标签 ~ 说明" 的写法.
