/**
 * The workbench panels on their own, each driven by a BlueprintEditor from useBlueprint:
 *
 *   const bp = useBlueprint({ registry, initial });
 *   <MyBlueprintPanel editor={bp} />  <Blueprint editor={bp} />  <DetailsPanel editor={bp} />  <DebugDock editor={bp} />
 *
 * Separate entry ("@/blueprint/ui/panels") so pages that only use <Blueprint> do not ship them.
 * <BlueprintWorkbench> (from "@/blueprint/ui") composes all of them and loads them lazily.
 */
export { MyBlueprintPanel } from "./my-blueprint";
export type { MyBlueprintPanelProps } from "./my-blueprint";
export { DetailsPanel } from "./details-panel";
export type { DetailsPanelProps } from "./details-panel";
export { DebugDock } from "./debug-dock";
export type { DebugDockProps, DockTab } from "./debug-dock";
export { VariablesPanel } from "./variables-panel";
export type { VariablesPanelProps } from "./variables-panel";
export { Splitter } from "./splitter";
export type { SplitterProps } from "./splitter";
