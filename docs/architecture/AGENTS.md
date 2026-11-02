# docs/architecture Agent 指引

本目录的索引与概览见同目录 [README.md](README.md). 本文件只写在本目录写作时必须遵守的约束.

## 定位

- 只放架构级规范: 跨多个组件或多个目录, 新代码必须遵守, 长期有效的规则
- 一篇文档只讲一个主题, 不与 docs/reference (调研, 现状, 门禁规则) 和 .agents/notes (单次决策) 重复
- component-contract.md 是新组件的唯一契约来源, 其他文档需要组件约定时引用它的章节, 不另写一份

## 写作约束

- 文件名小写 kebab, 扩展名 md, 不带日期前缀, 不用 v2 / final / copy 等副本词 (HC-DOCNAME, HC-DOCS)
- 单篇不超过 1500 行 (HC-DOCSIZE); component-contract.md 保持在 150 到 900 行
- 正文中文, 标点只用 ASCII (逗号, 冒号, 括号, 引号), 不用全角标点与 emoji (HC-TEXT)
- 规则必须可执行: 写清 prop 名, 取值, DOM 部件, 代码片段或门禁规则 ID, 不写口号
- 用词: 必须 / 应当 / 可以 三级, 含义见 component-contract.md 开头
- 引用路径一律写仓库相对路径, 不写文件系统绝对路径
- 引用门禁时写规则 ID (例如 PROJECT-UI-LINE-1PX), 阈值以 docs/reference/quality/rules.md 为准

## 维护

- 新增文档时同一 diff 更新 README.md 索引
- 契约变更 (新增 slot, 改 prop 词汇, 改废弃期) 与对应代码迁移在同一 PR 说明; 删除或改名公开 slot 属于破坏性变更, 走契约第 10.5 节废弃流程
- 存量组件完成迁移后, 从 component-contract.md 第 11 节删除对应条目, 不保留已完成记录
- 只改文档时不碰 src 与 package.json
