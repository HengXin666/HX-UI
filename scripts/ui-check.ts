/**
 * 基础件 (src/components/ui) 的纯逻辑自检.  Run: node scripts/ui-check.ts   (Node 22.18+, 直接跑 TS)
 * 覆盖 Tree (tree-model.ts): 摊平可见行与 aria 位置, WAI-ARIA 方向键导航, 字母跳转, 展开集合, 连选, 级联勾选;
 * 展开动效 (motion/unfold.ts): 缓动与反解, 参数归一, 列表合并, 逐行关键帧规划 (自上而下揭示, 反向收起, 打断接续, 视口裁剪).
 * 组件的渲染在文档站里看. 没有测试框架, node:assert, 第一个失败就 exit 1.
 */
import assert from "node:assert/strict";

const tm = await import("../src/components/ui/tree-model.ts");
const uf = await import("../src/motion/unfold.ts");
type Node = import("../src/components/ui/tree-model.ts").TreeNode;

let passed = 0;
async function check(name: string, fn: () => void | Promise<void>) {
  try {
    await fn();
    passed++;
    console.log(`ok   ${name}`);
  } catch (e) {
    console.error(`FAIL ${name}\n${e instanceof Error ? (e.stack ?? e.message) : String(e)}`);
    process.exit(1);
  }
}

const NODES: Node[] = [
  { id: "a", label: "Alpha", children: [
    { id: "a1", label: "Apple" },
    { id: "a2", label: "Avocado", children: [{ id: "a2x", label: "Xigua" }] },
  ] },
  { id: "b", label: "Banana", hasChildren: true },
  { id: "c", label: "Cherry", disabled: true, children: [{ id: "c1", label: "Coconut" }] },
  { id: "d", label: "Durian" },
];
const ids = (rows: { node: { id: string } }[]) => rows.map((r) => r.node.id);
const rowsOf = (open: string[]) => tm.flattenVisible(NODES, new Set(open));

await check("Tree 摊平: 折起的枝不进列表, 层级 / 兄弟位置 / 连接线标记正确", () => {
  assert.deepEqual(ids(rowsOf([])), ["a", "b", "c", "d"]);
  const rows = rowsOf(["a", "a2"]);
  assert.deepEqual(ids(rows), ["a", "a1", "a2", "a2x", "b", "c", "d"]);
  const a2x = rows[3];
  assert.equal(a2x.depth, 2);
  assert.equal(a2x.parentId, "a2");
  assert.deepEqual([a2x.pos, a2x.size, a2x.last], [1, 1, true]);
  // a 之后还有兄弟 (竖线贯穿), a2 是最后一个孩子 (不再往下画)
  assert.deepEqual(a2x.guides, [true, false]);
  assert.equal(rows[4].branch, true, "hasChildren 的未加载枝也是枝");
  assert.equal(rows[4].expanded, false);
  assert.equal(tm.flattenVisible(NODES, new Set(["b"]))[1].expanded, true, "待加载的枝也能标成展开 (显示加载行)");
});

await check("Tree 键盘: 上下 / Home / End 走可见行, 到头不动", () => {
  const rows = rowsOf(["a"]);
  assert.deepEqual(tm.moveFocus(rows, "a", "ArrowDown"), { kind: "focus", id: "a1" });
  assert.deepEqual(tm.moveFocus(rows, "a1", "ArrowUp"), { kind: "focus", id: "a" });
  assert.deepEqual(tm.moveFocus(rows, "a", "ArrowUp"), { kind: "none" });
  assert.deepEqual(tm.moveFocus(rows, "d", "ArrowDown"), { kind: "none" });
  assert.deepEqual(tm.moveFocus(rows, "a2", "Home"), { kind: "focus", id: "a" });
  assert.deepEqual(tm.moveFocus(rows, "a", "End"), { kind: "focus", id: "d" });
  assert.deepEqual(tm.moveFocus([], null, "ArrowDown"), { kind: "none" });
  assert.deepEqual(tm.moveFocus(rows, null, "ArrowDown"), { kind: "focus", id: "a1" }, "没有焦点时按第一行算");
});

