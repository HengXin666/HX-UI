import { useMemo, useState, type JSX } from "react";
import type { BlueprintGraph } from "@hx/ui";
import {
  BlueprintEditor, BlueprintCanvas, BlueprintPalette,
  demoRegistry, createDemoRegistry, demoGraph,
  createRegistry, canConnect, evaluateGraph, validateGraph, findCycles, topoSort,
  serializeGraph, parseGraph,
  collapseToSubgraph, expandSubgraph, subgraphRefCount, registerTunnels,
  commentAround, moveCommentWithNodes, nodesInComment,
  Badge, Button, Card, CardContent, CardHeader, CardTitle, cn,
} from "@hx/ui";
import { H2, P, Preview, PropsTable, Callout, Code, CodeBlock as DocCode } from "../components/DocKit";

/**
 * 蓝图库文档页。
 *
 * 每个示例都是**活的**: 拖一条线、连错了、跑到哪个分支, 都在这里看得见。
 * 静态截图说明不了"连接合法性"这类东西 —— 它的全部价值在于实时反馈。
 */

const REG_DEFINE = `import { createRegistry } from "@hx/ui";

const reg = createRegistry();

// 自定义数据类型: image 是 object 的子类型
reg.type({ id: "image", label: "图像", colorClass: "bg-amber-400", extends: "object" });

// 自定义节点: 一个文件能定义几十个
reg.node({
  type: "blur",
  label: "高斯模糊",
  category: "图像处理",
  inputs: [
    { id: "src",  label: "源图",   type: "image" },
    { id: "k",    label: "半径",   type: "number", default: 3 },
  ],
  outputs: [{ id: "out", label: "结果", type: "image" }],
  params: [{ id: "k", label: "半径", kind: "number", default: 3, min: 0, max: 64 }],
  evaluate: ({ inputs, params }) => ({ out: blur(inputs.src, params.k) }),
});`;

const REG_EXEC = `// 有副作用的节点必须有 execIn —— 否则它的求值时机无法确定
reg.node({
  type: "save",
  label: "保存文件",
  category: "输出",
  execIn: true,            // 执行入口: 它只能被"走到"才执行
  execOut: ["then"],       // 执行出口
  inputs: [{ id: "data", label: "数据", type: "any" }],
  params: [{ id: "path", label: "路径", kind: "text", default: "out.png" }],
  evaluate: ({ inputs, params }) => {
    fs.writeFileSync(params.path, inputs.data);
    return {};
  },
});`;

const VALIDATE_HOOK = `// 业务规则: 一个节点自带的校验钩子
reg.validator("save", ({ params }) => {
  const p = String(params.path ?? "");
  if (!p.endsWith(".png")) {
    return [{ code: "custom", level: "warning", message: "路径不是 .png, 可能存成错的格式" }];
  }
  return [];
});

// 提交前挡一道
const v = validateGraph(reg, graph);
if (!v.ok) return;   // v.issues 里每条都带 code / nodeIds / edgeIds`;

const CONNECT_RULE = `// 连接判定只有一个函数, 拖拽过程与落地都调它 —— 判据不能有两份
const r = canConnect(reg, graph, { node: "a", port: "out" }, { node: "b", port: "src" });

if ("reason" in r) {
  // r.reason: "type-mismatch" | "self-loop" | "duplicate" | "direction" | ...
  // UI 靠 reason 决定提示文案与线色, 不靠 message
} else {
  // r.kind: "data" | "exec"
  // r.replaces: 独占输入上会被顶掉的那条边 id (可以给提示"将替换")
}`;

const EVAL_CODE = `// 求值: 沿执行流走, 走过的分支才算
const result = await evaluateGraph(reg, graph, { entry: "start" });

result.outputs   // Map<nodeId, Record<portId, value>>
result.errors    // Map<nodeId, string>
result.ok        // 有没有节点抛错

// 只想按顺序跑一遍数据节点 (没有执行流时): 不传 entry 就退化为拓扑序全跑
const all = await evaluateGraph(reg, graph);`;

const SERIAL_CODE = `// 存: 就是一个 JSON
const json = JSON.stringify(serializeGraph(graph));

// 读: 形状校验在读取侧, 所以"半成品"也能存
const loaded = parseGraph(JSON.parse(json));   // 坏数据返回 null
const v = validateGraph(reg, loaded);          // 语义校验另走这一步`;

