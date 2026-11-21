/**
 * P0 落盘脚本 (scripts/p0-land.ts) 的全部字面量: 预期分支, 提交批次清单, 测试依赖, 新目录, 备份位置.
 * 批次清单是 2026-11-20 21:3x 对比 HEAD 51136bd 与工作区逐文件 git blob 哈希得出的 97 个改动文件, 一个文件只进一个批;
 * 共享的聚合文件 (index.ts, registry.ts, package.json) 放进它最后依赖的那一批, 保证每批的导入只指向更早的批或 HEAD.
 *
 * .agents/notes/implemented/architecture/2026-11-20-omni-p0-land.md
 */

/** 只允许在这两条分支上跑: 提交前在 omni-v1, 中途失败重跑时可能已切到 omni-1.0. */
export const SOURCE_BRANCH = "refactor/omni-v1";
export const TARGET_BRANCH = "refactor/omni-1.0";

/** 起草清单时的 HEAD. 不一致只告警, 由清单与工作区实际改动的交集决定提交什么. */
export const EXPECTED_HEAD = "51136bd";

export const GIT = "git";
export const NPM = "npm";
export const TAR = "tar";
export const UTF8 = "utf8";
export const NEWLINE = "\n";
export const NUL = "\0";

/** 命令行开关. */
export const FLAG_DRY_RUN = "--dry-run";
export const FLAG_FROM = "--from";
export const FLAG_SKIP_DEPS = "--skip-deps";

/** 备份放在 git 忽略的 .hark 下, 文件名带时间戳. */
export const BACKUP_DIR = ".hark";
export const BACKUP_PREFIX = "p0-backup-";
export const BACKUP_PATCH_EXT = ".patch";
export const BACKUP_TAR_EXT = ".tgz";
export const BACKUP_STATUS_EXT = ".status.txt";

/** 每批 git add 之后跑的门禁 (= npm run gates:staged). */
export const GATE_SCRIPT = "gates:staged";

/** tests/setup.ts 与测试文件实际 import 的包; 只按 node_modules 里已装的版本钉进 devDependencies. */
export const TEST_DEPS: ReadonlyArray<string> = [
  "vitest",
  "happy-dom",
  "@testing-library/react",
  "@testing-library/user-event",
  "@testing-library/jest-dom",
  "axe-core",
];

/** omni 1.0 新目录. 只建空目录, 不放占位文件, 让 hxoa 之后能直接 put. */
export const NEW_DIRS: ReadonlyArray<string> = ["src/data", "src/model", "src/sections", "src/templates"];

export type LandBatch = {
  readonly id: string;
  readonly message: string;
  readonly files: ReadonlyArray<string>;
};

/**
 * 按依赖顺序排列; 每个文件只出现一次.
 * .agents/notes/implemented/architecture/2026-11-20-omni-p0-land.md
 */
