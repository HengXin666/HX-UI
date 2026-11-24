/**
 * Blueprint logic self-check (M0 + M1 + M5 + M6). Run: node scripts/bp-check.ts   (Node 22.18+, type stripping)
 * No test runner, no dependencies: plain node:assert. Exits 1 on the first failure.
 */
import assert from "node:assert/strict";
import { register } from "node:module";

// src/ uses extensionless relative imports (bundler resolution). Teach Node to try ".ts".
register(
  "data:text/javascript," +
    encodeURIComponent(`
export async function resolve(spec, ctx, next) {
  try { return await next(spec, ctx); }
  catch (e) {
    if (spec.startsWith(".") && !/\\.[cm]?[jt]sx?$/.test(spec)) return next(spec + ".ts", ctx);
    throw e;
  }
}`),
);

const bp: typeof import("../src/blueprint/index.ts") & typeof import("../src/blueprint/agent/index.ts") = {
  ...(await import("../src/blueprint/index.ts")),
  ...(await import("../src/blueprint/agent/index.ts")),
};
type Graph = import("../src/blueprint/index.ts").BlueprintGraph;
const { DebugSession } = await import("../src/blueprint/debug.ts");
const { demoRegistry: reg, demoGraph } = bp;

let passed = 0;
async function check(name: string, fn: () => void | Promise<void>) {
  try {
    await fn();
    passed++;
    console.log(`ok   ${name}`);
  } catch (e) {
    console.error(`FAIL ${name}\n${e instanceof Error ? e.stack ?? e.message : String(e)}`);
    process.exit(1);
  }
}

/** Canonical form for deep comparison: JSON with nodes/edges/comments sorted by id. */
function canon(g: Graph): unknown {
  const j = bp.toJSON(g);
  const byId = <T extends { id: string }>(xs: readonly T[] | undefined) => [...(xs ?? [])].sort((a, b) => a.id.localeCompare(b.id));
  const level = (l: Pick<Graph, "nodes" | "edges" | "comments">) => ({ nodes: byId(l.nodes), edges: byId(l.edges), comments: byId(l.comments) });
  return { ...level(j), subgraphs: Object.fromEntries(Object.entries(j.subgraphs ?? {}).map(([k, v]) => [k, level(v)])) };
}

const ok = (r: { errors: readonly unknown[] }) => assert.deepEqual(r.errors, [], JSON.stringify(r.errors));

// ---------------------------------------------------------------------------
// Sample graph: demo + two-step add (to be collapsed) + collapsed exec section + reroute + comments.

function sample(): { flat: Graph; full: Graph } {
  const r1 = bp.applyOps(demoGraph, [
    { op: "disconnect", edge: "e2" },
    { op: "addNode", id: "add1", type: "math.add", at: [200, 300] },
    { op: "addNode", id: "add2", type: "math.add", at: [400, 300], values: { b: 10 } },
    { op: "connect", from: "a.value", to: "add1.a" },
    { op: "connect", from: "b.value", to: "add1.b" },
    { op: "connect", from: "add1.out", to: "add2.a" },
    { op: "connect", from: "add2.out", to: "cmp.a" },
    { op: "addNode", id: "done", type: "flow.print", at: [920, 40], values: { prefix: "done" } },
    { op: "connect", from: "yes.then", to: "done.exec" },
    { op: "connect", from: "yes.line", to: "done.msg" },
    { op: "addReroute", edge: "e4", id: "knot" },
    { op: "addComment", id: "c_flow", around: ["start", "branch"], title: "Flow", tone: "info" },
    { op: "addComment", id: "c_vals", around: ["a", "b"], title: "Inputs", body: "two numbers" },
  ], reg);
  ok(r1);
  const r2 = bp.applyOps(r1.graph, [
    { op: "collapse", nodes: ["add1", "add2"], id: "sg_add", label: "Add twice" },
    { op: "collapse", nodes: ["yes"], id: "sg_yes", label: "Say yes" },
  ], reg);
  ok(r2);
  return { flat: r1.graph, full: r2.graph };
}

// ---------------------------------------------------------------------------

await check("M1 typed authoring: defineNode normalises, rejects clashing ids, infers kind", () => {
  const n = bp.defineNode({
    id: "t.add", title: "Add",
    inputs: [{ id: "a", type: "number" }, { id: "b", type: "number" }],
    outputs: [{ id: "out", type: "number" }],
    evaluate: ({ inputs }) => ({ out: inputs.a + inputs.b }),
  });
  assert.equal(n.kind, "pure");
  assert.equal(n.category, "General");
  assert.equal(reg.node("flow.print")!.kind, "function");
  assert.equal(reg.node("event.start")!.kind, "event");
  assert.throws(() => bp.defineNode({ id: "bad", title: "Bad", inputs: [{ id: "x", type: "number" }], params: [{ id: "x", kind: "text" }] }));
  // Compile-time checks (see scratch typecheck): wrong output key / wrong value type are errors.
  if (false as boolean) {
    // @ts-expect-error out must be a number
    bp.defineNode({ id: "x", title: "x", outputs: [{ id: "out", type: "number" }], evaluate: () => ({ out: "no" }) });
    // @ts-expect-error unknown pin type
    bp.defineNode({ id: "x", title: "x", inputs: [{ id: "a", type: "nope" }] });
  }
});

await check("registry: assignability, containers, conversions", () => {
  assert.ok(reg.assignable("number", "any"));
  assert.ok(!reg.assignable("exec", "any"), "exec never mixes with data");
  assert.ok(!reg.assignable("number", "string"));
  assert.equal(reg.conversion("number", "string"), "conv.toString");
  assert.equal(reg.shape("numbers"), "array");
});

await check("B5 UE5 multiplicity: exec out replaces, exec in fans in, data in replaces, data out fans out", () => {
  const g = bp.applyOps(demoGraph, [
    { op: "addNode", id: "p3", type: "flow.print", at: [900, 300] },
  ], reg).graph;
  // exec OUTPUT takes one wire: branch.true already -> yes, re-wiring replaces
  const v1 = bp.canConnect(g, { node: "branch", pin: "true" }, { node: "p3", pin: "exec" }, reg);
  assert.ok(v1.ok && v1.replaces.length === 1 && v1.replaces[0] === "e5");
  // exec INPUT takes many: yes.exec gets a second wire without displacing
  const v2 = bp.canConnect(g, { node: "start", pin: "then" }, { node: "yes", pin: "exec" }, reg);
  assert.ok(v2.ok && v2.replaces.includes("e1") && v2.replaces.length === 1, "only start.then's own single wire is displaced");
  const v3 = bp.canConnect(g, { node: "no", pin: "then" }, { node: "yes", pin: "exec" }, reg);
  assert.ok(v3.ok && v3.replaces.length === 0, "exec input fan-in allowed");
  // data INPUT takes one: cmp.a already wired from a
  const v4 = bp.canConnect(g, { node: "b", pin: "value" }, { node: "cmp", pin: "a" }, reg);
  assert.ok(v4.ok && v4.replaces[0] === "e2");
  // data OUTPUT fans out
  const v5 = bp.canConnect(g, { node: "a", pin: "value" }, { node: "cmp", pin: "b" }, reg);
  assert.ok(v5.ok && v5.replaces.length === 1 && v5.replaces[0] === "e3", "only the input side is exclusive");
  // drag from an input is accepted and normalised
  const v6 = bp.canConnect(g, { node: "p3", pin: "exec" }, { node: "no", pin: "then" }, reg);
  assert.ok(v6.ok && v6.from.node === "no" && v6.to.node === "p3");
  // committing through ops really replaces
  const r = bp.applyOps(g, [{ op: "connect", from: "branch.true", to: "p3.exec" }], reg);
  ok(r);
  assert.equal(r.graph.edges.filter((e) => e.from.node === "branch" && e.from.pin === "true").length, 1);
  assert.ok(bp.validateGraph(r.graph, reg).issues.every((i) => i.code !== "output-occupied"));
  // validation flags a hand-built exec output with two wires
  const bad: Graph = { ...g, edges: [...g.edges, { id: "x", from: { node: "branch", pin: "true" }, to: { node: "p3", pin: "exec" } }] };
  assert.ok(bp.validateGraph(bad, reg).issues.some((i) => i.code === "output-occupied"));
});

await check("B1 data cycles: rejected at connect, error in validation; exec loops only warn", () => {
  const g = bp.applyOps({ nodes: [], edges: [] }, [
    { op: "addNode", id: "x", type: "math.add" },
    { op: "addNode", id: "y", type: "math.add" },
    { op: "connect", from: "x.out", to: "y.a" },
  ], reg).graph;
  const v = bp.canConnect(g, { node: "y", pin: "out" }, { node: "x", pin: "a" }, reg);
  assert.ok(!v.ok && v.reason === "cycle");
  const cyc: Graph = { ...g, edges: [...g.edges, { id: "back", from: { node: "y", pin: "out" }, to: { node: "x", pin: "a" } }] };
  const issues = bp.validateGraph(cyc, reg).issues.filter((i) => i.code === "cycle");
  assert.equal(issues.length, 1);
  assert.equal(issues[0]!.level, "error");
  assert.deepEqual([...issues[0]!.edgeIds!].sort(), ["back", "e1"]);
  // exec loop: print -> print -> back
  const loop = bp.applyOps({ nodes: [], edges: [] }, [
    { op: "addNode", id: "p", type: "flow.print" },
    { op: "addNode", id: "q", type: "flow.print" },
    { op: "connect", from: "p.then", to: "q.exec" },
    { op: "connect", from: "q.then", to: "p.exec" },
  ], reg);
  ok(loop);
  const li = bp.validateGraph(loop.graph, reg);
  assert.ok(li.ok, "exec loop is not an error");
  assert.ok(li.issues.some((i) => i.code === "cycle" && i.level === "warning"));
});

