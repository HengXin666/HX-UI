/**
 * 行级 diff (纯函数): 编辑工具给的 old / new 文本求差 (Myers O(ND)), 或解析统一 diff 文本.
 * 输出同一种行模型, DiffView 统一画.
 */
export interface DiffRow {
  kind: "ctx" | "add" | "del" | "hunk";
  text: string;
  oldNo?: number;
  newNo?: number;
}
export interface DiffFile {
  path?: string;
  oldPath?: string;
  rows: DiffRow[];
  added: number;
  removed: number;
}

/** Myers 最短编辑脚本; 超过 maxCost 步时退回 "整段删 + 整段加" */
export function diffLines(a: string, b: string, maxCost = 4000): DiffRow[] {
  const A = a === "" ? [] : a.split("\n");
  const B = b === "" ? [] : b.split("\n");
  const n = A.length;
  const m = B.length;
  const max = Math.min(n + m, maxCost);
  const v = new Map<number, number>([[1, 0]]);
  const trace: Map<number, number>[] = [];
  let found = false;
  outer: for (let d = 0; d <= max; d++) {
    trace.push(new Map(v));
    for (let k = -d; k <= d; k += 2) {
      let x = k === -d || (k !== d && (v.get(k - 1) ?? -1) < (v.get(k + 1) ?? -1)) ? (v.get(k + 1) ?? 0) : (v.get(k - 1) ?? 0) + 1;
      let y = x - k;
      while (x < n && y < m && A[x] === B[y]) {
        x++;
        y++;
      }
      v.set(k, x);
      if (x >= n && y >= m) {
        found = true;
        break outer;
      }
    }
  }
  if (!found) return [...A.map((t, i) => ({ kind: "del" as const, text: t, oldNo: i + 1 })), ...B.map((t, i) => ({ kind: "add" as const, text: t, newNo: i + 1 }))];
  // 回溯
  const rows: DiffRow[] = [];
  let x = n;
  let y = m;
  for (let d = trace.length - 1; d >= 0 && (x > 0 || y > 0); d--) {
    const vd = trace[d];
    const k = x - y;
    const prevK = k === -d || (k !== d && (vd.get(k - 1) ?? -1) < (vd.get(k + 1) ?? -1)) ? k + 1 : k - 1;
    const prevX = vd.get(prevK) ?? 0;
    const prevY = prevX - prevK;
    while (x > prevX && y > prevY) {
      rows.push({ kind: "ctx", text: A[x - 1], oldNo: x, newNo: y });
      x--;
      y--;
    }
    if (d > 0) {
      if (x === prevX) rows.push({ kind: "add", text: B[y - 1], newNo: y });
      else rows.push({ kind: "del", text: A[x - 1], oldNo: x });
    }
    x = prevX;
    y = prevY;
  }
  return rows.reverse();
}

/** 只留改动附近 context 行, 其余折成 hunk 分隔行 */
export function withContext(rows: DiffRow[], context = 3): DiffRow[] {
  const keep = new Array<boolean>(rows.length).fill(false);
  rows.forEach((r, i) => {
    if (r.kind !== "ctx") for (let j = Math.max(0, i - context); j <= Math.min(rows.length - 1, i + context); j++) keep[j] = true;
  });
  const out: DiffRow[] = [];
  let skipped = 0;
  rows.forEach((r, i) => {
    if (keep[i]) {
      if (skipped) out.push({ kind: "hunk", text: `… ${skipped} 行未改动` });
      skipped = 0;
      out.push(r);
    } else skipped++;
  });
  if (skipped && out.length) out.push({ kind: "hunk", text: `… ${skipped} 行未改动` });
  return out;
}

export function countDiff(rows: DiffRow[]): { added: number; removed: number } {
  let added = 0;
  let removed = 0;
  for (const r of rows) {
    if (r.kind === "add") added++;
    else if (r.kind === "del") removed++;
  }
  return { added, removed };
}

/** 解析统一 diff (git diff / apply_patch 的 *** Update File 也粗略支持) */
export function parseUnifiedDiff(text: string): DiffFile[] {
  const files: DiffFile[] = [];
  let cur = null as DiffFile | null;
  let o = 0;
  let nn = 0;
  const start = (path?: string, oldPath?: string): DiffFile => {
    const f: DiffFile = { path, oldPath, rows: [], added: 0, removed: 0 };
    files.push(f);
    return f;
  };
  for (const line of text.replace(/\r\n/g, "\n").split("\n")) {
    let m: RegExpMatchArray | null;
    if ((m = line.match(/^diff --git a\/(.+?) b\/(.+)$/))) cur = start(m[2], m[1]);
    else if ((m = line.match(/^\*\*\* (?:Update|Add|Delete) File: (.+)$/))) cur = start(m[1]);
    else if (line.startsWith("--- ")) {
      cur ??= start();
      const p = line.slice(4).replace(/^a\//, "");
      if (p !== "/dev/null") cur.oldPath ??= p;
    } else if (line.startsWith("+++ ")) {
      cur ??= start();
      const p = line.slice(4).replace(/^b\//, "");
      if (p !== "/dev/null") cur.path ??= p;
    } else if ((m = line.match(/^@@+ -(\d+)(?:,\d+)? \+(\d+)(?:,\d+)? @@+(.*)$/))) {
      cur ??= start();
      o = Number(m[1]);
      nn = Number(m[2]);
      cur.rows.push({ kind: "hunk", text: line });
    } else if (line.startsWith("@@")) {
      cur ??= start();
      cur.rows.push({ kind: "hunk", text: line });
    } else if (cur && line.startsWith("+")) {
      cur.rows.push({ kind: "add", text: line.slice(1), newNo: nn++ });
      cur.added++;
    } else if (cur && line.startsWith("-")) {
      cur.rows.push({ kind: "del", text: line.slice(1), oldNo: o++ });
      cur.removed++;
    } else if (cur && line.startsWith(" ")) cur.rows.push({ kind: "ctx", text: line.slice(1), oldNo: o++, newNo: nn++ });
  }
  return files.filter((f) => f.rows.length || f.path);
}
