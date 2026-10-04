import type { BlueprintGraph, BlueprintRegistry } from "./types";
import { buildFromAgent, countOverlaps, describeGraph, describeRegistry, type AgentBuildInput } from "./agent";
import { autoLayout, applyLayout, countCrossings } from "./layout";
import { validateGraph, findCycles, topoSort } from "./validate";
import { evaluateGraph, findEntries } from "./evaluate";
import { serializeGraph, parseGraph, toPseudoCode } from "./serialize";

/**
 * MCP 风格的工具面。
 *
 * ## 为什么做成"工具"而不是"SDK"
 *
 * SDK 要求调用方懂类型、懂 import、懂错误处理。而 MCP 工具是**自描述**的:
 * 每个工具有名字、有 JSON Schema 的输入输出、有说明文字。Agent (或任何
 * MCP 客户端) 读一遍工具清单就知道能干什么, 不需要看源码。
 *
 * 这一层就是把蓝图的操作**声明成工具**, 附带 schema。宿主拿到 `TOOLS`
 * 可以直接挂到 MCP server 上, 也可以自己 dispatch。
 *
 * ## 三条约定
 *
 *   1. **每个工具都返回文本摘要 + 结构化结果**。Agent 读文本, 程序读结构。
 *      只给 JSON 的话 Agent 要在一堆 id 里猜; 只给文本的话程序没法接。
 *   2. **失败不抛, 返回 ok:false 加原因**。抛异常会让整个 MCP 调用挂掉,
 *      而很多时候错误只是"这条边连不上", 其余部分仍然有效。
 *   3. **工具是纯函数**。不持有状态 —— 图由调用方保管, 工具只做变换。
 *      这样它能在后端、在 worker、在浏览器里跑, 也能并发。
 */

export interface ToolResult {
  readonly ok: boolean;
  /** 给 Agent 读的文本。 */
  readonly text: string;
  /** 给程序读的结构。 */
  readonly data?: unknown;
}

export interface ToolDef {
  readonly name: string;
  readonly title: string;
  readonly description: string;
  readonly inputSchema: Record<string, unknown>;
  readonly run: (input: Record<string, unknown>) => Promise<ToolResult> | ToolResult;
}

/** 工具运行所需的上下文。注册表由宿主提供 —— 工具自己不知道有哪些节点。 */
export interface ToolContext {
  readonly registry: BlueprintRegistry;
  /** 当前正在编辑的图。可变操作需要它。 */
  readonly getGraph?: () => BlueprintGraph;
  /** 应用一张新图。 */
  readonly setGraph?: (g: BlueprintGraph) => void;
}

/**
 * 建一套工具。
 *
 * 为什么是工厂函数而不是导出常量数组: 工具需要 registry, 而 registry 是
 * 每个使用方自己建的。做成工厂, 使用方建 registry 的同时就能拿到工具。
 */