const { flat, full } = sample();

await check("B3 collapsed graph pins come from the inner tunnels via getPorts", () => {
  const shell = full.nodes.find((n) => n.subgraph === "sg_add")!;
  const ports = bp.getPorts(shell, reg, full);
  assert.deepEqual(ports.inputs.map((p) => `${p.id}:${p.type}`), ["a:number", "b:number"]);
  assert.deepEqual(ports.outputs.map((p) => `${p.id}:${p.type}`), ["out:number"]);
  const yes = full.nodes.find((n) => n.subgraph === "sg_yes")!;
  const yp = bp.getPorts(yes, reg, full);
  assert.deepEqual(yp.inputs.map((p) => `${p.id}:${p.exec}:${p.multi}`), ["exec:true:true"]);
  assert.deepEqual(yp.outputs.map((p) => `${p.id}:${p.exec}:${p.multi}`), ["then:true:false", "line:false:true"]);
  // every outer wire resolves, the whole document validates
  const v = bp.validateGraph(full, reg);
  assert.ok(v.ok, JSON.stringify(v.issues.filter((i) => i.level === "error")));
  // without a scope the renderer gets an explicit marker instead of silent empty pins
  assert.equal(bp.getPorts(shell, reg).missing, "subgraph");
  // editing the tunnel changes the outer pins (single source of truth)
  const inner = bp.subgraphAsGraph(full, "sg_add")!;
  const tin = inner.nodes.find((n) => n.type === bp.TUNNEL_IN)!;
  const edited = bp.writeSubgraph(full, "sg_add", { ...inner, nodes: inner.nodes.map((n) => (n === tin ? { ...n, pins: { outputs: [...(n.pins?.outputs ?? []), { id: "c", type: "number" }] } } : n)) });
  assert.equal(bp.getPorts(shell, reg, edited).inputs.length, 3);
});

await check("evaluate: exec walk with branch $exec, through a collapsed exec section, data through a collapsed graph", async () => {
  const steps: string[] = [];
  const r1 = await bp.evaluateGraph(flat, reg, { entry: "start" });
  assert.ok(r1.ok, JSON.stringify([...r1.errors]));
  assert.deepEqual(r1.trace, ["start", "branch", "yes", "done"]);
  assert.equal(r1.outputs.get("done")!.line, "done yes a > b");
  const r2 = await bp.evaluateGraph(full, reg, { entry: "start", onStep: (s) => steps.push(s.node) });
  assert.ok(r2.ok, JSON.stringify([...r2.errors]));
  const yesShell = full.nodes.find((n) => n.subgraph === "sg_yes")!.id;
  assert.deepEqual(r2.trace, ["start", "branch", yesShell, `${yesShell}/yes`, "done"]);
  assert.deepEqual(steps, ["start", "branch", `${yesShell}/yes`, yesShell, "done"]);
  assert.equal(r2.outputs.get("done")!.line, "done yes a > b");
  // data mode: the collapsed add gives 7 + 5 + 10
  const addShell = full.nodes.find((n) => n.subgraph === "sg_add")!.id;
  const r3 = await bp.evaluateGraph(full, reg);
  assert.equal(r3.outputs.get(addShell)!.out, 22);
});

await check("collapse -> expand restores the graph (ids, positions, wires)", () => {
  const shell = full.nodes.find((n) => n.subgraph === "sg_add")!.id;
  const yesShell = full.nodes.find((n) => n.subgraph === "sg_yes")!.id;
  const r = bp.applyOps(full, [{ op: "expand", node: shell }, { op: "expand", node: yesShell }], reg);
  ok(r);
  assert.deepEqual(canon(r.graph), canon(flat));
});

await check("B2 JSON round trip is lossless (collapsed graphs, comments, reroute, values, pins)", () => {
  const json = bp.toJSON(full);
  assert.equal(json.version, bp.FORMAT_VERSION);
  assert.ok(json.subgraphs?.sg_add && json.subgraphs.sg_yes && json.comments?.length === 2);
  const back = bp.fromJSON(JSON.stringify(json));
  assert.ok(back.ok, back.errors.join("\n"));
  assert.deepEqual(bp.toJSON(back.graph!), json);
  assert.deepEqual(back.graph, bp.stripVersion(json));
  assert.deepEqual(canon(back.graph!), canon(full));
  const knot = back.graph!.nodes.find((n) => n.type === bp.REROUTE)!;
  assert.equal(knot.pins?.inputs?.[0]?.type, "boolean");
  // structural errors are reported with paths
  const bad = bp.fromJSON({ version: 2, nodes: [{ id: 1, type: "x", x: 0, y: 0 }], edges: [] });
  assert.ok(!bad.ok && bad.errors[0]!.startsWith("graph.nodes[0].id"));
});

await check("graphSchema accepts toJSON output and rejects junk", () => {
  const json = JSON.parse(JSON.stringify(bp.toJSON(full)));
  assert.deepEqual(schemaErrors(bp.graphSchema, json), []);
  assert.ok(schemaErrors(bp.graphSchema, { ...json, extra: 1 }).length > 0);
  assert.ok(schemaErrors(bp.graphSchema, { ...json, edges: [{ id: "e", from: { node: "a" }, to: { node: "b", pin: "c" } }] }).length > 0);
});

await check("text round trip: fromText(toText(g)) == g and text is stable", () => {
  const text = bp.toText(full);
  const back = bp.fromText(text);
  assert.ok(back.ok, back.errors.join("\n"));
  assert.deepEqual(back.graph, bp.stripVersion(bp.toJSON(full)));
  assert.equal(bp.toText(back.graph!), text);
  // awkward ids and strings survive
  const odd: Graph = {
    nodes: [{ id: "a b", type: "value.text", x: -1.5, y: 2e-7, values: { v: "line\n\"q\" -> x.y" }, title: "t=1 {" }],
    edges: [{ id: "e.1", from: { node: "a b", pin: "value" }, to: { node: "a b", pin: "odd pin" } }],
    comments: [{ id: "c", x: 0, y: 0, w: 100, h: 80, body: "} {" }],
  };
  const r = bp.fromText(bp.toText(odd));
  assert.ok(r.ok, r.errors.join("\n"));
  assert.deepEqual(r.graph, odd);
  const err = bp.fromText("node n1 math.add 10,10");
  assert.ok(!err.ok && err.errors[0]!.startsWith("line 1"));
});

await check("v1 legacy JSON is read (params -> values, port -> pin, exec-in -> exec, per-port tunnels merged)", () => {
  const v1 = {
    version: 1,
    nodes: [
      { id: "n1", type: "event.start", x: 0, y: 0 },
      { id: "n2", type: "flow.print", x: 200, y: 0, params: { prefix: "!" } },
      { id: "s", type: "subgraph", x: 0, y: 200, subgraph: "sg" },
    ],
    edges: [{ id: "e1", from: { node: "n1", port: "then" }, to: { node: "n2", port: "exec-in" }, kind: "exec" }],
    subgraphs: {
      sg: {
        id: "sg", inputs: [{ id: "a", type: "number" }], outputs: [{ id: "out", type: "number" }],
        nodes: [
          { id: "ti", type: "subgraph.input", x: 0, y: 0, ports: { outputs: [{ id: "value", type: "number" }] } },
          { id: "m", type: "math.add", x: 0, y: 0 },
          { id: "to", type: "subgraph.output", x: 0, y: 0, ports: { inputs: [{ id: "value", type: "number" }] } },
        ],
        edges: [
          { id: "i1", from: { node: "ti", port: "value" }, to: { node: "m", port: "a" } },
          { id: "i2", from: { node: "m", port: "out" }, to: { node: "to", port: "value" } },
        ],
      },
    },
  };
  const r = bp.fromJSON(v1);
  assert.ok(r.ok, r.errors.join("\n"));
  assert.equal(r.warnings.length, 1);
  assert.deepEqual(r.graph!.edges[0], { id: "e1", from: { node: "n1", pin: "then" }, to: { node: "n2", pin: "exec" } });
  assert.deepEqual(r.graph!.nodes[1]!.values, { prefix: "!" });
  const shell = r.graph!.nodes[2]!;
  assert.deepEqual(bp.getPorts(shell, reg, r.graph!).inputs.map((p) => p.id), ["a"]);
  // the only remaining issue is the real one: the collapsed graph's external input "a" has no wire
  assert.deepEqual(bp.validateGraph(r.graph!, reg).issues.map((i) => `${i.code}@${i.pin?.node}.${i.pin?.pin}`), ["missing-input@s.a"]);
});

