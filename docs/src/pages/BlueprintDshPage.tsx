import type { JSX } from "react";
import { Badge } from "@hx/ui";
import { DshArchitectureDemo, DshDemo, OtherDomainDemo, AgentApiDemo, NODES, dshAgentLoopGraph } from "@hx/blueprint-demo";
import { H2, P, Preview, Callout, Code, CodeBlock } from "../components/DocKit";

/**
 * 蓝图库的**使用方演示**页。
 *
 * 这一页的 dsh 图不在 HX-UI 里, 它住在兄弟包 HX-Blueprint-Demo ——
 * 只能通过 @hx/ui 的公共 API 拿到东西。放在库里会忍不住摸内部,
 * 而那证明不了拓展点开得对不对。
 */

const SOURCE_NOTE = `// 节点定义上带 source 字段, 标的是 dsh-agent-loop 源码里的行号
{
  type: "checkReject",
  label: "被拒绝?",
  category: "2. 轮次",
  source: "index.js:945",          // decision.kind === 'reject'
  execIn: true,
  execOut: ["reject", "enter"],    // 两个分支就是源码里那两个出口
  inputs: [{ id: "decision", label: "决定", type: "decision" }],
}`;

const EXTEND_NOTE = `// 加一个节点 = 加一条定义。蓝图层零改动。
registry.node({
  type: "myLogger",
  label: "我的日志节点",
  category: "自定义",
  execIn: true,
  execOut: ["then"],
  inputs: [{ id: "text", label: "文本", type: "string" }],
  params: [{ id: "level", label: "级别", kind: "select", default: "info",
             options: [{ value: "info", label: "信息" }] }],
});

// 加一种数据类型同理, 之后 image 就能连进 object 输入口 (协变)
registry.type({ id: "image", extends: "object" });`;