export const BATCHES: ReadonlyArray<LandBatch> = [
  {
    id: "land",
    message: "chore(omni): P0 落盘脚本与 CHECKPOINT 同步",
    files: [
      "scripts/p0-land.ts",
      "scripts/constants/p0-land.ts",
      ".agents/notes/implemented/architecture/2026-11-20-omni-p0-land.md",
      ".agents/CHECKPOINT.md",
      "docs/tsconfig.json",
    ],
  },
  {
    id: "motion",
    message: "feat(motion): 镜头配方, 统一时钟与发牌节奏 (omni 批 1~2, 含架构文档)",
    files: [
      ".agents/notes/implemented/architecture/2026-11-18-omni-motion-recipe-clock.md",
      "docs/architecture/README.md",
      "docs/architecture/omni-1.0.md",
      "src/constants/motion-recipe.ts",
      "src/motion/Stagger.tsx",
      "src/motion/drive/clock.ts",
      "src/motion/drive/use-clock.ts",
      "src/motion/drive/use-recipe.ts",
      "src/motion/index.ts",
      "src/motion/recipe-cards.ts",
      "src/motion/recipe.ts",
      "tests/motion/clock.test.ts",
      "tests/motion/recipe.test.ts",
      "tests/motion/stagger-rhythm.test.ts",
    ],
  },
  {
    id: "page",
    message: "feat(page): 叙事节拍, 美术方向, BeatPage 与 meta / JSON-LD (omni 批 3~7)",
    files: [
      ".agents/notes/implemented/architecture/2026-11-08-layered-entries.md",
      ".agents/notes/implemented/architecture/2026-11-18-omni-page-beats.md",
      ".agents/notes/implemented/architecture/2026-11-19-page-meta-jsonld.md",
      "src/constants/page-beat.ts",
      "src/constants/page-meta.ts",
      "src/page/BeatPage.tsx",
      "src/page/BeatStage.tsx",
      "src/page/Page.tsx",
      "src/page/PageHead.tsx",
      "src/page/beat-layout.ts",
      "src/page/beat.ts",
      "src/page/define.ts",
      "src/page/index.ts",
      "src/page/meta.ts",
      "src/page/story.ts",
      "src/tokens.css",
      "tests/page/beat-page.test.tsx",
      "tests/page/beat-stage.test.tsx",
      "tests/page/beat.test.ts",
      "tests/page/meta.test.tsx",
      "tests/page/story.test.tsx",
    ],
  },
  {
    id: "data",
    message: "feat(data): 数据内核, 新图种与 recharts 适配器, 重建 lock 并补测试依赖 (omni 批 8~11)",
    files: [
      ".agents/notes/implemented/architecture/2026-11-19-omni-data-kernel.md",
      "package.json",
      "package-lock.json",
      "docs/package-lock.json",
      "src/constants/data-scale.ts",
      "src/constants/data-stage.ts",
      "src/entry/data-recharts.ts",
      "src/viz/charts/Area.tsx",
      "src/viz/charts/Bar.tsx",
      "src/viz/charts/BarChart.tsx",
      "src/viz/charts/Heatmap.tsx",
      "src/viz/charts/Line.tsx",
      "src/viz/charts/Scatter.tsx",
      "src/viz/charts/Trend.tsx",
      "src/viz/data.ts",
      "src/viz/kernel-axis.ts",
      "src/viz/kernel-format.ts",
      "src/viz/kernel-scale.ts",
      "src/viz/kernel-stage.tsx",
      "tests/viz/data-area.test.tsx",
      "tests/viz/data-axis.test.ts",
      "tests/viz/data-bar.test.tsx",
      "tests/viz/data-heatmap.test.tsx",
      "tests/viz/data-line.test.tsx",
      "tests/viz/data-recharts.test.tsx",
      "tests/viz/data-scale.test.ts",
      "tests/viz/data-scatter.test.tsx",
      "tests/viz/data-stage.test.tsx",
    ],
  },
  {
    id: "commerce",
    message: "feat(commerce): 内容模型, 购买区 / 评价墙 / 粘性购买条 / 镜头化画廊与 pdp 模板 (P1)",
    files: [
      ".agents/notes/implemented/architecture/2026-11-20-omni-content-model.md",
      "src/blocks/commerce/BuyBar.tsx",
      "src/blocks/commerce/ProductBuy.tsx",
      "src/blocks/commerce/ReviewBoard.tsx",
      "src/blocks/commerce/ShotGallery.tsx",
      "src/blocks/commerce/sections.ts",
      "src/commerce/adapt.ts",
      "src/commerce/catalog.ts",
      "src/commerce/fixtures.ts",
      "src/commerce/model.ts",
      "src/commerce/review.ts",
      "src/commerce/validate.ts",
      "src/commerce/variant.ts",
      "src/constants/model-commerce.ts",
      "src/constants/model-fixtures.ts",
      "src/constants/sections-commerce.ts",
      "src/constants/templates-pdp.ts",
      "src/page/pdp.ts",
      "tests/page/buybar-gallery.test.tsx",
      "tests/page/model-review-validate.test.ts",
      "tests/page/model-variant.test.ts",
      "tests/page/pdp-template.test.tsx",
    ],
  },
  {
    id: "marketing",
    message: "feat(marketing): ProductTour, PricingCalculator 与 saas 模板 (P2 第一批)",
    files: [
      ".agents/notes/implemented/architecture/2026-11-20-saas-benchmark.md",
      "src/blocks/marketing/PricingCalculator.tsx",
      "src/blocks/marketing/ProductTour.tsx",
      "src/blocks/marketing/index.ts",
      "src/constants/sections-saas.ts",
      "src/constants/templates-saas.ts",
      "src/page/registry.ts",
      "src/page/saas.ts",
      "src/page/templates.ts",
      "scripts/gates/baselines/api-surface.txt",
      "scripts/gates/baselines/api-surface.version",
      "docs/face/docs/props/props.gen.json",
      "CHANGELOG.md",
      "tests/page/saas-template.test.tsx",
    ],
  },
  {
    id: "docs",
    message: "docs(site): 文档站标杆页 page-pdp 与 page-software",
    files: [
      "docs/src/nav.ts",
      "docs/src/pages/templates/index.ts",
      "docs/src/pages/templates/page-pdp.tsx",
      "docs/src/pages/templates/page-software.tsx",
    ],
  },
];