await check("B10 clipboard: copy/paste/duplicate/delete keep comments and collapsed graphs", () => {
  const ids = bp.createIdGen(full);
  const clip = bp.copySelection(full, { nodes: ["a", "b"] }, reg);
  assert.deepEqual(clip.comments?.map((c) => c.id), ["c_vals"], "a comment whose contents are all selected comes along");
  const pasted = bp.pasteClip(full, clip, ids);
  assert.equal(pasted.comments.length, 1);
  assert.equal(pasted.graph.comments!.length, 3);
  // paste through text (system clipboard form)
  const viaText = bp.fromText(bp.toText(clip));
  assert.ok(viaText.ok);
  assert.equal(bp.pasteClip(full, viaText.graph!, bp.createIdGen(full)).graph.comments!.length, 3);
  // a collapsed node brings its definition, reused when identical
  const shell = full.nodes.find((n) => n.subgraph === "sg_add")!.id;
  const dup = bp.duplicateSelection(full, { nodes: [shell] }, reg, bp.createIdGen(full));
  assert.equal(Object.keys(dup.graph.subgraphs!).length, 2, "identical definition reused, not copied");
  const other = bp.pasteClip({ nodes: [], edges: [], subgraphs: { sg_add: { id: "sg_add", nodes: [], edges: [] } } }, bp.copySelection(full, { nodes: [shell] }, reg), bp.createIdGen(full));
  const newShell = other.graph.nodes[0]!;
  assert.notEqual(newShell.subgraph, "sg_add", "clashing definition renamed");
  assert.equal(bp.getPorts(newShell, reg, other.graph).inputs.length, 2);
  // delete removes selected comments and orphaned definitions
  const del = bp.deleteSelection(full, { nodes: [shell], comments: ["c_flow"] });
  assert.deepEqual(del.comments!.map((c) => c.id), ["c_vals"]);
  assert.ok(!del.subgraphs!.sg_add && del.subgraphs!.sg_yes);
  assert.ok(!del.edges.some((e) => e.from.node === shell || e.to.node === shell));
});

await check("comments: move carries contained nodes unless moveWithNodes is false", () => {
  const moved = bp.applyOps(full, [{ op: "moveComment", id: "c_vals", to: [0, 0] }], reg).graph;
  const c = full.comments!.find((x) => x.id === "c_vals")!;
  const a0 = full.nodes.find((n) => n.id === "a")!;
  const a1 = moved.nodes.find((n) => n.id === "a")!;
  assert.deepEqual([a1.x - a0.x, a1.y - a0.y], [-c.x, -c.y]);
  const pinned = bp.applyOps(full, [{ op: "updateComment", id: "c_vals", moveWithNodes: false }, { op: "moveComment", id: "c_vals", to: [0, 0] }], reg).graph;
  assert.equal(pinned.nodes.find((n) => n.id === "a")!.x, a0.x);
});

await check("canConnect suggests a conversion node, connect op inserts it, menu filter lists matches", () => {
  const g = bp.applyOps(demoGraph, [{ op: "addNode", id: "p", type: "flow.print", at: [900, 400] }], reg).graph;
  const v = bp.canConnect(g, { node: "a", pin: "value" }, { node: "p", pin: "msg" }, reg);
  assert.ok(v.ok && v.conversion === "conv.toString");
  const r = bp.applyOps(g, [{ op: "connect", from: "a.value", to: "p.msg" }], reg);
  ok(r);
  const conv = r.graph.nodes.find((n) => n.type === "conv.toString");
  assert.ok(conv && r.graph.edges.some((e) => e.to.node === conv.id) && r.graph.edges.some((e) => e.from.node === conv.id && e.to.node === "p"));
  const refused = bp.applyOps(g, [{ op: "connect", from: "a.value", to: "p.msg", convert: false }], reg);
  assert.equal(refused.errors.length, 1);
  const menu = bp.nodesAcceptingPin("number", "out", reg);
  const ids = menu.map((m) => `${m.node.id}${m.conversion ? "~" : ""}`);
  assert.ok(ids.includes("math.add") && ids.includes("flow.print~"));
  assert.ok(ids.indexOf("math.add") < ids.indexOf("flow.print~"), "direct matches first");
  assert.ok(!ids.some((i) => i.startsWith("subgraph")), "internal nodes hidden");
  assert.deepEqual(bp.nodesAcceptingPin("exec", "in", reg).map((m) => m.node.id).sort(), ["event.start", "flow.branch", "flow.delay", "flow.print", "flow.sequence"]);
});

await check("history: one apply = one undo step, tags coalesce, redo works", () => {
  let t = 0;
  const h = bp.createHistory(demoGraph, { now: () => t });
  h.apply([{ op: "addNode", id: "x", type: "math.add" }, { op: "connect", from: "a.value", to: "x.a" }], reg, { label: "add x" });
  assert.equal(h.depth.past, 1);
  for (let i = 0; i < 5; i++) {
    t += 100;
    h.apply([{ op: "moveNode", id: "x", by: [10, 0] }], reg, { tag: "drag" });
  }
  assert.equal(h.depth.past, 2, "five drag moves merged");
  h.apply([{ op: "moveNode", id: "nope", to: [0, 0] }], reg);
  assert.equal(h.depth.past, 2, "a no-op apply records nothing");
  h.undo();
  assert.equal(h.current.nodes.find((n) => n.id === "x")!.x, 0);
  assert.equal(h.undoLabel, "add x");
  h.undo();
  assert.equal(h.current, demoGraph);
  h.redo();
  assert.ok(h.current.nodes.some((n) => n.id === "x"));
});

await check("deterministic ids and alias redirect in applyOps", () => {
  const ops = [
    { op: "addNode", type: "math.add" },
    { op: "addNode", id: "a", type: "math.add" },
    { op: "connect", from: "a.out", to: "cmp.b" },
  ] as const;
  const r1 = bp.applyOps(demoGraph, ops, reg);
  const r2 = bp.applyOps(demoGraph, ops, reg);
  assert.deepEqual(r1, r2);
  assert.equal(r1.created.a, "n2", "taken id 'a' redirected to a fresh one");
  assert.ok(r1.graph.edges.some((e) => e.from.node === "n2" && e.to.node === "cmp" && e.to.pin === "b"));
});

await check("agent builder: inference, explained rejections, layout without overlaps; tools round trip", async () => {
  const r = bp.buildGraph(reg, {
    nodes: [
      { key: "start", type: "event.start" }, { key: "x", type: "value.number", values: { v: 3 } },
      { key: "y", type: "value.number" }, { key: "cmp", type: "math.compare" }, { key: "br", type: "flow.branch" },
      { key: "p1", type: "flow.print" }, { key: "p2", type: "flow.print" },
    ],
    edges: [
      { from: "start", to: "br" }, { from: "x", to: "cmp" }, { from: "y", to: "cmp" }, { from: "cmp", to: "br" },
      { from: "br", to: "p1" }, { from: "br", to: "p2" }, { from: "x", to: "p1.msg" },
      { from: "p1.nope", to: "p2" }, { from: "ghost", to: "p2" },
    ],
    comments: [{ title: "values", nodes: ["x", "y"] }],
  });
  assert.equal(r.rejected.length, 2);
  assert.match(r.rejected[0]!.message, /Outputs: then:exec, line:string/);
  assert.match(r.rejected[1]!.message, /Known keys/);
  const pin = (from: string, to: string) => r.graph.edges.find((e) => e.from.node === from && e.to.node === to);
  assert.equal(pin("br", "p1")!.from.pin, "true");
  assert.equal(pin("br", "p2")!.from.pin, "false");
  assert.equal(pin("y", "cmp")!.to.pin, "b");
  assert.ok(r.warnings.some((w) => w.includes("conversion")), "number -> string autocast inserted");
  assert.equal(r.layout.overlaps, 0);
  assert.equal(r.graph.comments!.length, 1);

  let g: Graph = full;
  const tools = bp.createBlueprintTools({ registry: reg, getGraph: () => g, setGraph: (x) => (g = x) });
  const exported = await bp.dispatchTool(tools, "export_graph");
  g = { nodes: [], edges: [] };
  const imported = await bp.dispatchTool(tools, "import_graph", { source: exported.text });
  assert.ok(imported.ok, imported.text);
  assert.deepEqual(canon(g), canon(full));
  const run = await bp.dispatchTool(tools, "run_graph", {});
  assert.ok(run.ok && run.text.includes("exec order: start -> branch"), run.text);
  const bad = await bp.dispatchTool(tools, "apply_ops", { ops: [{ op: "connect", from: "a.value", to: "start.then" }] });
  assert.ok(!bad.ok && bad.text.includes("op #0"));
  assert.ok(bp.toolManifest(tools).every((t) => typeof t.inputSchema === "object"));
});

await check("layout + align are size-aware (B4 exec rows counted, B11 right/bottom edges line up)", () => {
  const laid = bp.applyLayout(full, bp.autoLayout(full, reg));
  assert.equal(bp.countOverlaps(laid, reg), 0);
  const branch = bp.nodeSize(full.nodes.find((n) => n.id === "branch")!, reg);
  assert.equal(branch.h, bp.NODE_METRICS.header + bp.NODE_METRICS.pad * 2 + 2 * bp.NODE_METRICS.row, "2 exec+data rows");
  const al = bp.alignNodes(full, ["a", "cmp"], "right", reg);
  const right = (id: string) => {
    const n = al.nodes.find((x) => x.id === id)!;
    return n.x + bp.nodeSize(n, reg).w;
  };
  assert.equal(right("a"), right("cmp"));
});

await check("describeGraph mentions collapsed graphs, comments and exec wires", () => {
  const text = bp.describeGraph(full, reg);
  assert.match(text, /2 collapsed graphs/);
  assert.match(text, /Collapsed graph "Add twice"/);
  assert.match(text, /--true-->/);
  assert.match(text, /No errors\./);
});


// ---------------------------------------------------------------------------
// M5: debugging, disabled nodes, variables, functions vs macros