export function BlueprintDshPage(): JSX.Element {
  return (
    <div>
      <H2>这是什么</H2>
      <P>
        把 <Code>dsh-agent-loop</Code> 的整个 agent loop 画成一张蓝图。
        不是示意图 —— 每个节点对应源码里一个真实的控制流位置，每条白线对应一个真实的"下一步"，
        节点定义上带 <Code>source</Code> 字段标了行号，可以回去逐条核对。
      </P>
      <P>
        这份图<strong>不在 HX-UI 里</strong>，它住在兄弟包 <Code>HX-Blueprint-Demo</Code>，
        只能通过 <Code>@hx/ui</Code> 的公共 API 拿东西。这是刻意的：
        放在库里会忍不住摸到内部，而那证明不了拓展点开得对不对。
      </P>

      <H2>全貌 (架构层)</H2>
      <P>
        <strong>根图是 10 个大步骤</strong>, 每个大步骤是一个<strong>子图</strong> ——
        双击进入看它"怎么做"。粒度到"照着能 1:1 复现"为止, 不再往下拆到代码分支。
      </P>
      <Preview align="stretch">
        <DshArchitectureDemo />
      </Preview>
      <P>
        这三层是理解 dsh 的关键:
      </P>
      <P>
        <strong>进 (输入 → 请求)。</strong>输入进收件箱后被原子领取, 从持久日志派生出
        本次要发的消息序列, 再由权威 waterfall 定出提示词与可见工具, 最后定路由、绑适配器、
        记请求头、冻结请求。注意<strong>请求头只在必要时重写</strong> —— 否则 KV 前缀缓存
        会从第一个变化的 token 起全部失效。
      </P>
      <P>
        <strong>出 (响应 → 结果)。</strong>流式接收, 每块先查取消, 结算成一条持久助手消息;
        有工具调用就按策略派发(独占构成屏障 / 并行走有界池), 结果与上下文按模型顺序入日志,
        成为下一步的派生依据。
      </P>
      <P>
        <strong>循环与压缩。</strong>步骤给出结束原因后决定: 继续本轮下一步、开新一轮、
        还是先压缩再继续。压缩会改写历史, 所以压完必须<strong>重新组装提示词</strong> ——
        这就是图上压缩回到组装的那条边。
      </P>

      <H2>源码层 (逐条核对用)</H2>
      <P>
        另有一张<strong>对应源码控制流</strong>的图: 60 个节点, 每个带{" "}
        <Code>source</Code> 字段标了 <Code>dsh-agent-loop</Code> 里的行号。
        那是代码流程图, 不是架构图 —— 用来逐条核对, 不是用来看结构。
      </P>
      <Preview align="stretch">
        <DshDemo />
      </Preview>

      <H2>源码对应关系</H2>
      <P>
        几个不那么显然的连线，都是从源码里读出来的：
      </P>
      <P>
        <Code>requestError →(retry) prepareRequest</Code> —— 源码里是 <Code>continue</Code>，
        回到 <Code>while(true)</Code> 顶部。关键是<strong>重试复用已渲染的组装结果</strong>：
        不重新组装、不重跑 <Code>pre-step</Code>、不重复追加 user 消息。所以这条边不能画回
        <Code>stepStart</Code>，那会表达成"重新走一遍准入"。
      </P>
      <P>
        <Code>checkEmpty →(empty) turnEnd</Code> 与 <Code>checkReject →(reject) turnEnd</Code> ——
        两者都是直接 <Code>return false</Code>，轮次以 <Code>completed</Code> / <Code>blocked</Code> 结束，
        <strong>不打开步骤</strong>。空的首批输入不产生 <Code>step/start</Code>。
      </P>
      <P>
        <Code>mode →(exclusive) exclusiveBarrier</Code> / <Code>(parallel) parallelPool</Code> ——
        源码是 <Code>mode === "parallel" ? planned.slice(next) : [first]</Code>：
        独占调用单独跑一个并构成排序屏障，并行安全的整批进有界池，上限 <Code>maxParallelToolCalls</Code>。
      </P>
      <P>
        <Code>wake →(again) kick</Code> —— <Code>turn()</Code> 末尾
        <Code>return true</Code>，而 <Code>kick()</Code> 是 <Code>while (await this.turn())</Code>。
        这条边就是"再来一轮"。
      </P>
      <CodeBlock code={SOURCE_NOTE} />

      <H2>折叠</H2>
      <P>
        三十个节点平铺着看不清结构。图里预置了三个可折叠的分组，对应源码的三个自然段落：
        轮次开启 / 一个步骤 / 工具调度。点上面的按钮折起来，<strong>双击进入</strong>里头那片，
        面包屑退回。
      </P>
      <Callout title="用自己演示自己">
        折叠功能是蓝图库的能力，这张图用它来让自身可读 —— 这比另写一个假例子更有说服力：
        如果它扛不住自己的复杂度，那它对使用方也没用。
      </Callout>

      <H2>怎么拓展</H2>
      <P>
        加一个节点 = 往节点表里加一条定义。<strong>蓝图层零改动</strong> ——
        校验、类型相容、面板、求值全都对新节点立即生效。
      </P>
      <CodeBlock code={EXTEND_NOTE} />
      <P>
        这张 dsh 图本身就是这么来的：<Code>{Object.keys(NODES).length}</Code> 种节点 +
        9 种自定义数据类型，全部写在一个文件里，没有改蓝图库一行代码。
        要加一个"子 Agent 调度"节点，就是再加一条 <Code>registry.node(...)</Code> 然后连上去。
      </P>

      <H2>给 Agent 用的 API</H2>
      <P>
        自定义节点的 API 是给<strong>人</strong>写节点用的。Agent 需要的是另一回事:
        它不该操心坐标, 也不该因为连错一条线就拿不到整张图。
      </P>
      <P>
        所以另有一层 <Code>buildFromAgent()</Code>: <strong>输入极宽松, 输出极严格</strong>。
        不用坐标、可以用自己顺手的 key、连线只写节点名 (端口由两端能力推断)。
        输出则保证: 坐标算好、id 稳定、非法边被拒且<strong>说清为什么</strong>。
      </P>
      <Preview align="stretch">
        <AgentApiDemo />
      </Preview>
      <P>
        三条关键的取舍:
      </P>
      <P>
        <strong>一、即使有错也返回能画的图。</strong>Agent 是迭代式的 —— 它先写一版,
        看报错再修。非法就返回 null 会让它凭空重试; 返回一张"尽力修复过"的图 +
        一份问题清单, 它下一轮就能精确改那一条。
      </P>
      <P>
        <strong>二、布局质量是硬要求, 不是优化项。</strong>叠在一起的图对人类等于没有。
        所以只要没显式给坐标就跑分层布局, 并且<strong>自检</strong>: 有重叠就加大间距重排,
        最多重试三次。上面那个「重叠 N 处」的徽标就是这条的判据。
      </P>
      <P>
        <strong>三、错误翻译成 Agent 能用的语言。</strong>校验层报的错挂在节点 id 上
        (<Code>n1b2c3</Code> 这种), Agent 看到也不知道是哪个 key。所以另做一层翻译,
        报成「节点 "stream" 有必填输入没有连上」, 它下一轮就知道该补哪条边。
      </P>

      <H2>MCP 风格的工具面</H2>
      <P>
        再往上一层是<strong>自描述的工具</strong>: 每个工具有名字、有 JSON Schema、
        有说明文字。Agent 读一遍清单就知道能干什么, 不需要看源码。
      </P>
      <CodeBlock code={`const tools = createBlueprintTools({
  registry,
  getGraph: () => graph,
  setGraph: setGraph,
});

// 清单直接给 MCP 客户端
toolManifest(tools);

// 派发: 失败不抛, 返回 ok:false 加原因
const r = await dispatchTool(tools, "build_graph", { nodes: [...], edges: [...] });`} />
      <P>
        九个工具: <Code>list_node_types</Code> <Code>build_graph</Code>{" "}
        <Code>inspect_graph</Code> <Code>validate_graph</Code> <Code>tidy_layout</Code>{" "}
        <Code>run_graph</Code> <Code>analyze_graph</Code> <Code>export_graph</Code>{" "}
        <Code>import_graph</Code>。上面演示页里的按钮就是它们, 点了能看到
        Agent 视角拿到的文本。
      </P>
      <Callout title="工具是纯函数">
        不持有状态 —— 图由调用方保管, 工具只做变换。所以它能在后端、在 worker、
        在浏览器里跑, 也能并发。这也是为什么 <Code>setGraph</Code> 是可选的:
        只读场景传个 registry 就能用。
      </Callout>

      <H2>换个领域</H2>
      <P>
        同一套库，换一张注册表就是另一个领域。下面是库自带的演示节点（数值 / 比较 / 分支 / 打印），
        与 dsh 那张图共用全部机制。
      </P>
      <Preview align="stretch">
        <OtherDomainDemo />
      </Preview>

      <H2>图的规模</H2>
      <P>
        当前这张 dsh 图：<Badge variant="secondary">{dshAgentLoopGraph.nodes.length} 个节点</Badge>{" "}
        <Badge variant="secondary">{dshAgentLoopGraph.edges.length} 条边</Badge>{" "}
        <Badge variant="secondary">{(dshAgentLoopGraph.comments ?? []).length} 条区间注释</Badge>{" "}
        <Badge variant="secondary">{Object.keys(NODES).length} 种节点定义</Badge>
      </P>
    </div>
  );
}
