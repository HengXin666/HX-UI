# HX-UI 2 (next)

HX-UI 的第二代, 站在成熟生态上重建: **shadcn/ui + Tailwind v4 + Motion + Recharts + TanStack Table**.
目标是一套高性能, 现代简洁, 交互和布局友好, 对人和 AI 都好用的界面库, 能直接拼出发布页, 电商, 运维面板和统计页.

```bash
cd next
npm ci
npm run dev        # 文档站: http://localhost:5173
npm run build      # 文档站: tsc + vite build -> dist-site/
npm run build:lib  # 发布包: -> dist/ (JS + .d.ts + styles.css + tailwind.css)
npm run pack:check # build:lib + npm pack + scripts/verify-pack.ts
```

## 安装

2.0 通过 GitHub Release 发 tgz, 不需要 npm 账号, 直接装 URL:

```bash
pnpm add https://github.com/HengXin666/HX-UI/releases/download/v2.4.0/hx-ui-2.4.0.tgz
# 或
npm i https://github.com/HengXin666/HX-UI/releases/download/v2.4.0/hx-ui-2.4.0.tgz
```

要求 React 19 (`react` / `react-dom` 是 peerDependencies). 包是纯 ESM, 带完整 `.d.ts` (bundler / NodeNext 解析都能用).

依赖怎么分:

| 用到什么 | 需要额外装 | 说明 |
|---|---|---|
| 基础件, 动效, 特效, 文字, 蓝图, Agent 界面 | 无 | radix-ui, motion, lucide-react, cmdk, sonner, vaul, react-day-picker, ldrs 等是 dependencies, 自动装上 |
| 2D 图表 + 表格 (`@hx/ui/data`) | 无 | recharts, d3-*, topojson-client, @tanstack/react-table 也是 dependencies; 不 import 就不会进你的包 |
| 3D 图表 (`@hx/ui/data/3d`) | `three @react-three/fiber @react-three/drei` | 可选 peer, 只用 Button 的项目不用装. 没装就别引 `@hx/ui/data/3d` |
| Mermaid 围栏 (`@hx/ui/agent/mermaid`) | `mermaid` | 可选 peer |
| 公式 (`@hx/ui/agent/math`) | `@streamdown/math katex` | 可选 peer, 另引 `katex/dist/katex.min.css` |

## 调用

### 1. 样式 (只引一次, 放在入口文件)

没用 Tailwind 的项目, 引预编译好的整份样式 (令牌 + 亮暗 + 组件用到的全部工具类 + 特效关键帧; 蓝图是拓展包, 样式另引, 见第 5 节):

```ts
import "@hx/ui/styles.css";
import "@hx/ui/fonts.css"; // 可选: Geist / Geist Mono 字体, 不引就回退到系统字体
```

注意: `styles.css` 带 Tailwind 的 Preflight (基础重置), 会作用于整页; 里面只有库自己用到的工具类, 你自己写的 `className="grid-cols-3"` 之类不保证有, 要随手写工具类请走下面的 Tailwind v4 用法.

### 2. 主题 (亮 / 暗 / 跟随系统 + 强调色) 和动效

```tsx
import { ThemeProvider, useTheme, themeScript } from "@hx/ui/theme";
import { MotionProvider } from "@hx/ui/motion";

createRoot(root).render(
  <ThemeProvider defaultMode="system">   {/* 亮暗靠 <html class="dark">, 强调色靠 data-theme */}
    <MotionProvider>                     {/* 动效特性按需加载, 尊重系统的减弱动效 */}
      <App />
    </MotionProvider>
  </ThemeProvider>,
);

function ThemeToggle() {
  const { resolved, setMode, setAccent } = useTheme(); // setAccent("emerald" | "rose" | "amber" | "zinc" | "indigo" | "ink"), ink 连中性色一起换
  return <Button onClick={() => setMode(resolved === "dark" ? "light" : "dark")}>切换</Button>;
}
```