await check("M5 eval trace: onBefore/onStep carry the exec wire taken, in order", async () => {
  const before: string[] = [];
  const steps: string[] = [];
  const r = await bp.evaluateGraph(demoGraph, reg, {
    entry: "start",
    onBefore: (t) => void before.push(`${t.edge ?? "-"}>${t.node}`),
    onStep: (s) => void steps.push(`${s.edge ?? "-"}>${s.node}:${s.fired.join(",")}`),
  });
  assert.ok(r.ok);
  assert.deepEqual(before, ["->start", "e1>branch", "e5>yes"]);
  assert.deepEqual(steps, ["->start:then", "e1>branch:true", "e5>yes:then"]);
  // pure nodes report their values through onCompute
  const computed = new Map<string, unknown>();
  await bp.evaluateGraph(demoGraph, reg, { entry: "start", onCompute: (n, o) => void computed.set(n, o) });
  assert.deepEqual(computed.get("cmp"), { out: true });
  assert.deepEqual(computed.get("a"), { value: 7 });
  // inside a collapsed graph, edges are reported as <shell>/<edge>
  const yesShell = full.nodes.find((n) => n.subgraph === "sg_yes")!.id;
  const inner: string[] = [];
  await bp.evaluateGraph(full, reg, { entry: "start", onBefore: (t) => void inner.push(`${t.edge ?? "-"}>${t.node}`) });
  assert.ok(inner.some((x) => x.startsWith(`${yesShell}/`) && x.endsWith(`>${yesShell}/yes`)), inner.join(" "));
  // the path maps back to its level for breakpoints / watches
  assert.deepEqual(bp.resolveNodePath(full, `${yesShell}/yes`), { sg: "sg_yes", id: "yes", key: "sg_yes/yes" });
  assert.deepEqual(bp.subgraphPath(full, "sg_yes"), ["sg_yes"]);
});

await check("M5 breakpoints: pause before the node, step, continue, stop; one breakpoint in a definition hits every call site", async () => {
  const bps = new Set(["branch"]);
  const events: string[] = [];
  const s = new DebugSession(demoGraph, reg, { breakpoints: bps }, (e) => {
    if (e.type === "status") events.push(e.state.status);
  });
  const done = s.start();
  const at = await s.waitForPause();
  assert.deepEqual(at, { node: "branch", edge: "e1" });
  assert.deepEqual(s.state.trace.map((x) => x.node), ["start"], "paused BEFORE branch ran");
  s.step();
  assert.deepEqual(await s.waitForPause(), { node: "yes", edge: "e5" }, "step pauses before the next exec node");
  assert.deepEqual(s.state.trace.map((x) => x.node), ["start", "branch"]);
  s.continue();
  const r = await done;
  assert.ok(r?.ok);
  assert.equal(s.state.status, "done");
  assert.deepEqual(s.state.trace.map((x) => x.node), ["start", "branch", "yes"]);
  assert.equal(s.state.values.get("cmp")?.out, true, "pure values recorded for hover / watch");
  assert.deepEqual(events.filter((x, i) => x !== events[i - 1]), ["running", "paused", "running", "paused", "running", "done"]);

  // breakpoint keyed by definition: a function called twice stops twice
  const fnG = bp.applyOps(demoGraph, [
    { op: "disconnect", edge: "e1" },
    { op: "connect", from: "start.then", to: "yes.exec" },
    { op: "addNode", id: "p1", type: "flow.print", at: [900, 40] },
    { op: "connect", from: "yes.then", to: "p1.exec" },
    { op: "connect", from: "p1.then", to: "no.exec" },
    { op: "collapse", nodes: ["p1"], id: "sg_p", label: "Log", kind: "function" },
    { op: "addNode", id: "p2", type: "subgraph", subgraph: "sg_p", at: [900, 200] },
    { op: "connect", from: "no.then", to: "p2.exec" },
  ], reg);
  ok(fnG);
  const shell1 = fnG.graph.nodes.find((n) => n.subgraph === "sg_p" && n.id !== "p2")!.id;
  const chained = fnG;
  const s2 = new DebugSession(chained.graph, reg, { breakpoints: new Set(["sg_p/p1"]) });
  const run2 = s2.start();
  const hits: string[] = [];
  for (let t = await s2.waitForPause(); t; t = await s2.waitForPause()) {
    hits.push(t.node);
    s2.continue();
  }
  await run2;
  assert.deepEqual(hits, [`${shell1}/p1`, "p2/p1"]);

  // stop ends a paused run
  const s3 = new DebugSession(demoGraph, reg, { startPaused: true });
  const run3 = s3.start();
  assert.deepEqual(await s3.waitForPause(), { node: "start" });
  s3.stop();
  const r3 = await run3;
  assert.ok(r3?.stopped && s3.state.status === "stopped" && r3.trace.length === 0);
});

await check("M5 disabled nodes: exec passes through, data passes a matching input, skipped in trace/outputs, validated as a warning", async () => {
  const g = bp.applyOps(demoGraph, [
    { op: "addNode", id: "p3", type: "flow.print", at: [900, 40], values: { prefix: "after" } },
    { op: "connect", from: "yes.then", to: "p3.exec" },
    { op: "connect", from: "yes.line", to: "p3.msg" },
    { op: "updateNode", id: "yes", disabled: true },
  ], reg);
  ok(g);
  const steps: string[] = [];
  const r = await bp.evaluateGraph(g.graph, reg, { entry: "start", onStep: (s) => void steps.push(`${s.node}${s.disabled ? "(skip)" : ""}`) });
  assert.ok(r.ok, JSON.stringify([...r.errors]));
  assert.deepEqual(r.trace, ["start", "branch", "p3"], "disabled node is not in the trace");
  assert.deepEqual(steps, ["start", "branch", "yes(skip)", "p3"]);
  assert.ok(!r.outputs.has("yes"));
  // yes.line (string) takes yes.msg (string, literal "a > b") through
  assert.equal(r.outputs.get("p3")!.line, "after a > b");
  const v = bp.validateGraph(g.graph, reg);
  assert.ok(v.ok && v.issues.some((i) => i.code === "disabled-node" && i.level === "warning"));
  // a disabled node never reports a missing input
  const lonely = bp.applyOps({ nodes: [], edges: [] }, [{ op: "addNode", id: "c", type: "conv.toString" }, { op: "updateNode", id: "c", disabled: true }], reg).graph;
  assert.ok(!bp.validateGraph(lonely, reg).issues.some((i) => i.code === "missing-input"));
  // enabling again removes the flag
  const back = bp.applyOps(g.graph, [{ op: "updateNode", id: "yes", disabled: false }], reg).graph;
  assert.equal(back.nodes.find((n) => n.id === "yes")!.disabled, undefined);
  // JSON / text keep it
  assert.equal(bp.fromText(bp.toText(g.graph)).graph!.nodes.find((n) => n.id === "yes")!.disabled, true);
});

function varGraph(): Graph {
  const r = bp.applyOps({ nodes: [], edges: [] }, [
    { op: "addVariable", id: "v_n", name: "Count", type: "number", default: 0 },
    { op: "addVariable", id: "v_s", name: "Label", type: "string", default: "hi" },
    { op: "addNode", id: "start", type: "event.start" },
    { op: "addNode", id: "get", type: "var.get", variable: "v_n" },
    { op: "addNode", id: "inc", type: "math.add", values: { b: 1 } },
    { op: "addNode", id: "set1", type: "var.set", variable: "v_n" },
    { op: "addNode", id: "set2", type: "var.set", variable: "v_n" },
    { op: "connect", from: "get.value", to: "inc.a" },
    { op: "connect", from: "inc.out", to: "set1.value" },
    { op: "connect", from: "inc.out", to: "set2.value" },
    { op: "connect", from: "start.then", to: "set1.exec" },
    { op: "connect", from: "set1.then", to: "set2.exec" },
  ], reg);
  ok(r);
  return r.graph;
}

await check("M5 variables: Get/Set evaluate, pins follow the variable, rename propagates, remove drops its nodes", async () => {
  const g = varGraph();
  const r = await bp.evaluateGraph(g, reg, { entry: "start" });
  assert.ok(r.ok, JSON.stringify([...r.errors]));
  assert.equal(r.variables.get("v_n"), 2, "two sets, Get re-read between them (pure node per step)");
  assert.equal((await bp.evaluateGraph(g, reg, { entry: "start", variables: { v_n: 10 } })).variables.get("v_n"), 12);
  const get = g.nodes.find((n) => n.id === "get")!;
  assert.deepEqual(bp.getPorts(get, reg, g).outputs.map((p) => `${p.id}:${p.type}:${p.label}`), ["value:number:Count"]);
  const renamed = bp.applyOps(g, [{ op: "updateVariable", id: "v_n", name: "Total" }], reg).graph;
  assert.equal(bp.getPorts(get, reg, renamed).outputs[0]!.label, "Total");
  // type change: pins retype, the wire into inc.a (number) stays valid only for compatible types
  const retyped = bp.applyOps(g, [{ op: "updateVariable", id: "v_n", type: "string" }], reg).graph;
  assert.ok(bp.validateGraph(retyped, reg).issues.some((i) => i.code === "type-mismatch"));
  assert.equal(retyped.variables!.find((v) => v.id === "v_n")!.default, undefined, "default dropped when the type changes");
  const removed = bp.applyOps(g, [{ op: "removeVariable", id: "v_n" }], reg).graph;
  assert.ok(!removed.nodes.some((n) => n.variable === "v_n") && !removed.edges.some((e) => e.from.node === "get"));
  assert.deepEqual(removed.variables!.map((v) => v.id), ["v_s"]);
  // dangling reference is an error, unknown type refused
  const dangling: Graph = { ...g, variables: [] };
  assert.ok(bp.validateGraph(dangling, reg).issues.some((i) => i.code === "unknown-variable"));
  assert.equal(bp.applyOps(g, [{ op: "addVariable", name: "x", type: "exec" }], reg).errors.length, 1);
  assert.equal(bp.applyOps(g, [{ op: "addNode", type: "var.get", variable: "nope" }], reg).errors.length, 1);
});

