# docs/architecture

本目录存放 HX-UI 的架构级规范: 跨组件, 长期有效, 新代码必须遵守的约定. 写作约束见同目录 [AGENTS.md](AGENTS.md).

## 索引

| 文档 | 内容 | 适用对象 |
|---|---|---|
| [component-contract.md](component-contract.md) | 组件契约: 统一 prop 词汇, 受控与非受控, asChild 与 render prop, classNames / styles 插槽与标准 slot 表, data-slot / data-state, ref 归属, 事件命名, 样式硬约束, 无障碍与键盘表, 文件切分与废弃流程, 存量组件待迁移清单 | 所有新组件与迁移中的存量组件 |

## 与其他文档的关系

- 调研与路线图 (为什么这样定) 在 `docs/reference/`, 本目录只写结论性的规则.
- 单次决策的来龙去脉写在 `.agents/notes/` 或 `docs/decisions/`, 本目录不记录过程.
- 质量门禁的规则与命令以 `docs/reference/quality/rules.md` 为准, 本目录引用而不复制.