await check("Tree 键盘: 右 = 展开 / 进第一个孩子, 左 = 收起 / 回父, 叶子与禁用不展开", () => {
  assert.deepEqual(tm.moveFocus(rowsOf([]), "a", "ArrowRight"), { kind: "expand", id: "a" });
  assert.deepEqual(tm.moveFocus(rowsOf(["a"]), "a", "ArrowRight"), { kind: "focus", id: "a1" });
  assert.deepEqual(tm.moveFocus(rowsOf(["a"]), "a1", "ArrowRight"), { kind: "none" });
  assert.deepEqual(tm.moveFocus(rowsOf([]), "c", "ArrowRight"), { kind: "none" }, "禁用的枝不展开");
  assert.deepEqual(tm.moveFocus(rowsOf(["b"]), "b", "ArrowRight"), { kind: "none" }, "展开了但孩子还没到: 停在原地");
  assert.deepEqual(tm.moveFocus(rowsOf(["a", "a2"]), "a2", "ArrowLeft"), { kind: "collapse", id: "a2" });
  assert.deepEqual(tm.moveFocus(rowsOf(["a", "a2"]), "a2x", "ArrowLeft"), { kind: "focus", id: "a2" });
  assert.deepEqual(tm.moveFocus(rowsOf(["a"]), "a1", "ArrowLeft"), { kind: "focus", id: "a" });
  assert.deepEqual(tm.moveFocus(rowsOf([]), "a", "ArrowLeft"), { kind: "none" });
});

await check("Tree 键盘: * 展开同级所有收起的枝 (跳过禁用)", () => {
  assert.deepEqual(tm.moveFocus(rowsOf([]), "d", "*"), { kind: "expandSiblings", ids: ["a", "b"] });
  assert.deepEqual(tm.moveFocus(rowsOf(["a", "a2"]), "a1", "*"), { kind: "none" });
});

await check("Tree 字母跳转: 从下一行起循环, 不分大小写; 连按同一字母轮转; 多字母前缀", () => {
  const rows = rowsOf(["a"]);
  assert.equal(tm.typeahead(rows, "a", "a"), "a1");
  assert.equal(tm.typeahead(rows, "a1", "A"), "a2");
  assert.equal(tm.typeahead(rows, "a2", "a"), "a", "绕回开头");
  assert.equal(tm.typeahead(rows, "a1", "aa"), "a2", "连按同一字母 = 找下一个");
  assert.equal(tm.typeahead(rows, "a", "av"), "a2");
  assert.equal(tm.typeahead(rows, "a2", "av"), "a2", "多字母时当前行本身也算");
  assert.equal(tm.typeahead(rows, "a", "z"), null);
  assert.equal(tm.typeahead(rows, "a", "x"), null, "折起的行找不到");
  assert.equal(tm.textOf({ id: "n", label: 42 }), "42");
  assert.equal(tm.textOf({ id: "n", label: null, textValue: "Name" }), "Name");
});

await check("Tree 展开状态: 增删保序不重复; branchIds 只收已有孩子的枝", () => {
  assert.deepEqual(tm.setExpanded(["a"], ["b", "a"], true), ["a", "b"]);
  assert.deepEqual(tm.setExpanded(["a", "b", "c"], ["b"], false), ["a", "c"]);
  assert.deepEqual(tm.branchIds(NODES), ["a", "a2", "c"]);
  assert.deepEqual(tm.subtreeIds(NODES[0]), ["a", "a1", "a2", "a2x"]);
});

await check("Tree 多选: 切换一项, 连选跳过禁用", () => {
  assert.deepEqual(tm.toggleOne(["a1"], "a2"), ["a1", "a2"]);
  assert.deepEqual(tm.toggleOne(["a1", "a2"], "a1"), ["a2"]);
  const rows = rowsOf(["a"]);
  assert.deepEqual(tm.rangeIds(rows, "d", "a2"), ["a2", "b", "d"]);
  assert.deepEqual(tm.rangeIds(rows, "zz", "b"), ["b"]);
});