export function createBlueprintTools(ctx: ToolContext): ToolDef[] {
  const { registry } = ctx;

  /**
   * 取当前图。判别用 `"text" in` —— 本仓 strict 关着, 判别式窄化不生效,
   * 写 `if (!g.ok)` 在 else 分支里取 .text 会报 TS2339。见 connect.ts 里同一条。
   */
  const needGraph = (): { graph?: BlueprintGraph; text: string } => {
    const g = ctx.getGraph?.();
    if (!g) return { text: "当前没有打开的图" };
    return { graph: g, text: "" };
  };

  return [
    {
      name: "list_node_types",
      title: "列出可用节点类型",
      description:
        "列出注册中心里所有可用的节点类型, 含每个类型的输入输出端口与类型。" +
        "建图之前先调它, 才能知道能用什么节点、端口叫什么。",
      inputSchema: { type: "object", properties: {}, additionalProperties: false },
      run: () => ({
        ok: true,
        text: describeRegistry(registry),
        data: { types: [...registry.nodeTypes.keys()] },
      }),
    },

    {
      name: "build_graph",
      title: "构建一张图",
      description:
        "按节点与连线描述构建一张图。**不需要给坐标** —— 会自动做分层布局, " +
        "保证节点不重叠、连线尽量少交叉。返回每个 key 对应的节点 id, 便于后续精确修改。" +
        "连线可以只写节点 key (自动推断端口), 也可以写 key.port 指名端口。",
      inputSchema: {
        type: "object",
        properties: {
          nodes: {
            type: "array",
            description: "节点列表",
            items: {
              type: "object",
              properties: {
                key: { type: "string", description: "你给这个节点起的名字, 连线时引用它" },
                type: { type: "string", description: "节点类型, 见 list_node_types" },
                title: { type: "string", description: "显示标题" },
                params: { type: "object", description: "节点参数" },
                x: { type: "number", description: "可选。给了就不参与自动布局" },
                y: { type: "number" },
              },
              required: ["type"],
            },
          },
          edges: {
            type: "array",
            description: "连线列表",
            items: {
              type: "object",
              properties: {
                from: { type: "string", description: "起点, 形如 'key' 或 'key.port'" },
                to: { type: "string", description: "终点, 形如 'key' 或 'key.port'" },
              },
              required: ["from", "to"],
            },
          },
          comments: {
            type: "array",
            description: "区间注释",
            items: {
              type: "object",
              properties: {
                title: { type: "string" },
                body: { type: "string" },
                nodes: { type: "array", items: { type: "string" }, description: "属于这块注释的节点 key" },
              },
            },
          },
        },
        required: ["nodes"],
      },
      run: (input) => {
        const r = buildFromAgent(registry, input as unknown as AgentBuildInput);
        /**
         * 建完就落到当前图上。
         *
         * 第一版只返回不写入 —— 于是 Agent 调完 build_graph, 编辑器里
         * 还是空的, 而它从 text 里看到"建好 7 个节点", 以为成功了。
         * 这种"说成功但实际没生效"是最难查的一类失败。
         */
        ctx.setGraph?.(r.graph);
        const lines: string[] = [];
        lines.push(`建好 ${r.graph.nodes.length} 个节点 / ${r.graph.edges.length} 条连线。`);
        lines.push(
          `布局: ${r.layoutReport.auto ? "自动分层" : "使用你给的坐标"}, ` +
            `重叠 ${r.layoutReport.overlaps} 处, 交叉 ${r.layoutReport.crossings} 处` +
            (r.layoutReport.retries ? ` (为消除重叠重试 ${r.layoutReport.retries} 次)` : "")
        );
        if (r.rejected.length) {
          lines.push("", `被拒的连线 ${r.rejected.length} 条:`);
          for (const x of r.rejected) lines.push(`  ✕ ${x.from} → ${x.to}: ${x.message}`);
        }
        if (r.warnings.length) {
          lines.push("", "提示:");
          for (const w of r.warnings) lines.push(`  ! ${w}`);
        }
        lines.push("", "key → id:");
        for (const [k, id] of r.ids) lines.push(`  ${k} = ${id}`);
        return { ok: r.ok, text: lines.join("\n"), data: { graph: r.graph, ids: [...r.ids], rejected: r.rejected } };
      },
    },

    {
      name: "inspect_graph",
      title: "查看当前图",
      description: "摘要当前图: 每个节点的类型、标题、连线关系, 以及存在的问题。",
      inputSchema: { type: "object", properties: {}, additionalProperties: false },
      run: () => {
        const g = needGraph();
        if (!g.graph) return { ok: false, text: g.text };
        return { ok: true, text: describeGraph(registry, g.graph), data: { graph: g.graph } };
      },
    },

    {
      name: "validate_graph",
      title: "校验图",
      description: "检查图是否合法: 类型是否匹配、必填输入有没有连、有没有环、子图内部有没有问题。",
      inputSchema: { type: "object", properties: {}, additionalProperties: false },
      run: () => {
        const g = needGraph();
        if (!g.graph) return { ok: false, text: g.text };
        const v = validateGraph(registry, g.graph);
        const errs = v.issues.filter((i) => i.level === "error");
        const warns = v.issues.filter((i) => i.level === "warning");
        const text = [
          errs.length ? `${errs.length} 个错误:` : "校验通过",
          ...errs.map((i) => `  ✕ ${i.message}`),
          warns.length ? `${warns.length} 个警告:` : "",
          ...warns.map((i) => `  ! ${i.message}`),
        ].filter(Boolean).join("\n");
        return { ok: errs.length === 0, text, data: { issues: v.issues } };
      },
    },

    {
      name: "tidy_layout",
      title: "整理布局",
      description: "按流向重新排布节点 (分层布局)。确定性: 同样的图永远得到同样的坐标。",
      inputSchema: {
        type: "object",
        properties: {
          rankGap: { type: "number", description: "层间水平间距, 默认 120" },
          nodeGap: { type: "number", description: "层内垂直间距, 默认 40" },
        },
      },
      run: (input) => {
        const g = needGraph();
        if (!g.graph) return { ok: false, text: g.text };
        const next = applyLayout(
          g.graph,
          autoLayout(registry, g.graph, {
            rankGap: numOr(input.rankGap, undefined),
            nodeGap: numOr(input.nodeGap, undefined),
          })
        );
        ctx.setGraph?.(next);
        const text =
          `已重排 ${next.nodes.length} 个节点。重叠 ${countOverlaps(registry, next)} 处, ` +
          `交叉 ${countCrossings(registry, next, posOf_(next))} / 重叠 ${countOverlaps(registry, next)} 处。`;
        return { ok: true, text, data: { graph: next } };
      },
    },

    {
      name: "run_graph",
      title: "运行图",
      description: "求值。有执行流时沿执行流走 (没走到的分支不求值), 否则按拓扑序全跑。",
      inputSchema: {
        type: "object",
        properties: {
          entry: { type: "string", description: "执行入口节点 id。不传则自动找入口" },
        },
      },
      run: async (input) => {
        const g = needGraph();
        if (!g.graph) return { ok: false, text: g.text };
        const entry = typeof input.entry === "string" ? input.entry : findEntries(g.graph)[0];
        const r = await evaluateGraph(registry, g.graph, entry ? { entry } : {});
        const lines: string[] = [];
        for (const [id, vals] of r.outputs) lines.push(`${id}: ${JSON.stringify(vals)}`);
        for (const [id, msg] of r.errors) lines.push(`✕ ${id}: ${msg}`);
        return {
          ok: r.ok,
          text: lines.length ? lines.join("\n") : "(没有输出)",
          data: { outputs: [...r.outputs], errors: [...r.errors] },
        };
      },
    },

    {
      name: "analyze_graph",
      title: "分析图结构",
      description: "报告环、拓扑序、执行入口、交叉数、重叠数。用于判断图能不能跑、好不好看。",
      inputSchema: { type: "object", properties: {}, additionalProperties: false },
      run: () => {
        const g = needGraph();
        if (!g.graph) return { ok: false, text: g.text };
        const execOnly = g.graph.edges.filter((e) => e.kind === "exec");
        const cycles = findCycles({ ...g.graph, edges: execOnly });
        const order = topoSort(g.graph);
        const entries = findEntries(g.graph);
        const text = [
          `节点 ${g.graph.nodes.length} / 连线 ${g.graph.edges.length}`,
          `执行入口: ${entries.length ? entries.join(", ") : "无"}`,
          `拓扑序: ${order ? order.join(" → ") : "有环, 无法确定"}`,
          `执行流回路: ${cycles.length} 个${cycles.length ? " (循环是刻意的, 不算错误)" : ""}`,
          `交叉 ${countCrossings(registry, g.graph, posOf_(g.graph))} / 重叠 ${countOverlaps(registry, g.graph)}`,
        ].join("\n");
        return { ok: true, text, data: { cycles, order, entries } };
      },
    },

    {
      name: "export_graph",
      title: "导出图",
      description: "导出成 JSON (可存文件、可进 git diff) 或伪代码 (便于人工确认连对了没有)。",
      inputSchema: {
        type: "object",
        properties: {
          format: { type: "string", enum: ["json", "pseudo"], description: "默认 json" },
        },
      },
      run: (input) => {
        const g = needGraph();
        if (!g.graph) return { ok: false, text: g.text };
        if (input.format === "pseudo") {
          return { ok: true, text: toPseudoCode(registry, g.graph) };
        }
        const json = JSON.stringify(serializeGraph(g.graph), null, 2);
        return { ok: true, text: json, data: { json } };
      },
    },

    {
      name: "import_graph",
      title: "导入图",
      description: "从 JSON 导入。坏数据会返回失败并说明, 不会把当前图弄坏。",
      inputSchema: {
        type: "object",
        properties: {
          json: { type: "string", description: "图的 JSON 字符串" },
        },
        required: ["json"],
      },
      run: (input) => {
        let raw: unknown;
        try {
          raw = JSON.parse(String(input.json ?? ""));
        } catch {
          return { ok: false, text: "JSON 解析失败" };
        }
        const g = parseGraph(raw);
        if (!g) return { ok: false, text: "不是合法的图: 缺少 nodes / edges" };
        ctx.setGraph?.(g);
        return { ok: true, text: `导入 ${g.nodes.length} 个节点 / ${g.edges.length} 条连线`, data: { graph: g } };
      },
    },
  ];
}