await check("M5 variables round-trip: JSON, schema, text, clipboard; v1 still reads", () => {
  const g = varGraph();
  const json = bp.toJSON(g);
  assert.deepEqual(json.variables, [{ id: "v_n", name: "Count", type: "number", default: 0 }, { id: "v_s", name: "Label", type: "string", default: "hi" }]);
  const back = bp.fromJSON(JSON.stringify(json));
  assert.ok(back.ok, back.errors.join("\n"));
  assert.deepEqual(bp.toJSON(back.graph!), json);
  assert.deepEqual(schemaErrors(bp.graphSchema, JSON.parse(JSON.stringify(json))), []);
  const text = bp.toText(g);
  assert.match(text, /^variable v_n "Count" number default=0$/m);
  const t = bp.fromText(text);
  assert.ok(t.ok, t.errors.join("\n"));
  assert.deepEqual(bp.toJSON(t.graph!), json);
  assert.equal(bp.toText(t.graph!), text);
  // copying a Get node carries its variable; pasting into a graph with a same-named variable reuses it
  const clip = bp.copySelection(g, { nodes: ["get"] }, reg);
  assert.deepEqual(clip.variables?.map((v) => v.id), ["v_n"]);
  const fresh = bp.pasteClip({ nodes: [], edges: [] }, bp.fromText(bp.toText(clip)).graph!, bp.createIdGen({ nodes: [], edges: [] }));
  assert.deepEqual(fresh.graph.variables?.map((v) => v.name), ["Count"]);
  const twin: Graph = { nodes: [], edges: [], variables: [{ id: "other", name: "Count", type: "number" }] };
  const reused = bp.pasteClip(twin, clip, bp.createIdGen(twin));
  assert.equal(reused.graph.variables!.length, 1);
  assert.equal(reused.graph.nodes[0]!.variable, "other");
  // a v1 file (no variables anywhere) still reads
  assert.ok(bp.fromJSON({ version: 1, nodes: [{ id: "n", type: "event.start", x: 0, y: 0 }], edges: [] }).ok);
  // bad variable entries are reported with a path
  const bad = bp.fromJSON({ version: 2, nodes: [], edges: [], variables: [{ id: "v", type: "number" }] });
  assert.ok(!bad.ok && bad.errors[0]!.startsWith("graph.variables[0].name"));
});

await check("M5 function vs macro: exec rules, locals reset per call, macro exits continue inline", async () => {
  // a node that fires two exec outputs in order (UE Sequence)
  const seq = bp.demoTypes.defineNode({
    id: "flow.seq", title: "Sequence", category: "Flow", kind: "flow",
    inputs: [{ id: "exec", type: "exec" }],
    outputs: [{ id: "a", type: "exec" }, { id: "b", type: "exec" }],
  });
  const reg2 = bp.createRegistry(bp.demoTypes, [...bp.demoNodes, seq]);
  const base = bp.applyOps({ nodes: [], edges: [] }, [
    { op: "addNode", id: "start", type: "event.start" },
    { op: "addNode", id: "seq", type: "flow.seq" },
    { op: "addNode", id: "inA", type: "flow.print", values: { prefix: "inA" } },
    { op: "addNode", id: "inB", type: "flow.print", values: { prefix: "inB" } },
    { op: "addNode", id: "outA", type: "flow.print", values: { prefix: "outA" } },
    { op: "addNode", id: "outB", type: "flow.print", values: { prefix: "outB" } },
    { op: "connect", from: "start.then", to: "seq.exec" },
    { op: "connect", from: "seq.a", to: "inA.exec" },
    { op: "connect", from: "seq.b", to: "inB.exec" },
    { op: "connect", from: "inA.then", to: "outA.exec" },
    { op: "connect", from: "inB.then", to: "outB.exec" },
  ], reg2);
  ok(base);
  // two exec outputs leave the selection: a function refuses, a macro / graph accept
  const asFn = bp.applyOps(base.graph, [{ op: "collapse", nodes: ["seq", "inA", "inB"], kind: "function" }], reg2);
  assert.equal(asFn.errors.length, 1);
  assert.match(asFn.errors[0]!.message, /function takes at most one exec input/);
  const order = async (kind: "macro" | "graph") => {
    const r = bp.applyOps(base.graph, [{ op: "collapse", nodes: ["seq", "inA", "inB"], id: "sg", kind }], reg2);
    ok(r);
    const ev = await bp.evaluateGraph(r.graph, reg2, { entry: "start" });
    assert.ok(ev.ok, JSON.stringify([...ev.errors]));
    const shellId = r.graph.nodes.find((n) => n.subgraph === "sg")!.id;
    return ev.trace.map((p) => (p === shellId ? "SHELL" : p.split("/").pop()));
  };
  assert.deepEqual(await order("macro"), ["start", "SHELL", "seq", "inA", "outA", "inB", "outB"], "macro: an exit continues the outer flow at once");
  assert.deepEqual(await order("graph"), ["start", "SHELL", "seq", "inA", "inB", "outA", "outB"], "collapsed graph: exits fire after the body");

  // function: one exec in / out, a local counter that resets on every call, a return value
  const fn = bp.applyOps({ nodes: [], edges: [] }, [
    { op: "addNode", id: "start", type: "event.start" },
    { op: "addNode", id: "body", type: "flow.print", values: { prefix: "call" } },
    { op: "addNode", id: "after", type: "flow.print", values: { prefix: "after" } },
    { op: "connect", from: "start.then", to: "body.exec" },
    { op: "connect", from: "body.then", to: "after.exec" },
    { op: "collapse", nodes: ["body"], id: "sg_f", label: "Tick", kind: "function" },
  ], reg);
  ok(fn);
  const shell = fn.graph.nodes.find((n) => n.subgraph === "sg_f")!.id;
  // inside the function: local counter = counter + 1, then return it
  const inner = bp.applyOps(fn.graph, [
    { op: "addVariable", id: "v_local", name: "n", type: "number", default: 0, local: true },
    { op: "addNode", id: "lget", type: "var.get", variable: "v_local" },
    { op: "addNode", id: "ladd", type: "math.add", values: { b: 1 } },
    { op: "addNode", id: "lset", type: "var.set", variable: "v_local" },
    { op: "connect", from: "lget.value", to: "ladd.a" },
    { op: "connect", from: "ladd.out", to: "lset.value" },
    { op: "connect", from: "body.then", to: "lset.exec" },
    { op: "connect", from: "lset.then", to: `${bp.subgraphAsGraph(fn.graph, "sg_f")!.nodes.find((n) => n.type === bp.TUNNEL_OUT)!.id}.then` },
  ], reg, { subgraph: "sg_f" });
  ok(inner);
  assert.deepEqual(inner.graph.subgraphs!.sg_f!.variables?.map((v) => v.id), ["v_local"], "locals live on the definition");
  assert.equal(inner.graph.variables, undefined, "and not on the graph");
  // two call sites: each sees the local start at 0
  const two = bp.applyOps(inner.graph, [
    { op: "addNode", id: "call2", type: "subgraph", subgraph: "sg_f" },
    { op: "connect", from: `${shell}.then`, to: "call2.exec" },
  ], reg);
  ok(two);
  const sets: unknown[] = [];
  const ev = await bp.evaluateGraph(two.graph, reg, { entry: "start", onStep: (s) => { if (s.node.endsWith("/lset")) sets.push(s.outputs.value); } });
  assert.ok(ev.ok, JSON.stringify([...ev.errors]));
  assert.deepEqual(sets, [1, 1], "locals reset per call");
  assert.deepEqual(ev.trace.filter((p) => !p.includes("/")), ["start", shell, "call2"]);
  assert.deepEqual(ev.trace.filter((p) => p.startsWith(`${shell}/`)), [`${shell}/body`, `${shell}/lset`], "body runs to the return before the call continues");
  // local variables only inside a function; converting a 2-exec graph to a function is refused
  assert.equal(bp.applyOps(base.graph, [{ op: "addVariable", name: "x", type: "number", local: true }], reg2).errors.length, 1);
  const g2 = bp.applyOps(base.graph, [{ op: "collapse", nodes: ["seq", "inA", "inB"], id: "sg", kind: "macro" }], reg2).graph;
  assert.equal(bp.applyOps(g2, [{ op: "updateSubgraph", id: "sg", kind: "function" }], reg2).errors.length, 1);
  // a function that grew a second exec output is flagged
  const forced: Graph = { ...g2, subgraphs: { sg: { ...g2.subgraphs!.sg!, kind: "function" } } };
  assert.ok(bp.validateGraph(forced, reg2).issues.some((i) => i.code === "function-exec"));
  // kind and locals round-trip
  const t = bp.fromText(bp.toText(two.graph));
  assert.ok(t.ok, t.errors.join("\n"));
  assert.deepEqual(bp.toJSON(t.graph!), bp.toJSON(two.graph));
  assert.equal(t.graph!.subgraphs!.sg_f!.kind, "function");
  // expanding a function promotes its locals to graph variables
  const ex = bp.applyOps(two.graph, [{ op: "expand", node: "call2", keepDefinition: true }], reg);
  ok(ex);
  assert.deepEqual(ex.graph.variables?.map((v) => v.id), ["v_local"]);
});


// ---------------------------------------------------------------------------- M6: functions as library primitives

