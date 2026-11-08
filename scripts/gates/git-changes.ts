/** 门禁总线读 git 变更集的纯函数: run.ts 调它, probe-gates.ts 直接对它做断言. */
import { spawnSync } from "node:child_process";
import { GIT, NEWLINE, UTF8 } from "../constants/gates.ts";

/** porcelain v1 每行是 "XY<空格><路径>", 路径从第 4 个字符起; 改名行是 "R  旧 -> 新". */
const PORCELAIN_PATH_START = 3;
const RENAME_ARROW = " -> ";

/**
 * 跑一条 git 命令, 返回原始 stdout; 失败返回 null (调用方按"全跑"处理).
 *
 * .agents/notes/implemented/process/2026-11-08-gates-ts.md
 */
export function gitOutput(args: string[], cwd: string): string | null {
  const r = spawnSync(GIT, args, { cwd, encoding: UTF8 });
  if (r.status !== 0) return null;
  return r.stdout ?? "";
}

/** 按行切开 --name-only 一类的输出: 这类输出每行就是一个路径, 两端空白都可以去掉. */
export function nameLines(stdout: string): string[] {
  return stdout.split(NEWLINE).map((s) => s.trim()).filter(Boolean);
}

/**
 * 解析 `git status --porcelain`.
 * 行首状态码常以空格开头 (" M docs/x" 表示只改了工作区), 所以**行首绝不能 trim**:
 * 先 trim 再切会把 " M docs/x" 变成 "M docs/x", 再去掉前三个字符就得到 "ocs/x",
 * 于是总线把它报成"未认领路径"并全量兜底. 这里只去行尾空白, 再按固定列切.
 */
export function parsePorcelain(stdout: string): string[] {
  return stdout
    .split(NEWLINE)
    .map((l) => l.trimEnd())
    .filter((l) => l.length > PORCELAIN_PATH_START)
    .map((l) => {
      const p = l.slice(PORCELAIN_PATH_START);
      const arrow = p.indexOf(RENAME_ARROW);
      return arrow === -1 ? p : p.slice(arrow + RENAME_ARROW.length);
    })
    .filter(Boolean);
}