/** MCP 工具清单 (不含 run)。给客户端列工具用。 */
export function toolManifest(tools: readonly ToolDef[]): unknown[] {
  return tools.map((t) => ({
    name: t.name,
    title: t.title,
    description: t.description,
    inputSchema: t.inputSchema,
  }));
}

/** 按名字派发。找不到就返回失败 —— 不抛, 免得整个调用挂掉。 */
export async function dispatchTool(
  tools: readonly ToolDef[],
  name: string,
  input: Record<string, unknown> = {}
): Promise<ToolResult> {
  const t = tools.find((x) => x.name === name);
  if (!t) {
    return {
      ok: false,
      text: `没有这个工具: ${name}。可用: ${tools.map((x) => x.name).join(", ")}`,
    };
  }
  try {
    return await t.run(input);
  } catch (e) {
    return { ok: false, text: `工具 ${name} 出错: ${e instanceof Error ? e.message : String(e)}` };
  }
}

/** countCrossings 需要显式坐标 —— 从图里取。 */
function posOf_(g: BlueprintGraph): ReadonlyMap<string, { x: number; y: number }> {
  return new Map(g.nodes.map((n) => [n.id, { x: n.x, y: n.y }]));
}

function numOr(v: unknown, d: number | undefined): number | undefined {
  return typeof v === "number" && Number.isFinite(v) ? v : d;
}