/** start -> f(a.value) -> print(f.out); f = "加倍" function with an exec pin, two call sites. */
function fnDoc(): Graph {
  const base = bp.applyOps({ nodes: [], edges: [] }, [
    { op: "addNode", id: "start", type: "event.start" },
    { op: "addNode", id: "a", type: "value.number", values: { v: 4 } },
    { op: "addSubgraph", id: "f", label: "加倍", kind: "function", inputs: [{ id: "x", type: "number", label: "x" }], outputs: [{ id: "out", type: "number", label: "结果" }] },
  ], reg).graph;
  // body: Get x + Get x -> Return.out
  const body = bp.applyOps(base, [
    { op: "addNode", id: "gx", type: "var.get", variable: "$in:x" },
    { op: "addNode", id: "add", type: "math.add" },
    { op: "connect", from: "gx.value", to: "add.a" },
    { op: "connect", from: "gx.value", to: "add.b" },
  ], reg, { subgraph: "f" });
  assert.deepEqual(body.errors, []);
  const ret = body.graph.subgraphs!.f!.nodes.find((n) => n.type === "subgraph.out")!.id;
  const wired = bp.applyOps(body.graph, [{ op: "connect", from: "add.out", to: `${ret}.out` }], reg, { subgraph: "f" }).graph;
  return bp.applyOps(wired, [
    { op: "addNode", id: "call", type: "subgraph", subgraph: "f" },
    { op: "addNode", id: "call2", type: "subgraph", subgraph: "f" },
    { op: "addNode", id: "p", type: "flow.print" },
    { op: "connect", from: "start.then", to: "call.exec" },
    { op: "connect", from: "a.value", to: "call.x" },
    { op: "connect", from: "call.then", to: "p.exec" },
    { op: "connect", from: "call.out", to: "p.msg" },
    { op: "connect", from: "a.value", to: "call2.x" },
  ], reg).graph;
}

await check("M6 addSubgraph + input getters: a new function with entry / Return, $in: getters read the call site's pin", async () => {
  const g = fnDoc();
  const v = bp.validateGraph(g, reg);
  assert.ok(v.ok, JSON.stringify(v.issues));
  const r = await bp.evaluateGraph(g, reg, { entry: "start" });
  assert.equal(r.outputs.get("p")?.line, "> 8");
  // getters are read only: a Set of an input does not resolve
  const set = bp.applyOps(g, [{ op: "addNode", id: "sx", type: "var.set", variable: "$in:x" }], reg, { subgraph: "f" });
  assert.equal(set.errors.length, 1, "addNode refuses an unknown variable");
  // getters outside a function do not resolve either
  assert.equal(bp.applyOps(g, [{ op: "addNode", type: "var.get", variable: "$in:x" }], reg).errors.length, 1);
});

await check("M6 signature change propagates: rename keeps wires, retype breaks call sites (validated), remove drops wires everywhere", () => {
  const g = fnDoc();
  const sig = bp.signatureOf(g.subgraphs!.f!);
  // rename: label only, every call site shows it, nothing breaks
  const renamed = bp.applyOps(g, [{ op: "setSignature", id: "f", inputs: sig.inputs.map((p) => (p.id === "x" ? { ...p, label: "数值" } : p)) }], reg).graph;
  assert.equal(bp.getPorts(renamed.nodes.find((n) => n.id === "call")!, reg, renamed).inputs.find((p) => p.id === "x")?.label, "数值");
  assert.ok(bp.validateGraph(renamed, reg).ok);
  // retype x to string: wires from a number output stay, validation reports the broken call sites
  const retyped = bp.applyOps(g, [{ op: "setSignature", id: "f", inputs: sig.inputs.map((p) => (p.id === "x" ? { ...p, type: "string" } : p)) }], reg).graph;
  const issues = bp.validateGraph(retyped, reg).issues.filter((i) => i.code === "broken-call");
  assert.ok(issues.some((i) => i.nodeIds?.includes("call")) && issues.some((i) => i.nodeIds?.includes("call2")), JSON.stringify(issues));
  assert.deepEqual(bp.brokenCallSites(retyped, "f", reg).map((c) => c.node.id).sort(), ["call", "call2"]);
  // remove output "out": the call site wire out -> p.msg and the inner wire to Return are gone
  const removed = bp.applyOps(g, [{ op: "setSignature", id: "f", outputs: sig.outputs.filter((p) => p.id !== "out") }], reg).graph;
  assert.ok(!removed.edges.some((e) => e.from.node === "call" && e.from.pin === "out"));
  assert.ok(!removed.subgraphs!.f!.edges.some((e) => e.to.pin === "out"));
  // remove input "x": its getter dies with it, call-site literal / wire gone
  const noX = bp.applyOps(g, [{ op: "setSignature", id: "f", inputs: sig.inputs.filter((p) => p.id !== "x") }], reg).graph;
  assert.ok(!noX.subgraphs!.f!.nodes.some((n) => n.variable === "$in:x"));
  assert.ok(!noX.edges.some((e) => e.to.node === "call2"));
  // a stale wire written by hand shows as broken-call, not as a generic unknown pin
  const stale: Graph = { ...g, edges: [...g.edges, { id: "zz", from: { node: "a", pin: "value" }, to: { node: "call2", pin: "nope" } }] };
  assert.ok(bp.validateGraph(stale, reg).issues.some((i) => i.code === "broken-call" && i.edgeIds?.includes("zz")));
  // exec rules still hold for functions
  assert.equal(bp.applyOps(g, [{ op: "setSignature", id: "f", outputs: [...sig.outputs, { id: "then2", type: "exec" }] }], reg).errors.length, 1);
  // signature edits inside the function's own view run on the document (DOC op), not on the view
  const inside = bp.applyOps(g, [{ op: "setSignature", id: "f", inputs: [...sig.inputs, { id: "y", type: "number" }] }, { op: "addNode", id: "gy", type: "var.get", variable: "$in:y" }], reg, { subgraph: "f" });
  assert.deepEqual(inside.errors, []);
  assert.ok(bp.getPorts(inside.graph.nodes.find((n) => n.id === "call")!, reg, inside.graph).inputs.some((p) => p.id === "y"));
  assert.ok(inside.graph.subgraphs!.f!.nodes.some((n) => n.id === "gy"));
});

await check("M6 Return nodes: several allowed in a function, one signature, the reached one returns", async () => {
  // f(x): Branch(x > 5) true -> Return#1(out = 1), false -> Return#2(out = 2)
  let g = bp.applyOps({ nodes: [], edges: [] }, [
    { op: "addNode", id: "start", type: "event.start" },
    { op: "addSubgraph", id: "f", kind: "function", label: "分级", inputs: [{ id: "x", type: "number" }], outputs: [{ id: "out", type: "number" }] },
  ], reg).graph;
  const def = g.subgraphs!.f!;
  const entry = def.nodes.find((n) => n.type === "subgraph.in")!.id;
  const ret1 = def.nodes.find((n) => n.type === "subgraph.out")!.id;
  const inner = bp.applyOps(g, [
    { op: "disconnect", pin: `${entry}.exec` },
    { op: "addNode", id: "ret2", type: "subgraph.out", at: [480, 200] },
    { op: "addNode", id: "gx", type: "var.get", variable: "$in:x" },
    { op: "addNode", id: "cmp", type: "math.compare", values: { b: 5, op: "gt" } },
    { op: "addNode", id: "br", type: "flow.branch" },
    { op: "connect", from: "gx.value", to: "cmp.a" },
    { op: "connect", from: "cmp.out", to: "br.cond" },
    { op: "connect", from: `${entry}.exec`, to: "br.exec" },
    { op: "connect", from: "br.true", to: `${ret1}.then` },
    { op: "connect", from: "br.false", to: "ret2.then" },
    { op: "setValue", node: ret1, key: "out", value: 1 },
    { op: "setValue", node: "ret2", key: "out", value: 2 },
  ], reg, { subgraph: "f" });
  assert.deepEqual(inner.errors, []);
  g = inner.graph;
  const rets = g.subgraphs!.f!.nodes.filter((n) => n.type === "subgraph.out");
  assert.equal(rets.length, 2);
  assert.deepEqual(rets[1]!.pins, rets[0]!.pins, "the second Return copies the signature");
  // call site pins counted once
  g = bp.applyOps(g, [
    { op: "addNode", id: "c", type: "subgraph", subgraph: "f", values: { x: 9 } },
    { op: "addNode", id: "p", type: "flow.print" },
    { op: "addNode", id: "s", type: "conv.toString" },
    { op: "connect", from: "start.then", to: "c.exec" },
    { op: "connect", from: "c.then", to: "p.exec" },
    { op: "connect", from: "c.out", to: "s.in" },
    { op: "connect", from: "s.out", to: "p.msg" },
  ], reg).graph;
  assert.equal(bp.getPorts(g.nodes.find((n) => n.id === "c")!, reg, g).outputs.length, 2);
  assert.ok(bp.validateGraph(g, reg).ok, JSON.stringify(bp.validateGraph(g, reg).issues));
  assert.equal((await bp.evaluateGraph(g, reg, { entry: "start" })).outputs.get("p")?.line, "> 1");
  const low = bp.applyOps(g, [{ op: "setValue", node: "c", key: "x", value: 2 }], reg).graph;
  assert.equal((await bp.evaluateGraph(low, reg, { entry: "start" })).outputs.get("p")?.line, "> 2");
  // a Return node only exists inside functions; a function with two Returns cannot be inlined
  assert.equal(bp.applyOps(g, [{ op: "addNode", type: "subgraph.out" }], reg).errors.length, 1);
  assert.ok(bp.applyOps(g, [{ op: "expand", node: "c" }], reg).errors.length === 1);
});

