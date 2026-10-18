# Agent Note: 前端 PR 必须附 GIF 演示, 录制技能改编自 deepseek-harness

Status: implemented

Decision-ID: pr-gif-demo

## Code

- `scripts/pr-gif/rule.ts`
- `scripts/tests/pr-gif/rule.test.ts`

## Problem

HX-UI 的组件改动主要是交互与动效 (弹层进出场, 轮播, 命令面板, 侧栏开合), 评审者只看 diff 判断不了实际效果, 而文档站的浏览器门禁 (smoke / shell) 只证明页面能渲染, 不证明交互符合描述. 演示需要满足: 来自 PR 头部的确切 commit; 用仓库已声明的工具 (根 devDependency playwright, 文档站 Vite 构建), 不新增依赖; 二进制媒体不进 PR 分支与 main 的历史; 能被 CI 机械检查, 又允许没有可见变化的改动豁免. 本仓没有 `gh` 的 `--attach` 可用, Agent 只能通过 git 与 REST API 发布.

## Decision

- 技能: `.agents/skills/record-browser-gif/` 改编自 deepseek-harness 的同名技能 (MIT, 上游提交 2e08462). `encode_gif.py` 与它的单测原样保留, 便于对照上游; `SKILL.md` 改写为 HX-UI 流程: 从 PR 头部 commit 构建 `docs/dist`, 在组件各自的文档页上演示, 用仓库根声明的 playwright 在全新 headless 上下文里录制 (CHROMIUM_PATH 约定与 test:e2e 一致), 去掉 dsh 服务器, 模型与 API key 步骤. 新增 `scripts/record_docs.ts`: 按 JSON 分镜驱动文档站, 自带只读静态服务, 工作区不干净时拒绝录制, 写出 capture.json (commit, 视口, 浏览器来源, 时间线). MIT 许可全文放在技能目录 `LICENSE`, 仓库 `NOTICE` 登记来源.
- 产物目录 `.playwright-gif/` 加入 `.gitignore`. 发布: GIF 推到孤儿分支 `pr-assets` 的 `pr-<编号>/` 下 (只追加, 不删除, 不强推, 不发 PR, 不合并), PR 正文用 `raw.githubusercontent.com` 地址嵌入, 旁边写演示的 commit SHA, 内容与截图间隔 / 播放倍速.
- 规则: 改动 `src/**/*.tsx`, `src/**/*.css` 或 `docs/src/**` 的 PR 必须在正文嵌入 GIF, 写进 AGENTS.md, CONTRIBUTING.md 与 PR 模板的 "演示" 一节 (已有的 `.github/PULL_REQUEST_TEMPLATE.md` 原地追加, 不另建小写同名模板, 避免两份模板并存).
- CI: `.github/workflows/pr-gif.yml` 只在 pull_request 事件运行 (opened, edited, reopened, synchronize, labeled, unlabeled), 只读权限, checkout 不保留凭据; 正文与标签经环境变量传入 `scripts/pr-gif/check.ts`, 不拼进 shell. 判定在 `scripts/pr-gif/rule.ts`: 改动文件命中前端路径且正文 (去掉 HTML 注释后) 没有 GIF 图片 (markdown 图片或 img 标签, 地址以 .gif 结尾或是 GitHub 上传附件地址) 时失败; 普通链接不算; 带 `no-gif` 标签时豁免. 与 agent-notes 报告类工作流不同, 这是一个真正会失败的检查, 因为缺 GIF 是 PR 作者能立即补上的. 判定的单测注册为 `pr-gif:unit`. CLI 与判定同放 `scripts/pr-gif/` (代表文件是 `rule.ts`), 不放 `scripts/` 根目录: 根目录已由 smoke / shell / blueprint 检查各自的决策占用, 新增兄弟文件会让三篇无关 note 被判为待审核.
- 新增工作流改变了 CI 接线清单, 门禁指纹 `wiring:checkpoints` 随之有意更新; 没有摘掉或放松任何已有门禁.

## Alternatives considered

- 什么都不做 / 复用现有: 最强理由是 smoke 与 shell 浏览器门禁已经逐页渲染文档站, 评审者也可以自己拉分支跑 `npm --prefix docs run dev`. 否决: 渲染成功不等于交互正确, 让每个评审者本地复现成本高, 而 PR 正文里的 GIF 一眼可见并钉死到 commit.
- 照搬上游技能 (gh --attach 优先, 真实模型回合): 与上游逐字一致. 否决: HX-UI 是组件库, 没有服务器与模型回合; 本环境没有 gh, Agent 只能经 git 与 REST API 发布.
- 把 GIF 提交到 PR 分支或 docs 目录: 最简单. 否决: 二进制会进 main 历史, 每次 clone 都要背.
- 用 GitHub Release 资产或 gist 存 GIF: 不进 git 历史. 否决: Release 语义是版本发布, gist 不支持二进制上传; 孤儿分支用普通 git push 即可, 地址稳定.
- CI 用 pull_request_target 读取正文: 能对 fork PR 评论. 否决: 该事件带写权限令牌运行, 与检出 PR 代码组合有已知的提权风险; 只读的 pull_request 已足够判定.

## Consequences

前端 PR 多一个录制与发布步骤, 需要 python3, ffmpeg, ffprobe 与一个 chromium (CHROMIUM_PATH 或 playwright 自带). 没有浏览器的环境录不了 GIF, 只能如实说明并由维护者决定是否加 `no-gif`. `pr-assets` 分支会单调增长, 不能清理已被引用的文件. 检查只认 "正文里有 GIF 图片", 不校验 GIF 内容与 commit 是否一致, 一致性靠技能里的发布前后 head 复核与评审.
