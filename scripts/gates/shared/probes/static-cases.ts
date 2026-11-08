/** 负向探针: 设计规约 / 文档注册表 / 行数棘轮 / 分流覆盖四条门禁的违规组与控制组. */
import { LINE_BUDGET_BASELINE } from "../../../constants/gates.ts";
import {
  CHECK, EXPECT_FAIL, EXPECT_PASS, budgetBase, docsSkeleton, fixture, rootAt, run, runUiRules, writeFiles,
} from "./kit.ts";
import type { Probe } from "./kit.ts";

const GATE_UI_RULES = "check-ui-rules";
const GATE_DOCS_REGISTRY = "check-docs-registry";
const GATE_LINE_BUDGET = "check-line-budget";
const GATE_LANES = "check-lanes";
const SMALL_TS = "src/small.ts";
const SMALL_SRC = "export const x = 1;\n";

/** 违规组必须 FAIL 且说出正确理由, 控制组必须 PASS; 只有一侧时, 坏门禁与空门禁都会显得完美. */
export const STATIC_PROBES: Probe[] = [
  // ───── 设计规约 (scripts/quality 的 PROJECT-UI-*) ─────
  {
    name: "ui-rules 违规组: 硬编调色盘 + 非 1px 边框 + 漏写 type 的 button + 开发日记注释 + JSX 裸块注释",
    gate: GATE_UI_RULES,
    expect: EXPECT_FAIL,
    reason: "正则或扫描根被改坏时, 这套库会慢慢长回随机颜色, 而没有任何东西报错",
    run: () => {
      const dir = fixture("ui-rules-bad");
      writeFiles(dir, {
        "src/bad.tsx": `export const X = () => <button className="bg-slate-500 border-2">hi</button>;\n`,
        "src/diary.ts": `// 上一版这里写成了 2px\nexport const D = 1;\n`,
        "src/leak.tsx": `export const L = () => (\n  <div>\n    /* 说明 */\n  </div>\n);\n`,
      });
      return runUiRules(dir);
    },
    expectIn: ["PROJECT-UI-PALETTE", "PROJECT-UI-LINE-1PX", "PROJECT-UI-BUTTON-TYPE", "PROJECT-UI-DEV-DIARY", "PROJECT-UI-JSX-COMMENT-LEAK"],
  },
  {
    name: "ui-rules 控制组: 语义 token + type=button",
    gate: GATE_UI_RULES,
    expect: EXPECT_PASS,
    reason: "防误报: 合规写法被拦下会让人直接绕过这条门禁",
    run: () => {
      const dir = fixture("ui-rules-ok");
      writeFiles(dir, {
        "src/ok.tsx": `export const Y = () => <button type="button" className="bg-primary border-border">hi</button>;\n`,
        "src/note.tsx": `// 默认间距取 16\nexport const N = () => (\n  <div>\n    {/* 说明 */}\n    上一版\n  </div>\n);\n`,
      });
      return runUiRules(dir);
    },
  },

  // ───── 注册表对账 (check-docs-registry) ─────
  {
    name: "registry 违规组: nav 里有 id 但 App 没有 case (幽灵页)",
    gate: GATE_DOCS_REGISTRY,
    expect: EXPECT_FAIL,
    reason:
      "这是本探针存在的直接理由: 幽灵页会落进 default 分支渲染成占位页  有 h1、DOM 够大, " +
      "实测 check-smoke 会报「41/41 页渲染正常」并 exit 0",
    run: () => {
      const dir = fixture("registry-ghost");
      writeFiles(
        dir,
        docsSkeleton({
          "docs/src/nav.ts": `export const DOCS = [
  { id: "a", label: "A", group: "g", desc: "d" },
  { id: "ghost", label: "G", group: "g", desc: "d" },
];
`,
        }),
      );
      return run(...CHECK.registry, rootAt(dir));
    },
    expectIn: ["nav-without-case", "ghost"],
  },
  {
    name: "registry 违规组: 模块既没从 src/index.ts 导出、也没人 import (死文件)",
    gate: GATE_DOCS_REGISTRY,
    expect: EXPECT_FAIL,
    reason:
      "「组件写好了但忘了接上」必然同时满足这两条, 所以这条同时拦住真实的接线缺口。" +
      "反过来也要成立: 行数棘轮拆出来的内部件 (只被主文件 import、不对外导出) **必须放行**  " +
      "否则门禁在惩罚它自己推荐的修复动作 (实测踩过: canvas-parts.tsx 就被误报过)",
    run: () => {
      const dir = fixture("registry-unexported");
      writeFiles(dir, docsSkeleton({ "src/layout/orphan.tsx": `export const Orphan = 1;\n` }));
      return run(...CHECK.registry, rootAt(dir));
    },
    expectIn: ["module-unreachable", "orphan"],
  },
  {
    name: "registry 控制组: 内部拆分件 (只被同目录模块 import, 不对外导出)",
    gate: GATE_DOCS_REGISTRY,
    expect: EXPECT_PASS,
    reason:
      "这条控制组钉住上面那条的边界。它防的是「门禁把正确的拆分动作报成违规」 " +
      "而那种误报的结局是所有人学会无视这条门禁",
    run: () => {
      const dir = fixture("registry-splitparts");
      writeFiles(
        dir,
        docsSkeleton({
          // host 从 index.ts 导出 (对外入口), inner 只被 host import (内部拆分件)
          "src/index.ts": `export { A } from "./primitives/a";\nexport { host } from "./blueprint/host";\n`,
          "src/blueprint/host.ts": `export { helper } from "./inner";\nexport const host = 1;\n`,
          "src/blueprint/inner.tsx": `export const helper = () => null;\n`,
        }),
      );
      return run(...CHECK.registry, rootAt(dir));
    },
  },
  {
    name: "registry 违规组: 图标表键对应不到任何页面 (id 改名后残留)",
    gate: GATE_DOCS_REGISTRY,
    expect: EXPECT_FAIL,
    reason: "图标键改名后残留时, 导航里那一项静默留白, 没有任何东西会报错",
    run: () => {
      const dir = fixture("registry-staleicon");
      writeFiles(
        dir,
        docsSkeleton({
          "docs/src/navIcons.ts": `export const NAV_ICONS = { a: "icon-[solar--graph-linear]", gone: "icon-[solar--bell-linear]" };\n`,
        }),
      );
      return run(...CHECK.registry, rootAt(dir));
    },
    expectIn: ["icon-without-nav"],
  },
  {
    name: "registry 控制组: 四方对账一致的骨架",
    gate: GATE_DOCS_REGISTRY,
    expect: EXPECT_PASS,
    reason: "防误报: 正常的加页面流程 (nav + case + import + 文件 + 导出) 必须放行",
    run: () => {
      const dir = fixture("registry-ok");
      writeFiles(dir, docsSkeleton());
      return run(...CHECK.registry, rootAt(dir));
    },
  },

  // ───── 行数棘轮 (check-line-budget) ─────
  {
    name: "line-budget 违规组: 已冻结文件长过水位",
    gate: GATE_LINE_BUDGET,
    expect: EXPECT_FAIL,
    reason: "棘轮只许降; 水位被抬高就等于门禁不存在",
    run: () => {
      const dir = fixture("linebudget-grew");
      writeFiles(dir, {
        "src/big.tsx": "// pad\n".repeat(30),
        [LINE_BUDGET_BASELINE]: budgetBase({ "src/big.tsx": 20 }),
      });
      return run(...CHECK.lineBudget, rootAt(dir));
    },
    expectIn: ["frozen-grew", "20"],
  },
  {
    name: "line-budget 违规组: 新文件直接超上限",
    gate: GATE_LINE_BUDGET,
    expect: EXPECT_FAIL,
    reason: "上限本身被调大时, 新文件会悄悄变成下一个 800 行文件",
    run: () => {
      const dir = fixture("linebudget-over");
      writeFiles(dir, {
        "src/huge.ts": "// pad\n".repeat(500),
        [LINE_BUDGET_BASELINE]: budgetBase({}),
      });
      return run(...CHECK.lineBudget, rootAt(dir));
    },
    expectIn: ["over-limit", "上限 450"],
  },
  {
    name: "line-budget 违规组: 基线里的文件已不存在 (腐烂的豁免)",
    gate: GATE_LINE_BUDGET,
    expect: EXPECT_FAIL,
    reason: "只查「有没有超」会让基线只增不减, 攒满一堆没人敢删的死条目",
    run: () => {
      const dir = fixture("linebudget-stale");
      writeFiles(dir, {
        [SMALL_TS]: SMALL_SRC,
        [LINE_BUDGET_BASELINE]: budgetBase({ "src/deleted.ts": 900 }),
      });
      return run(...CHECK.lineBudget, rootAt(dir));
    },
    expectIn: ["stale-baseline", "src/deleted.ts"],
  },
  {
    name: "line-budget 控制组: 未冻结文件在下限内",
    gate: GATE_LINE_BUDGET,
    expect: EXPECT_PASS,
    reason: "防误报: 普通小文件必须放行, 否则每个 PR 都在改基线",
    run: () => {
      const dir = fixture("linebudget-ok");
      writeFiles(dir, {
        [SMALL_TS]: SMALL_SRC,
        "src/small.tsx": `export const Y = () => null;\n`,
        [LINE_BUDGET_BASELINE]: budgetBase({}),
      });
      return run(...CHECK.lineBudget, rootAt(dir));
    },
  },

  // ───── 分流覆盖 (check-lanes) ─────
  {
    name: "lanes 违规组: 出现一个没被任何 lane 认领的顶层目录",
    gate: GATE_LANES,
    expect: EXPECT_FAIL,
    reason:
      "症状是「改了东西却一条门禁都不跑」; 它在运行时完全看不出来 (不报错、不输出、退出码 0), " +
      "所以这是分流设计里唯一必须自动化的一环",
    run: () => {
      const dir = fixture("lanes-unclaimed");
      writeFiles(dir, docsSkeleton({ "brand-new-dir/a.txt": "" }));
      return run(...CHECK.lanes, rootAt(dir));
    },
    expectIn: ["unclaimed-top-level", "brand-new-dir"],
  },
  {
    name: "lanes 控制组: 全部顶层条目都被认领",
    gate: GATE_LANES,
    expect: EXPECT_PASS,
    reason: "防误报: 前缀匹配写成 p === prefix 时, 目录型前缀会认不出任何东西",
    run: () => {
      const dir = fixture("lanes-ok");
      writeFiles(dir, docsSkeleton());
      return run(...CHECK.lanes, rootAt(dir));
    },
  },
];
