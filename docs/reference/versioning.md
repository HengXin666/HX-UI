# 版本与破坏性变更策略

本文规定 `@hx/ui` 的版本号怎么动, 破坏性变更怎么发, 废弃怎么走完流程, 以及这些规则和现有 API 快照门禁怎么配合. 每个版本的具体变化记在仓库根的 `CHANGELOG.md`.

## 一. 语义化版本

版本号形如 `MAJOR.MINOR.PATCH`, 遵循 [semver 2.0.0](https://semver.org/lang/zh-CN/).

| 位 | 1.0 之后的含义 | 0.x 期间的含义 |
|---|---|---|
| MAJOR | 有破坏性变更 | 固定为 0 |
| MINOR | 新增功能, 向后兼容 | 新增功能, **允许**破坏性变更 |
| PATCH | 只修缺陷, 向后兼容 | 只修缺陷, 或只新增不删除的公共符号 |

"公共 API" 指以下全部内容, 任何一项的不兼容变化都算破坏性:

- `src/index.ts` 展开后的公共符号表 (即 `scripts/gates/baselines/api-surface.txt` 的内容): 名字的删除, 改名, 类型收窄, 必填 prop 新增.
- `package.json` 的 `exports` 子路径与样式入口 (`styles.css`, `tokens.css`, `motion.css` 等).
- CSS 变量名与令牌名 (`--shadow-*`, `--surface-*`, `--duration-*` 等), 以及使用方可能覆盖的类名钩子.
- peer 依赖的新增或大版本提升.
- 默认变体的渲染结果 (DOM 结构, 默认类名). 只改观感数值 (颜色, 阴影深浅) 不算破坏, 但要在 Changed 里写明.

不算公共 API: 文档站 (`docs/`) 的页面与路由, `scripts/` 门禁, 未从入口导出的内部模块.

## 二. 0.x 期间的规则

1. minor 可以破坏, 但该版本在 `CHANGELOG.md` 里必须有 `### Migration` 段, 逐条写出 "旧写法 -> 新写法".
2. 有对应 codemod 时, Migration 段写出 codemod 的命令; 没有时写明 "需手工迁移" 及原因.
3. 能先废弃再删除的变更, 不直接删除: 先发一个带 `deprecate()` 警告的 minor, 再在之后的 minor 里删除 (见第三节).
4. 一个 minor 只做一组相关的破坏, 不要把无关破坏搭车塞进同一版本.
5. patch 不得有任何破坏, 也不得删除公共符号.
6. 进入 1.0 的前提: P3 阶段完成, 所有现存废弃项已经删除或撤销, codemods 覆盖 0.x 的每个破坏性变更.

## 三. 废弃 (deprecation) 流程

废弃项至少保留一个 minor 才能删除. 以 0.6 废弃为例:

| 版本 | 状态 | 要做的事 |
|---|---|---|
| 0.6.0 | 废弃 | 旧 API 保持可用; 调用处加 `deprecate()`; JSDoc 加 `@deprecated`; CHANGELOG 的 Deprecated 段登记 |
| 0.7.x | 仍可用 | 继续警告, 不得删除 |
| 0.8.0 起 | 可删除 | 删除旧 API; CHANGELOG 的 Removed 段与 Migration 段登记; 提供 codemod 或手工迁移说明 |

也就是说, "在 0.N 废弃" 意味着最早在 0.(N+2) 删除. 每个废弃项都要有:

- JSDoc 的 `@deprecated` 标签, 写清替代品和计划删除的版本.
- 运行时的 `deprecate()` 调用 (只在开发环境发声).
- CHANGELOG 的 Deprecated 条目.

### deprecate() 的用法

工具函数在 `src/primitives/deprecate.ts`. 规则:

- 开发环境 (`process.env.NODE_ENV !== "production"`) 下调用 `console.warn`, 消息统一前缀 `[@hx/ui]`.
- 同一个 `id` 在一个页面生命周期里只警告一次, 避免组件每次渲染刷屏.
- 生产环境静默. 使用方的打包器把 `process.env.NODE_ENV` 替换成 `"production"` 后, 警告分支整体可被摇树删除.
- `id` 的命名: `<模块>.<符号>[.<prop>]`, 例如 `card.Card.shadow`, `motion.FadeSwap`.

```ts
import { deprecate } from "../primitives/deprecate";

export function Card(props: CardProps) {
	if (props.shadow !== undefined) {
		deprecate({
			id: "card.Card.shadow",
			message: "Card 的 shadow prop 已废弃",
			replacement: "variant=\"elevated\"",
			removeIn: "0.8.0",
		});
	}
	return null;
}
```

在 React 组件里调用时直接放在渲染函数中即可, "只警告一次" 由函数自己保证, 不需要包 `useEffect`.

## 四. codemods 目录约定

codemods 放在仓库根的 `codemods/`, 按目标版本分子目录. 目录由 P3-08 正式落地, 在那之前出现的破坏性变更也按这里的约定命名.

```text
codemods/
  README.md                    总说明, 列出全部 codemod 与对应版本
  AGENTS.md                    与 README.md 互相引用 (HC-CONTEXT 要求)
  0.6/
    rename-fade-swap.ts        一个破坏性变更一个文件
    rename-fade-swap.test.ts   同名测试, 输入输出夹具内联
  0.7/
    ...
```

- 子目录名是引入破坏的 minor 版本号 `0.N`, 不带 `v` 前缀, 不带日期.
- 文件名小写 kebab, 用 "动词-对象" 描述变化: `rename-<旧名>`, `remove-<prop>`, `move-<符号>-import`.
- 只用 TypeScript compiler API 实现, 不引入 jscodeshift 等新依赖.
- 每个 codemod 必须幂等: 对已迁移的代码再跑一次不产生变化.
- 运行方式统一为 `node codemods/0.6/<name>.ts <glob>`, 并写进该版本 CHANGELOG 的 Migration 段.
- 无法安全自动改写的情形 (动态 prop, 展开运算) 只打印位置, 不猜测.

## 五. 与 API 快照门禁的关系

仓库已有两道门禁守住公共 API:

- `scripts/check-api-snapshot.mjs`: 从 `src/index.ts` 展开出排序后的符号表, 与 `scripts/gates/baselines/api-surface.txt` 比对. 入口禁止 `export *`.
- `scripts/check-api-version.mjs`: 把快照的哈希与 `package.json` 的 `version` 一起记在 `scripts/gates/baselines/api-surface.version`. 哈希变了但版本没变时, `--update` 拒绝写入.

两者合起来的规则是: **快照变了就必须动版本号**. 本文在此之上再加三条:

1. 快照里只有新增行: 至少升 patch; 新增的是一组新功能时升 minor.
2. 快照里有删除行或改名: 0.x 期间升 minor, 并在 CHANGELOG 写 Migration 段; 删除的符号必须已经走完第三节的废弃周期, 除非 Migration 段写明为什么不能先废弃.
3. 动版本号的同一个提交里, `CHANGELOG.md` 必须把 `[Unreleased]` 的内容移到新版本标题下.

正确的顺序:

```sh
node scripts/check-api-snapshot.mjs --update
# 改 package.json 的 version
node scripts/check-api-version.mjs --update
# 把 CHANGELOG 的 Unreleased 移到新版本下
npm run verify
```

`src/index.ts`, `package.json`, `api-surface.txt`, `api-surface.version` 都是共享入口, 只由各阶段的集成任务 (P0-Z, P1-Z, ...) 修改. 并行任务只往 `CHANGELOG.md` 的 `[Unreleased]` 里追加条目, 不动版本号.

## 六. CHANGELOG 写法

- 格式遵循 Keep a Changelog, 段名固定为 Added / Changed / Deprecated / Removed / Fixed / Security, 外加本仓库的 Migration.
- 只写使用方能感知的变化; 门禁, 文档站, 重构不写, 除非影响安装或使用.
- 每条以符号名或组件名开头, 用反引号包住.
- 日期用 `YYYY-MM-DD`, 标题形如 `## [0.6.0] - 2026-11-10`.
- 新条目先进 `[Unreleased]`, 发版时整体下移.

## 七. 迁移模板: 0.5 -> 0.6

P0-Z 集成时把下面的模板复制进 `CHANGELOG.md` 的 `## [0.6.0]` 下, 逐项填写; 没有内容的小节删掉. 尖括号是待填内容.

```md
## [0.6.0] - <YYYY-MM-DD>

<一句话概括本版主题, 例如: 第零阶段基础设施, Provider / 国际化 / hooks / 子路径导出.>

### Added

- `HxProvider`: <作用>.
- `LocaleProvider`: <作用>.
- `@hx/ui/base.css`: <原 tokens.css 中的全局规则搬到这里, 可选引入>.
- `@hx/ui/<component>` 子路径: <列出或指向清单>.

### Changed

- 全部样式包进 `@layer hx.tokens / hx.base / hx.components`, 使用方未分层的样式默认胜出.

### Deprecated

- `<旧符号>`: 改用 `<新符号>`, 计划在 0.8.0 删除.

### Removed

- `<符号>`: <原因>. (必须已在 0.4 或更早废弃, 否则说明例外理由)

### Fixed

- <缺陷>.

### Migration

1. 全局样式
   - 旧: `import "@hx/ui/tokens.css";` 即带上 body / 滚动条 / 选区等全局规则.
   - 新: 需要这些全局规则时追加 `import "@hx/ui/base.css";`.
   - 自动化: 无, 需手工迁移 (只有使用方知道是否需要全局规则).
2. 样式优先级
   - 旧: 组件样式与使用方样式按选择器权重竞争.
   - 新: 组件样式位于 cascade layer 内, 使用方未分层样式总是胜出; 如有依赖旧优先级的覆盖, 请检查.
   - 自动化: 无.
3. Provider
   - 旧: <不需要包裹 / 原写法>.
   - 新: 在应用根部包 `<HxProvider>`; <不包时的行为>.
   - 自动化: `node codemods/0.6/<name>.ts "src/**/*.tsx"` (如提供).
4. <其他破坏项>
   - 旧: <代码>.
   - 新: <代码>.
   - 自动化: <codemod 命令或 "无">.

### Checklist (发版前自查, 发版后删除本小节)

- [ ] `package.json` 的 version 为 0.6.0.
- [ ] `node scripts/check-api-snapshot.mjs --update` 与 `node scripts/check-api-version.mjs --update` 已执行.
- [ ] 快照删除行都在 Removed 或 Migration 中有对应条目.
- [ ] 新增废弃都调用了 `deprecate()` 并带 `@deprecated` JSDoc.
- [ ] `[Unreleased]` 已清空.
```

## 八. 相关文件

- `CHANGELOG.md`: 版本历史.
- `src/primitives/deprecate.ts`: 运行时废弃警告.
- `scripts/check-api-snapshot.mjs`, `scripts/check-api-version.mjs`: 公共 API 门禁.
- `scripts/gates/baselines/api-surface.txt`, `scripts/gates/baselines/api-surface.version`: 快照与版本记录.
- `docs/reference/audit/ui-library-roadmap.md`: 各阶段的版本目标 (P0 -> 0.6.0, P1 -> 0.7.0, P3 -> 1.0.0-rc.0).
