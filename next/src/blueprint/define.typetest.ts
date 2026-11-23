/**
 * Compile-time tests for the typed authoring API. Never imported at runtime: `tsc -b` checks them.
 * A broken inference shows up as a type error here (or as an unused @ts-expect-error).
 */
import { defineNode, defineTypes } from "./define";

type IsAny<T> = 0 extends 1 & T ? true : false;
type Eq<A, B> = IsAny<A> extends true ? false : [A] extends [B] ? ([B] extends [A] ? true : false) : false;
const expectType = <T extends true>(): T | void => undefined;

const t = defineTypes({
  image: { extends: "object" },
  ints: { shape: "array", of: "number" },
  tags: { shape: "set", of: "string" },
  dict: { shape: "map", key: "string", of: "boolean" },
});

t.defineNode({
  id: "typetest.all", title: "All",
  inputs: [
    { id: "exec", type: "exec" }, { id: "a", type: "number" }, { id: "img", type: "image" },
    { id: "l", type: "ints" }, { id: "s", type: "tags" }, { id: "d", type: "dict" }, { id: "x", type: "any" },
  ],
  outputs: [{ id: "then", type: "exec" }, { id: "else", type: "exec" }, { id: "out", type: "string" }],
  params: [{ id: "mode", kind: "select", options: [{ value: "fast" }, { value: "slow" }] }, { id: "on", kind: "switch" }, { id: "n", kind: "number" }],
  evaluate: ({ inputs, params }) => {
    expectType<Eq<typeof inputs.a, number>>();
    expectType<Eq<typeof inputs.img, Record<string, unknown>>>();
    expectType<Eq<typeof inputs.l, number[]>>();
    expectType<Eq<typeof inputs.s, Set<string>>>();
    expectType<Eq<typeof inputs.d, Map<string, boolean>>>();
    expectType<Eq<typeof params.mode, "fast" | "slow">>();
    expectType<Eq<typeof params.on, boolean>>();
    expectType<Eq<typeof params.n, number>>();
    // @ts-expect-error exec pins carry no value
    void inputs.exec;
    return { out: `${inputs.a}`, $exec: params.on ? "then" : "else" };
  },
});

defineNode({
  id: "typetest.badOut", title: "Bad", outputs: [{ id: "out", type: "number" }],
  // @ts-expect-error output value has the wrong type
  evaluate: () => ({ out: "no" }),
});

defineNode({
  id: "typetest.badExec", title: "Bad", outputs: [{ id: "then", type: "exec" }],
  // @ts-expect-error $exec must name an exec output
  evaluate: () => ({ $exec: "nope" }),
});

// @ts-expect-error unknown pin type
defineNode({ id: "typetest.badType", title: "Bad", inputs: [{ id: "a", type: "nope" }] });

// @ts-expect-error custom types are only known to their own defineTypes(...).defineNode
defineNode({ id: "typetest.foreign", title: "Bad", inputs: [{ id: "a", type: "image" }] });
