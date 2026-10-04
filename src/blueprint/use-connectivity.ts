import { useCallback } from "react";
import type { Connection } from "@xyflow/react";
import type { BlueprintGraph, BlueprintRegistry } from "./types";
import { canConnect, applyConnect } from "./connect";
import { edgeFromRf, type RfEdge } from "./rf-adapter";
import { makeId } from "./useBlueprint";

/**
 * 连线: 合法性判定 + 落地。
 *
 * 单独成文件是因为 BlueprintFlow.tsx 撞 250 行上限, 但拆得也对 ——
 * 这是整套东西**最核心**的一块, 值得单独待着并被人反复读。
 */

export function useConnectivity(o: {
  readonly registry: BlueprintRegistry;
  readonly graph: BlueprintGraph;
  readonly onGraphChange?: (next: BlueprintGraph) => void;
}) {
  const { registry, graph, onGraphChange } = o;

  /**
   * "能不能连" —— **这是这套库的核心卖点, 必须走我们自己的判定**。
   *
   * React Flow 只提供"两个 handle 能不能连"的回调, 真正的规则
   * (类型 DAG 协变 / exec 与 data 不能互连 / 独占输入 / 环检测)
   * 全部在 connect.ts 里, 这里只是转发。
   *
   * ⚠️ 这条只回答"能不能放", **不**处理"顶替" —— 那是 applyConnect 的事。
   *    两个都接才完整 (见下面的 onConnect)。
   */
  const isValidConnection = useCallback(
    (c: Connection | RfEdge): boolean => {
      const e = edgeFromRf(c, "__probe__");
      if (!e) return false;
      return canConnect(registry, graph, e.from, e.to).ok;
    },
    [registry, graph]
  );

  const onConnect = useCallback(
    (c: Connection) => {
      const e = edgeFromRf(c, "__tmp__");
      if (!e) return;
      /**
       * ⚠️ 必须走 **applyConnect**, 不能自己 `edges: [...edges, e]`。
       *
       * 自己拼的下场 (实测): 独占输入口会被**双占** —— n4.b 已有 n3→n4.b,
       * 再连 n2→n4.b 后连线数 6→7、错误数 0→2, 图直接变成非法的。
       * 因为"能不能连"和"顶不顶掉"是两件事: isValidConnection 管前者,
       * applyConnect 才处理 verdict.replaces。只接前一个就把顶替丢了。
       */
      const next = applyConnect(registry, graph, e.from, e.to, () => makeId("e"));
      if (next) onGraphChange?.(next);
    },
    [registry, graph, onGraphChange]
  );

  return { isValidConnection, onConnect };
}