await check("Tree 级联勾选: 勾枝带上后代, 部分勾上半选, 全勾回填祖先, 禁用不动", () => {
  let sel = tm.toggleCascade(NODES, [], "a");
  assert.deepEqual(new Set(sel), new Set(["a", "a1", "a2", "a2x"]));
  sel = tm.toggleCascade(NODES, sel, "a2x");
  assert.deepEqual(new Set(sel), new Set(["a1"]), "取消唯一的孙子: a2 与 a 都退出");
  const set = new Set(sel);
  assert.equal(tm.checkState(NODES[0], set), "indeterminate");
  assert.equal(tm.checkState(NODES[0].children![1], set), false);
  sel = tm.toggleCascade(NODES, sel, "a2x");
  assert.equal(tm.checkState(NODES[0], new Set(sel)), true, "补齐后祖先回到全选");
  assert.ok(sel.includes("a"));
  assert.deepEqual(tm.toggleCascade(NODES, ["d"], "c"), ["d"], "禁用的枝不能勾");
  sel = tm.toggleCascade(NODES, sel, "a");
  assert.deepEqual(sel, [], "再点一次全部取消");
});

// ---- 展开动效 (motion/unfold.ts) ----
type UItem = import("../src/motion/unfold.ts").UnfoldItem;
type UPlan = import("../src/motion/unfold.ts").UnfoldPlan;
const ROW_H = 32;
const ROW_STEP = 34;
const VIEW = { top: 0, bottom: 2000 };
const near = (a: number, b: number, eps = 0.02) => Math.abs(a - b) <= eps;
const at = (plan: UPlan, key: string, t: number) => {
  const tr = plan.tracks.get(key);
  return tr ? uf.sampleUnfold(tr, Math.min(t, tr.duration)) : { y: 0, opacity: 1 };
};
/** 开始淡入的时刻 (ms): 最后一个不透明度还是 0 的关键帧 */
const firstSeen = (plan: UPlan, key: string) => {
  const tr = plan.tracks.get(key)!;
  const i = tr.frames.findIndex((x) => x.opacity > 0);
  return tr.frames[Math.max(0, i - 1)].offset * tr.duration;
};
/** 父 P, 新出现的 n 个孩子, 后面 m 行 (展开前紧贴着 P) */
const expandItems = (n: number, m: number): UItem[] => [
  { key: "P", phase: "stay", top: 0, height: ROW_H, y: 0 },
  ...Array.from({ length: n }, (_, i): UItem => ({ key: `c${i}`, phase: "enter", top: ROW_STEP * (i + 1), height: ROW_H })),
  ...Array.from({ length: m }, (_, i): UItem => ({ key: `t${i}`, phase: "stay", top: ROW_STEP * (n + 1 + i), height: ROW_H, y: -ROW_STEP * n })),
];

await check("Unfold 缓动: 关键字 / cubic-bezier / 数组解析, 认不出回落默认; 曲线单调, 反函数还原", () => {
  assert.deepEqual(uf.parseEasing("ease-out"), [0, 0, 0.58, 1]);
  assert.deepEqual(uf.parseEasing(" cubic-bezier(0.2, 0.8, 0.2, 1) "), [0.2, 0.8, 0.2, 1]);
  assert.deepEqual(uf.parseEasing([0.1, 0.2, 0.3, 0.4]), [0.1, 0.2, 0.3, 0.4]);
  assert.deepEqual(uf.parseEasing("bounce"), uf.UNFOLD_DEFAULTS.easing);
  assert.deepEqual(uf.parseEasing(undefined), uf.UNFOLD_DEFAULTS.easing);
  const lin = uf.cubicBezier([0, 0, 1, 1]);
  for (const t of [0, 0.25, 0.5, 0.9, 1]) assert.ok(near(lin(t), t, 1e-4));
  const e = uf.cubicBezier(uf.UNFOLD_DEFAULTS.easing);
  const inv = uf.inverseEase(e);
  let last = -1;
  for (let i = 0; i <= 20; i++) {
    const y = e(i / 20);
    assert.ok(y >= last, "单调不减");
    last = y;
    assert.ok(near(inv(y), i / 20, 1e-3) || near(e(inv(y)), y, 1e-4), "反解还原");
  }
  assert.ok(e(0.3) > 0.6, "默认曲线先快后慢 (ease-out)");
});

