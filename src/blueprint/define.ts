import type {
  BlueprintNode, EvalContext, EvalOutput, NodeDef, NodeKind, NodeValidateContext, ParamDef, Pin, PinShape, PinTypeDef,
  ValidationIssue,
} from "./types";

/**
 * Typed authoring API.
 *
 *   const types = defineTypes({ image: { extends: "object", color: "bp-object" } });
 *   const add = types.defineNode({
 *     id: "math.add", title: "Add", category: "Math",
 *     inputs: [{ id: "a", type: "number", default: 0 }, { id: "b", type: "number", default: 0 }],
 *     outputs: [{ id: "out", type: "number" }],
 *     evaluate: ({ inputs }) => ({ out: inputs.a + inputs.b }), // inputs.a: number
 *   });
 *
 * `ts` on a type declaration is a phantom (`0 as number`): it only feeds TypeScript, it is never read at runtime.
 */

// ---------------------------------------------------------------------------
// Type declarations

export interface TypeDecl {
  readonly label?: string;
  readonly color?: string;
  /** Default "data". */
  readonly shape?: PinShape;
  readonly extends?: string;
  readonly of?: string;
  readonly key?: string;
  /** target type id -> conversion node id. */
  readonly convert?: Readonly<Record<string, string>>;
  /** Phantom TS type of values of this pin type. */
  readonly ts?: unknown;
}

export const BASE_TYPES = {
  exec: { shape: "exec", label: "Exec", color: "bp-exec" },
  any: { label: "Any", color: "bp-any" },
  number: { label: "Number", color: "bp-float", ts: 0 as number },
  string: { label: "String", color: "bp-string", ts: "" as string },
  boolean: { label: "Boolean", color: "bp-bool", ts: false as boolean },
  object: { label: "Object", color: "bp-object", ts: {} as Record<string, unknown> },
} as const satisfies Record<string, TypeDecl>;

export type BaseTypes = typeof BASE_TYPES;

/** TS value type of pin type `K` in declaration map `M`. */
export type TsOf<M, K> = K extends keyof M ? DeclTs<M, M[K]> : unknown;
type DeclTs<M, D> =
  D extends { readonly ts: infer V } ? V
  : D extends { readonly shape: "array"; readonly of: infer E } ? TsOf<M, E>[]
  : D extends { readonly shape: "set"; readonly of: infer E } ? Set<TsOf<M, E>>
  : D extends { readonly shape: "map"; readonly of: infer E; readonly key: infer KK } ? Map<TsOf<M, KK>, TsOf<M, E>>
  : D extends { readonly extends: infer P } ? TsOf<M, P>
  : unknown;

type ExecNames<M> = { [K in keyof M]: M[K] extends { readonly shape: "exec" } ? K : never }[keyof M];

// ---------------------------------------------------------------------------
// Node declarations

export interface PinDecl<TN extends string = string> {
  readonly id: string;
  readonly type: TN;
  readonly label?: string;
  readonly default?: unknown;
  readonly multi?: boolean;
  readonly hidden?: boolean;
}

export type ParamDecl = ParamDef;

export type InputsOf<M, I extends readonly PinDecl[]> = {
  -readonly [P in I[number] as P["type"] extends ExecNames<M> ? never : P["id"]]: TsOf<M, P["type"]>;
};

type ExecOutIds<M, O extends readonly PinDecl[]> = Extract<O[number], { readonly type: ExecNames<M> }>["id"];

export type OutputsOf<M, O extends readonly PinDecl[]> = {
  -readonly [P in O[number] as P["type"] extends ExecNames<M> ? never : P["id"]]?: TsOf<M, P["type"]>;
} & { readonly $exec?: ExecOutIds<M, O> | readonly ExecOutIds<M, O>[] };

type ParamTs<Q> = Q extends { readonly kind: "number" } ? number
  : Q extends { readonly kind: "switch" } ? boolean
  : Q extends { readonly kind: "select"; readonly options: readonly (infer X)[] } ? (X extends { readonly value: infer V } ? V : string)
  : string;

export type ParamsOf<P extends readonly ParamDecl[]> = { -readonly [Q in P[number] as Q["id"]]: ParamTs<Q> };

export interface NodeDecl<
  M,
  I extends readonly PinDecl[],
  O extends readonly PinDecl[],
  P extends readonly ParamDecl[],
> {
  readonly id: string;
  readonly title: string;
  readonly category?: string;
  /** Header colour role. Inferred from pins when omitted (exec in = function, exec out only = event, none = pure). */
  readonly kind?: NodeKind;
  readonly description?: string;
  readonly width?: number;
  readonly inputs?: I;
  readonly outputs?: O;
  readonly params?: P;
  readonly internal?: boolean;
  readonly evaluate?: (ctx: {
    readonly inputs: InputsOf<M, I>;
    readonly params: ParamsOf<P>;
    readonly node: BlueprintNode;
  }) => OutputsOf<M, O> | Promise<OutputsOf<M, O>>;
  readonly validate?: (ctx: NodeValidateContext) => readonly ValidationIssue[];
}