await check("M6 pure functions: no exec pins, pulled per exec step like a pure node, validated", async () => {
  // collapse a data-only selection to a function: pure automatically
  const g0 = bp.applyOps(demoGraph, [{ op: "collapse", nodes: ["cmp"], id: "pf", label: "比较", kind: "function" }], reg).graph;
  assert.equal(g0.subgraphs!.pf!.pure, true);
  const r0 = await bp.evaluateGraph(g0, reg, { entry: "start" });
  assert.deepEqual(r0.trace, ["start", "branch", "yes"]);
  // a pure function is recomputed for each exec step that pulls it (counter variable changes between pulls)
  let g = bp.applyOps({ nodes: [], edges: [], variables: [{ id: "n", name: "n", type: "number", default: 0 }] }, [
    { op: "addSubgraph", id: "sq", kind: "function", pure: true, label: "平方", inputs: [{ id: "x", type: "number" }], outputs: [{ id: "out", type: "number" }] },
  ], reg).graph;
  assert.equal(bp.signatureOf(g.subgraphs!.sq!).inputs.some((p) => p.type === "exec"), false);
  const ret = g.subgraphs!.sq!.nodes.find((n) => n.type === "subgraph.out")!.id;
  g = bp.applyOps(g, [
    { op: "addNode", id: "gx", type: "var.get", variable: "$in:x" },
    { op: "addNode", id: "m", type: "math.multiply" },
    { op: "connect", from: "gx.value", to: "m.a" },
    { op: "connect", from: "gx.value", to: "m.b" },
    { op: "connect", from: "m.out", to: `${ret}.out` },
  ], reg, { subgraph: "sq" }).graph;
  g = bp.applyOps(g, [
    { op: "addNode", id: "start", type: "event.start" },
    { op: "addNode", id: "get", type: "var.get", variable: "n" },
    { op: "addNode", id: "inc", type: "math.add", values: { b: 3 } },
    { op: "addNode", id: "set1", type: "var.set", variable: "n" },
    { op: "addNode", id: "call", type: "subgraph", subgraph: "sq" },
    { op: "addNode", id: "set2", type: "var.set", variable: "n" },
    { op: "connect", from: "start.then", to: "set1.exec" },
    { op: "connect", from: "get.value", to: "inc.a" },
    { op: "connect", from: "inc.out", to: "set1.value" },
    { op: "connect", from: "set1.then", to: "set2.exec" },
    { op: "connect", from: "get.value", to: "call.x" },
    { op: "connect", from: "call.out", to: "set2.value" },
  ], reg).graph;
  assert.ok(bp.validateGraph(g, reg).ok, JSON.stringify(bp.validateGraph(g, reg).issues));
  const r = await bp.evaluateGraph(g, reg, { entry: "start" });
  assert.equal(r.variables.get("n"), 9, "set2 pulled sq(n) after set1 made n = 3");
  // exec nodes inside a pure function are an error; turning it impure adds exec pins back, wired through
  const bad = bp.applyOps(g, [{ op: "addNode", id: "pp", type: "flow.print" }], reg, { subgraph: "sq" }).graph;
  assert.ok(bp.validateGraph(bad, reg).issues.some((i) => i.code === "pure-function"));
  const impure = bp.applyOps(g, [{ op: "updateSubgraph", id: "sq", pure: false }], reg).graph;
  assert.equal(impure.subgraphs!.sq!.pure, undefined);
  assert.ok(bp.signatureOf(impure.subgraphs!.sq!).inputs.some((p) => p.type === "exec"));
  assert.ok(bp.applyOps(bad, [{ op: "updateSubgraph", id: "sq", pure: true }], reg).errors.length === 0, "already pure: no-op");
  const backPure = bp.applyOps(impure, [{ op: "updateSubgraph", id: "sq", pure: true }], reg).graph;
  assert.equal(backPure.subgraphs!.sq!.pure, true);
  assert.ok(!bp.signatureOf(backPure.subgraphs!.sq!).inputs.some((p) => p.type === "exec"));
  // const: setting a graph variable inside is an error, locals are fine
  const cst = bp.applyOps(fnDoc(), [{ op: "updateSubgraph", id: "f", const: true }], reg).graph;
  assert.ok(bp.validateGraph(cst, reg).ok);
  const writes = bp.applyOps({ ...cst, variables: [{ id: "gv", name: "g", type: "number" }] }, [{ op: "addNode", id: "w", type: "var.set", variable: "gv" }], reg, { subgraph: "f" }).graph;
  assert.ok(bp.validateGraph(writes, reg).issues.some((i) => i.code === "const-function"));
});

await check("M6 expand / inline a function call: input getters become wires or literals, round trip evaluates the same", async () => {
  const g = fnDoc();
  const lit = bp.applyOps(g, [{ op: "disconnect", edge: g.edges.find((e) => e.to.node === "call2")!.id }, { op: "setValue", node: "call2", key: "x", value: 10 }], reg).graph;
  const ex = bp.applyOps(lit, [{ op: "expand", node: "call" }, { op: "expand", node: "call2", keepDefinition: true }], reg);
  assert.deepEqual(ex.errors, []);
  assert.ok(!ex.graph.nodes.some((n) => n.variable?.startsWith("$in:")), "no getter left outside the function");
  assert.ok(bp.validateGraph(ex.graph, reg).ok, JSON.stringify(bp.validateGraph(ex.graph, reg).issues));
  assert.equal((await bp.evaluateGraph(ex.graph, reg, { entry: "start" })).outputs.get("p")?.line, "> 8");
  const adds = ex.graph.nodes.filter((n) => n.type === "math.add");
  assert.ok(adds.some((n) => n.values?.a === 10 && n.values?.b === 10), "literal on the call site moved onto the inner pins");
});

await check("M6 My Blueprint ops: duplicate, remove (with call sites), meta, variable category / tooltip, container types", () => {
  const g = fnDoc();
  const d = bp.applyOps(g, [{ op: "duplicateSubgraph", id: "f" }], reg);
  const copy = d.created["#0"]!;
  assert.equal(d.graph.subgraphs![copy]!.label, "加倍 副本");
  const rm = bp.applyOps(d.graph, [{ op: "removeSubgraph", id: "f" }], reg).graph;
  assert.ok(!rm.subgraphs!.f && !rm.nodes.some((n) => n.subgraph === "f") && !rm.edges.some((e) => e.to.node === "call"));
  const m = bp.applyOps(g, [{ op: "setMeta", name: "文档", description: "说明" }, { op: "addVariable", id: "list", name: "列表", type: "array<number>", default: [1, 2], category: "数据", tooltip: "一串数" }], reg).graph;
  assert.deepEqual(m.meta, { name: "文档", description: "说明" });
  assert.equal(reg.shape("array<number>"), "array");
  assert.ok(reg.assignable("array<number>", "numbers") && reg.assignable("numbers", "array<number>"), "structural: same as a registered number array");
  assert.ok(!reg.assignable("array<number>", "array<string>"));
  assert.equal(reg.shape("map<string,boolean>"), "map");
  assert.equal(reg.type("array<exec>"), undefined, "no containers of exec");
  assert.deepEqual(bp.parseContainer("map<string,number>"), { kind: "map", key: "string", of: "number" });
  // round trips: JSON, schema, text
  const full = bp.applyOps(m, [{ op: "updateSubgraph", id: "f", category: "数学", description: "两倍", keywords: "double", const: true }, { op: "updateNode", id: "p", devOnly: true, comment: "开发用", commentPinned: true }], reg).graph;
  const json = bp.toJSON(full);
  assert.deepEqual(schemaErrors(bp.graphSchema, json), []);
  const back = bp.fromJSON(JSON.stringify(json));
  assert.ok(back.ok, back.errors.join());
  assert.deepEqual(canon(back.graph!), canon(full));
  const t = bp.fromText(bp.toText(full));
  assert.ok(t.ok, t.errors.join());
  assert.deepEqual(canon(t.graph!), canon(full));
});

