/**
 * omni 1.0 的 P0 止血: 把堆在工作区未提交的改动备份, 补测试依赖, 再按清单分批提交, 最后开 refactor/omni-1.0 并建新目录.
 * 不 push, 不 reset, 不 stash, 不 checkout 已有分支, 不删任何文件; 门禁失败即停在该批, 已提交的批保留.
 * 清单与全部字面量在 scripts/constants/p0-land.ts.
 *
 * 用法:
 *   node scripts/p0-land.ts --dry-run        只打印将执行的步骤与每批文件
 *   node scripts/p0-land.ts                  全流程
 *   node scripts/p0-land.ts --from <批 id>    上次停在某批, 修好后从该批续跑 (仍先备份)
 *   node scripts/p0-land.ts --skip-deps      跳过 npm install 与补测试依赖
 *
 * .agents/notes/implemented/architecture/2026-11-20-omni-p0-land.md
 */
import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import {
  BACKUP_DIR,
  BACKUP_PATCH_EXT,
  BACKUP_PREFIX,
  BACKUP_STATUS_EXT,
  BACKUP_TAR_EXT,
  BATCHES,
  EXPECTED_HEAD,
  FLAG_DRY_RUN,
  FLAG_FROM,
  FLAG_SKIP_DEPS,
  GATE_SCRIPT,
  GIT,
  NEWLINE,
  NEW_DIRS,
  NPM,
  NUL,
  SOURCE_BRANCH,
  TAR,
  TARGET_BRANCH,
  TEST_DEPS,
  UTF8,
  type LandBatch,
} from "./constants/p0-land.ts";

type Run = { readonly code: number; readonly out: string };

const argv = process.argv.slice(2);
const DRY = argv.includes(FLAG_DRY_RUN);
const SKIP_DEPS = argv.includes(FLAG_SKIP_DEPS);
const fromIndex = argv.indexOf(FLAG_FROM);
const FROM = fromIndex >= 0 ? argv[fromIndex + 1] : undefined;

function run(cmd: string, args: ReadonlyArray<string>, cwd: string, inherit = false): Run {
  const res = spawnSync(cmd, args, { cwd, encoding: UTF8, stdio: inherit ? "inherit" : "pipe", maxBuffer: 256 * 1024 * 1024 });
  return { code: res.status ?? 1, out: (res.stdout ?? "").toString() };
}

function must(cmd: string, args: ReadonlyArray<string>, cwd: string): string {
  const res = run(cmd, args, cwd);
  if (res.code !== 0) stop(`${cmd} ${args.join(" ")} 失败 (退出码 ${res.code})`);
  return res.out.trim();
}

function stop(msg: string): never {
  console.error(`p0-land: ${msg}`);
  process.exit(1);
}

function step(title: string): void {
  console.log(`${NEWLINE}== ${title}`);
}

/** 工作区里相对 HEAD 有改动或未跟踪 (且不被忽略) 的文件. */
function dirtyFiles(root: string): Set<string> {
  const changed = must(GIT, ["diff", "--name-only", "-z", "HEAD"], root).split(NUL);
  const untracked = must(GIT, ["ls-files", "--others", "--exclude-standard", "-z"], root).split(NUL);
  return new Set([...changed, ...untracked].filter(Boolean));
}

function stamp(): string {
  return new Date().toISOString().replace(/[:.]/g, "-");
}

function backup(root: string, dirty: ReadonlySet<string>): void {
  step("1. 备份未提交改动");
  const base = path.join(root, BACKUP_DIR, BACKUP_PREFIX + stamp());
  if (DRY) {
    console.log(`将写入 ${path.relative(root, base)}${BACKUP_PATCH_EXT} / ${BACKUP_TAR_EXT} / ${BACKUP_STATUS_EXT} (${dirty.size} 个文件)`);
    return;
  }
  mkdirSync(path.join(root, BACKUP_DIR), { recursive: true });
  writeFileSync(base + BACKUP_PATCH_EXT, must(GIT, ["diff", "--binary", "HEAD"], root) + NEWLINE);
  writeFileSync(base + BACKUP_STATUS_EXT, must(GIT, ["status", "--porcelain"], root) + NEWLINE);
  const list = base + ".list";
  writeFileSync(list, [...dirty].join(NEWLINE) + NEWLINE);
  if (run(TAR, ["-czf", base + BACKUP_TAR_EXT, "-T", list], root).code !== 0) stop("tar 备份失败, 未做任何提交");
  console.log(`已备份: ${path.relative(root, base)}{${BACKUP_PATCH_EXT},${BACKUP_TAR_EXT},${BACKUP_STATUS_EXT}}`);
}

function installedVersion(root: string, name: string): string | undefined {
  const file = path.join(root, "node_modules", name, "package.json");
  if (!existsSync(file)) return undefined;
  return (JSON.parse(readFileSync(file, UTF8)) as { version?: string }).version;
}

