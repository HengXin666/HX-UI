/**
 * Blueprint editor UI. `Blueprint` + `useBlueprint`; everything else here is internal.
 * Debug UI, the variables panel and Find are separate chunks loaded on first use.
 */
export { Blueprint } from "./blueprint";
export type { BlueprintProps } from "./blueprint";
export { BlueprintWorkbench } from "./workbench";
export type { BlueprintWorkbenchProps } from "./workbench";
// The panels on their own (MyBlueprintPanel, DetailsPanel, DebugDock, Splitter): "@/blueprint/ui/panels".
export type { MyBlueprintPanelProps } from "./my-blueprint";
export type { DetailsPanelProps } from "./details-panel";
export type { DebugDockProps, DockTab } from "./debug-dock";
export { useBlueprint } from "./use-blueprint";
export type { UseBlueprintOptions, BlueprintHandle } from "./use-blueprint";
export { BlueprintEditor, ZOOM } from "./editor";
export type { EditorSelection, SelectMode, Viewport, ViewValidation, RunOptions, InspectTarget } from "./editor";
// VariablesPanel (for placing the panel outside the canvas) is its own module so <Blueprint> can load it lazily:
//   import { VariablesPanel } from "@/blueprint/ui/variables-panel";
export type { VariablesPanelProps } from "./variables-panel";
export { SHORTCUTS, GESTURES, DEFAULT_PLACE_KEYS } from "./shortcuts";
export type { Shortcut, CommandId } from "./shortcuts";