/** 完整编辑器: 用演示节点库跑起来。 */
function EditorDemo(): JSX.Element {
  const [graph, setGraph] = useState<BlueprintGraph>(demoGraph as BlueprintGraph);
  const [lines, setLines] = useState<string[]>([]);
  const reg = demoRegistry;
  const v = validateGraph(reg, graph);

  /**
   * 求值并把"被走到的打印节点"的行收上来。
   *
   * 关键点是**只有被走到的分支才求值** —— 把 n2 改成 3 再点运行,
   * 会看到走的是"假"那条。这正是执行流存在的理由。
   */
  const run = async () => {
    const r = await evaluateGraph(reg, graph, { entry: "n1" });
    const got: string[] = [];
    for (const [id, out] of r.outputs) {
      const def = reg.nodeTypes.get(graph.nodes.find((n) => n.id === id)?.type ?? "");
      if (def?.type === "log" && typeof out.line === "string") got.push(out.line);
    }
    for (const [id, msg] of r.errors) got.push(`✕ ${id}: ${msg}`);
    setLines(got.length ? got : ["(没有打印节点被走到)"]);
  };

  return (
    <div className="w-full space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant={v.ok ? "success" : "destructive"}>
          {v.ok ? "校验通过" : `${v.issues.filter((i) => i.level === "error").length} 个错误`}
        </Badge>
        <span className="text-[11px] text-muted-foreground">
          {graph.nodes.length} 节点 / {graph.edges.length} 连线
        </span>
        <Button
          size="sm"
          variant="outline"
          className="ml-auto"
          onClick={() => { void run(); }}
        >
          运行
        </Button>
        <Button size="sm" variant="outline" onClick={() => setGraph(demoGraph)}>
          重置
        </Button>
      </div>

      <BlueprintEditor
        registry={reg}
        value={graph}
        onChange={setGraph}
        height={420}
        showIssues={false}
      />

      {lines.length > 0 && (
        <div className="rounded-lg border border-border bg-muted/30 px-3 py-2 font-mono text-[11.5px]">
          {lines.map((l, i) => (
            <div key={i} className={cn(l.startsWith("✕") ? "text-destructive" : "text-foreground")}>{l}</div>
          ))}
        </div>
      )}

      <div className="flex flex-wrap gap-1.5 text-[11px] text-muted-foreground">
        <span>试试:</span>
        <Code>滚轮缩放</Code>
        <Code>中键 / 空白处拖动平移</Code>
        <Code>从圆点拖到另一个圆点连线</Code>
        <Code>从已连的输入口拖出 = 改接</Code>
        <Code>拖到空白处松手 = 弹面板加节点</Code>
        <Code>框选后 Delete 删除</Code>
        <Code>把「数值」改成 3 再运行 → 走另一条分支</Code>
      </div>
    </div>
  );
}

/** 折叠为子图: 现场演示"把一片节点折成一个, 再展开回去"。 */
function SubgraphDemo(): JSX.Element {
  const reg = createDemoRegistry();
  registerTunnels(reg);
  const [step, setStep] = useState<"原图" | "已折叠" | "展开后">("原图");
  const [folded, setFolded] = useState<BlueprintGraph | null>(null);

  const doCollapse = () => {
    const g = collapseToSubgraph(reg, demoGraph, ["n2", "n3", "n4"], { label: "算比较" });
    setFolded(g);
    setStep("已折叠");
  };
  const doExpand = () => {
    if (!folded) return;
    const sub = folded.nodes.find((n) => n.subgraph)!;
    setFolded(expandSubgraph(folded, sub.id));
    setStep("展开后");
  };

  const g: BlueprintGraph = folded ?? (demoGraph as BlueprintGraph);
  const v = validateGraph(reg, g);
  const sub = g.nodes.find((n) => n.subgraph);
  const sg = sub?.subgraph ? g.subgraphs?.[sub.subgraph] : undefined;

  return (
    <div className="w-full space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        <Button size="sm" variant="outline" onClick={doCollapse} disabled={step !== "原图"}>
          折叠 n2/n3/n4
        </Button>
        <Button size="sm" variant="outline" onClick={doExpand} disabled={step !== "已折叠"}>
          展开
        </Button>
        <Button size="sm" variant="ghost" onClick={() => { setFolded(null); setStep("原图"); }}>
          重置
        </Button>
        <Badge variant={v.ok ? "success" : "destructive"}>{v.ok ? "校验通过" : "有错"}</Badge>
        <span className="ml-auto text-[11px] tabular-nums text-muted-foreground">
          {g.nodes.length} 节点 / {g.edges.length} 连线
        </span>
      </div>

      <BlueprintCanvas registry={reg} graph={g} height={300} />

      <div className="rounded-lg border border-border bg-muted/30 px-3 py-2 text-[11.5px] leading-relaxed text-muted-foreground">
        {step === "原图" && "三个节点 (两个数值 + 一个比较) 在根图上。点「折叠」把它们收成一个子图节点。"}
        {step === "已折叠" && sg && (
          <>
            外层少了三个节点, 多了一个「算比较」节点。它对外只有
            <Code>{sg.outputs?.map((p) => p.id).join(", ") || "无"}</Code> 一个输出口,
            输入口为零 —— 数值节点被关在里面了。原来那条「比较结果 → 分支条件」
            的边自动改接到子图节点身上。双击它可以进入。
          </>
        )}
        {step === "展开后" && (
          <>
            展开后节点数与边数回到原样, 且求值结果与折叠前一致 ——
            这是折叠语义正确性的硬判据。子图定义<strong>默认保留</strong>:
            一个子图可能有多个调用点, 展开其中一个就把定义删了, 别的调用点会立刻悬空。
          </>
        )}
      </div>
    </div>
  );
}

