# Agent Note: docs-props 的输出与 node_modules 无关

Status: implemented

Decision-ID: docs-props-deterministic

## Code

- `scripts/docs-props.ts`

## Problem

pre-commit / pre-push 的 docs-props 在本机反复失败: 生成的 props.gen.json 与入库版本差在字面量联合的成员顺序
("vertical" | "horizontal" 与反过来) 和 Radix 一条 JSDoc ("so that that"). 根因有两个:
checker 的 `t.types` 按内部类型 id 排序, 字面量类型全程序共享, 谁先在某个 d.ts 里出现谁就排前面, 所以顺序随装的依赖变;
本机根目录 node_modules 比 package-lock.json 旧 129 个包 (Radix 1.1.x 对 lockfile 的 1.2.x), 第三方说明也就跟 CI 不一样.

## Decision

- 联合成员按源码书写顺序输出: 顺着属性声明的类型节点 (联合, 括号, 类型别名, T["k"], keyof typeof X, (typeof X)[keyof typeof X], (typeof A)[number], d.ts 里的 readonly 元组, cva 配置对象的键) 读出顺序; 读不出来的按字典序. 1470 个联合里约 1435 个按书写顺序.
- 生成前核对用到的第三方包: node_modules 版本与 package-lock.json 不一致就失败并提示 `npm ci`, 而不是给出一个看不出原因的 diff.
- 重新生成并提交 props.gen.json. `--check` 的比对方式不变 (逐字节).

## Alternatives considered

- 全部按字典序: 最简单, 但 "sm | md | lg" 会变成 "lg | md | sm", 文档变难读.
- 不收第三方 JSDoc: 否决, Radix 的属性说明是 Props 表里有用的部分.

## Consequences

同一份源码 + 同一份 lockfile 在任何机器上生成的 props.gen.json 逐字节相同; 依赖没装对时报的是依赖问题.