首屏防闪烁: 把 `themeScript` (一段字符串) 内联进 `<head>`, 在 React 挂载前就给 `<html>` 加上 `.dark`. Next.js: `<script dangerouslySetInnerHTML={{ __html: themeScript }} />`; Vite: 把它的内容贴进 `index.html` 的 `<script>`. 它读的是默认的 `storageKey` (`hx-theme`), 改了 `storageKey` 就自己写一份.

### 3. 基础件 (shadcn/ui 源码上加强, 一个组件一个入口)

```tsx
import { Button } from "@hx/ui/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@hx/ui/ui/card";
import { Input } from "@hx/ui/ui/input";
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle } from "@hx/ui/ui/dialog";

<Dialog>
  <DialogTrigger asChild><Button>打开</Button></DialogTrigger>
  <DialogContent><DialogHeader><DialogTitle>标题</DialogTitle></DialogHeader></DialogContent>
</Dialog>
```

`src/components/ui/<name>.tsx` 都能这样引: `@hx/ui/ui/<name>` (accordion, alert, badge, calendar, command, confirm-dialog, date-picker, drawer, dropdown-menu, field, pagination, select, sheet, sidebar, spin, tabs, tooltip ...). `cn` 在 `@hx/ui/utils`.

### 4. 图表 / 表格

```tsx
import { AreaTrend, BarCompare, Donut, Sparkline, Candlestick, DataTable } from "@hx/ui/data";

<AreaTrend data={rows} x="month" series={[{ key: "web", label: "网页" }, { key: "app", label: "App" }]} height={240} />
<Donut data={[{ key: "web", label: "网页", value: 42 }, { key: "app", label: "App", value: 35 }]} />
<Sparkline values={[3, 5, 4, 8, 6]} />

// 3D (先装 three @react-three/fiber @react-three/drei; 场景本体懒加载)
import { Bar3D } from "@hx/ui/data/3d";
<Bar3D values={[[3, 5], [4, 6]]} xLabels={["一", "二"]} yLabels={["华东", "华南"]} height={360} />
```

颜色走令牌 (`--chart-1..5`, `--brand`), 亮暗自动跟随.

### 5. 蓝图 (UE5 风格节点编辑器, 拓展包)

蓝图是拓展包: 根入口 `@hx/ui` 和 `styles.css` / `tailwind.css` 都不带它, 不用蓝图就不为它付任何 JS / CSS. 要用时从子路径引, 再多引一份样式 (排在核心样式之后):

```ts
// 没用 Tailwind: 跟在 styles.css 后面
import "@hx/ui/styles.css";
import "@hx/ui/blueprint/styles.css";
```

```css
/* Tailwind v4: 跟在 tailwind.css 后面, 它带蓝图样式和只指向蓝图目录的 @source */
@import "tailwindcss";
@import "@hx/ui/tailwind.css";
@import "@hx/ui/blueprint.css";
```

```tsx
import { defineTypes, defineNode, createRegistry, demoRegistry, demoGraph } from "@hx/ui/blueprint"; // 逻辑层, 不依赖 React
import { Blueprint, BlueprintWorkbench, useBlueprint } from "@hx/ui/blueprint/ui";            // 画布 / 整套工作台

// 整套工作台: 工具栏 + 我的蓝图 + 画布 + 细节 + 调试坞; 面板按需懒加载
<div style={{ height: 600 }}>
  <BlueprintWorkbench registry={demoRegistry} defaultValue={demoGraph} fullscreen={false} />
</div>

// 只要画布
const bp = useBlueprint({ registry, initial: graph });
<Blueprint editor={bp} />
```

其它入口: `@hx/ui/blueprint/panels` (MyBlueprintPanel, DetailsPanel, DebugDock, VariablesPanel, Splitter, 自己摆布局用), `@hx/ui/blueprint/agent` (buildGraph, createBlueprintTools, 给 AI 用的工具), `@hx/ui/blueprint/debug` (调试会话).

