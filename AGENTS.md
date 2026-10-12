# HX-UI Agent 指引

项目概览, 组件清单与开发命令见 README.md. 本文件只放 Agent 必须遵守的约束.

## 质量门禁

- 改动完成后运行 `npm run quality:done`: 对最终工作区 diff 做静态检查, 再执行一次受影响测试. 有新增 Error 不得宣称完成
- 规则, 命令与豁免见 docs/reference/quality/rules.md; 规则逐项裁决见 scripts/quality/coverage.json
- baseline (scripts/quality/baseline.json) 只记录安装门禁前的历史违规, 不得为了让检查通过而新增或改写条目

## 硬约束

- 同一字面量在代码中出现 3 次及以上, 提取到 src/constants/ (库与文档站) 或 scripts/constants/ (脚本工具) 后引用
- 禁止任何文件系统绝对路径写法, 包括以根路径开头的路径拼接; 使用仓库相对路径或运行时解析
- 组件颜色只来自语义 token, 线条只用 1px, 不写 transition-all, 原生 button 必须写 type
- 脚本只写 .ts, 由 Node 22.18+ 直接运行, 不新增 .js/.mjs/.cjs
- 组件视觉类名沿用上游 open-vetta, 不在门禁类改动中顺手修改组件视觉或行为