/** 区间注释: 拖注释, 里面的节点跟着走。 */
function CommentDemo(): JSX.Element {
  const reg = createDemoRegistry();
  const built = useMemo(() => commentAround(reg, demoGraph as BlueprintGraph, ["n2", "n3", "n4"], { title: "算出比较结果" }), [reg]);
  const [g, setG] = useState<BlueprintGraph>(built.graph as BlueprintGraph);
  const [moved, setMoved] = useState(0);

  const nudge = () => {
    const id = g.comments?.[0]?.id;
    if (!id) return;
    setG(moveCommentWithNodes(reg, g, id, { dx: 40, dy: 24 }));
    setMoved((m) => m + 1);
  };

  const inside = g.comments?.[0] ? nodesInComment(reg, g, g.comments[0].id) : [];

  return (
    <div className="w-full space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        <Button size="sm" variant="outline" onClick={nudge}>
          把注释往右下拖一格
        </Button>
        <Button size="sm" variant="ghost" onClick={() => { setG(built.graph); setMoved(0); }}>
          重置
        </Button>
        <span className="ml-auto text-[11px] text-muted-foreground">
          框内 {inside.length} 个节点会跟着走 · 已移动 {moved} 次
        </span>
      </div>

      <BlueprintCanvas registry={reg} graph={g} height={300} />

      <div className="text-[11.5px] leading-relaxed text-muted-foreground">
        判据是「<strong>完全落在框里</strong>」而不是「相交」。相交会让一次拖动带走半个图 ——
        注释框通常画得比内容大一圈, 相交判定几乎必然命中相邻节点。
        完全包含保守但可预测: 你能一眼看出哪些会被带走。
        注释不是节点: 不连线、不参与求值、不影响校验。
      </div>
    </div>
  );
}