调试默认在浏览器里解释整张图. 图由别处真正执行时 (例如服务端), 给编辑器设 `debugBackend`, 运行条, 执行脉冲, 断点 (含条件断点), 监视和悬停取值照常工作:

```ts
const bp = useBlueprint({ registry, initial: graph });
bp.debugBackend = ({ graph, options, emit }) => ({
  start: () => remote.run(graph, { breakpoints: [...options.breakpoints] }), // 结束时 resolve
  step: () => remote.step(), continue: () => remote.continue(), runTo: (key) => remote.runTo(key), stop: () => remote.stop(),
  breakpointsChanged: () => remote.setBreakpoints([...options.breakpoints]),
});
// 收到远端进度时: emit({ type: "status", state: createDebugState({ status: "paused", at: { node }, trace }) })
```

### 6. Agent 界面 (流式 Markdown, 代码块, 思考, 工具调用, 会话; 拓展包)

和蓝图一样不进根入口. 样式另引 (`@hx/ui/agent/styles.css` 排在 `styles.css` 之后, 或 Tailwind v4 的 `@hx/ui/agent.css`).
代码高亮用 Shiki (dependency, 语言和主题按需懒加载); Mermaid 与公式是可选入口, 用到才装 `mermaid` / `@streamdown/math katex`.

```tsx
import "@hx/ui/agent/styles.css";
import { AgentProvider, Conversation, MessageList, PromptInput, Markdown, useAgentStream } from "@hx/ui/agent";
import { mermaidFences } from "@hx/ui/agent/mermaid";   // 可选
import { math, mathFences } from "@hx/ui/agent/math";    // 可选, 另引 "katex/dist/katex.min.css"

// 单独渲染一段流式回答: 半截语法补全, 只重渲染最后一块, 博客同款代码块 (One Dark Pro, 行号, [组-标签] 选项卡)
<Markdown streaming={generating} fences={{ ...mermaidFences, ...mathFences, chart: MyChart }} plugins={{ math }}>{text}</Markdown>

// 整个 Agent 会话: 事件流 -> useAgentStream (按帧合批) -> MessageList
function Chat() {
  const { messages, agents, push, busy } = useAgentStream();
  const [open, setOpen] = useState<string | null>(null);
  const [viewing, setViewing] = useState<string | null>(null);
  const [model, setModel] = useState({ client: "codex", model: "gpt-5", effort: "medium" });
  // push({ type: "text-delta", messageId, partId, delta }) / "reasoning-delta" / "tool-start" / "tool-args-delta"
  //      / "tool-status" / "tool-output-delta" / "tool-result" / "tool-child" / "message-end" ...
  // 用量: "usage" (提示 / 缓存 / 上下文快照), "usage-delta" (输出 token 增量, 算实时 tokens/s; 不发就按文字估)
  // 子 Agent: task 调用里嵌 tool-child { agent-spawn }, 再推 agent-status / agent-handoff / agent-message; 子 Agent 的消息带 agentId
  // AI SDK: fromAiSdkMessages(useChat().messages, { streaming })
  return (
    <AgentProvider
      markdown={{ fences: mermaidFences }}
      toolViews={{ deploy: myDeployView }}               // 按工具名注册视图, 内置 bash / read / edit / grep / web / todo / 提问 / 子 Agent ...
      actions={{ onApprove, onDeny, onAnswer, onOpenFile }}
      mode="grouped"                                      // grouped | flat | hide-success | zen
      agents={agents} messages={messages}                 // 派出子 Agent 的消息里出现编排框; 子 Agent 的审批上浮到父线程
      openAgentId={open} onOpenAgent={setOpen}            // 点编排框里的子 Agent
    >
      <AgentSwitcher value={viewing} onValueChange={setViewing} />         {/* 顶栏: 主 Agent / 子 Agent 切换, 各自 tok/s */}
      {viewing ? <SubagentConversation agentId={viewing} onBack={() => setViewing(null)} /> : (
        <Conversation
          className="h-dvh"
          overlay={<OrchestraDock />}                                         // 编排框可弹出成悬浮面板
          footer={<>
            <PlanPanel />                                                     {/* 计划: 从 todo_write / OMP todo 调用派生, 嵌套可折叠 */}
            <PromptInput busy={busy} onSubmit={send} onStop={stop}
              toolbar={<EffortControl levels={levels} value={model.effort} onValueChange={(effort) => setModel({ ...model, effort })} />}  // 推理强度: 输入框里直接拖
              status={<AgentModelPicker clients={clients} value={model} onValueChange={setModel} />} />                                    // 客户端 + 模型: 控件栏右边
            <SessionMeter messages={messages} agents={agents} onOpenContext={openContext} />  {/* 默认居中; 上下文弹层可进 AgentContextView */}
          </>}
        >
          <MessageList messages={messages} />
        </Conversation>
      )}
      {open && <AgentThread agentId={open} onClose={() => setOpen(null)} />}  {/* 子 Agent 的只读会话 */}
    </AgentProvider>
  );
}
// 轨迹账本 (对标 DSH 的 Trajectory): <AgentTrajectory messages={messages} agents={agents} />
// 每个 Agent 的实时速率: agentTokenRates(messages, agents, Date.now()).get(agentId)
```

