# Agent Note: 文档站窄屏抽屉的焦点归还进 e2e

Status: implemented

Decision-ID: docs-drawer-focus-e2e

## Code

- `scripts/e2e/drawer.ts`

## Problem

文档站窄屏抽屉由顶栏菜单键打开, 不是 SheetTrigger, 关上后焦点要靠 onCloseAutoFocus 交还菜单键. 这一点此前只在本地临时脚本里验过, 仓库里没有任何检查; 回退了也不会有门禁变红.

## Decision

`scripts/e2e/drawer.ts` 在 390 宽的真实浏览器里打开 #/install 的抽屉, 分别用 Esc 和点遮罩关闭 (抽屉不带关闭键, 点遮罩就是点关闭), 断言抽屉卸下且 document.activeElement 是菜单键. 挂进 `scripts/e2e/run.mjs` 的套件清单, 随 e2e 总入口一起跑. 去掉 onCloseAutoFocus 里的 focus 调用时两条都会失败 (已实测).

## Alternatives considered

- 什么都不做 / 复用现有 `scripts/check-shell.ts` 的探针: 最强理由是它已经在 500 宽下点开抽屉并断言 aria-expanded, 加两步最省. 否决: 它用 --dump-dom 加虚拟时间, 库的 Sheet 要等退场动画结束才卸下并归还焦点, 虚拟时间里退场动画不结束, 实测两条恒失败.

## Consequences

e2e 多一个套件, 依赖与其它套件相同 (127.0.0.1:5600 上的 docs). 断言绑定菜单键的 aria-controls="docs-navigation" 与抽屉 id; 改名时要同步本套件.