type TypeName<M> = Extract<keyof M, string>;

/** A set of pin types, plus a `defineNode` whose `evaluate` is typed against them. */
export interface PinTypes<M> {
  readonly decls: M;
  readonly list: readonly PinTypeDef[];
  defineNode<
    const I extends readonly PinDecl<TypeName<M>>[] = readonly [],
    const O extends readonly PinDecl<TypeName<M>>[] = readonly [],
    const P extends readonly ParamDecl[] = readonly [],
  >(decl: NodeDecl<M, I, O, P>): NodeDef;
}

/** Declare pin types. The base types (exec, any, number, string, boolean, object) are always included and can be overridden. */
export function defineTypes<const T extends Record<string, TypeDecl>>(decls: T): PinTypes<Omit<BaseTypes, keyof T> & T> {
  type M = Omit<BaseTypes, keyof T> & T;
  const merged = { ...BASE_TYPES, ...decls } as unknown as M;
  const all = merged as Record<string, TypeDecl>;
  const list: PinTypeDef[] = Object.entries(all).map(([id, d]) => ({
    id,
    shape: d.shape ?? "data",
    ...(d.label !== undefined ? { label: d.label } : {}),
    ...(d.color !== undefined ? { color: d.color } : {}),
    ...(d.extends !== undefined ? { extends: d.extends } : {}),
    ...(d.of !== undefined ? { of: d.of } : {}),
    ...(d.key !== undefined ? { key: d.key } : {}),
    ...(d.convert !== undefined ? { convert: d.convert } : {}),
  }));
  const execTypes = new Set(list.filter((t) => t.shape === "exec").map((t) => t.id));
  return {
    decls: merged,
    list,
    defineNode: (decl) => buildNodeDef(decl as unknown as LooseDecl, execTypes),
  };
}

const BASE = defineTypes({});

/** `defineNode` typed against the base types only. Use `defineTypes(...).defineNode` for custom types. */
export const defineNode: PinTypes<BaseTypes>["defineNode"] = BASE.defineNode;

// ---------------------------------------------------------------------------
// Runtime normalisation

interface LooseDecl {
  readonly id: string;
  readonly title: string;
  readonly category?: string;
  readonly kind?: NodeKind;
  readonly description?: string;
  readonly width?: number;
  readonly inputs?: readonly Pin[];
  readonly outputs?: readonly Pin[];
  readonly params?: readonly ParamDef[];
  readonly internal?: boolean;
  readonly evaluate?: (ctx: EvalContext) => EvalOutput | Promise<EvalOutput>;
  readonly validate?: (ctx: NodeValidateContext) => readonly ValidationIssue[];
}

function buildNodeDef(decl: LooseDecl, execTypes: ReadonlySet<string>): NodeDef {
  const inputs = decl.inputs ?? [];
  const outputs = decl.outputs ?? [];
  const params = decl.params ?? [];
  // Inputs and params share the node's `values` map, so their ids must not collide.
  const seen = new Set<string>();
  for (const id of [...inputs.map((p) => p.id), ...params.map((p) => p.id)]) {
    if (seen.has(id)) throw new Error(`[blueprint] node "${decl.id}": input/param id "${id}" is used twice`);
    seen.add(id);
  }
  const outIds = new Set<string>();
  for (const p of outputs) {
    if (outIds.has(p.id)) throw new Error(`[blueprint] node "${decl.id}": output id "${p.id}" is used twice`);
    outIds.add(p.id);
  }
  return {
    id: decl.id,
    title: decl.title,
    category: decl.category ?? "General",
    kind: decl.kind ?? inferKind(inputs, outputs, execTypes),
    inputs,
    outputs,
    params,
    ...(decl.description !== undefined ? { description: decl.description } : {}),
    ...(decl.width !== undefined ? { width: decl.width } : {}),
    ...(decl.internal ? { internal: true } : {}),
    ...(decl.evaluate ? { evaluate: decl.evaluate } : {}),
    ...(decl.validate ? { validate: decl.validate } : {}),
  };
}

function inferKind(inputs: readonly Pin[], outputs: readonly Pin[], execTypes: ReadonlySet<string>): NodeKind {
  const execIn = inputs.some((p) => execTypes.has(p.type));
  const execOut = outputs.some((p) => execTypes.has(p.type));
  if (execIn) return "function";
  if (execOut) return "event";
  return "pure";
}
