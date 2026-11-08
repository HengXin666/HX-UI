# Agent Note: 组件文档页统一骨架与 Props 从类型抽取

Status: implemented

Decision-ID: docs-component-pages

## Code

- `scripts/docs-props.ts`

## Problem

文档站 138 个组件条目里只有 13 个是可调组件页, 其余 125 个仍是旧文档页套新页头. 旧页的属性表全是手写, 已经和源码对不上 (例如设置页模板的示例代码给 SettingRow 传 label, 实际属性是 title). 照 reactbits 的组件页把 125 页都做一遍, 手写 Props 表会再次漂移.

## Decision

- 组件页统一一个顺序: 页头, 预览 | 代码, 调参, 示例, Props (主件与各部件), 键盘与无障碍, 依赖, 相关组件, 上下页. 没有内容的段落不出. 三栏外壳与右栏 (安装, 本页目录) 保留.
- 三种组件页型共用 ComponentSpec: single (可调单件), composite (复合组件: Props 按部件分表, 必有键盘段), block (区块与模板: 宽舞台, 皮肤与密度写在舞台包裹层). 说明页 (安装, 令牌, 皮肤) 不套这个骨架.
- Props 的类型, 默认值与 JSDoc 由 `scripts/docs-props.ts` 用 TypeScript 编译器从源码抽成 `docs/face/docs/props/props.gen.json`. 只抽组件页声明的 importName 与 parts; 只收组件自己与它包装的无头库声明的属性, @types/react 的 DOM 属性不收; 字面量联合 (含起了别名的) 展开成字面量. 页面只补中文说明 (控件说明 > propDesc > JSDoc).
- 门禁 `docs-props` 跑 `--check`: 组件属性改了而 JSON 没重新生成即失败. 注册表因此多一条, 门禁指纹 (registry:gates, wiring:checkpoints) 随之有意更新, 这是加门禁不是放松.
- 挂在原有导航条目上的组件页 (PageSpec) 按 id 替换回退页, 名称, 说明与分组仍取导航. 旧 docs/src/pages 里的页面还被旧 App 引用, 本批不删.
- 预览台与示例卡标 data-demo, 右栏目录不收其中区块自带的 h2.

## Alternatives considered

- 什么都不做 / 每页手写 Props 表: 最强理由是零新脚本, 单页灵活. 否决: 138 张表必然与源码漂移, 旧页已经漂了.
- react-docgen-typescript: 现成, 但要新依赖, 且对 cva 变体与 Radix 透传的过滤要另写, 不比直接用编译器少.
- 抽 src/index.ts 的全部 400 多个组件: 一次到位, 但 JSON 近 500KB, 并且把文档门禁和与文档无关的组件绑在一起.

## Consequences

新增组件页只写控件, 示例与键盘行, Props 自动跟源码走. 代价: 改了文档页用到的组件属性要跑 `npm run docs:props`; 无头库属性的英文 JSDoc 需要在 propDesc 里补中文.