await check("Unfold 参数: 类型名 / 对象归一, 非法值回落默认, 封顶不小于基础时长; 总时长按行数递增并封顶", () => {
  const d = uf.resolveUnfold();
  assert.deepEqual([d.type, d.duration, d.stagger, d.maxDuration], ["slide", 220, 14, 380]);
  assert.equal(uf.resolveUnfold("fade").type, "fade");
  assert.equal(uf.resolveUnfold({ type: "none" }).type, "none");
  assert.equal(uf.resolveUnfold({ type: "wobble" as "slide" }).type, "slide");
  const o = uf.resolveUnfold({ duration: -5, stagger: Number.NaN, maxDuration: 100 });
  assert.deepEqual([o.duration, o.stagger, o.maxDuration], [220, 14, 220], "封顶小于时长时取时长");
  assert.equal(uf.unfoldDuration(d, 1), 220);
  assert.equal(uf.unfoldDuration(d, 5), 220 + 14 * 4);
  assert.equal(uf.unfoldDuration(d, 200), 380, "200 行也不超过封顶");
});

await check("Unfold 合并: 收起的行留在原位直到播完, 半路展开原样回来, 播完的丢掉", () => {
  const open = ["a", "a1", "a2", "b"];
  const closed = ["a", "b"];
  assert.deepEqual(uf.mergeUnfoldKeys(open, closed), ["a", "a1", "a2", "b"], "离开的孩子留在父后面");
  assert.deepEqual(uf.mergeUnfoldKeys(["a", "a1", "a2", "b"], open), open, "半路再展开: 顺序不变, 不重复");
  assert.deepEqual(uf.mergeUnfoldKeys(open, closed, (k) => k !== "a2"), ["a", "a1", "b"], "播完的不再保留");
  assert.deepEqual(uf.mergeUnfoldKeys(["x", "a"], ["a"]), ["x", "a"], "开头离开的行留在最前");
  assert.deepEqual(uf.mergeUnfoldKeys(["a", "b"], ["b", "a", "c"]), ["b", "a", "c"], "新顺序为准");
});

await check("Unfold 展开: 下方行从原位平滑让位, 子行自上而下依次出现且不和下方行叠在一起, 终点归位", () => {
  const o = uf.resolveUnfold();
  const plan = uf.planUnfold(expandItems(3, 2), VIEW, o);
  assert.equal(plan.duration, uf.unfoldDuration(o, 3));
  assert.equal(plan.tracks.has("P"), false, "父行不动不出轨道");
  const t0 = plan.tracks.get("t0")!;
  assert.equal(t0.fades, false, "只移动的行不写 opacity");
  assert.ok(near(t0.frames[0].y, -ROW_STEP * 3) && near(t0.frames.at(-1)!.y, 0), "下方行从原位走到新位置");
  const seen = [0, 1, 2].map((i) => firstSeen(plan, `c${i}`));
  assert.ok(seen[0] < seen[1] && seen[1] < seen[2], `自上而下: ${seen.map(Math.round).join(" < ")}`);
  assert.ok(seen[2] < plan.duration, "最后一行在让位结束前开始出现");
  for (let t = 0; t <= plan.end; t += 4) {
    const front = ROW_STEP * 4 + at(plan, "t0", t).y;
    let lastY = -Infinity;
    for (let i = 0; i < 3; i++) {
      const c = at(plan, `c${i}`, t);
      const top = ROW_STEP * (i + 1) + c.y;
      if (c.opacity > 0) assert.ok(front >= top + ROW_H / 2 - 0.5, `t=${t} c${i} 出现时下方行已让开一半以上`);
      assert.ok(top > lastY, "子行之间不交叉");
      lastY = top;
    }
  }
  for (const k of ["c0", "c1", "c2"]) {
    const end = plan.tracks.get(k)!.frames.at(-1)!;
    assert.deepEqual([end.y, end.opacity], [0, 1], `${k} 终点归位`);
  }
  assert.ok(plan.tracks.get("c0")!.frames[0].y < 0, "slide: 新行从上方一点滑入");
  const fade = uf.planUnfold(expandItems(3, 2), VIEW, uf.resolveUnfold("fade"));
  assert.ok(fade.tracks.get("c0")!.frames.every((f) => f.y === 0), "fade: 原地淡入");
  assert.equal(uf.planUnfold(expandItems(3, 2), VIEW, uf.resolveUnfold("none")).tracks.size, 0, "none: 没有动画");
});

