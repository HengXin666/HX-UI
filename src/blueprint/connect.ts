import type {
  BlueprintGraph,
  BlueprintRegistry,
  PortDef,
  PortRef,
} from "./types";
import { EXEC } from "./types";

/**
 * 连接判定 —— 蓝图库的心脏。
 *
 * ## 为什么它必须是一个纯函数
 *
 * 拖线时 UI 要问两件事, 而这两件事的答案是**同一条规则**:
 *   1. 悬停到某个端口上时, 能不能放? (要即时反馈, 每帧都在问)
 *   2. 松手之后, 这条边合不合法? (要落地判据)
 * 若两处各写一遍, 迟早出现"提示能连、连完却报错"。所以判定只有一份
 * `canConnect`, 拖拽过程与提交都调它。
 *
 * ## 判据顺序 (有讲究, 别随手调)
 *
 * 先查"找不找得到", 再查"会不会重复/占位", 最后查"类型对不对"。
 * 反过来会先拿一个不存在的端口去做类型比较, 报错信息连端口名都说不出。
 */

/** 找不到端口/节点时的具体原因。UI 靠它决定提示文案, 不靠 message。 */
export type ConnectFailReason =
  | "missing-node"
  | "missing-port"
  | "direction"
  | "self-loop"
  | "duplicate"
  | "occupied"
  | "type-mismatch";

export type ConnectResult =
  | {
      readonly ok: true;
      readonly kind: "data" | "exec";
      /** 这条线会顶掉的输入边 id。独占输入才有; UI 靠它提示"将替换"。 */
      readonly replaces?: string;
    }
  | { readonly ok: false; readonly reason: ConnectFailReason; readonly message: string };

/** 执行入口的固定端口 id。执行出口沿用定义里的 id。 */
export const EXEC_IN_PORT = "exec-in";

/** 执行出口规范化: 定义里可写字符串简写。 */
export function execOutIds(
  def: { readonly execOut?: readonly (string | { readonly id: string })[] } | undefined
): string[] {
  return (def?.execOut ?? []).map((e) => (typeof e === "string" ? e : e.id));
}

export function execOutLabel(
  def: { readonly execOut?: readonly (string | { readonly id: string; readonly label?: string })[] } | undefined,
  id: string
): string {
  for (const e of def?.execOut ?? []) {
    if (typeof e === "string") {
      if (e === id) return e;
    } else if (e.id === id) return e.label ?? e.id;
  }
  return id;
}

interface ResolvedPort {
  readonly port: PortDef;
  readonly isExec: boolean;
}

function findPort(ports: readonly PortDef[] | undefined, id: string): PortDef | undefined {
  return ports?.find((p) => p.id === id);
}

/**
 * 解析一个端口引用。
 * `dir` 是"我们要把这端当什么用" —— 同一条边的 from 端被当输出、to 端被当输入。
 */
export function resolvePort(
  reg: BlueprintRegistry,
  graph: Pick<BlueprintGraph, "nodes">,
  ref: PortRef,
  dir: "in" | "out"
): ResolvedPort | undefined {
  const node = graph.nodes.find((n) => n.id === ref.node);
  if (!node) return undefined;
  const def = reg.nodeTypes.get(node.type);
  if (!def) return undefined;

  // 执行端口: 入口只有一个, 出口按定义
  if (dir === "in" && def.execIn && ref.port === EXEC_IN_PORT) {
    return { port: { id: EXEC_IN_PORT, type: EXEC }, isExec: true };
  }
  if (dir === "out" && execOutIds(def).includes(ref.port)) {
    return { port: { id: ref.port, type: EXEC }, isExec: true };
  }

  const port = findPort(dir === "in" ? def.inputs : def.outputs, ref.port);
  return port ? { port, isExec: false } : undefined;
}

/**
 * 能不能连。这是唯一判据。
 *
 * @param from 起点端口 (必须是输出)
 * @param to   终点端口 (必须是输入)
 */
export function canConnect(
  reg: BlueprintRegistry,
  graph: Pick<BlueprintGraph, "nodes"> & { readonly edges: readonly { readonly id: string; readonly from: PortRef; readonly to: PortRef }[] },
  from: PortRef,
  to: PortRef
): ConnectResult {
  const src = resolvePort(reg, graph, from, "out");
  const dst = resolvePort(reg, graph, to, "in");

  if (!src) return { ok: false, reason: "missing-port", message: "起点不是有效的输出端口" };
  if (!dst) return { ok: false, reason: "missing-port", message: "终点不是有效的输入端口" };

  // 自环: 连回自己永远是错的, 类型再匹配也没意义
  if (from.node === to.node) {
    return { ok: false, reason: "self-loop", message: "不能连回自己" };
  }

  // 执行流与数据流不能混
  if (src.isExec !== dst.isExec) {
    return { ok: false, reason: "direction", message: "执行流与数据流不能互连" };
  }

  const dup = graph.edges.some(
    (e) => e.from.node === from.node && e.from.port === from.port && e.to.node === to.node && e.to.port === to.port
  );
  if (dup) return { ok: false, reason: "duplicate", message: "这条线已经连过了" };

  /**
   * 独占输入上已经有线时**不算错**。
   *
   * 拖线的语义是"我要这个来源", 报个错让人先去删线是纯粹的折磨 ——
   * UE5 与 ComfyUI 都是直接顶掉。所以这里放行, 但回传被顶掉的边 id:
   * UI 可以提示"将替换原有连线", 而 applyConnect 真的把它换掉。
   */
  let replaces: string | undefined;
  if (!dst.port.multi) {
    const old = graph.edges.find((e) => e.to.node === to.node && e.to.port === to.port);
    replaces = old?.id;
  }

  if (!reg.assignable(src.port.type, dst.port.type)) {
    return { ok: false, reason: "type-mismatch", message: `类型不匹配: ${src.port.type} → ${dst.port.type}` };
  }

  return { ok: true, kind: src.isExec ? "exec" : "data", ...(replaces ? { replaces } : {}) };
}

/**
 * 落一条边, 返回新边数组。
 *
 * 返回 null = 不该连 (调 canConnect 判过还失败, 说明图在我们不知道的情况下变了)。
 * 独占输入会**替换**旧边而不是报错 —— 拖线的语义是"我要这个来源",
 * 报个错让人先去删线是纯粹的折磨。
 */
export function applyConnect(
  reg: BlueprintRegistry,
  graph: BlueprintGraph,
  from: PortRef,
  to: PortRef,
  makeId: () => string
): BlueprintGraph | null {
  // 判别用 "reason" in 而不是 !ok —— 见 BlueprintCanvas.tsx 里那条注释:
  // 本仓 strict 关着, 判别式窄化不生效, 只有 in 判据在所有配置下都成立。
  const verdict = canConnect(reg, graph, from, to);
  if ("reason" in verdict) return null;

  const edges = graph.edges.filter((e) => e.id !== verdict.replaces);
  return {
    ...graph,
    edges: [...edges, { id: makeId(), from, to, kind: verdict.kind }],
  };
}