await check("M6 libraries: define, menu items from the registry, import with dependencies, JSON / text round-trip, package a document", async () => {
  const lib = bp.demoLibrary;
  assert.ok(reg.libraries.some((l) => l.id === "demo"));
  assert.throws(() => bp.defineLibrary({ id: "bad id", name: "x", items: [] }));
  // import one item (pure function) and call it
  const imp = bp.applyOps(demoGraph, [{ op: "importLibrary", library: lib, items: ["square"] }], reg);
  assert.deepEqual(imp.errors, []);
  const sid = imp.created["#0"]!;
  assert.equal(sid, "demo:square");
  assert.equal(imp.graph.subgraphs![sid]!.library, "demo");
  const used = bp.applyOps(imp.graph, [
    { op: "addNode", id: "sq", type: "subgraph", subgraph: sid },
    { op: "connect", from: "a.value", to: "sq.x" },
  ], reg).graph;
  assert.ok(bp.validateGraph(used, reg).ok);
  assert.equal((await bp.evaluateGraph(used, reg)).outputs.get("sq")?.out, 49);
  // an item that calls another item brings it along
  const nested = bp.defineLibrary({
    id: "n2", name: "嵌套", items: [
      lib.items.square!,
      { ...lib.items.square!, id: "quad", label: "四次方", nodes: [
        { id: "in", type: "subgraph.in", x: 0, y: 0, pins: { outputs: [{ id: "x", type: "number" }] } },
        { id: "s1", type: "subgraph", subgraph: "square", x: 200, y: 0 },
        { id: "s2", type: "subgraph", subgraph: "square", x: 400, y: 0 },
        { id: "out", type: "subgraph.out", x: 600, y: 0, pins: { inputs: [{ id: "out", type: "number" }] } },
      ], edges: [
        { id: "e1", from: { node: "in", pin: "x" }, to: { node: "s1", pin: "x" } },
        { id: "e2", from: { node: "s1", pin: "out" }, to: { node: "s2", pin: "x" } },
        { id: "e3", from: { node: "s2", pin: "out" }, to: { node: "out", pin: "out" } },
      ] },
    ],
  });
  const q = bp.applyOps(demoGraph, [{ op: "importLibrary", library: nested, items: ["quad"] }, { op: "addNode", id: "q", type: "subgraph", subgraph: "n2:quad" }, { op: "connect", from: "b.value", to: "q.x" }], reg).graph;
  assert.ok(q.subgraphs!["n2:square"], "dependency imported");
  assert.equal((await bp.evaluateGraph(q, reg)).outputs.get("q")?.out, 625);
  // replace: false keeps a locally edited copy
  const edited = { ...q, subgraphs: { ...q.subgraphs, "n2:quad": { ...q.subgraphs!["n2:quad"]!, label: "改过" } } };
  assert.equal(bp.applyOps(edited, [{ op: "importLibrary", library: nested, replace: false }], reg).graph.subgraphs!["n2:quad"]!.label, "改过");
  assert.equal(bp.applyOps(edited, [{ op: "importLibrary", library: nested }], reg).graph.subgraphs!["n2:quad"]!.label, "四次方");
  // JSON / text round-trip
  const j = bp.libraryFromJSON(JSON.stringify(bp.libraryToJSON(nested)));
  assert.ok(j.ok, j.errors.join());
  assert.deepEqual(bp.libraryToJSON(j.library!), bp.libraryToJSON(nested));
  const tx = bp.libraryFromText(bp.libraryToText(lib));
  assert.ok(tx.ok, tx.errors.join());
  assert.deepEqual(bp.libraryToJSON(tx.library!), bp.libraryToJSON(lib));
  assert.equal(bp.libraryFromJSON("{}").ok, false);
  // package a document's function (plus what it calls) as a library, then reuse it elsewhere
  const pkg = bp.libraryFromGraph(q, ["n2:quad"], { id: "mine", name: "我的" });
  assert.deepEqual(Object.keys(pkg.library.items).sort(), ["quad", "square"]);
  assert.deepEqual(pkg.warnings, []);
  assert.equal(pkg.library.items.quad!.nodes.find((n) => n.id === "s1")!.subgraph, "square");
  const fromFn = bp.libraryFromGraph(fnDoc(), ["f"], { id: "fn", name: "函数" });
  assert.ok(fromFn.library.items.f);
});

await check("M6 conditional breakpoints, hit counts, run to cursor, call stack", async () => {
  // put an exec node (print "fp", fed by the input x) inside the function body
  const base = fnDoc();
  const def = base.subgraphs!.f!;
  const entry = def.nodes.find((n) => n.type === "subgraph.in")!.id;
  const ret = def.nodes.find((n) => n.type === "subgraph.out")!.id;
  const g = bp.applyOps(base, [
    { op: "disconnect", pin: `${entry}.exec` },
    { op: "addNode", id: "fp", type: "flow.print" },
    { op: "addNode", id: "ts", type: "conv.toString" },
    { op: "connect", from: "gx.value", to: "ts.in" },
    { op: "connect", from: "ts.out", to: "fp.msg" },
    { op: "connect", from: `${entry}.exec`, to: "fp.exec" },
    { op: "connect", from: "fp.then", to: `${ret}.then` },
  ], reg, { subgraph: "f" }).graph;
  assert.ok(bp.validateGraph(g, reg).ok, JSON.stringify(bp.validateGraph(g, reg).issues));
  // condition over the node's input values: msg is computed on demand from the call site's x
  const cond = new Map([["f/fp", { condition: "msg == '4' && hit >= 1" }]]);
  const s = new DebugSession(g, reg, { breakpoints: new Set(["f/fp"]), conditions: cond });
  void s.start();
  const at = await s.waitForPause();
  assert.equal(at?.node, "call/fp");
  assert.equal(s.state.reason, "breakpoint");
  assert.equal(s.state.hits.get("f/fp"), 1);
  // call stack: the call site on the main graph, then the node inside the function
  assert.deepEqual(bp.callStackOf(g, at!.node).map((f) => `${f.sg ?? "main"}:${f.id}`), ["main:call", "f:fp"]);
  s.continue();
  assert.equal(await s.waitForPause(), undefined);
  assert.equal(s.state.status, "done");
  // false condition never stops; broken expression stops (safer)
  const s2 = new DebugSession(g, reg, { breakpoints: new Set(["f/fp"]), conditions: new Map([["f/fp", { condition: "msg == '5'" }]]) });
  await s2.start();
  assert.equal(s2.state.status, "done");
  const s3 = new DebugSession(g, reg, { breakpoints: new Set(["p"]), conditions: new Map([["p", { condition: "msg ==" }]]) });
  void s3.start();
  assert.equal((await s3.waitForPause())?.node, "p");
  s3.stop();
  // hit count: a loop through a node, stop only from the 3rd visit; disabled spec never stops
  assert.equal(bp.compileExpr("hit % 2 == 0").run({ hit: 4 }), true);
  assert.equal(bp.compileExpr("items.length > 1 && name != ''").run({ items: [1, 2], name: "x" }), true);
  assert.equal(bp.compileExpr("a.constructor").run({ a: {} }), undefined, "no prototype access");
  assert.equal(bp.compileExpr("1 +").ok, false);
  const s4 = new DebugSession(g, reg, { breakpoints: new Set(["p"]), conditions: new Map([["p", { enabled: false }]]) });
  await s4.start();
  assert.equal(s4.state.status, "done");
  const s5 = new DebugSession(g, reg, { breakpoints: new Set(["p"]), conditions: new Map([["p", { hitCount: 2 }]]) });
  await s5.start();
  assert.equal(s5.state.status, "done", "reached once, hit count 2 never stops");
  // run to cursor: one-shot, no breakpoint needed, from idle and from a pause
  const s6 = new DebugSession(g, reg, {});
  s6.runTo("p");
  assert.equal((await s6.waitForPause())?.node, "p");
  assert.equal(s6.state.reason, "cursor");
  s6.continue();
  assert.equal(await s6.waitForPause(), undefined);
  const s7 = new DebugSession(g, reg, { startPaused: true });
  void s7.start();
  assert.equal((await s7.waitForPause())?.node, "start");
  s7.runTo("f/fp");
  assert.equal((await s7.waitForPause())?.node, "call/fp");
  s7.stop();
});

await check("M6 development-only nodes run normally, are skipped in shipping runs", async () => {
  const g = bp.applyOps(demoGraph, [{ op: "updateNode", id: "branch", devOnly: true }], reg).graph;
  assert.deepEqual((await bp.evaluateGraph(g, reg, { entry: "start" })).trace, ["start", "branch", "yes"]);
  assert.deepEqual((await bp.evaluateGraph(g, reg, { entry: "start", shipping: true })).trace, ["start", "yes"]);
  // Sequence fires each output in order; Delay is latent (awaited)
  const sq = bp.applyOps({ nodes: [], edges: [] }, [
    { op: "addNode", id: "s", type: "event.start" }, { op: "addNode", id: "q", type: "flow.sequence" },
    { op: "addNode", id: "d", type: "flow.delay", values: { duration: 0.01 } },
    { op: "addNode", id: "p1", type: "flow.print" }, { op: "addNode", id: "p2", type: "flow.print" },
    { op: "connect", from: "s.then", to: "q.exec" }, { op: "connect", from: "q.then_0", to: "d.exec" },
    { op: "connect", from: "d.then", to: "p1.exec" }, { op: "connect", from: "q.then_1", to: "p2.exec" },
  ], reg).graph;
  assert.deepEqual((await bp.evaluateGraph(sq, reg, { entry: "s" })).trace, ["s", "q", "d", "p1", "p2"]);
});

console.log(`\n${passed} checks passed`);

// ---------------------------------------------------------------------------
// Tiny JSON Schema checker: the subset graphSchema uses (type, required, properties,
// additionalProperties, items, $ref to #/$defs, const, enum).
function schemaErrors(root: unknown, value: unknown): string[] {
  type S = Record<string, unknown>;
  const errs: string[] = [];
  const walk = (s: S, v: unknown, path: string): void => {
    if (typeof s.$ref === "string") return walk(((root as S).$defs as S)[s.$ref.split("/").pop()!] as S, v, path);
    if ("const" in s && v !== s.const) errs.push(`${path}: const`);
    if (Array.isArray(s.enum) && !s.enum.includes(v)) errs.push(`${path}: enum`);
    const t = s.type;
    const isObj = typeof v === "object" && v !== null && !Array.isArray(v);
    if (t === "object" && !isObj) return void errs.push(`${path}: object`);
    if (t === "array" && !Array.isArray(v)) return void errs.push(`${path}: array`);
    if ((t === "string" || t === "number" || t === "boolean") && typeof v !== t) return void errs.push(`${path}: ${t}`);
    if (isObj) {
      const o = v as S;
      const props = (s.properties ?? {}) as S;
      for (const r of (s.required ?? []) as string[]) if (!(r in o)) errs.push(`${path}.${r}: required`);
      for (const [k, x] of Object.entries(o)) {
        if (k in props) walk(props[k] as S, x, `${path}.${k}`);
        else if (s.additionalProperties === false) errs.push(`${path}.${k}: not allowed`);
        else if (typeof s.additionalProperties === "object") walk(s.additionalProperties as S, x, `${path}.${k}`);
      }
    }
    if (Array.isArray(v) && s.items) v.forEach((x, i) => walk(s.items as S, x, `${path}[${i}]`));
  };
  walk(root as S, value, "$");
  return errs;
}
