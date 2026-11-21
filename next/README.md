# HX-UI 2 (next)

HX-UI 的第二代, 站在成熟生态上重建: **shadcn/ui + Tailwind v4 + Motion + Recharts + TanStack Table**.
目标是一套高性能, 现代简洁, 交互和布局友好, 对人和 AI 都好用的界面库, 能直接拼出发布页, 电商, 运维面板和统计页.

```bash
cd next
npm ci
npm run dev        # 文档站 + 四张成品页: http://localhost:5173
npm run build      # tsc + vite build
```

## 分层

| 目录 | 内容 | 来源 |
|---|---|---|
| `src/styles` | 令牌 (OKLCH, 亮暗, 5 种强调色) + 特效关键帧 | 自写, 变量名与 shadcn 主题格式一致 |
| `src/components/ui` | 38 个基础件 | shadcn/ui 源码 (`npx shadcn add <name>` 增补) |
| `src/motion` | 弹簧档位, 入场预设, Reveal / Stagger / AnimatedNumber / TextReveal | Motion |
| `src/effects` | SpotlightCard, BorderBeam, Marquee, Backdrop, ShimmerButton, Magnetic, TiltCard, LiveDot | 自写, 参考 Magic UI / Aceternity 路数 |
| `src/data` | AreaTrend, BarCompare, Donut, Sparkline, DataTable | Recharts + TanStack Table v8 |
| `src/blocks` | marketing / commerce / dashboard / analytics / shell 整段区块 | 自写 |
| `site` | 文档站与四张成品页 (launch / shop / ops / analytics) | 只用上面的公开组件 |

## 规则 (只有这几条)

1. 颜色只用令牌类 (`bg-brand`, `text-muted-foreground` ...), 不写裸色值; 换肤 = 换一份 `:root` / `.dark`.
2. 动效只动 `transform` / `opacity` / `filter`; 弹簧用 `spring.*` 档位; 必须在 `prefers-reduced-motion` 下给终态.
3. 组件即源码: 基础件可以直接改, 改完在文件顶部注释写一句为什么.
4. 每个新区块在 `site` 里有一个真实用例; 没在浏览器里看过不算完成.

AI 使用说明见 `llms.txt`.
