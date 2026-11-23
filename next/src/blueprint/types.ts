/**
 * Blueprint data model. Pure types, no runtime code except two constants.
 *
 * Rules of thumb:
 * - Everything in a graph is plain JSON: ids are strings, edges reference `{ node, pin }`, never indices.
 * - Exec ("white wire") pins are ordinary pins whose type has shape "exec". There is no separate execIn/execOut field.
 * - Wire multiplicity follows UE5: exec OUTPUT takes one wire, exec INPUT takes many,
 *   data INPUT takes one wire, data OUTPUT takes many. A pin may override with `multi`.
 */

// ---------------------------------------------------------------------------
// Pin types

/** How a pin type is drawn and how wires to it behave. */
export type PinShape = "exec" | "data" | "array" | "set" | "map";

/** A registered pin type. `color` is a design token name, e.g. "bp-float" (renderer maps it to bg-/stroke- classes). */
export interface PinTypeDef {
  readonly id: string;
  readonly label?: string;
  readonly color?: string;
  readonly shape: PinShape;
  /** Parent type: values of this type may flow into pins of the parent (covariant). */
  readonly extends?: string;
  /** Element type for array / set / map. */
  readonly of?: string;
  /** Key type for map. */
  readonly key?: string;
  /** Implicit conversions: target type id -> conversion node id (UE5 autocast). */
  readonly convert?: Readonly<Record<string, string>>;
}

export const EXEC = "exec";
export const ANY = "any";

// ---------------------------------------------------------------------------
// Node definitions (registry side)

/** One pin on a node. Inputs and outputs share this shape. */
export interface Pin {
  readonly id: string;
  readonly type: string;
  readonly label?: string;
  /** Value used when an input has no wire and no literal. Having a default makes the input optional. */
  readonly default?: unknown;
  /** Override the UE5 multiplicity rule for this pin. */
  readonly multi?: boolean;
  readonly hidden?: boolean;
}

/** An inline field on the node body (not a pin). */
export interface ParamDef {
  readonly id: string;
  readonly label?: string;
  readonly kind: "text" | "number" | "select" | "switch";
  readonly default?: unknown;
  readonly options?: readonly { readonly value: string; readonly label?: string }[];
  readonly min?: number;
  readonly max?: number;
  readonly step?: number;
}

export type NodeKind = "event" | "function" | "pure" | "macro" | "flow" | "cast" | "default" | (string & {});

/** What `evaluate` receives at runtime. `defineNode` gives the typed view of the same object. */
export interface EvalContext {
  readonly inputs: Readonly<Record<string, unknown>>;
  readonly params: Readonly<Record<string, unknown>>;
  readonly node: BlueprintNode;
}

/**
 * What `evaluate` returns: data output values by pin id.
 * `$exec` picks which exec output(s) fire next. Omit it to fire every exec output in declared order.
 */
export type EvalOutput = Readonly<Record<string, unknown>> & { readonly $exec?: string | readonly string[] };

export interface NodeValidateContext {
  readonly node: BlueprintNode;
  readonly def: NodeDef;
  /** Number of wires on each input pin. */
  readonly inDegree: Readonly<Record<string, number>>;
}

/** A registered node type (normalised form produced by `defineNode`). */
export interface NodeDef {
  readonly id: string;
  readonly title: string;
  readonly category: string;
  readonly kind: NodeKind;
  readonly description?: string;
  readonly width?: number;
  readonly inputs: readonly Pin[];
  readonly outputs: readonly Pin[];
  readonly params: readonly ParamDef[];
  /** Internal nodes (tunnels, subgraph shell) are hidden from menus. */
  readonly internal?: boolean;
  readonly evaluate?: (ctx: EvalContext) => EvalOutput | Promise<EvalOutput>;
  readonly validate?: (ctx: NodeValidateContext) => readonly ValidationIssue[];
}

// ---------------------------------------------------------------------------
// Graph (document side, JSON)

/** Reference to one pin on one node. */
export interface PinRef {
  readonly node: string;
  readonly pin: string;
}

/** Per-instance pins. Used by tunnels, reroutes and dynamic nodes. Overrides the definition. */
export interface NodePins {
  readonly inputs?: readonly Pin[];
  readonly outputs?: readonly Pin[];
}

export interface BlueprintNode {
  readonly id: string;
  /** NodeDef id. */
  readonly type: string;
  readonly x: number;
  readonly y: number;
  readonly title?: string;
  /** Param values and inline literals for unconnected inputs, keyed by param id or input pin id. */
  readonly values?: Readonly<Record<string, unknown>>;
  readonly collapsed?: boolean;
  readonly width?: number;
  /** Per-node comment bubble (UE5 node comment). */
  readonly comment?: string;
  readonly pins?: NodePins;
  /** Id of a SubGraphDef in the root graph. The node's pins are derived from that subgraph's tunnels. */
  readonly subgraph?: string;
}

export interface BlueprintEdge {
  readonly id: string;
  readonly from: PinRef;
  readonly to: PinRef;
}

export type CommentTone = "default" | "primary" | "warning" | "success" | "info" | "danger" | "neutral";

/** Comment box (UE5 Comment). Not a node: no pins, not evaluated. */
export interface BlueprintComment {
  readonly id: string;
  readonly x: number;
  readonly y: number;
  readonly w: number;
  readonly h: number;
  readonly title?: string;
  readonly body?: string;
  readonly tone?: CommentTone;
  /** Default true: moving the comment carries the nodes fully inside it. */
  readonly moveWithNodes?: boolean;
}

/**
 * A collapsed graph. Its external pins are NOT stored: they are the pins of its
 * tunnel nodes (`subgraph.in` outputs, `subgraph.out` inputs), so they can never drift.
 * Definitions are shared by id, one definition may have several call sites.
 */
export interface SubGraphDef {
  readonly id: string;
  readonly label?: string;
  readonly nodes: readonly BlueprintNode[];
  readonly edges: readonly BlueprintEdge[];
  readonly comments?: readonly BlueprintComment[];
}

export interface BlueprintGraph {
  readonly nodes: readonly BlueprintNode[];
  readonly edges: readonly BlueprintEdge[];
  readonly comments?: readonly BlueprintComment[];
  /** All subgraph definitions of the document, flat (nested subgraphs reference this same table). */
  readonly subgraphs?: Readonly<Record<string, SubGraphDef>>;
}

/** Anything that can resolve subgraph ids: the root graph, or an inner graph view that carries the table. */
export interface SubgraphScope {
  readonly subgraphs?: Readonly<Record<string, SubGraphDef>>;
}

// ---------------------------------------------------------------------------
// Validation

export type IssueCode =
  | "unknown-node-type"
  | "unknown-pin"
  | "dangling-edge"
  | "duplicate-edge"
  | "duplicate-id"
  | "type-mismatch"
  | "exec-data-mix"
  | "self-loop"
  | "cycle"
  | "input-occupied"
  | "output-occupied"
  | "missing-input"
  | "missing-subgraph"
  | "no-entry"
  | "custom";

export type IssueLevel = "error" | "warning";

export interface ValidationIssue {
  readonly code: IssueCode;
  readonly level: IssueLevel;
  readonly message: string;
  readonly nodeIds?: readonly string[];
  readonly edgeIds?: readonly string[];
  /** Pin the issue points at (for red pin dots). */
  readonly pin?: PinRef;
}

export interface GraphValidation {
  readonly ok: boolean;
  readonly issues: readonly ValidationIssue[];
  readonly byNode: ReadonlyMap<string, readonly ValidationIssue[]>;
  readonly byEdge: ReadonlyMap<string, readonly ValidationIssue[]>;
}
