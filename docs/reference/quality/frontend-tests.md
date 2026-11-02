# 组件单元与无障碍测试 (frontend 层)

组件级测试用 Vitest + happy-dom + Testing Library, 无障碍断言用 axe-core. 本文只讲怎么跑, 怎么加; 门禁整体见 rules.md.

## 文件

| 路径 | 内容 |
|---|---|
| `vitest.config.ts` | happy-dom 环境, tsx 自动 JSX 运行时, 别名 `@src` / `@tests` / `@hx/ui`, setup 文件, 只收 `tests/**/*.test.{ts,tsx}` |
| `tests/setup.ts` | 接入 `@testing-library/jest-dom/vitest`; 导出 `scanA11y` 并注册 `toHaveNoSeriousA11yViolations` (serious / critical 判失败, 关闭 color-contrast 与 landmark 类规则, happy-dom 无布局与配色); matchMedia, ResizeObserver, IntersectionObserver 与 Radix 用到的 Element API 在缺失时补齐; 每条用例后 `cleanup()` |
| `tests/components/*.test.tsx` | 每个组件一个文件, 首批: button, dialog, select, tabs, checkbox |

`scripts/tests/` 下的 node:test 用例不归 Vitest 管, 仍由 `scripts/quality/ci.json` 的 tests 注册表运行.

## 运行

```sh
npm run test:frontend          # 质量入口的 frontend 层, 等价于 vitest run
npx vitest run --reporter=dot  # 直接跑全部
npx vitest run tests/components/select.test.tsx   # 只跑一个文件
npx vitest                     # watch 模式
```

`npm run test:frontend` 调 `node scripts/quality/index.ts layer --name frontend`: 有 `node_modules/vitest` 时用当前 Node 执行 `vitest run` 并透传退出码; 没装依赖时打印 blocked 并以 1 退出.

依赖 (由集成任务写入 devDependencies): `vitest`, `happy-dom`, `@testing-library/react`, `@testing-library/dom`, `@testing-library/user-event`, `@testing-library/jest-dom`, `axe-core`.

## 加新测试

1. 新建 `tests/components/<组件名>.test.tsx`, 文件名与 `src/primitives/` 下的源文件同名
2. 从 `@src/primitives/<组件名>` 引单个组件, 不从 `@hx/ui` 引整库 (会拉起 monaco / xyflow 等可选 peer)
3. 每个组件至少覆盖四类用例:
   - 渲染: 用 role 与可访问名称查询 (`getByRole("tab", { name })`), 不用类名
   - 键盘: 按 WAI-ARIA APG 对应模式的键位, 用 `userEvent.setup()` 的 `user.keyboard` / `user.tab`
   - 受控与非受控各一条: 受控断言 "只通知回调, 父组件改值后才变", 非受控断言 `default*` 起步并自行更新
   - axe: `await expect(document.body).toHaveNoSeriousA11yViolations()`; 弹层类组件在打开态再扫一次, Portal 内容在 body 里
4. 断言带过渡的弹层消失用 `waitFor`, 不用固定延时
5. 新的环境缺口 (某个 DOM API 缺失) 补在 `tests/setup.ts`, 先判断缺失再补, 不覆盖 happy-dom 已有实现
