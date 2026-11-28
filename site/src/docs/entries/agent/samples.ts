/** Agent 文档页的示例内容: 一篇覆盖各种语法的回答; 剧本的步骤类型 (完整会话剧本见 session-script.ts) */
import type { AgentEvent } from "@/agent";

export const SAMPLE_MARKDOWN = `## 给 debounce 加上 leading

改动分两步: 先让计时器知道 **这一次是不是首次调用**, 再在 \`flush\` 里决定要不要补发尾调用。

- [x] 读现有实现
- [x] 加 \`leading\` / \`trailing\` 选项
- [ ] 补边界测试

| 选项 | 默认 | 作用 |
|---|---|---|
| \`leading\` | \`false\` | 第一次调用立刻执行 |
| \`trailing\` | \`true\` | 静默期结束后再执行一次 |
| \`maxWait\` | 无 | 最长等多久必须执行 |

\`\`\`ts title="src/utils/debounce.ts" {4-6}
export function debounce<A extends unknown[]>(fn: (...a: A) => void, wait: number, opts: { leading?: boolean } = {}) {
  let timer: ReturnType<typeof setTimeout> | undefined;
  return (...args: A) => {
    const first = timer === undefined;
    if (first && opts.leading) fn(...args);
    clearTimeout(timer);
    timer = setTimeout(() => {
      timer = undefined;
      if (!opts.leading || !first) fn(...args);
    }, wait);
  };
}
\`\`\`

同一个思路的三种写法 (组合代码块, 点选项卡切换):

\`\`\`cpp [impl-C++]
template <class F>
auto debounce(F f, std::chrono::milliseconds wait) {
    return [=, last = std::chrono::steady_clock::time_point{}]() mutable {
        auto now = std::chrono::steady_clock::now();
        if (now - last > wait) f();
        last = now;
    };
}
\`\`\`

\`\`\`python [impl-Python]
import time

def debounce(wait: float):
    def deco(fn):
        last = 0.0
        def wrapped(*a, **k):
            nonlocal last
            now = time.monotonic()
            if now - last > wait:
                fn(*a, **k)
            last = now
        return wrapped
    return deco
\`\`\`

\`\`\`rust [impl-Rust]
pub struct Debounce { last: Option<std::time::Instant>, wait: std::time::Duration }

impl Debounce {
    pub fn hit(&mut self) -> bool {
        let now = std::time::Instant::now();
        let fire = self.last.map_or(true, |t| now - t > self.wait);
        self.last = Some(now);
        fire
    }
}
\`\`\`

调用时序:

\`\`\`mermaid
sequenceDiagram
    participant U as 用户输入
    participant D as debounce
    participant F as fn
    U->>D: 第 1 次
    D->>F: leading 立即执行
    U->>D: 第 2..n 次
    Note over D: 静默 wait 毫秒
    D->>F: trailing 补一次
\`\`\`

状态流转:

\`\`\`mermaid
flowchart LR
    A[空闲] -->|调用| B{首次?}
    B -->|是, leading| C[立即执行]
    B -->|否| D[重置计时]
    C --> D
    D -->|wait 到期| E[尾调用]
    E --> A
\`\`\`

一张内联 SVG:

\`\`\`svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 80" width="320" height="80">
  <rect x="1" y="1" width="318" height="78" rx="10" fill="none" stroke="#61afef" stroke-width="2"/>
  <circle cx="40" cy="40" r="14" fill="#98c379"/>
  <circle cx="90" cy="40" r="6" fill="#7f848e"/><circle cx="120" cy="40" r="6" fill="#7f848e"/><circle cx="150" cy="40" r="6" fill="#7f848e"/>
  <circle cx="270" cy="40" r="14" fill="#e5c07b"/>
  <text x="40" y="72" text-anchor="middle" font-size="11" fill="#abb2bf">leading</text>
  <text x="270" y="72" text-anchor="middle" font-size="11" fill="#abb2bf">trailing</text>
</svg>
\`\`\`

触发间隔满足 $$\\Delta t \\ge w$$ 时才执行, 期望执行次数:

$$
E[N] = \\sum_{i=1}^{n} \\Pr(t_i - t_{i-1} \\ge w) = n \\cdot e^{-\\lambda w}
$$

\`\`\`diff
- if (!opts.leading) fn(...args);
+ if (!opts.leading || !first) fn(...args);
\`\`\`

> 注意: \`leading\` 和 \`trailing\` 同时为 \`true\` 且只调用一次时, 只执行一次。

参考 [lodash.debounce](https://lodash.com/docs/#debounce) 的语义。
`;

/* ---------------- Agent 运行剧本 ---------------- */

export interface Step {
  /** 距上一步的毫秒 (1x 速度) */
  wait: number;
  events: AgentEvent[];
  /** 推完这一步后停住, 等 release(id) (例如用户点了批准) 或 ms 毫秒后自动继续 */
  hold?: { id: string; ms: number };
}
