import type { DocEntry } from "../types";

export const agentConversation: DocEntry = {
  slug: "conversation",
  name: "Conversation",
  title: "会话",
  section: "ui",
  group: "Agent",
  sub: "会话",
  description:
    "完整接入后的对话页面：一段从提问到回答的回放。计划（TODO）按 oh-my-pi 的做法实时更新：大项下挂小项、可折叠、显示 x/y，当前项高亮，新完成的项划线扫过；完整计划只在输入框上方的计划面板里（可收起成一行，宽屏可固定到侧边），对话里每次更新只留一行很淡的变更（更新计划 · 完成 X · 3/9），不再重复画整张计划。编排者派出子 Agent 时，派发处出现编排框：默认是派生树——每个子 Agent 是一张完整卡片，从父节点长出来（宽时父在左、子在右，窄时竖向缩进），各自显示实时 tok/s，头部是子 Agent 合计；编排框能弹出成悬浮面板（停在右下角或侧边、可收起成小条），原位置留占位、点它放回。顶栏的子 Agent 切换器（学 DSH）列出主 Agent 与全部子 Agent 的状态与速率，切过去看该子 Agent 的完整会话（只读），一键回主 Agent；点卡片在侧栏看（手机上是全屏抽屉）。输入框控件栏右边是 Agent 客户端 / 模型下拉（菜单学 T3 Code），推理强度按 Codex 的做法与模型分开，是控件栏左边可直接拖的档位条（Alt+, / Alt+. 降升一档，只列当前模型支持的档位）；下方居中的是实时上下文 / 用量条。顶栏可切到「轨迹」账本与「上下文」检视器（学 dsh-context：构成、缓存命中段、各 Agent、最大的几项、事件与演变，回放到后段会越过压缩线并自动压缩），用量条的上下文弹层也能点进去。",
  file: "src/agent/message.tsx",
  importFrom: "@hx/ui/agent",
  demo: () => import("./agent-conversation.demo"),
  source: () => import("@/agent/message.tsx?raw").then((m) => m.default),
  fullPage: { label: "完整会话", load: () => import("./agent-conversation.full") },
  bleed: true,
  stageHeight: 820,
  remountOnChange: false,
  defaults: { speed: 1, mode: "grouped", orchestraView: "graph", codeTheme: "dark" },
  componentDefaults: { mode: "grouped", orchestraView: "graph", codeTheme: "dark" },
  demoOnly: ["speed"],
  presets: [
    { label: "分组", values: { speed: 1, mode: "grouped", orchestraView: "graph", codeTheme: "dark" } },
    { label: "泳道", values: { speed: 1, mode: "grouped", orchestraView: "lanes", codeTheme: "dark" } },
    { label: "逐条", values: { speed: 1, mode: "flat", orchestraView: "graph", codeTheme: "dark" } },
    { label: "只看结论", values: { speed: 2, mode: "zen", orchestraView: "cards", codeTheme: "dark" } },
  ],
  controls: [
    { type: "number", key: "speed", label: "倍速", min: 0.25, max: 4, step: 0.25, unit: "x" },
    { type: "select", key: "mode", label: "显示模式", options: [{ value: "grouped", label: "分组" }, { value: "flat", label: "逐条" }, { value: "hide-success", label: "隐藏成功的" }, { value: "zen", label: "只看结论" }] },
    { type: "select", key: "orchestraView", label: "编排框视图", options: [{ value: "graph", label: "关系图" }, { value: "lanes", label: "泳道" }, { value: "cards", label: "卡片墙" }] },
    { type: "select", key: "codeTheme", label: "代码配色", options: [{ value: "dark", label: "One Dark Pro" }, { value: "auto", label: "跟随亮暗" }] },
  ],
  usage: (v) => `import {
  AgentContextView, AgentModelPicker, AgentProvider, AgentSwitcher, AgentThread, Conversation, EffortControl,
  MessageList, OrchestraDock, PlanPanel, PromptInput, SessionMeter, SubagentConversation, effortsOf, findModel, useAgentStream,
} from "@hx/ui/agent";

export function Chat() {
  const { messages, agents, push, busy } = useAgentStream();
  const [open, setOpen] = useState<string | null>(null);      // 侧栏里看的子 Agent
  const [viewing, setViewing] = useState<string | null>(null); // 顶栏切过去的子 Agent (null = 主 Agent)
  const [model, setModel] = useState({ client: "claude-code", model: "opus", effort: "high" });
  const [view, setView] = useState<"chat" | "context">("chat");
  const levels = effortsOf(findModel(CLIENTS, model.client, model.model).model); // 当前模型支持的推理档位
  // 后端事件 (SSE / WebSocket) 转成 AgentEvent 推进来:
  //   文字 / 工具: text-delta, tool-start, tool-args-delta, tool-output-delta, tool-result ...
  //   计划: todo_write / update_plan 的快照 (todos 里 children 嵌套) 或 OMP 的 todo 操作, 不用额外事件
  //   用量: usage, usage-delta (子 Agent 嵌在 task 调用里时用 tool-child 包一层, 速率归给子 Agent)
  //   上下文: context (系统提示 / 工具定义 / 注入的大小, 窗口与压缩线), tool-result 的 tokens, compaction (压缩前后)
  //   子 Agent: { type: "tool-child", event: { type: "agent-spawn", agentId, parentAgentId, ... } }, agent-status ...
  return (
    <AgentProvider
      mode="${v.mode}"
      agents={agents}
      messages={messages}
      openAgentId={open}
      onOpenAgent={setOpen}${v.orchestraView !== "graph" ? `\n      orchestraView="${v.orchestraView}"` : ""}
      actions={{ onApprove, onDeny, onAnswer, onOpenFile }}
    >
      <header>
        <AgentSwitcher value={viewing} onValueChange={setViewing} />
      </header>
      {view === "context" ? (
        <AgentContextView agentId={viewing} onAgentChange={setViewing} />
      ) : viewing ? (
        <SubagentConversation agentId={viewing} onBack={() => setViewing(null)} />
      ) : (
        <Conversation
          overlay={<OrchestraDock />}
          footer={
            <>
              <PlanPanel />
              <PromptInput busy={busy} onSubmit={send} onStop={stop}
                toolbar={<EffortControl levels={levels} value={model.effort} onValueChange={(effort) => setModel({ ...model, effort })} />}
                status={<AgentModelPicker clients={CLIENTS} value={model} onValueChange={setModel} />} />
              <SessionMeter messages={messages} agents={agents} onOpenContext={() => setView("context")} />
            </>
          }
        >
          {/* 派出子 Agent 的消息里自动出现编排框 (可弹出到 OrchestraDock); 待办调用只留一行变更, 完整计划在 PlanPanel */}
          <MessageList messages={messages} />
        </Conversation>
      )}
      {open && <AgentThread agentId={open} onClose={() => setOpen(null)} />}
    </AgentProvider>
  );
}
`,
  props: [
    { name: "useAgentStream()", type: "{ messages, agents, push, flush, reset, busy }", description: "事件 -> 消息快照与 Agent 树，按帧合批。事件见 AgentEvent；用量事件 usage / usage-delta，子 Agent 事件 agent-spawn / agent-status / agent-handoff / agent-message。" },
    { name: "AgentProvider.agents / messages", type: "AgentTree / AgentMessage[]", description: "给了才在会话里渲染编排框；messages 是全部消息（含子 Agent 自己的），编排框的泳道 / 卡片与子 Agent 轨迹从这里取。MessageList 只渲染主线程。" },
    { name: "AgentProvider.onOpenAgent / openAgentId", type: "(id | null) => void / string | null", description: "点编排框里的子 Agent；配合 AgentThread 在侧栏看它的只读轨迹。不给就只在框内选中。" },
    { name: "AgentProvider.orchestraView", type: '"graph" | "lanes" | "cards"', default: '"graph"', description: "编排框的默认视图，框内可切换。" },
    { name: "AgentProvider.planCalls", type: '"hidden" | "line" | "card"', default: '"hidden"', description: "对话里的待办调用怎么画：hidden 更新时不显示，只在第一次列出计划时留一行（列出计划 · 9 项），完整计划只在 PlanPanel；line 每次更新留一行很淡的变更摘要（更新计划 · 完成 X · 3/9）；没放 PlanPanel 时用 card 回退成内联实时计划卡。" },
    { name: "AgentProvider.mode", type: '"grouped" | "flat" | "hide-success" | "zen"', default: '"grouped"', description: "过程的显示方式；审批、提问、错误、编排框在任何模式下都可见。" },
    { name: "ComposerModelMenu", type: "{ clients, value, onValueChange, sheet?, hotkeys?, align? }", default: "hotkeys", description: "Codex 式触发器「hx-opus ▂▄▆ 高 ⌄」，档名是 EffortBadge（按档位区分样式：关闭 / 低 淡，中 正常，高 品牌色，最高 渐变字 + 光晕）；点开是卡片：「模型 …… 当前模型 ›」（子菜单 / 手机进模型列表），下面「推理强度 …… 高」与渐变档位条 EffortTrack。sheet（手机）时是底部弹层。Alt+, / Alt+. 降 / 升一档，滑块聚焦时 ← → 换档。" },
    { name: "SessionMeter", type: "{ messages, agents?, agentId?, contextWindow?, compact?, align?, onOpenContext? }", default: 'align="center"', description: "实时上下文 / 用量条（默认居中）：上下文环、此刻 tokens/s（2 秒滑动窗口，并行加总）、累计 token 与缓存命中率、本轮耗时与费用；给 agentId 只看那个 Agent 的。给 onOpenContext 时上下文弹层里出构成条与「查看上下文构成」。" },
    { name: "AgentContextView", type: "{ messages?, agents?, agentId?, onAgentChange?, contextWindow?, topItems? }", description: "上下文检视器（对标 dsh-context）：总量 / 窗口与状态，构成条（系统提示 · 工具定义 · 注入 · 历史 · 用户 · 助手 · 工具结果，压缩线、输出预留、缓存命中段），各 Agent 的占用，最大的几项，上下文事件（注入 / 大块结果 / 越线 / 压缩），每次请求的演变。随事件实时变化。" },
    { name: "contextBreakdown / contextTimeline / contextEvents", type: "(messages, { agents?, agentId?, contextWindow? })", description: "上下文的纯函数选择器：固定开销取 context 事件的报告值，对话部分按消息估算（工具结果优先用 tool-result.tokens），总量取 max(最近 usage.contextTokens, 估算)；压缩前的对话收成摘要。" },
    { name: "AgentThread", type: "{ agentId, onClose?, variant?, onExpand?, agents?, messages? }", description: "子 Agent 的只读会话（侧栏；variant=\"drawer\" 是窄屏全屏抽屉）：状态、模型、计时、用量与它自己的实时速率，任务，收发的消息 / 交接，它的思考与工具调用。" },
    { name: "AgentTrajectory", type: '{ messages, agents?, defaultExpanded?, layout?: "auto" | "table" | "list" }', default: 'layout="auto"', description: "轨迹账本：按轮分组，类型标签、输入 / 输出 / 思考 token、时长与计时条；子调用与子 Agent 的工作折在父行下。窄于 600px（或 layout=\"list\"）时是单列卡片式行：序号 + 类型 + 一行摘要，token 与时长在右侧小字。" },
    { name: "ComposerMeters", type: "{ messages, agents?, agentId?, contextWindow?, compact?, turnTime?, sheet?, onOpenContext? }", default: "turnTime", description: "输入框下方那一行的指标（DSH 的 StatsPills 放进 Codex 底栏）：tok/s（按当前 Agent，生成中跳动）· 路数 · 累计（整段会话的 token 总数，只增不减，标签写明「累计」）· 缓存命中（累计值，悬停 / 明细里另给本次请求的）· 本轮用时 · 费用（每次请求都带）。实时的上下文占用在旁边的 ContextLeft，两者分开标签。等宽数字、占位不跳宽；compact（手机）留 tok/s · 累计 · 命中，其余进弹层。点开是用量明细（实时上下文 / 累计 两节）。" },
    { name: "ContextLeft", type: "{ messages, agents?, agentId?, contextWindow?, compact?, sheet?, onOpenContext? }", default: "—", description: "实时上下文：小环 +「上下文 68% · 13.6万 / 20万」（此刻主线程占了多少窗口，会涨，压缩后回落），悬停给精确值与剩余；与 ComposerMeters 的「累计」分开。compact（手机）只写「上下文 68%」。点开是用量明细。" },
    { name: "EffortTrack", type: '{ levels, value, onValueChange, label?, header?, hint?, size?: "md" | "lg", disabled? }', default: 'size="md"', description: "推理强度的渐变档位条：粗圆角胶囊轨道，渐变 淡蓝紫 → 蓝 → 紫（语义 token 混色），每档一个刻度点，浅色圆形滑块带边框（亮色取背景色、暗色取前景色，黑白主题下也是浅色）；档名在下方，每档是自己的 EffortBadge，当前档加底色。档位越高轨道越亮、越鲜艳（filter / opacity），流光越快（transform，减弱动效时停）。可点、可拖（松开吸附）、方向键 / PageUp / Home / End；role=slider，aria-valuetext 是档名。ComposerModelMenu 的菜单与手机弹层里用它。" },
    { name: "EffortBadge", type: "{ effort, glyph?, glow? }", default: "glyph", description: "档位徽标「▂▄▆█ 最高」：4 根小柱（像信号格）+ 档名，每档一种样子（effortLook）：关闭 70% 弱前景无柱，低 弱前景 1 柱，中 前景 2 柱，高 品牌色中等字重 3 柱，最高 渐变字（info → brand → chart-4）粗一档 4 柱 + 光晕（只动 opacity，减弱动效时静态）。黑白主题靠柱数与字重分高低。触发器、档名、标题行共用。" },
    { name: "usage 事件的 scope", type: '"total" | "request"', default: '"total"', description: "total（默认）是累计值快照，合并进 message.usage；request 是一次请求自己的用量：记进 message.request（本次请求），并累加进 message.usage（累计，没给 inputTokens 时按 contextTokens 算）。宿主按每次请求报用量时用 request，命中率读累计值不会随每次请求跳；sessionUsage 的 lastRequest 是最近一次请求。" },
    { name: "TurnUsage", type: "{ message }", description: "助手消息操作条上的这一轮用量胶囊：提示 / 缓存读取 / 写入 / 输出 / 首 token / 吞吐 / 费用。" },
    { name: "选择器", type: "sessionUsage / tokenRate / messageTiming / cacheHitRate / buildTrajectory / pendingRequests ...", description: "纯函数，服务端可用；自定义用量条或轨迹时直接用。" },
    { name: "PlanPanel", type: "{ plan?, agentId?, placement?, onPlacementChange?, defaultCollapsed?, live? }", description: "计划面板：dock 停在输入框上方（收起时一行「计划 3/9 · 当前项」），side 是侧边一栏；不给 plan 就取会话里主线程（或 agentId 的）计划。PlanTree / PlanCard 可单独用。" },
    { name: "planOf / planFromParts", type: "(messages, agents?, agentId?) => Plan", description: "从待办调用派生计划树：todo_write / update_plan 快照（children / subtasks 嵌套，参数流式时实时更新）与 OMP 的 todo 操作（init / start / done / drop / append / rm）；planProgress 给 x/y 与当前项，steps 记每次完成 / 新增 / 移除。" },
    { name: "OrchestraDock", type: "{ position?, defaultPosition?, onPositionChange?, defaultView? }", description: "悬浮编排面板的宿主，放进 Conversation 的 overlay。放了它，编排框头部才出现「弹出」；面板停在右下角或侧边、可收起成小条、可放回。" },
    { name: "AgentSwitcher", type: "{ value: string | null, onValueChange }", description: "顶栏的子 Agent 切换器（DSH 同款）：主 Agent + 全部子 Agent，状态点、各自实时 tok/s、时长；悬停 150ms 打开，点击固定，方向键 / Enter / Esc。" },
    { name: "SubagentConversation", type: "{ agentId, onBack?, contextWindow?, dock? }", description: "切到子 Agent 时的整个会话区：任务、它的完整轨迹（同一套组件）、只读输入条与它自己的用量条。" },
    { name: "AgentModelPicker", type: "{ clients: AgentClientOption[], value, onValueChange, align?, compact? }", default: 'align="end"', description: "客户端（Codex / Claude Code / OpenCode …）+ 模型下拉，放在输入框控件栏右边（PromptInput 的 status）。菜单只选客户端和模型；换模型时强度吸附到新模型支持的最近一档（resolveModelSelection）。" },
    { name: "EffortControl", type: "{ levels, value, onValueChange, compact?, hotkeys?, disabled? }", default: "hotkeys", description: "输入框里的推理强度（Codex 同款：与模型分开，只走模型声明的档位）：一档一段的短条，拖动 / 点段 / 方向键，Alt+, / Alt+. 降升一档，改动时冒气泡说明；levels 为空（模型不能调）时不画。放在 PromptInput 的 toolbar。" },
    { name: "EffortSlider", type: "{ levels, value, onValueChange }", description: "带刻度的大号推理强度条（基于库里的 Slider），给设置页等单独用。" },
    { name: "agentTokenRates", type: "(messages, agents, now) => Map<agentId, tok/s>", description: "按 Agent 归属的实时速率：消息的 meter 归消息的 agentId，嵌在派发调用里的子 Agent 时间线（tool-child / usage-delta.callId）归它自己。" },
    { name: "PromptInput", type: "{ onSubmit, busy, onStop, commands, mentions, toolbar, status, attachments }", description: "Enter 发送、Shift+Enter 换行、输入法组字不误发；附件可选择、拖拽、粘贴；/ 命令与 @ 提及菜单。" },
  ],
};