await check("Unfold 收起: 反向, 下方行收上来, 子行自下而上淡出, 在被盖住前已淡完; 离开的行播完前一直在", () => {
  const items: UItem[] = [
    { key: "P", phase: "stay", top: 0, height: ROW_H, y: 0 },
    ...[0, 1, 2].map((i): UItem => ({ key: `c${i}`, phase: "exit", top: ROW_STEP * (i + 1), height: ROW_H, y: 0 })),
    { key: "t0", phase: "stay", top: ROW_STEP * 4, height: ROW_H, y: 0 },
  ];
  const o = uf.resolveUnfold();
  const plan = uf.planUnfold(items, VIEW, o);
  assert.ok(plan.duration < uf.unfoldDuration(o, 3), "纯收起比展开快一点");
  assert.ok(near(plan.tracks.get("t0")!.frames.at(-1)!.y, -ROW_STEP * 3), "下方行收到父行下面");
  const gone = [0, 1, 2].map((i) => {
    const tr = plan.tracks.get(`c${i}`)!;
    return tr.frames.find((f) => f.opacity === 0)!.offset * tr.duration;
  });
  assert.ok(gone[2] <= gone[1] && gone[1] <= gone[0], `自下而上: ${gone.map(Math.round).join(" >= ")}`);
  assert.ok(gone[0] <= plan.end && plan.end >= plan.duration, "end 覆盖最后一行淡完");
  for (let t = 0; t <= plan.end; t += 4) {
    const front = ROW_STEP * 4 + at(plan, "t0", t).y;
    for (let i = 0; i < 3; i++) {
      const c = at(plan, `c${i}`, t);
      if (front < ROW_STEP * (i + 1) + ROW_H / 2 - 0.5) assert.ok(c.opacity < 0.02, `t=${t} c${i} 被盖过一半时已淡完`);
    }
  }
});

await check("Unfold 打断: 从当前看到的位置和不透明度接着走, 第一帧不跳", () => {
  // 收起到一半又展开: c0 已半透明且被下方行盖住一部分, 下方行在中途
  const items: UItem[] = [
    { key: "P", phase: "stay", top: 0, height: ROW_H, y: 0 },
    { key: "c0", phase: "stay", top: ROW_STEP, height: ROW_H, y: -3, opacity: 0.4 },
    { key: "t0", phase: "stay", top: ROW_STEP * 2, height: ROW_H, y: -20 },
  ];
  const plan = uf.planUnfold(items, VIEW, uf.resolveUnfold());
  const c0 = plan.tracks.get("c0")!;
  assert.ok(near(c0.frames[0].y, -3) && near(c0.frames[0].opacity, 0.4), "c0 从当前状态出发");
  assert.deepEqual([c0.frames.at(-1)!.y, c0.frames.at(-1)!.opacity], [0, 1]);
  assert.ok(near(plan.tracks.get("t0")!.frames[0].y, -20), "下方行从中途出发");
  const s = uf.sampleUnfold({ duration: 100, fades: true, frames: [{ offset: 0, y: -10, opacity: 0 }, { offset: 0.5, y: -5, opacity: 1 }, { offset: 1, y: 0, opacity: 1 }] }, 25);
  assert.ok(near(s.y, -7.5) && near(s.opacity, 0.5), "sampleUnfold 线性插值");
});

await check("Unfold 大量子行: 200 个孩子也封顶时长, 下方行只走到视口底部, 视口外的行不出轨道", () => {
  const o = uf.resolveUnfold();
  const view = { top: 0, bottom: 400 };
  const plan = uf.planUnfold(expandItems(200, 3), view, o);
  assert.ok(plan.duration <= o.maxDuration && plan.end <= o.maxDuration + 200, "时长封顶");
  const t0 = plan.tracks.get("t0")!;
  assert.ok(near(ROW_STEP * 201 + t0.frames.at(-1)!.y, view.bottom, 0.5), "下方行的终点停在视口底部 (之后在视口外一步到位)");
  assert.ok(near(t0.frames[0].y, -ROW_STEP * 200), "从原位出发");
  assert.equal(plan.tracks.has("t2"), true);
  assert.equal(plan.tracks.has("c150"), false, "视口外的子行不出轨道");
  const seen = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((i) => firstSeen(plan, `c${i}`));
  for (let i = 1; i < seen.length; i++) assert.ok(seen[i] >= seen[i - 1], "视口内仍自上而下");
  const span = seen[9] - seen[0];
  assert.ok(span > 40, `视口内的十行不是一闪而过 (${Math.round(span)}ms)`);
});

console.log(`\n${passed} checks passed`);
