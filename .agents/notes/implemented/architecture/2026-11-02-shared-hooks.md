# Agent Note: 共享 hooks 层 (src/hooks)

Status: implemented

Decision-ID: shared-hooks

## Code

- `src/hooks/index.ts`
- `src/hooks/state/useControllableState.ts`
- `src/hooks/dom/useEventListener.ts`
- `src/hooks/browser/useLocalStorage.ts`
- `src/hooks/browser/media/useMediaQuery.ts`
- `src/hooks/input/useHotkeys.ts`
- `src/constants/hooks.ts`

## Problem

组件内部各自重复实现同一类小逻辑: 受控与非受控状态切换, window 与 document 上的事件订阅与解绑 (blueprint 的 ContextMenu, use-canvas-escape, use-shortcuts, flow-shortcuts 各写一遍 keydown 订阅), 点击外部关闭 (ContextMenu 手写 mousedown 判定), 媒体查询与减弱动效 (ripple, motion 各读一次 matchMedia). 每份实现的 SSR 判断, 依赖数组与清理方式都不一样, 修一个漏洞要改多处.

## Decision

新增 `src/hooks/`, 按类别分子目录, 每个 hook 一个文件, `src/hooks/index.ts` 逐个写名导出全部 hook 与类型:

- `state/`: useControllableState (字段对标 Mantine useUncontrolled: value / defaultValue / finalValue / onChange, 返回 [value, setValue, controlled]), useDisclosure, useDebouncedValue, useEventCallback (usehooks-ts).
- `dom/`: useMergeRefs (附 mergeRefs / assignRef), useResizeObserver, useEventListener (usehooks-ts 的重载: window / 元素 / document / MediaQueryList), useClickOutside (Mantine).
- `browser/`: useLocalStorage (usehooks-ts 签名, 同标签页用自定义事件同步), useClipboard, useIntersection, useIsomorphicLayoutEffect; `browser/media/`: useMediaQuery, useBreakpoint, useReducedMotion. browser 共 7 个 hook, 超过每目录 6 个文件的门禁, 媒体查询三件拆进 media 子目录.
- `input/`: useHotkeys (Mantine 签名, 附 getHotkeyHandler / parseHotkey / matchHotkey).

签名与 Mantine hooks 及 usehooks-ts 保持一致; 不引新依赖. hooks 用到的事件名, 媒体查询, 断点档, 快捷键修饰键与 SSR / 函数判据全部放在 `src/constants/hooks.ts`, 文件内不写会触发 PROJECT-CONST-DUP 的字面量. 回调类入参经 useEventCallback 保持最新, 不进依赖数组, 避免重复绑定. 本次不改 `src/index.ts` 的公共入口 (由集成分片接入), 也不改动既有组件的实现.

## Alternatives considered

- 什么都不做 / 复用现有: 不新增文件最省事, 但重复实现继续扩散, 每处 SSR 判断与清理方式各不相同, 新组件只能再抄一份
- 引入 @mantine/hooks 或 usehooks-ts: API 现成且经过验证, 但新增直接依赖要过 HC-DEPS 审批, 且只用到其中一小部分, 版本升级节奏也不受控
- 引入 ahooks 或 lodash: 体积大, 签名风格与 Mantine 不一致, 任务明确禁止
- 全部 hook 放在一个 hooks.ts: 文件少, 但会超过 300 行门禁, 也无法按类别查找

## Consequences

组件可以直接复用一套 SSR 安全且依赖数组正确的 hooks; 代价是多一层目录, 以及 hooks 与常量之间的一次 import. 既有组件迁移到这些 hooks 另行处理, 迁移时每个组件的行为需单独回归.
