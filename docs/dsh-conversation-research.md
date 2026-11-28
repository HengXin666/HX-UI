# DSH 会话界面研究: 实时用量, 轨迹与子 Agent

2026-11-28 读 deepseek-ai/deepseek-harness (commit 4b399c39) 的 web client, 给 HX-UI 2 的 Agent 会话 (issue #57) 定方案. 下面路径都相对 DSH 仓库的 `packages/client/`.

## 研究要点

- 用量放在输入框下方的 composer dock: `ui-conversation/src/client/skeleton/ContextMeter.tsx` 是 14px 占用环 + 百分比, 点开是 `~已用 / 窗口` 与系统提示 / 工具 / 对话的占比条; 占用 = projectedTokens / contextWindow (`ui-conversation/src/client/context-occupancy.ts`).
- 同一行的统计胶囊在 `ui-chat/src/client/chat/StatsPills.tsx`: activity (轮次 · 步数 · N tok/s, 点开 LLM 时间 / 工具时间 / TTFT / 速度) 与 usage (总 token · 命中率, 点开 命中率 / 输入 / 缓存读 / 缓存写 / 输出). 速率 = decodeTokens / decodeMs (`message-chrome.ts` formatTokensPerSecond: 10 以上取整); 命中率 = cacheRead / (uncached + cacheRead + cacheWrite), 部分命中不显示成 100% (`token-format.ts` formatCacheHitPercent). 数据来自 sessionStats / tokenUsage 投影 (`../session/session-stats`), 投影变更推送刷新, 运行中的时钟用 setInterval 单独刷新 (`RunningStatus.tsx`).
- 每轮: 结束的一轮顶部是 "用时 X" 的整轮折叠按钮 (`TurnProcessNodeView.tsx`), 操作条上有本轮用量胶囊 (`TurnUsagePanel.tsx`).
- 过程分组 (`ui-chat/src/client/conversation-nodes/README.md` 的 process-grouping / display-modes): 一轮内相邻的思考与工具合成一组, 回复与输入断开; 运行中标题是正在跑的那一类 ("Running commands" + 参数), 没有在跑的工具时 "Analyzing"; 结束标题按次数排 (同次数按先后) 点名前三类再 "等"; 展开体限高 min(400px, 50vh), 停在底部才跟随; 子 Agent 调用算 subagents 一类 ("Coordinating subagents").
- 轨迹 (`ui-trajectory`): 按轮的账本, 吸顶轮次头带 输入 / 输出 / 思考 / 时间 列, 行 38px (序号 · 类型标签 · 文字 · 指标 · 时长), 子调用折在父工具下可单独展开, 工具栏一键折叠轮次 / 调用 / 子调用; 顶部计时总览把助手请求分成 TTFT 与生成两段; 进行中的行只画开始标记, 不编造时长.
- 子 Agent (`ui-subagent`, `ui-agent-team`): 在轨迹里是一次工具调用行; 子会话在右侧栏以只读会话打开 (同一套会话组件); 会话面板列出子 Agent 的状态点, token 与时长.

## 问题

上一版把多 Agent 编排 (关系图 / 泳道 / 卡片墙) 做成了独立组件和独立文档页 #/ui/orchestra, 与会话脱节: 使用方要自己决定放哪, 子 Agent 的审批和父线程没有关系. 会话本身只在消息末尾给一行静态用量, 看不到实时上下文占用, 速率, 缓存命中; 关系图用 SVG 文字自绘, 左侧彩条加彩色边, 与库里的 Card / Badge 不是一套语言. 文档站也没有一个能直接看到完整接入效果的对话页.

## 落地 (HX-UI 2)

- 编排不再单独成页: 一条消息派出子 Agent (task 调用里嵌 agent-spawn, 或 spawn 带 messageId) 时, AgentParts 在第一个派发调用处渲染 AgentOrchestraBlock, 派发调用本身由框代替. 框里只画这次派出的那一支 (orchestraScope: 编排者 + 这几个子 Agent 及后代), 关系图 / 泳道 / 卡片墙可切, 默认关系图. 子 Agent 等批准 / 回答时, 请求 (pendingRequests) 上浮到框下的父线程, ApprovalBar 标明 "来自 X". 点子 Agent 走 AgentProvider 的 onOpenAgent, 配 AgentThread 在侧栏看只读轨迹 (复用 AgentParts). MessageList 只渲染主线程 (threadMessages).
- AgentProvider 新增 agents / messages / openAgentId / onOpenAgent / orchestraView; 树和消息分两个 context, 普通消息只订阅树, token 流不让整段会话重渲染.
- 用量: AgentUsage 补 cacheWriteTokens; reducer 在文字 / 思考 / 工具参数增量时记 message.meter (首 token, 采样), usage-delta 给精确输出 token, 没有时按文字估算; usage.ts 算 2 秒滑动窗口 tokens/s (并行消息相加), 首 token, 吞吐, 命中率, 上下文占用, 本轮起止与费用. SessionMeter 按 DSH 放在输入框下方: 上下文环 · 速率 (并行路数) · token 与命中率 · 本轮耗时与费用, 每项弹层看明细; 生成中 250ms 刷新, 停了就不刷.
- 轨迹: 活动分组改用 DSH 的标题规则与限高跟随; 结束的一轮顶部加整轮折叠头 (最新一轮展开, 更早的折起), 操作条换成 TurnUsage 胶囊; 新增 AgentTrajectory 账本 (buildTrajectory 纯函数), 子 Agent 的工作挂在派发调用下.
- 视觉: 关系图节点改成 HTML 小卡片 (rounded-lg, 1px border, bg-card, shadow-xs, 13px / 12px 字, 状态点 + outline Badge), 连线中性色 1px, 只有活跃 (子 Agent 在跑 / 等人) 或选中的边用强调色, 去掉左侧彩条; 泳道标签列改 HTML, 运行段浅强调色, 依赖连线只画正在等的那一段; 卡片墙用同一套徽章与 shadow-xs.
- 文档站: 删掉 #/ui/orchestra 条目 (router 把旧链接重定向到 #/ui/conversation); 会话页是完整对话回放 (session-script.ts), 带 "全屏打开" 整页 #/ui/conversation/full, 审批停顿可点也可 7 秒自动继续.

## 考虑过的其他做法

- 什么都不做 / 复用现有的独立 AgentOrchestra 页: 最强理由是已经实现, 三个视图可单独使用. 否决: 用户明确要求编排在对话里, 独立页让使用方自己猜接法, 审批也无法回到父线程. AgentOrchestra 与三个视图仍导出, 作为编排框的内部实现与单独使用的入口.
- 编排框做成独立的 part 类型 (例如 { type: "orchestra" }) 由后端推: 位置最可控, 但要求后端多发一种事件, 而派发信息已经在 task 调用与 agent-spawn 里, 前端推导即可.
- 速率只在结束后算 (DSH 的 decodeTokens / decodeMs): 简单准确, 但运行中看不到跳动; 滑动窗口兼顾实时, 结束后仍给平均吞吐.
- 关系图继续用纯 SVG 但调样式: 少改动, 但 SVG 文字没有截断和库里的字体排版, 徽章也只能仿画, 与 Card / Badge 永远差一截.

## 影响与破坏性变化

使用方把 agents / messages 交给 AgentProvider 就能在会话里得到编排框, 审批上浮与子 Agent 轨迹; 不给时行为与以前相同. 破坏性: #/ui/orchestra 文档页移除 (重定向); summarizeActivity 的排序与措辞改为 DSH 规则 (最多三类, "等 N 项"); 运行中分组标题改为 "正在运行命令" 一类; GRAPH / LANES 尺寸常量变了; 关系图节点从 SVG g 变成 HTML 按钮; MessageList 在给了 agents 时隐藏子 Agent 自己的消息; 助手消息操作条的 UsageSummary 换成 TurnUsage (UsageSummary 仍导出). 速率在没有 usage-delta 时是按文字长度的估算.

## 代码入口

- `src/agent/model/usage.ts`: 计量与汇总的纯函数 (sessionUsage, tokenRate, messageTiming, cacheHitRate)
- `src/agent/meter.tsx`: SessionMeter, TurnUsage
- `src/agent/orchestra/orchestra-block.tsx`: 对话内的编排框与上浮的子 Agent 请求
- `src/agent/orchestra/agent-thread.tsx`: 子 Agent 只读轨迹
- `src/agent/model/trajectory.ts` + `src/agent/trajectory.tsx`: 轨迹账本
- `site/src/docs/entries/agent/session-script.ts`: 文档站的完整会话剧本

注: 这份研究笔记放在 docs/ 下, 由各组件文件头的 "研究笔记" 注释引用.

## 第三轮 (2026-11-28): 计划, 派生树, 悬浮编排, 子 Agent 切换, 模型选择

### 参考

- oh-my-pi (github.com/can1357/oh-my-pi, commit d8816b4, pi coding agent 的分支; 用户说的 OMP 就是它). 路径相对 `packages/coding-agent/src/`:
  `tools/todo.ts` (todo 工具: op = init / start / done / drop / rm / append / view; phases > tasks 两层; 状态 pending / in_progress / completed / abandoned;
  normalizeInProgressTask: 没有进行中的就把第一个待办设为进行中; append 不点名阶段时加到当前项所在阶段), `tools/details/todo.ts` (类型, 罗马数字阶段名, 完成划线动画帧数),
  `ui/dock/todo.tsx` (HUD 停在输入框上方: 只展开当前阶段, 其余阶段只显示标题与 closed/total, 子 Agent 正在做的待办高亮; 终端矮时折成一行 `TODO 2/5 · ☐ 下一项`),
  `ui/styles/dock/todo.ts` 与 `ui/styles/tools/todo.ts` (脊线按总进度填色; 会话里的待办调用画成框, 刚完成的项逐字划线).
- DSH (/tmp/dsh, packages/client): `ui-subagent/src/client/SubagentHeaderLineage.tsx` (会话标题旁的子 Agent 切换器: 标题 + 箭头, 悬停 150ms 打开 / 离开 120ms 关, 点击固定,
  ArrowDown 进菜单, Esc 还焦点), `SubagentCatalog.tsx` (树: 状态点, 名字 / 角色, token 与时长, 当前打勾, 行尾 "在侧栏打开"), `ui-conversation/src/client/skeleton/TodoPanel.tsx`
  (输入框上方的待办面板: 一行 "已完成 n · 进行中 n · 待办 n", 可展开).
- T3 Code (github.com/pingdotgg/t3code, commit 57561ba8), `apps/web/src/components/chat/`: `ProviderModelPicker.tsx` (Popover: 左侧窄栏选 provider 实例, 中间搜索 + 模型列表,
  右侧 w-48 的推理强度栏, 手机上竖排), `ModelPickerSidebar.tsx`, `ModelListRow.tsx` (provider 图标 · 模型名 · 角标 · 收藏), `ComposerModelEffort.tsx` (强度是模型声明的 select,
  按档列出; 触发器上显示强度), `EffortGlyph.tsx` (一档一根柱, 由低到高, 填到当前档, 像素取整).

### 落地

- 计划: `model/todos.ts` 从待办调用派生 "大项 > 小项" 树 (todo_write / update_plan 快照, children 等嵌套键; OMP 的 op 增量与结果里的 phases), 参数流式时用部分解析的快照实时长出来;
  大项状态由子项推出, 进度只数叶子 (同 OMP closed/total), 每一步记完成 / 新增 / 移除 / 开始. `model/plan-index.ts` 按所属 Agent 建索引 (待办调用不变就复用).
  组件 `plan.tsx`: PlanTree (可折叠, 当前项高亮, 新完成划线 scaleX 扫过, 新项淡入), PlanCard, PlanPanel (dock 在输入框上方可收成一行 / side 侧栏), TodoCallCard (最新一步是实时卡, 更早的收成一行摘要).
  与 OMP 的差别: 多个进行中只在 start 时收成一个 (与 todo_write 混用、并行子 Agent 时不压掉别的进行中项).
- 派生树: 关系图改成 DOM 树 (`.hx-otree-*`, 1px 边框画枝), 每个节点是完整卡片 (状态, 模型, 计时, 最新一步, 自己的 tok/s 与 token); 宽容器父在左子在右, 窄容器 (容器查询 < 34rem) 竖向缩进;
  新派出的子节点枝从父那侧伸出、卡片平移淡入, 减弱动效时直接到位. layoutAgentGraph 仍导出, 但图不再用它.
- 悬浮编排: 编排框拆出 OrchestraFrame; AgentProvider 维护 "弹出的是哪一支"; 页面在 Conversation 的 overlay 里放 OrchestraDock 后头部出现 "弹出", 面板停右下角 / 侧边 (侧边时对话内容让出右侧), 可收起成小条; 原位置留占位, 点它放回.
- 按 Agent 区分速率: 原来编排框头部与侧栏的速率都从消息 meter 取, 子 Agent 的时间线嵌在父的 task 调用里 (tool-child) 时增量算不到子 Agent 头上, 而且节点 / 卡片 / 泳道都没有各自的速率, 看到的总是主线程或总和.
  现在 tool-child 里的输出增量 (以及带 callId 的 usage-delta) 记在派发调用的 call.meter 上, `agentTokenRates` 按归属给每个 Agent 一个值; 节点, 卡片, 泳道, 切换器, 侧栏各显示自己的, 编排框头部是子 Agent 合计.
- 顶栏切换器 AgentSwitcher (DSH 同款交互) + SubagentConversation (子 Agent 的整个会话区, 只读输入条 + 它自己的用量条); 窄屏 AgentThread 是全屏抽屉.
- 模型选择 AgentModelPicker + EffortSlider: 数据在 `model/models.ts` (客户端 / 模型 / 支持的强度档位, 换模型吸附到最近一档且不会从开着吸附成关闭); 强度条基于库里的 Slider (Radix: 拖动, 方向键, 按档吸附, role=slider), 下面的刻度可点.
  与 T3 的差别: T3 的强度是单选列表, 这里按用户要求做成拖拽条, 刻度与列表同档.
- SessionMeter 默认居中 (align), 可按 agentId 只看一个 Agent.

### 考虑过的其他做法

- 什么都不做 / 复用现有 TodoList: 最强理由是已有扁平清单能显示 todo_write. 否决: 不支持嵌套与折叠, 每次调用各画各的, 没有跨调用的累计状态, 也认不出 OMP 的增量操作.
- 计划走新的 plan 事件: 后端直接推完整计划最简单. 否决: 各家 Agent 都把计划放在工具调用里, 派生就能拿到, 不必让后端多发一种事件.
- 派生树继续用 SVG 连线 + 绝对定位卡片: 改动小, 连线可以画曲线. 否决: 用户要的是 "直接把元素显示出来", 绝对定位在窄屏没法换成竖排, 只能整体缩放或横滚.
- 悬浮面板用 portal 到 body 的 fixed 定位: 不受容器限制. 否决: 文档舞台和嵌入场景里会盖住整页; 放在 Conversation 的 overlay 里能用 --hx-footer-h 避开输入区.
- 推理强度用单选列表 (T3 原样): 键盘与读屏最直接. 否决: 用户明确要拖拽条; Slider 本身也有 role=slider 与方向键.

### 影响与破坏性变化

- 待办工具视图 (todoView) 变成始终露在外面的计划卡 / 摘要行 (pinned), 不再进活动折叠; TodoList 仍导出.
- AgentGraph 的节点从绝对定位卡片变成 DOM 树, `GRAPH` 尺寸常量与 layoutAgentGraph 不再影响渲染; 节点多了 tok/s 与最新一步, 卡片高度变高.
- AgentGraph / AgentCardWall / AgentSwimlanes 新增 `messages` / `rates` 可选参数; SessionMeter 默认居中 (原来靠左), 新增 `agentId` / `align`.
- ToolCallData 新增 `meter`; usage-delta 新增 `callId`; tool-child 里的输出增量不再算进任何消息的 meter (原来也没算), 会话总速率现在包含它们.
- AgentThread 文案 "轨迹" 改为 "会话", 新增 `variant` / `onExpand`; Conversation 新增 `overlay`.

## 第四轮 (2026-11-28): Codex 式模型 / 推理强度, 计划去重, 上下文检视器 (dsh-context), 停靠对齐

### 参考

- Codex (github.com/openai/codex, commit 18c09f2), 路径相对 `codex-rs/tui/src/`:
  `chatwidget/model_popups.rs` (open_model_popup "Select Model and Effort" -> 选中模型后 open_reasoning_popup "Select Reasoning Level for X": 模型与强度是两步, 强度列表只列该模型 preset 声明的档位, 标 default / current),
  `chatwidget/reasoning_shortcuts.rs` (Alt+, / Alt+. 在输入框直接降 / 升一档, 不开弹窗; 只走当前模型声明的档位, 当前值不在里面先落到默认档, 到头给一句提示),
  `keymap.rs` (decrease_reasoning_effort / increase_reasoning_effort 可改键), `chatwidget/status_controls.rs` + 快照 `chatwidget/snapshots/*status_line_model_with_reasoning*footer.snap`
  (输入框下方状态行是 `gpt-5.4 xhigh fast · Context 100% left`: 模型名旁直接写强度, 强度是独立设置而不是藏在菜单里).
  Codex 的 IDE 扩展 / 桌面 App 不开源, 没找到可核实的源码或官方截图, 未作为依据.
- dsh-context (github.com/bowenliang123/dsh-context, commit f9962ad, DSH 社区上下文洞察插件), 路径相对 `src/`:
  `shared/categories.ts` (七类: system / tools / user / inject / skill / assistant / tool; officialParts: 系统提示与工具定义取官方 contextBreakdown, 消息部分按估算比例分摊官方 messageTokens;
  anchoredParts 把估算锚到服务商报告的总数), `client/reserve.ts` (压缩线 = min(窗口 × 0.8, 窗口 - 输出预留 - 64k), 条末两段斜纹 = 压缩余量与输出预留),
  `shared/types.ts` (RequestRecord: 每次请求一份构成; ContextEventRecord: compaction / prune / inject / model / agent ...; HeaderTool: 每个工具定义的大小与来源),
  `client/components/currentComposition.tsx` + `stackedBar.tsx` (当前上下文卡: 总数 / 窗口 / 百分比 + 六色堆叠条 + 图例), `timelineChart.tsx` (每次请求一根堆叠柱, Total / Delta, 事件旗标),
  `events.tsx` (上下文事件: 来源与净变化, 压缩显示回收量), `fleetView.tsx` / `agentGraph.tsx` (每个 Agent 一张卡: 实时上下文大小与占用, 构成条).
  核心思想: 上下文占用不只是一个百分比, 要能回答 "装了什么 (构成)、谁最大、什么时候为什么变了 (注入 / 大块工具结果 / 压缩)、多 Agent 各自多满"; 报告值与估算值分开标.

### 落地

- 模型与强度分开 (Codex): AgentModelPicker 放到 PromptInput 的 status (控件栏右边, 发送键左侧), 菜单只选客户端和模型 (去掉强度栏, 底部一行提示快捷键);
  新组件 EffortControl 放在 toolbar (控件栏左边): 一档一段的短条 + 拇指 + 档名, 拖动 (指针捕获) / 点段 / 方向键, Alt+, / Alt+. (stepEffort, 只走模型声明的档位),
  改动时冒气泡 "高 · 复杂改动, 多想几步"; 模型不能调推理 (levels 为空) 时不画; 手机 compact 去掉 "推理" 字样. EffortSlider 保留为带刻度的大号条, 单独用. EFFORT_HINT 挪到 model/models.ts.
- 计划去重: AgentProvider 新增 planCalls (默认 "line"): 对话里的待办调用只是一行很淡的变更摘要 "更新计划 · 完成 X · 3/9" (第一步 "列出 N 项"), 不可展开; 完整计划只在 PlanPanel.
  "card" 是没放 PlanPanel 时的回退 (原来的实时计划卡 + 更早几步可展开).
- 上下文检视器: 数据层 `model/context.ts` (contextBreakdown / contextTimeline / contextEvents), 事件 `context` (系统提示 / 工具定义 + 各工具大小 / 注入来源 / 会话前历史 / 窗口 / 压缩线 / 输出预留),
  `compaction` (前后 token, 画 compaction 提示并记采样), tool-result 的 `tokens`; reducer 在每次 usage 报 contextTokens 时记 message.contextSamples (含 cached).
  组件 `context-view.tsx` 的 AgentContextView: 概览 (总数 / 窗口 / 状态徽章, 构成条按模型读到的先后从左到右, 压缩线 1px 竖线, 输出预留斜纹, 下沿缓存命中段, 图例悬停点亮),
  各 Agent (每个 Agent 一行占用条, 点了切过去), 最大的几项 (估算值标 ~), 上下文事件 (最新在上: 注入, ≥2k 的工具结果, 接近 / 越过压缩线, 压缩回收), 演变 (每次请求一根柱, 缓存 / 新增两段, 压缩后换色, 最后一根虚框是此刻估算).
  会话页顶栏加 "上下文" 视图, SessionMeter 新增 onOpenContext: 上下文弹层里出小构成条与 "查看上下文构成". 演示剧本改成续上的长会话, 后段越过 160k 压缩线并压缩到 4.3 万.
  与 dsh-context 的差别: 不做跨会话总览 / 文件活动 / 命令执行 (那是宿主侧日志), 也不按服务商 messageTokens 比例分摊; 总数取 max(报告, 估算), 报告更大时差额单列 "未细分", 生成中估算先涨, 回放时实时可见.
- 停靠对齐: 编排面板停在侧边时, 输入区 (计划条 + 输入框 + 用量条) 与对话内容用同一套 max-w / 右侧留白, 面板改为整列高度 (不再停在输入区上方).
- 手机 "回到最新": Conversation 是尺寸容器, 窄于 40rem 时收成右下角 32px 圆形图标按钮, 不再横在卡片文字中间.

### 考虑过的其他做法

- 什么都不做 / 复用现有 (强度留在模型菜单的右栏): 最强理由是 T3 就这么做, 一个弹层管完. 否决: 用户要强度单独、不进悬浮菜单; Codex 的经验是强度是高频微调, 应该一步就能改 (快捷键 + 状态行可见).
- 强度做成触发器上的下拉 (Codex TUI 的第二步弹窗): 键盘友好. 否决: 仍是弹出再选, 用户要直接拖.
- 对话里的待办调用完全不显示: 最干净. 否决: 失去 "计划在什么时候变了" 的时间线位置; 一行很淡的变更摘要成本很低.
- 上下文构成由后端整份推 (每次请求一份 RequestRecord, dsh-context 的做法): 最准. 否决: 要求宿主多做一层投影; 前端从消息推得出对话部分, 后端只需报固定开销 (context 事件) 与可选的 tool-result.tokens.
- 演变图按类别堆叠 (dsh-context 的时间线): 信息更多. 否决: 需要每次请求的完整构成快照 (本库只采样总数与缓存); 先画总数 + 缓存段, 构成看概览.

### 影响与破坏性变化

- AgentModelPicker 不再含推理强度栏 (强度改由 EffortControl 调), 默认 align 从 start 改 end, 新增 compact; 选中模型后弹层关闭.
- 对话里的待办调用默认不再画整张计划卡 (要旧行为传 planCalls="card").
- AgentMessage 新增 context / contextSamples; notice part 新增 compaction; ToolCallData 新增 resultTokens; AgentEvent 新增 context / compaction, tool-result 新增 tokens.
- SessionMeter 新增 onOpenContext; Conversation 根元素成为 @container/conv, 窄容器里 "回到最新" 只剩图标.
- 新导出: EffortControl, EFFORT_HINT, stepEffort, AgentContextView, ContextBar, contextBreakdown / contextTimeline / contextEvents 及类型, PlanCallDisplay.

### 代码入口

- `src/agent/model/context.ts` + `src/agent/context-view.tsx`: 上下文检视器
- `src/agent/model-picker.tsx`: EffortControl, AgentModelPicker, EffortSlider; `src/agent/model/models.ts`: stepEffort, EFFORT_HINT
- `src/agent/plan.tsx`: TodoCallCard 的 PlanLine

## 第五轮 (2026-11-28): 上下文检视器加密度, Codex 输入栏, 子 Agent 尾部文字, 手机端操作 (DSH Go)

### 参考

- dsh-context (f9962ad) 的 README 截图 `docs/context-dashboard.png` / `context-timeline.png` / `context-overview.png` / `current-context.png` / `context-events.png` / `fleet-overview.png`
  与 `src/client/components/currentComposition.tsx`, `stackedBar.tsx`, `timelineChart.tsx`, `events.tsx`, `fleetView.tsx`: 一屏是 "一行总数 + 细构成条" 加若干紧凑表格,
  时间线每次请求一根 **按类别堆叠** 的柱 (不是总数一根), 左侧纵轴刻度, 压缩处旗标; 字 11-12px, 行高 ~22px, 面板 1px 边无大标题.
- Codex 桌面 App / IDE 扩展的输入栏 (闭源, 只能看图与文档):
  learn.chatgpt.com/images/codex/ide-review.webp (官方 IDE 扩展截图: 圆角框, 占位 "Ask for follow-up changes", 左下 "+" 与权限 "Custom ⌄", 右下上下文环, "5.6-Sol ⌄", 圆形发送; 框下 "Work locally ⌄"),
  openai.com "Introducing the Codex app" 的宣传图 (经 xairouter.com 转载的 app-screenshot-light: 框里 "+ · GPT-5.2-Codex Extra High ⌄ …… 🔒 🎤 ●", 框下 "Local ⌄ …… ⑂ main ◔ 50%"),
  reddit r/codex 用户截图 (App 的模型菜单: 顶层 "Reasoning" 档位列表带勾, 分隔线下当前模型名 "›" 子菜单),
  developers.openai.com/codex/models ("model and reasoning control beneath the composer"), /codex/permission-modes (权限控件在输入栏, Ask for approval / Approve for me / Full access),
  learn.chatgpt.com/docs/prompting 与多篇转述 (占位 "Ask Codex anything, @ to add files, / for commands"), learn.chatgpt.com/docs/integrated-terminal ("Local Worktree Cloud main").
  codex-rs/tui (18c09f2): `bottom_pane/snapshots/*chat_composer__tests__empty.snap` ("› Ask Codex to do anything", 右下 "100% context left"), `*footer_shortcuts_context_running.snap` ("72% context left"),
  `snapshots/codex_tui__status_indicator_widget__tests__renders_with_working_header.snap` ("• Working (0s • esc to interrupt)"), `*effort_status_line_transition_frames.snap` ("gpt-5.4 high · main": 模型名旁直接写强度),
  `*footer_mode_shortcut_overlay.snap` (⌥, / ⌥. 降 / 升推理, ⇧enter 换行).
- DSH Go (github.com/ccch1mneyyy/dsh-Go, 3b9fbbb, AGPL-3.0, 只学布局与交互): `app/lib/ui/chat/chat_header.dart` (顶栏没有色带, 只有浮动玻璃胶囊: ≡ · 标题胶囊第二行是状态点 + 一句话 · 模型胶囊 · 新对话),
  `agents/header_agents.dart` (子代理胶囊: 图标 + 数量, 有在跑的就呼吸; 子代理会话左键变 "‹ 上级对话"), `chat/composer.dart` (28 圆角胶囊, 两颗 36 圆键做端盖, 单行 48 高; 手机上打字时展开成两行, 模型胶囊在 + 旁),
  `chat/widgets/activity_strip.dart` (生成中输入条正上方一颗胶囊: 此刻在做什么 + 本轮用时, 点开本轮轨迹弹层), `chat/dock/todo_bar.dart` + `dock_stack.dart` (输入条上方的待办条, 原地展开, 多条叠成卡组),
  `chat/widgets/approval_card.dart` (拒绝 / 允许本次 两个等宽键, 主色只给允许, "本对话都允许" 降成文字键防误触), `chat/model_sheet.dart` / `usage_sheet.dart` / `trajectory_sheet.dart` (模型, 用量, 轨迹都是底部弹层),
  `shell/drawer_drag.dart` (从左右滑拉抽屉: 先看位移方向再认领, 竖向一律让给列表), `chat/widgets/message_menu.dart` (长按气泡出菜单), `chat/chat_list.dart` (贴底跟随, 上翻不打扰, 回到底部是玻璃圆键);
  截图 `docs/assets/hero-zh-dark.webp`, `f-steer-zh-dark.webp`, `f-adaptive-zh-dark.webp`.

### 落地

- 上下文检视器重排 (AgentContextView): 概览压成一行 (总数 / 窗口 / 占比 / 状态 / 报告 · 估算 · 缓存 · 压缩线 · 预留 · 剩余) + 10px 构成条; 下面三列紧凑表格
  (构成: 每类 项数 · tokens · 占总量 (带底条) · 占窗口 · 报告 / 估算, 点一行展开该类最大的几项; 最大项: 前 12; 各 Agent + 事件), 最后是 "每次请求的构成" 堆叠柱图
  (纵轴 1/2/5 刻度, 压缩线虚线, ◆ 压缩旗标, 白线是缓存前缀, 柱宽按至少 48 个槽位排, 悬停一根在下方读出这次请求各类大小). 悬停的类别在构成条 / 表格 / 柱图里一起点亮.
  数据: ContextSample 新增 parts (采样时这条消息有几个部件), 新纯函数 contextSeries 按它切出 "那一刻" 的线程算构成并锚到报告值, 带缓存 (流式时只算新采样).
- Codex 输入栏: 新文件 `composer.tsx` (ComposerModelMenu, ComposerSelect, ComposerActivity, ComposerSheet), meter.tsx 新增 ContextLeft; PromptInput 改成 Codex 的样子
  (左下 "+" 代替回形针, 占位 "让 Agent 做任何事, @ 添加文件, / 使用命令", 28px 圆形发送键空时是灰底, 停止是实心方块, 14px 字, 20px 圆角), 新增 collapsible / busyPlaceholder.
  会话页: 框里 "+ · 权限 ⌄ …… 模型 强度 ⌄ · 发送", 框下 "运行位置 ⌄ …… ⑂ main · ◔ 剩余 34%", 生成中框上方 "• 工作中 (12 秒 · esc 中断) 运行 npm test  82 tok/s ›".
  EffortControl / AgentModelPicker / SessionMeter 仍导出, 会话页主输入栏不再用 (轨迹 / 上下文视图底部仍是 SessionMeter).
- 子 Agent 尾部: 新纯函数 agentTail (最后一个部件: 文字 / 思考的末尾, 正在跑的工具 "运行 npm test" + 输出末尾, 计划调用 "更新计划"; 派发子 Agent 的调用跳过) 与 toolLine;
  组件 TailText (两行贴底排, 新字从右下长出来, 截掉的是开头, 左上角盖省略号; 一行时靠右截开头). 编排框节点, 卡片墙, 切换器 (在跑的行) 都用它; latestOutput 改为基于 agentTail.
- 手机 (< 768px, 对照 DSH Go):

| 场景 | DSH Go 怎么操作 | 我们原来 | 改成 |
| --- | --- | --- | --- |
| 顶栏 | 浮动胶囊, 标题胶囊第二行是状态; 右边子代理胶囊 | 一条带边框的工具栏, 视图切换压成三个小图标 tab, 回放键挤在一起 | 浮动胶囊: 返回 / 标题 (第二行 "● 生成中 / 等你批准") / 子 Agent 胶囊 (数量 + 呼吸点); 视图与回放收进标题胶囊点开的弹层 |
| 输入栏 | 单行胶囊, 打字时展开两行, 模型在 + 旁; 安全区 | 常驻两行, 左边是强度拖条, 右边模型菜单, 下面一整行用量胶囊 | 空闲一行 (+ · 文字 · 发送/停止, 36px 圆键), 聚焦展开: 模型 强度 · 权限 (图标) …… 上下文环; 底部让出 safe-area |
| 生成中 | 输入条上方活动胶囊, 点开轨迹弹层 | 没有 (只有消息里的计时) | ComposerActivity, 点开 "本轮轨迹" 底部弹层 |
| 选模型 / 权限 / 用量 | 都是底部弹层, 选项 44px 行, 思考深度是分段胶囊 | 悬浮弹层 (手机上靠近顶部, 拇指够不着) | ComposerSheet 底部弹层: 推理是分段按钮 + 一句说明, 模型按客户端分组的 44px 行; 用量弹层里 "查看上下文构成" |
| 子 Agent | 顶栏胶囊进列表, 子会话左上 "‹ 上级对话" | 顶栏切换器弹层 + 全屏抽屉 | 子 Agent 弹层 (每行 56px, 在跑的显示实时尾部); 点节点是 88dvh 底部弹层, 下拉关闭; 整页会话左上 ‹ 返回, 从左边缘右滑返回 |
| 审批 | 拒绝 / 允许本次 等宽两键, 更宽的授权是文字键 | 三个 sm 按钮挤在一行右侧 | 容器窄于 28rem 时: 命令单独一块, 拒绝 / 允许 两个 40px 等宽键, "总是允许" 降成下面一行文字键 |
| 消息操作 | 长按气泡出菜单 | 悬停才显示, 触屏上看不到 | 触屏上助手消息的操作条常显, 用户气泡长按 450ms 露出 (复制 / 编辑) |
| 回到最新 | 玻璃圆键 | 已是右下 32px 圆键 (上一轮) | 保留 |

### 考虑过的其他做法

- 什么都不做 / 复用上一轮: 最强理由是上一轮的上下文页信息是全的, 输入栏的强度拖条也是用户要过的. 否决: 用户明确指出密度不够、输入栏要和 Codex 一样; 上一轮的演变图只有总数, 看不出每次请求装了什么.
- 演变图让后端每次请求推一份完整构成 (dsh-context 的 RequestRecord): 最准. 否决: 宿主要多做投影; 采样时记部件数, 前端切线程就能算, 精度与对话部分的估算一致.
- 手机上模型 / 权限继续用悬浮菜单: 少一套组件. 否决: 菜单从底部输入栏向上弹, 在手机上大半屏被遮, 选项行太矮; 底部弹层拇指可达, 还能下拉关闭.
- 尾部文字用 CSS `direction: rtl` 截开头: 不用测量. 否决: 中英混排和标点会被重排, 两行时也做不到.
- 手机顶栏保留 tab: 一步切换. 否决: 三个 tab 占掉标题位置, 轨迹与上下文在手机上从活动条 / 上下文环进入更顺手, 顶栏只留身份与状态.

### 影响与破坏性变化

- PromptInput: 附件键图标改 "+" (读屏名 "添加文件等"), 发送 / 停止键 28px (collapsible 时 36px), 默认占位文字变了, 生成中占位换成 busyPlaceholder, 字号 15px → 14px, 圆角 1rem → 1.25rem.
- ApprovalBar 是尺寸容器 (@container/approval), 窄时换成大键布局并多一个 "总是允许" 文字键.
- latestOutput 的内容变了: 现在取最后一个部件 (含思考与运行中的工具, 带 "运行 xxx · " 前缀), 不再跳回更早的文字.
- AgentContextView 版式整体改为紧凑表格; ContextBar md 的缓存段从下沿标注改成 1px 线; 演变图改为按类别堆叠.
- 触屏上助手消息操作条常显.
- 新导出: ComposerModelMenu, ComposerSelect, ComposerActivity, ComposerSheet, ContextLeft, TailText, agentTail, toolLine, contextSeries 及类型.

### 代码入口

- `src/agent/composer.tsx`, `src/agent/meter.tsx` (ContextLeft), `src/agent/prompt-input.tsx`: Codex 输入栏
- `src/agent/model/context.ts` (contextSeries) + `src/agent/context-view.tsx`: 上下文检视器
- `src/agent/model/agents.ts` (agentTail, toolLine) + `src/agent/orchestra/shared.tsx` (TailText): 子 Agent 尾部
- `site/src/docs/entries/agent/conversation-page.tsx`: 会话页的桌面 / 手机布局

## 第六轮 (2026-11-28): 渐变推理强度条, 底栏找回 DSH 实时指标, 手机计划行 / 节点 / 轨迹

### 参考

- 用户给的截图 (卡片: "模型 …… DeepSeek V4 ›" / "推理强度 …… 最高" / 粗胶囊渐变轨道 淡紫蓝 → 蓝 → 紫, 每档小白点, 白色大圆滑块, 下方 低 中 高 最高, 当前档强调色;
  标题 "强度跟档位走: 越高越亮、越鲜艳、越快").
- DSH Go (ccch1mneyyy/dsh-Go, 1.4.1 / 3b9fbbb, 本机 /tmp/dsh-go 与 GitHub main 一致) `app/lib/ui/chat/model_sheet.dart`: 强度在这一版是 `SegmentedPill<String>` (40 高的分段胶囊,
  一个滑块在段间滑动), 只列 `selected.efforts` (少于 2 档整节淡出再折叠, 先淡后收高度, 下面不跳); `effortLabel` 把协议词 off / minimal / low / medium / high / xhigh / max 翻成中文;
  换模型时强度保留原值 (新模型支持) 否则 `startingEffort`; 选完强度后等滑块落定 (`AppMotion.standard + 120ms`, 减弱动效时 0) 自动关弹层; `ComposerModelPill` 在胶囊上写 "模型名 强度".
  **源码里没有渐变条**: 截图里的渐变轨道不在 1.4.1 也不在 GitHub main, 这一版的视觉照用户截图做, 交互 (只列模型声明的档 / 吸附 / 落定) 取 model_sheet.dart.
- DSH (deepseek-harness, 4b399c39) `packages/client/ui-model-selection/src/client/ModelSelect.tsx`: 菜单根是 "Model / Effort 两行 (标签 + 当前值 + 右箭头)", 进去是 drilled pane, Esc / Shift+Tab 先退一层. 卡片的两行结构取这里.
- DSH `packages/client/ui-chat/src/client/chat/StatsPills.tsx` (轮次 · 步数 · tok/s, 总 token · 命中率) 与 `ui-conversation/src/client/skeleton/ContextMeter.tsx`: 输入框下方的实时指标.

### 落地

- **EffortTrack** (新文件 `src/agent/effort-track.tsx`): 渐变档位条. 轨道 = `.hx-effort-fill` (color-mix 混 --info / --background / --brand / --chart-4, 无裸色值) + 流光 `.hx-effort-sheen`
  (一条 --brand-foreground 半透明光带, 只做 translateX); 每档的 saturate / brightness / opacity 与流光一趟的时长由纯函数 `effortIntensity(i, n)` 给 (低 0.5 / 0.92 / 0.6 / 3.6s → 最高 1.3 / 1.12 / 1 / 1.1s),
  filter / opacity 300ms 过渡. 滑块挂在与内轨同宽的移动层上, 进度用 translateX 百分比 (不动 left); 拖动时跟手 (`effortFractionAt`), 松开吸附 (`effortIndexAt`), 点轨道 / 档名跳到最近一档.
  键盘按 WAI-ARIA slider (`effortKey`: ← ↓ PageDown 降, → ↑ PageUp 升, Home / End), role=slider, aria-valuetext 是档名. 减弱动效: 流光不渲染, 滑块 / 滤镜直接到位.
- **ComposerModelMenu**: 触发器不变 (Codex 的 "hx-opus 高 ⌄"); 菜单改成卡片: 第一行 "模型 …… [图标] hx-opus ›" 是子菜单 (手机是弹层里进模型列表, 带 "‹ 返回"), 下面 "推理强度 …… 高" + EffortTrack,
  替换原来顶层的档位文字列表. 桌面菜单里滑块本身是一个 Radix 菜单项 (asChild, role 换成 slider, onSelect preventDefault 留住菜单): 上下键能走到它, ← → 在滑块里换档. Alt+, / Alt+. 仍有效.
  没跟 DSH Go 自动关弹层: 渐变条要拖, 拖到一半关掉会误选; 关弹层仍是下拉 / 关闭键 / Esc.
- **ComposerMeters** (meter.tsx): 输入框下那一行回到 "Codex 元素 + DSH 指标": `本地 ⌄ · ⑂ main …… [⏲ 82 tok/s · 3 路 · 16.7万 tokens · 命中 95% · 本轮 19 秒 · $0.42] · ◔ 剩余 34%`.
  数字等宽 + 最小宽度右对齐 (tok/s 3ch, token 5ch, 命中 2ch, 用时 4ch, 费用 5ch), 跳动时不变宽; 整行一个按钮, 点开是用量明细 (UsageDetails, 与上下文余量的明细同一份).
  手机 (compact): `⏲ 82 tok/s · 命中 95% …… ◔ 66%`, 路数 / token / 用时 / 费用进用量弹层; 输入条收成一行时这一行也在.
- **状态条与底栏分工**: 生成中框上方的 ComposerActivity 只说 "在做什么 + 本轮走了几秒 (+ esc 中断)", 不再带 tok/s; 速率 / token / 命中 / 费用只在底栏. 生成中底栏关掉 "本轮用时" (turnTime=false),
  因为状态条已经在走秒, 结束后状态条消失, 底栏的 "本轮 19 秒" 回来. 同一个数任何时刻只出现一次.
- **命中率不再跳**: 原因是剧本 (以及按 DSH 每步报快照的宿主) 每次 usage 都覆盖 `cachedInputTokens`, 但 `inputTokens` 还是更早一次的值, 命中 = 新的命中 / 旧的提示, 在 90% 与 100%+ 之间跳.
  usage 事件新增 `scope: "request"`: 一次请求自己的用量, 记进 `message.request` (本次请求) 并累加进 `message.usage` (累计; 没给 inputTokens 时按 contextTokens 算, 命中夹在提示侧以内), `message.requests` 计次数.
  默认 scope "total" 行为不变. 底栏读累计; 悬停 title 与明细里同时给 "缓存命中 · 累计" 与 "缓存命中 · 本次请求" (sessionUsage().lastRequest, 主线程的请求优先). 剧本的 usage 全改成 request, 编排者结束时不再报一份对不上的累计.
- **planCalls="hidden"** (新默认): 计划更新不进对话, AgentParts 在分段前滤掉 (纯函数 `isRepeatPlanCall(index, callId)`), 每份计划只留第一次列出的一行 "列出计划 · 9 项"; "line" / "card" 保留可选.
- **手机编排框节点**: `.hx-otree-card` 改成 grid; 窄容器 (< 34rem) 压成两行 "● 名字 …… 时长 / 尾部一行 …… ⏲ 82 tok/s", 去掉模型 · 状态徽章行和 token 数, 上下内边距 4px.
- **轨迹弹层**: AgentTrajectory 新增 `layout` ("auto" 默认, 窄于 600px 自动用 list; "table" / "list"). list 是单列卡片式行: 序号 · 类型标签 · 名称 · 状态 …… 时长 / 一行摘要 …… 入 / 出 / 思 token 小字;
  轮次头只留 "第 N 轮 · 用时 …… 费用". 手机的 "本轮轨迹" 弹层用 list.

### 考虑过的其他做法

- 渐变条直接改 EffortSlider / EffortControl (第四轮的): 少一个组件. 否决: 那两个是 "输入框里的短条" 与 "设置页的 Slider", 尺寸与交互都不同; 新组件要能当菜单项 (asChild), 单独做更干净, 旧的仍导出.
- 渐变色写死 (截图里的 #b9a7ff → #3b82f6 → #a855f7): 最像截图. 否决: 违反只用语义 token; 换主题 (emerald / rose) 时跟着 --brand 走更对, 亮暗下也都成立.
- 拖动时用 left 定位滑块: 写法最直白. 否决: 动效只动 transform; 移动层 translateX(百分比) 同样不用量宽度.
- 命中率在组件里做平滑 (指数滑动平均): 不用改事件. 否决: 那是掩盖数据不一致, 累计值本来就该是 Σ命中 / Σ提示; 本次请求的命中另外给出来更有用.
- 计划行在 card 模式里也藏: 否决: card 是没放 PlanPanel 时的回退, 藏了就没地方看计划.
- 轨迹在手机上保留表格横向滚动: 否决: 390 宽下说明列只剩几个字, 时长和计时条都要横滑才看得到.

### 影响与破坏性变化

- `AgentProvider.planCalls` 默认从 "line" 改成 "hidden"; `PlanCallDisplay` 多了 "hidden". 想要每次一行的宿主显式传 "line".
- PlanLine 第一次列出时文案是 "列出计划 · N 项" (原来 "更新计划 · 列出 N 项").
- ComposerModelMenu 的菜单结构变了 (卡片 + 渐变条, 不再有 menuitemradio 档位项); 依赖菜单里 "推理" 档位项的测试 / 脚本要改成操作 role=slider.
- ComposerActivity 的 meta 仍可用, 会话页不再传速率.
- 新增: usage 事件 `scope`, AgentMessage `request` / `requests`, SessionUsage `lastRequest` / `requests`, `requestUsage` / `addRequestUsage`, `isRepeatPlanCall`,
  `effortKey` / `effortIndexAt` / `effortFractionAt` / `effortIntensity`, 组件 `EffortTrack`, `ComposerMeters`, AgentTrajectory `layout`.
- 节点卡片在窄容器里不再显示模型 / 状态徽章 / token 数 (状态看状态点与卡片边框).

### 代码入口

- `src/agent/effort-track.tsx` + `src/agent/model/models.ts` (effortKey 等) + `agent.css` (.hx-effort-*): 渐变档位条
- `src/agent/composer.tsx` (ComposerModelMenu): 卡片式模型菜单 / 弹层
- `src/agent/meter.tsx` (ComposerMeters, UsageDetails) + `src/agent/model/usage.ts` / `events.ts` (scope request): 底栏指标与命中率
- `src/agent/agent-parts.tsx` + `src/agent/model/plan-index.ts` (isRepeatPlanCall): planCalls hidden
- `src/agent/orchestra/agent-graph.tsx` + `agent.css` (.hx-otree-card grid): 紧凑节点; `src/agent/trajectory.tsx` (layout list): 手机轨迹