function deps(root: string): void {
  step("2. 重建 package-lock 并补测试依赖");
  if (SKIP_DEPS) {
    console.log("跳过 (--skip-deps)");
    return;
  }
  const pkg = JSON.parse(readFileSync(path.join(root, "package.json"), UTF8)) as { devDependencies?: Record<string, string> };
  const declared = pkg.devDependencies ?? {};
  const pin: string[] = [];
  const missing: string[] = [];
  for (const name of TEST_DEPS) {
    if (declared[name]) continue;
    const version = installedVersion(root, name);
    if (version) pin.push(`${name}@${version}`);
    else missing.push(name);
  }
  console.log(`npm install (重写截断的 package-lock.json)`);
  console.log(`补进 devDependencies: ${pin.length ? pin.join(", ") : "无"}`);
  if (missing.length) console.log(`本机未装, 不自动取 latest, 请人工确认后手动装: ${missing.join(", ")}`);
  if (DRY) return;
  if (run(NPM, ["install"], root, true).code !== 0) stop("npm install 失败, 未做任何提交");
  if (pin.length && run(NPM, ["install", "-D", ...pin], root, true).code !== 0) stop("补测试依赖失败, 未做任何提交");
}

function commitBatch(root: string, batch: LandBatch, dirty: ReadonlySet<string>): void {
  const files = batch.files.filter((file) => dirty.has(file));
  const clean = batch.files.length - files.length;
  console.log(`${NEWLINE}-- [${batch.id}] ${batch.message}`);
  console.log(`   ${files.length} 个文件待提交${clean ? `, ${clean} 个已无改动跳过` : ""}`);
  if (DRY) {
    for (const file of files) console.log(`     ${file}`);
    return;
  }
  if (!files.length) return;
  must(GIT, ["add", "--", ...files], root);
  if (run(NPM, ["run", GATE_SCRIPT], root, true).code !== 0) {
    stop(`门禁在批 [${batch.id}] 失败. 已暂存未提交; 修好后运行: node scripts/p0-land.ts ${FLAG_FROM} ${batch.id} ${FLAG_SKIP_DEPS}`);
  }
  if (run(GIT, ["commit", "-m", batch.message], root, true).code !== 0) stop(`批 [${batch.id}] 提交失败`);
}

/**
 * 入口: 备份, 补依赖, 分批提交, 开分支建目录, 打印剩余.
 * .agents/notes/implemented/architecture/2026-11-20-omni-p0-land.md
 */
function main(): void {
  const root = must(GIT, ["rev-parse", "--show-toplevel"], process.cwd());
  const branch = must(GIT, ["rev-parse", "--abbrev-ref", "HEAD"], root);
  const head = must(GIT, ["rev-parse", "--short", "HEAD"], root);
  if (branch !== SOURCE_BRANCH && branch !== TARGET_BRANCH) stop(`当前分支 ${branch}, 只在 ${SOURCE_BRANCH} 或 ${TARGET_BRANCH} 上运行`);
  if (!FROM && head !== EXPECTED_HEAD) console.warn(`提示: HEAD 是 ${head}, 清单起草时是 ${EXPECTED_HEAD}; 只提交清单与实际改动的交集`);
  if (DRY) console.log("(dry-run: 只打印, 不改任何东西)");

  const start = FROM ? BATCHES.findIndex((batch) => batch.id === FROM) : 0;
  if (start < 0) stop(`没有批 ${FROM}; 可选: ${BATCHES.map((batch) => batch.id).join(", ")}`);

  backup(root, dirtyFiles(root));
  deps(root);

  step(`3. 分批提交 (每批跑 npm run ${GATE_SCRIPT})`);
  for (const batch of BATCHES.slice(start)) commitBatch(root, batch, dirtyFiles(root));

  step(`4. 开分支 ${TARGET_BRANCH} 并建新目录`);
  if (DRY) console.log(`git switch -c ${TARGET_BRANCH}; mkdir ${NEW_DIRS.join(" ")}`);
  else {
    if (branch !== TARGET_BRANCH && run(GIT, ["switch", "-c", TARGET_BRANCH], root, true).code !== 0) stop(`建分支 ${TARGET_BRANCH} 失败 (已提交的批不受影响)`);
    for (const dir of NEW_DIRS) mkdirSync(path.join(root, dir), { recursive: true });
  }

  step("5. 清单外仍未提交的文件 (贴回给 Hark 归类)");
  const listed = new Set(BATCHES.flatMap((batch) => batch.files));
  const rest = [...dirtyFiles(root)].filter((file) => DRY ? !listed.has(file) : true);
  console.log(rest.length ? rest.join(NEWLINE) : "无");
  if (!DRY) console.log(`${NEWLINE}${must(GIT, ["log", "--oneline", `${EXPECTED_HEAD}..HEAD`], root)}`);
}

main();
