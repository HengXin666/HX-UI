# Agent Note: 门禁脚本的常量池

Status: implemented

Decision-ID: scripts-constants

## Code

- `scripts/constants/quality.ts`

## Problem

门禁脚本里的路径、阈值、命令名与退出码如果就地写在各自的检查里, 同一字面量出现三次以上就要靠人眼维持一致, 而 PROJECT-CONST-DUP 会把它们判成 Error。门禁本身靠这些值判断"该读哪个文件、该不该拦、算不算工具故障", 写歪一处就是静默漏检。另一面是依赖: 文档站的浏览器检查 (check-smoke / check-shell) 与质量门禁 (scripts/quality) 的消费方不同, 混在一个文件里会让浏览器检查 import 质量门禁的路径常量, 不相关的改动互相触发重跑。

## Decision

`scripts/constants/` 按消费方拆成两份纯 `export const`: `quality.ts` 收质量门禁的路径 (STATE_DIR / REPORT_DIR / BASELINE_FILE 等)、模式、命令与退出码, `browser.ts` 收文档站浏览器检查的值 (INDEX_HTML / JS_MIME / PROBE_SETTLE_MS 等)。两份都不 import 任何模块, 由 `scripts/quality/**` 与两个 check 脚本按需引用; 新增常量先判断属于哪一侧, 两侧都要的才上提。

## Alternatives considered

- 什么都不做 / 复用现有: 字面量就地写在检查里最省事, 但同一路径与阈值在多处重复, PROJECT-CONST-DUP 报 Error, 而且改一处漏一处的风险直接落在门禁上
- 两份合成一个 `scripts/constants/index.ts`: 少一个文件, 但浏览器检查会 import 质量门禁的常量, 依赖面变大且不相关的改动会互相触发重跑
- 把常量放进 `scripts/quality/constants.ts`: 让浏览器检查去 import 质量门禁目录, 形成反向依赖, 且门禁目录的职责会变成"既是检查也是常量库"
- 直接写在 vendored skill 的常量文件里: 复用现成实现, 但 `.agents/` 由上游维护, 本仓的路径与阈值会随上游漂移

## Consequences

路径、阈值与退出码有唯一来源, 门禁改一处即全局生效; 代价是多一层目录, 新增常量要先判断它属于质量门禁还是浏览器检查, 两侧都用的值需要显式上提而不是就地复制。