自定义围栏渲染器拿到 `{ code, lang, meta, incomplete, theme }`, `incomplete` 为真表示围栏还在生成, 可以自己做流式渲染.

### 7. 已经在用 Tailwind v4

不引 `styles.css`, 改在你自己的 CSS 里:

```css
@import "tailwindcss";
@import "@hx/ui/tailwind.css"; /* 令牌 + @theme (bg-brand, text-muted-foreground ...) + 暗色 variant + 关键帧 */
@import "@hx/ui/blueprint.css"; /* 只在用蓝图时 */
@import "@hx/ui/agent.css";     /* 只在用 Agent 界面时 */
@import "@hx/ui/fonts.css";    /* 可选 */
```

`tailwind.css` 里有 `@source` 指向包内 `dist/` (不含 `dist/blueprint/` 与 `dist/agent/`, 它们由 `blueprint.css` / `agent.css` 自己的 `@source` 扫), 你的 Tailwind 会把组件用到的类一起生成, 你自己也能用同一套令牌类 (`bg-brand`, `dark:` ...). 换肤 = 覆盖 `:root` / `.dark` 里的变量 (与 shadcn 主题格式一致).

### 包入口一览

| 入口 | 内容 |
|---|---|
| `@hx/ui` | 汇总入口: cn, ThemeProvider, Motion / Effects / Data (2D) 命名空间, 文字, 背景, 滚动, Stage. 不含 3D 和蓝图 |
| `@hx/ui/ui/*` | 基础件, 一个文件一个入口 |
| `@hx/ui/theme` / `@hx/ui/hooks/*` / `@hx/ui/utils` | 主题 / hooks / cn |
| `@hx/ui/motion` / `@hx/ui/effects` / `@hx/ui/effects/*` / `@hx/ui/interactions` | 动效预设, 特效件, StatefulButton 等 |
| `@hx/ui/text/*` / `@hx/ui/backgrounds/*` / `@hx/ui/scroll/*` / `@hx/ui/stage` | SplitText, NumberRoll, Aurora, Particles, ScrollStack, Stage ... |
| `@hx/ui/data` / `@hx/ui/data/3d` | 2D 图表 + DataTable / 3D 图表 |
| `@hx/ui/blueprint` / `/blueprint/ui` / `/blueprint/panels` / `/blueprint/agent` / `/blueprint/debug` | 蓝图拓展包: 逻辑 / 编辑器 / 面板 / AI 工具 / 调试 |
| `@hx/ui/agent` / `/agent/mermaid` / `/agent/math` | Agent 拓展包: 流式 Markdown, 代码块, 思考, 工具调用, 会话, 事件模型 / Mermaid 围栏 / 公式 |
| `@hx/ui/styles.css` / `@hx/ui/tailwind.css` / `@hx/ui/fonts.css` | 预编译样式 / Tailwind v4 入口 / 字体 (都不含蓝图和 Agent) |
| `@hx/ui/blueprint/styles.css` / `@hx/ui/blueprint.css` | 蓝图样式: 预编译 (配 styles.css) / Tailwind v4 入口 (配 tailwind.css) |
| `@hx/ui/agent/styles.css` / `@hx/ui/agent.css` | Agent 样式: 预编译 (配 styles.css) / Tailwind v4 入口 (配 tailwind.css) |