/** 类型相容: 现场演示协变与 any。 */
function TypeDemo(): JSX.Element {
  const reg = createRegistry();
  reg.type({ id: "image", label: "图像", extends: "object" });
  reg.type({ id: "mask", label: "遮罩", extends: "image" });

  const cases: Array<{ from: string; to: string; note: string }> = [
    { from: "number", to: "number", note: "同类型" },
    { from: "number", to: "string", note: "不同类型" },
    { from: "image", to: "object", note: "子类型 → 父类型 (协变, 放行)" },
    { from: "object", to: "image", note: "父类型 → 子类型 (不放行)" },
    { from: "mask", to: "image", note: "跨两级也放行" },
    { from: "anything", to: "number", note: "未注册类型 → 只与自身/any 相容" },
    { from: "number", to: "any", note: "任何类型 → any" },
    { from: "any", to: "number", note: "any → 任何类型" },
  ];

  return (
    <div className="w-full">
      <table className="w-full border-collapse text-[12px]">
        <thead>
          <tr className="border-b border-border text-left text-muted-foreground">
            <th className="py-1.5 pr-3 font-normal">from</th>
            <th className="py-1.5 pr-3 font-normal">to</th>
            <th className="py-1.5 pr-3 font-normal">结论</th>
            <th className="py-1.5 font-normal">为什么</th>
          </tr>
        </thead>
        <tbody>
          {cases.map((c) => {
            const ok = reg.assignable(c.from, c.to);
            return (
              <tr key={`${c.from}-${c.to}`} className="border-b border-border/40">
                <td className="py-1.5 pr-3 font-mono text-[11px]">{c.from}</td>
                <td className="py-1.5 pr-3 font-mono text-[11px]">{c.to}</td>
                <td className="py-1.5 pr-3">
                  <span className={cn("font-mono text-[11px]", ok ? "text-emerald-400" : "text-destructive")}>
                    {ok ? "可连" : "不可连"}
                  </span>
                </td>
                <td className="py-1.5 text-muted-foreground">{c.note}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

/** 环检测。 */
function CycleDemo(): JSX.Element {
  const [withCycle, setWithCycle] = useState(true);
  const base = {
    nodes: [
      { id: "a", type: "number", x: 0, y: 0, params: { v: 1 } },
      { id: "b", type: "math", x: 200, y: 0 },
      { id: "c", type: "math", x: 400, y: 0 },
    ],
    edges: [
      { id: "e1", from: { node: "a", port: "value" }, to: { node: "b", port: "a" }, kind: "data" as const },
      { id: "e2", from: { node: "b", port: "out" }, to: { node: "c", port: "a" }, kind: "data" as const },
    ],
  };
  const graph = withCycle
    ? { ...base, edges: [...base.edges, { id: "e3", from: { node: "c", port: "out" }, to: { node: "b", port: "b" }, kind: "data" as const }] }
    : base;
  const reg = createDemoRegistry();
  const cycles = findCycles(graph);
  const order = topoSort(graph);
  const v = validateGraph(reg, graph);

  return (
    <div className="w-full space-y-2">
      <div className="flex items-center gap-2">
        <Button size="sm" variant={withCycle ? "default" : "outline"} onClick={() => setWithCycle(true)}>
          有环 (c → b)
        </Button>
        <Button size="sm" variant={!withCycle ? "default" : "outline"} onClick={() => setWithCycle(false)}>
          无环
        </Button>
        <span className="ml-auto text-[11px] text-muted-foreground">
          拓扑序: {order ? order.join(" → ") : "null (有环)"}
        </span>
      </div>
      <div className="rounded-lg border border-border bg-muted/30 px-3 py-2 text-[12px]">
        {cycles.length === 0 ? (
          <span className="text-emerald-400">无环。校验: {v.ok ? "通过" : "有其它错误"}</span>
        ) : (
          <div className="space-y-1">
            <div className="text-destructive">检出 {cycles.length} 个环: {cycles.map((c) => c.join(" → ")).join(" ｜ ")}</div>
            <div className="text-muted-foreground">
              环的报错挂在**边**上而不是节点上 —— 删掉环上任意一条边都能解开, 挂节点会让人以为要删节点。
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/** 只用画布的裸用法。 */
function CanvasOnlyDemo(): JSX.Element {
  const [graph, setGraph] = useState<BlueprintGraph>({
    nodes: [
      { id: "x", type: "text", x: 20, y: 30, params: { v: "hx" } },
      { id: "y", type: "math", x: 260, y: 60 },
    ],
    edges: [],
  });
  const [sel, setSel] = useState<string[]>([]);
  const reg = demoRegistry;

  return (
    <div className="w-full space-y-2">
      <BlueprintCanvas
        registry={reg}
        graph={graph}
        selected={new Set(sel)}
        height={260}
        onSelect={(ids) => setSel([...ids])}
        onConnect={(from, to) => {
          const r = canConnect(reg, graph, from, to);
          if ("reason" in r) return;
          setGraph((g) => ({ ...g, edges: [...g.edges, { id: `e${g.edges.length}`, from, to, kind: r.kind }] }));
        }}
        onNodesMove={(moves) => {
          const byId = new Map(moves.map((m) => [m.id, m]));
          setGraph((g) => ({ ...g, nodes: g.nodes.map((n) => { const m = byId.get(n.id); return m ? { ...n, x: m.x, y: m.y } : n; }) }));
        }}
      />
      <div className="text-[11px] text-muted-foreground">
        这里没有 useBlueprint、没有校验、没有左侧面板 —— Canvas 是纯展示 + 事件, 判据你自己调。
      </div>
    </div>
  );
}

export function BlueprintPage(): JSX.Element {
  return (
    <div>
      <H2>它解决什么</H2>
      <P>
        一张可拖拽的节点图。节点是**注册**进来的 (不是改库源码),
        两个端口能不能连由**类型**决定, 连错了立刻看得见。
      </P>
      <P>
        分四层, 可以只取一层: <Code>registry</Code> 注册中心 (纯 TS, 无 React)、
        <Code>canConnect / validateGraph</Code> 判定与校验 (纯函数)、
        <Code>useBlueprint</Code> 状态命令集、<Code>BlueprintCanvas / Editor</Code> 渲染。
        前两层没有 React 也能跑, 所以后端能拿同一份判据校验上传上来的图。
      </P>

      <H2>完整编辑器</H2>
      <Preview align="stretch">
        <EditorDemo />
      </Preview>

      <H2>定义一个节点</H2>
      <P>
        注册中心是普通的 TS 对象, 不用 Context —— 节点定义是静态的,
        而且校验函数在 React 之外 (后端、单测) 也要能跑。
      </P>
      <DocCode code={REG_DEFINE} />
      <P>
        有副作用的节点必须挂 <Code>execIn</Code>。这不是形式主义:
        没有执行入口的节点, 求值时机只能靠拓扑序, 而拓扑序里"分支"没有意义 ——
        两条分支的下游都会被算到。
      </P>
      <DocCode code={REG_EXEC} />

      <H2>折叠为子图 (进入 / 展开)</H2>
      <P>
        几十上百个节点的图靠缩放是找不完的 —— 折叠成子图是唯一能让它保持可读的手段。
        框选一批节点 → 折叠，得到一个新的子图节点，<strong>双击进入</strong>里头那片，
        面包屑可以退回外层。
      </P>
      <Preview align="stretch">
        <SubgraphDemo />
      </Preview>
      <P>
        关键设计：子图的进出端点做成<strong>真实节点</strong>（隧道）。
        这样子图内部的连线就是普通的边，于是校验、环检测、拓扑序、求值
        <strong>全都不需要为子图写任何特例</strong> —— 它们看到的就是一张普通的图。
        代价是多一个要解释的概念，但比让每个下游函数都判一次「我是不是在子图里」好得多。
      </P>
      <Callout title="子图定义默认保留">
        一个子图可以有多个调用点（改一处全变）。展开其中一个时，定义会留着 ——
        否则别的调用点会立刻变成悬空引用。只有确认没有别的引用了才删。
      </Callout>

      <H2>区间注释</H2>
      <P>
        就是 UE5 的 Comment：画布上一个带标题的矩形，给一片节点加个说明框。
        它<strong>不是节点</strong> —— 不连线、不参与求值、不影响校验。
      </P>
      <Preview align="stretch">
        <CommentDemo />
      </Preview>
      <DocCode code={`// 框选一批节点 -> 得到刚好包住它们的注释框
const r = commentAround(reg, graph, selectedIds, { title: "这一段负责鉴权" });

// 拖动注释: 完全落在框里的节点跟着走, 框外的不动
const next = moveCommentWithNodes(reg, graph, commentId, { dx: 40, dy: 24 });`} />
      <P>
        只有<strong>完全落在框里</strong>的节点才会被带走。点在注释空白处会穿透过去起框选 ——
        否则注释会挡住整片区域的操作。
      </P>

      <H2>连接判定</H2>
      <P>
        拖线时要问两件事 (悬停能不能放、松手合不合法), 两件事必须是**同一条规则**。
        写成两处迟早出现"提示能连、连完报错"。所以判定只有 <Code>canConnect</Code> 一个函数。
      </P>
      <DocCode code={CONNECT_RULE} />
      <Callout title="独占输入">
        独占输入被占时不算错 —— 新线直接顶掉旧线 (UE5 与 ComfyUI 都是这样),
        并回传 <Code>replaces</Code> 让 UI 提示"将替换"。报个错逼人先去删线是纯粹的折磨。
      </Callout>

      <H2>类型相容</H2>
      <Preview align="stretch">
        <TypeDemo />
      </Preview>
      <P>
        沿 <Code>extends</Code> 链向上走, 子类型能喂父类型 (协变), 反过来不行。
        <Code>any</Code> 两个方向都通。类型 id 是开放 string, 内置那几个只是默认值。
      </P>

      <H2>校验</H2>
      <P>
        分四层, 顺序有讲究: 先查结构 (类型注册了吗、端口存在吗), 再查局部 (类型对不对、必填有没有连),
        再查全局 (环), 最后跑业务钩子。拿一个未知端口去做类型比较没有意义, 而且会产出两条互相矛盾的报错。
      </P>
      <DocCode code={VALIDATE_HOOK} />
      <Preview align="stretch">
        <CycleDemo />
      </Preview>

      <H2>求值</H2>
      <P>
        按拓扑序 + 结果缓存, 保证菱形图上公共上游只算一次。有执行流时沿 exec 边走,
        <strong>没走到的分支不求值</strong> —— 这正是分支的语义。
      </P>
      <DocCode code={EVAL_CODE} />
      <Callout title="求值是可选项">
        节点上的 <Code>evaluate</Code> 是可选的。不提供就当"把输入透传到同名输出",
        图不会断。只做配置编辑器 / 导出给后端的用法根本不需要它。
      </Callout>

      <H2>序列化</H2>
      <P>
        格式就是一个 JSON, 不加密、不加版本号以外的元数据 —— 蓝图是用户资产,
        要能进 git diff、能被人手改。
      </P>
      <DocCode code={SERIAL_CODE} />

      <H2>只用画布</H2>
      <P>
        要自定义布局 (嵌进向导、面板变抽屉) 时别用 Editor, 直接用 Canvas:
        它只做展示与事件, 图的状态与判据都在你手里。
      </P>
      <Preview align="stretch">
        <CanvasOnlyDemo />
      </Preview>

      <H2>API</H2>
      <PropsTable
        rows={[
          { name: "createRegistry()", type: "BlueprintRegistryImpl", desc: "建注册中心, 预置内置类型" },
          { name: ".node(def)", type: "this", desc: "注册节点类型, 可链式" },
          { name: ".type(def)", type: "this", desc: "注册数据类型, extends 表达子类型" },
          { name: ".validator(type, fn)", type: "() => void", desc: "装业务校验钩子, 返回拆卸函数" },
          { name: ".assignable(from, to)", type: "boolean", desc: "类型相容判定" },
          { name: "canConnect(reg, g, from, to)", type: "ConnectResult", desc: "连接合法性, 唯一判据" },
          { name: "applyConnect(reg, g, from, to, id)", type: "BlueprintGraph | null", desc: "落一条边 (会顶掉独占输入上的旧边)" },
          { name: "validateGraph(reg, g, opts)", type: "GraphValidation", desc: "四层校验, 结果按节点/边索引" },
          { name: "findCycles(g)", type: "string[][]", desc: "枚举所有环" },
          { name: "topoSort(g)", type: "string[] | null", desc: "拓扑序, 有环返回 null" },
          { name: "upstreamOf(g, id)", type: "Set<string>", desc: "递归上游, 用于增量重算" },
          { name: "evaluateGraph(reg, g, opts)", type: "Promise<EvalResult>", desc: "求值, entry 指定执行入口" },
          { name: "serializeGraph(g) / parseGraph(raw)", type: "SerializedGraph / Graph | null", desc: "存读" },
          { name: "useBlueprint(opts)", type: "BlueprintApi", desc: "受控/非受控图状态 + 命令集" },
          { name: "BlueprintCanvas", type: "component", desc: "画布: 平移/缩放/拖线/框选" },
          { name: "BlueprintPalette", type: "component", desc: "节点面板, 分组 + 模糊搜索" },
          { name: "BlueprintEditor", type: "component", desc: "默认形态: 面板 + 画布 + 诊断" },
        ]}
      />

      <H2>三条硬约定</H2>
      <P>
        一、端口一律竖排, 行高固定 20px —— 那个数值与 <Code>geometry.PORT_ROW</Code> 绑死,
        改一处不改另一处, 连线端点会偏离圆点。
      </P>
      <P>
        二、判据只有一份。画布的拖拽反馈、<Code>applyConnect</Code> 的落地、
        后端的提交校验, 全调 <Code>canConnect</Code>。
      </P>
      <P>
        三、颜色走 token。端口圆点的颜色由 <Code>DataTypeDef.colorClass</Code> 给,
        组件里不出现硬编色值 —— 换肤时这里要跟着变。
      </P>
    </div>
  );
}
