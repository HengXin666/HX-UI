import type { JSX } from "react";
import { Badge } from "@hx/ui";
import { DshDemo, OtherDomainDemo, NODES, dshAgentLoopGraph } from "@hx/blueprint-demo";
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

      <H2>全貌</H2>
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