> 文档站里的示例代码写的是源码路径 (`@/components/ui/button`, `@/data`), 对应到包里分别是 `@hx/ui/ui/button`, `@hx/ui/data` (3D 是 `@hx/ui/data/3d`).

### 8. Next.js App Router / React Server Components

包里每个用到 hook, 事件, 浏览器 API 或 motion / recharts / three 的模块都带 `"use client"` (逐文件保留在 `dist/` 里), 纯工具和蓝图核心不带. 所以服务端组件 (默认的 `page.tsx` / `layout.tsx`) 可以直接引组件, 不用自己再包一层:

```tsx
// app/layout.tsx (服务端组件)
import "@hx/ui/styles.css";
import { ThemeProvider, themeScript } from "@hx/ui/theme"; // themeScript 在服务端就是字符串

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <head><script dangerouslySetInnerHTML={{ __html: themeScript }} /></head>
      <body><ThemeProvider>{children}</ThemeProvider></body>
    </html>
  );
}

// app/page.tsx (服务端组件)
import { Button } from "@hx/ui/ui/button";
import { AreaTrend, formatCompact } from "@hx/ui/data"; // formatCompact 等纯工具可以在服务端直接调用

export default async function Page() {
  const data = await getData();
  return <><Button>保存</Button><AreaTrend data={data} x="m" series={[{ key: "a", label: "A" }]} /></>;
}
```

两条服务端组件本身的限制 (React 的规则, 不是包的):

- 函数不能当 props 从服务端传给客户端组件: `onClick`, `valueFormatter`, 以及蓝图的 `registry` (节点带 `evaluate`). 要传函数就在你自己的 `"use client"` 文件里渲染, 例如蓝图:
  ```tsx
  "use client";
  import { BlueprintWorkbench } from "@hx/ui/blueprint/ui";
  import { registry } from "./registry";
  export function Editor() { return <BlueprintWorkbench registry={registry} fullscreen={false} />; }
  ```
- 汇总入口 (`@hx/ui`, `@hx/ui/data`, `@hx/ui/theme`, `@hx/ui/blueprint/ui` 等) 里的常量和工具函数都来自服务端安全的模块; 逐文件入口 `@hx/ui/ui/*` 跟 shadcn 一样, 文件里附带的 `xxxVariants` 随文件走, 客户端组件文件里的只能在客户端用.

已用 Next.js 15.5 (webpack) 和 16.4 (Turbopack) 的 `next build` 验证: 服务端页面直接引 Button, 图表, `@hx/ui/blueprint/ui`, 主题脚本.

## 分层


