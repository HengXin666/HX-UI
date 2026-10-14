/**
 * 兄弟目录 HX-Blueprint-Demo 缺席时 @hx/blueprint-demo 的纯逻辑替身
 *
 * 为什么: 真实演示包是父仓的普通目录, 单独 clone 本仓 (含 CI) 拿不到,
 * 文档站与类型检查又必须能独立构建.替身只用本库自带的 demo 注册表与演示图,
 * 导出名与真实包一致; 依赖真实 dsh 图的断言由 check-blueprint 显式跳过并打印原因.
 */
import { createDemoRegistry, demoGraph } from "../../../src/blueprint/demo";
import type { BlueprintGraph } from "../../../src/blueprint/types";

/**
 * 替身标记: 页面与门禁据此说明当前不是真实 dsh 图
 *
 * .agents/notes/implemented/process/2026-10-14-pr3-quality-gates-ci-fixes.md
 */
export const BLUEPRINT_DEMO_FALLBACK = true;

export const NODES: Record<string, unknown> = {};

export const COLLAPSIBLE_GROUPS: Record<string, string[]> = {};

export const dshAgentLoopGraph: BlueprintGraph = { ...demoGraph, comments: [] };

export function createSourceRegistry() {
    return createDemoRegistry();
}

export function createDshRegistry() {
    return createDemoRegistry();
}

export function buildRootGraph() {
    return { graph: { nodes: demoGraph.nodes.map((node) => ({ ...node })), edges: demoGraph.edges.map((edge) => ({ ...edge })) } };
}
