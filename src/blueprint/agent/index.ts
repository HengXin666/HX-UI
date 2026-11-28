/**
 * Agent / AI entry, kept off the editor bundle. Import from "@/blueprint/agent".
 */
export { buildGraph } from "./build";
export type { AgentInput, AgentNode, AgentEnd, AgentBuildResult, RejectedWire } from "./build";
export { createBlueprintTools, toolManifest, dispatchTool } from "./tools";
export type { ToolDef, ToolResult, ToolContext } from "./tools";