| 目录 | 内容 | 来源 |
|---|---|---|
| `src/styles` | 令牌 (OKLCH, 亮暗, 5 种强调色) + 特效关键帧 | 自写, 变量名与 shadcn 主题格式一致 |
| `src/components/ui` | 基础件, 在 shadcn/ui 源码上补了业务能力: Field, ConfirmDialog, DatePicker, PaginationBar, RadioGroupCard, Alert 色调, Progress 不确定态 ... | shadcn/ui 源码 + 自写 |
| `src/motion` | 弹簧档位, 入场预设, Reveal / Stagger / AnimatedNumber / TextReveal | Motion |
| `src/effects` | 特效件 (Marquee, TiltCard, LiveDot ...); 已并入组件参数的 (spotlight / beam / shimmer) 不单独列在文档里 | 自写 |
| `src/interactions` | StatefulButton (Button 的提交流程), SpeedCounter (并入 NumberRoll) | 自写 |
| `src/data` | AreaTrend, BarCompare, Donut, Sparkline, ComboChart, RadarCompare, Gauge, ScatterBubble, ConversionFunnel, ShareTreemap, SankeyFlow, HeatCalendar, Candlestick, DataTable | Recharts + TanStack Table v8 |
| `src/text` | 文字组件 (SplitText ...) | 自写, 思路参考 React Bits |
| `src/agent` | Agent 拓展包: Markdown (流式), CodeBlock, 围栏 (svg / mermaid / 公式 / html), Reasoning, ToolCall + 内置工具视图, ActivityGroup, Conversation, MessageList (含对话内编排框), PromptInput, SessionMeter (实时上下文 / 用量), AgentContextView (上下文检视器), PlanPanel (计划 / TODO), AgentModelPicker + EffortControl (客户端 / 模型, 推理强度), AgentSwitcher, OrchestraDock, AgentTrajectory, AgentThread, 事件 reducer, AI SDK 适配 | Streamdown (解析切块) + Shiki (高亮) + 自写; 交互参考 T3 Code / DSH / dsh-context / Codex / oh-my-pi, 代码块参考 HXLoLi 博客 |
| `site` | 文档站, 三个分区: UI 组件 (操作 / 导航 / 展示 / 反馈 / 表单 / 数据 / 图表 / 3D / 编辑器 / Agent), 视觉组件, 落地页. 旧的 #/agent/* 链接重定向到 #/ui/*. 每个组件一页: 预览 / 代码 / 调参 / 属性表 / 复制给 AI. 新组件写 `site/src/docs/entries/<slug>.ts` + `<slug>.demo.tsx`, 在 `registry.ts` 登记 | |

## 规则 (只有这几条)

给 AI / 代理的工作说明 (命令, 边界, 发版) 在 [AGENTS.md](./AGENTS.md).

1. 颜色只用令牌类 (`bg-brand`, `text-muted-foreground` ...), 不写裸色值; 换肤 = 换一份 `:root` / `.dark`.
2. 动效只动 `transform` / `opacity` / `filter`; 弹簧用 `spring.*` 档位; 必须在 `prefers-reduced-motion` 下给终态.
3. 组件即源码: 基础件可以直接改, 改完在文件顶部注释写一句为什么.
4. 每个新组件在文档站里有一个真实场景; 没在浏览器里看过不算完成.
5. 状态变化都有过渡 (150-250ms), 选中态滑动跟随; 减弱动效时不位移只淡入.
6. 用到 hook / 事件 / 浏览器 API / motion / recharts / three 的文件顶部写 `"use client"`; 纯工具, 常量, 类型不写, 要从汇总入口导出的常量和工具放在不带指令的模块里. `npm run check` 会查.

## 命令

```bash
npm run check         # 交互组件体积预算 + "use client" 边界检查 (scripts/check-client.ts)
npm run check:bp      # 蓝图逻辑 + 编辑器的回归检查
npm run check:agent   # Agent 拓展包的逻辑检查 (围栏, 组合代码块, 部分 JSON, 事件 reducer, 多 Agent, 实时用量, 轨迹, diff, ANSI)
npm run pack:check    # 发布包: build:lib (含 dist 逐文件核对 "use client") + npm pack + verify-pack
```

AI 使用说明见 `llms.txt`.
