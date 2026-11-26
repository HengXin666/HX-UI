import type { DebugState } from "./debug";
import type { StepEvent } from "./evaluate";

/**
 * Build a `DebugState` from a backend's own bookkeeping (no interpreter in this module, so remote
 * backends do not pull `debug.ts` / `evaluate.ts` into the bundle).
 *
 *   emit({ type: "status", state: createDebugState({ status: "paused", at: { node: "send" }, trace }) })
 *
 * `steps` follows `trace`; `values` defaults to the last outputs of each traced node.
 */
export function createDebugState(
  parts: Partial<Omit<DebugState, "steps" | "trace" | "values" | "hits">> & {
    readonly trace?: readonly StepEvent[];
    readonly values?: ReadonlyMap<string, Readonly<Record<string, unknown>>>;
    readonly hits?: ReadonlyMap<string, number>;
  } = {},
): DebugState {
  const trace = parts.trace ?? [];
  const values = parts.values ?? new Map(trace.filter((s) => !s.disabled).map((s) => [s.node, s.outputs] as const));
  return { status: "idle", ...parts, steps: trace.length, trace, values, hits: parts.hits ?? new Map() };
}
