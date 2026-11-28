/**
 * 基础件 (src/components/ui) 的纯逻辑自检.  Run: node scripts/ui-check.ts   (Node 22.18+, 直接跑 TS)
 * 目前覆盖 Tree (tree-model.ts): 摊平可见行与 aria 位置, WAI-ARIA 方向键导航, 字母跳转, 展开集合, 连选, 级联勾选.
 * 组件的渲染在文档站里看. 没有测试框架, node:assert, 第一个失败就 exit 1.
 */
import assert from "node:assert/strict";

const tm = await import("../src/components/ui/tree-model.ts");
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

console.log(`\n${passed} checks passed`);
