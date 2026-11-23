/**
 * Blueprint logic self-check (M0 + M1). Run: node scripts/bp-check.ts   (Node 22.18+, type stripping)
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

const bp: typeof import("../src/blueprint/index.ts") = await import("../src/blueprint/index.ts");
type Graph = import("../src/blueprint/index.ts").BlueprintGraph;
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
  assert.deepEqual(bp.nodesAcceptingPin("exec", "in", reg).map((m) => m.node.id).sort(), ["event.start", "flow.branch", "flow.print"]);
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
