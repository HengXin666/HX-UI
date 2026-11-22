# HX-UI 2 (next)

HX-UI 的第二代, 站在成熟生态上重建: **shadcn/ui + Tailwind v4 + Motion + Recharts + TanStack Table**.
目标是一套高性能, 现代简洁, 交互和布局友好, 对人和 AI 都好用的界面库, 能直接拼出发布页, 电商, 运维面板和统计页.

```bash
cd next
npm ci
npm run dev        # 组件页: http://localhost:5173
npm run build      # tsc + vite build
```

## 分层


| 目录 | 内容 | 来源 |
|---|---|---|
| `src/styles` | 令牌 (OKLCH, 亮暗, 5 种强调色) + 特效关键帧 | 自写, 变量名与 shadcn 主题格式一致 |
| `src/components/ui` | 38 个基础件 | shadcn/ui 源码 (`npx shadcn add <name>` 增补) |
| `src/motion` | 弹簧档位, 入场预设, Reveal / Stagger / AnimatedNumber / TextReveal | Motion |
| `src/effects` | 旧特效, R2 逐个审: 能变成交互的迁入 interactions, 其余删除 | 自写 |
| `src/interactions` | 交互组件: 一件一个目录 (`index.tsx` 组件, `meta.ts` 调参描述, `demo.tsx` 场景演示), 清单在 `registry.ts` | 自写, 思路参考 Aceternity Interactions |
| `src/data` | AreaTrend, BarCompare, Donut, Sparkline, DataTable | Recharts + TanStack Table v8 |
| `src/text` | 文字组件 (SplitText ...) | 自写, 思路参考 React Bits |
| `site` | 文档站: 总览 + 每个组件一页 (预览 / 代码 / 调参 / 属性表 / 复制给 AI); 新组件在 `site/src/docs/entries` 登记 | |

## 规则 (只有这几条)

1. 颜色只用令牌类 (`bg-brand`, `text-muted-foreground` ...), 不写裸色值; 换肤 = 换一份 `:root` / `.dark`.
2. 动效只动 `transform` / `opacity` / `filter`; 弹簧用 `spring.*` 档位; 必须在 `prefers-reduced-motion` 下给终态.
3. 组件即源码: 基础件可以直接改, 改完在文件顶部注释写一句为什么.
4. 每个新组件在组件页里有一个真实用例; 没在浏览器里看过不算完成.

## 命令

```bash
npm run check   # 交互组件体积预算
```

AI 使用说明见 `llms.txt`.
