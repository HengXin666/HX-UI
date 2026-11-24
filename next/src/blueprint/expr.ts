/**
 * A tiny, safe expression language for conditional breakpoints (no `eval`, no `Function`, CSP-safe).
 *
 *   hit >= 3            a > b && msg != ""        items.length > 2        !cond || hit % 10 == 0
 *
 * Literals (numbers, "strings" or 'strings', true, false, null), names (read from the context;
 * unknown names are undefined), member access (a.b, a[0]), unary ! and -, and the binary operators
 * * / % + - < <= > >= == != === !== && || with JavaScript semantics and precedence.
 * `.length` works on strings, arrays, Sets (size) and Maps (size).
 */

type Tok = { t: "num"; v: number } | { t: "str"; v: string } | { t: "id"; v: string } | { t: "op"; v: string };
type Node =
  | { k: "lit"; v: unknown }
  | { k: "name"; v: string }
  | { k: "member"; o: Node; p: Node }
  | { k: "unary"; op: string; a: Node }
  | { k: "bin"; op: string; a: Node; b: Node };

const OPS = ["===", "!==", "==", "!=", "<=", ">=", "&&", "||", "<", ">", "+", "-", "*", "/", "%", "!", "(", ")", "[", "]", "."];

function lex(src: string): Tok[] {
  const out: Tok[] = [];
  let i = 0;
  while (i < src.length) {
    const c = src[i]!;
    if (/\s/.test(c)) { i++; continue; }
    if (/[0-9]/.test(c) || (c === "." && /[0-9]/.test(src[i + 1] ?? ""))) {
      const m = /^(?:\d+\.?\d*|\.\d+)(?:e[-+]?\d+)?/i.exec(src.slice(i))!;
      out.push({ t: "num", v: Number(m[0]) });
      i += m[0].length;
      continue;
    }
    if (c === '"' || c === "'") {
      let j = i + 1;
      let v = "";
      while (j < src.length && src[j] !== c) {
        if (src[j] === "\\" && j + 1 < src.length) { j++; v += src[j] === "n" ? "\n" : src[j]; } else v += src[j];
        j++;
      }
      if (j >= src.length) throw new Error("unterminated string");
      out.push({ t: "str", v });
      i = j + 1;
      continue;
    }
    const id = /^[A-Za-z_$\u4e00-\u9fff][\w$\u4e00-\u9fff]*/.exec(src.slice(i));
    if (id) {
      out.push({ t: "id", v: id[0] });
      i += id[0].length;
      continue;
    }
    const op = OPS.find((o) => src.startsWith(o, i));
    if (!op) throw new Error(`unexpected "${c}"`);
    out.push({ t: "op", v: op });
    i += op.length;
  }
  return out;
}

const PREC: Record<string, number> = { "||": 1, "&&": 2, "==": 3, "!=": 3, "===": 3, "!==": 3, "<": 4, "<=": 4, ">": 4, ">=": 4, "+": 5, "-": 5, "*": 6, "/": 6, "%": 6 };

function parse(toks: Tok[]): Node {
  let i = 0;
  const peek = () => toks[i];
  const isOp = (v: string) => peek()?.t === "op" && peek()!.v === v;
  const expect = (v: string) => {
    if (!isOp(v)) throw new Error(`expected "${v}"`);
    i++;
  };
  const primary = (): Node => {
    const t = toks[i++];
    if (!t) throw new Error("unexpected end");
    if (t.t === "num" || t.t === "str") return { k: "lit", v: t.v };
    if (t.t === "id") {
      if (t.v === "true") return { k: "lit", v: true };
      if (t.v === "false") return { k: "lit", v: false };
      if (t.v === "null") return { k: "lit", v: null };
      if (t.v === "undefined") return { k: "lit", v: undefined };
      return { k: "name", v: t.v };
    }
    if (t.v === "(") {
      const e = expr(0);
      expect(")");
      return e;
    }
    if (t.v === "!" || t.v === "-") return { k: "unary", op: t.v, a: postfix(primary()) };
    throw new Error(`unexpected "${t.v}"`);
  };
  const postfix = (n: Node): Node => {
    for (;;) {
      if (isOp(".")) {
        i++;
        const t = toks[i++];
        if (t?.t !== "id") throw new Error("expected a name after .");
        n = { k: "member", o: n, p: { k: "lit", v: t.v } };
      } else if (isOp("[")) {
        i++;
        const p = expr(0);
        expect("]");
        n = { k: "member", o: n, p };
      } else return n;
    }
  };
  const expr = (min: number): Node => {
    let left = postfix(primary());
    for (;;) {
      const t = peek();
      const p = t?.t === "op" ? PREC[t.v] : undefined;
      if (p === undefined || p < min) return left;
      i++;
      const right = expr(p + 1);
      left = { k: "bin", op: String(t!.v), a: left, b: right };
    }
  };
  const e = expr(0);
  if (i < toks.length) throw new Error(`unexpected "${String(toks[i]!.v)}"`);
  return e;
}

function member(o: unknown, key: unknown): unknown {
  if (o === null || o === undefined) return undefined;
  if (key === "length") {
    if (typeof o === "string" || Array.isArray(o)) return o.length;
    if (o instanceof Set || o instanceof Map) return o.size;
  }
  if (o instanceof Map) return o.get(key);
  if (typeof o !== "object" && typeof o !== "string") return undefined;
  const k = String(key);
  // own data only: no prototype walking (no "constructor", "__proto__" tricks)
  return Object.prototype.hasOwnProperty.call(o, k) ? (o as Record<string, unknown>)[k] : undefined;
}

function run(n: Node, ctx: Readonly<Record<string, unknown>>): unknown {
  switch (n.k) {
    case "lit": return n.v;
    case "name": return Object.prototype.hasOwnProperty.call(ctx, n.v) ? ctx[n.v] : undefined;
    case "member": return member(run(n.o, ctx), run(n.p, ctx));
    case "unary": { const a = run(n.a, ctx); return n.op === "!" ? !a : -(a as number); }
    case "bin": {
      if (n.op === "&&") return run(n.a, ctx) && run(n.b, ctx);
      if (n.op === "||") return run(n.a, ctx) || run(n.b, ctx);
      const a = run(n.a, ctx) as never;
      const b = run(n.b, ctx) as never;
      switch (n.op) {
        case "+": return (a as number) + (b as number);
        case "-": return a - b;
        case "*": return a * b;
        case "/": return a / b;
        case "%": return a % b;
        case "<": return a < b;
        case "<=": return a <= b;
        case ">": return a > b;
        case ">=": return a >= b;
        // eslint-disable-next-line eqeqeq
        case "==": return a == b;
        // eslint-disable-next-line eqeqeq
        case "!=": return a != b;
        case "===": return a === b;
        case "!==": return a !== b;
      }
    }
  }
  return undefined;
}

export interface CompiledExpr {
  readonly ok: boolean;
  readonly error?: string;
  /** Evaluate; never throws (a runtime problem gives undefined). */
  run(ctx: Readonly<Record<string, unknown>>): unknown;
}

const cache = new Map<string, CompiledExpr>();

/** Compile an expression (cached by source). */
export function compileExpr(src: string): CompiledExpr {
  const hit = cache.get(src);
  if (hit) return hit;
  let out: CompiledExpr;
  try {
    const ast = parse(lex(src));
    out = { ok: true, run: (ctx) => { try { return run(ast, ctx); } catch { return undefined; } } };
  } catch (e) {
    const error = e instanceof Error ? e.message : String(e);
    out = { ok: false, error, run: () => undefined };
  }
  if (cache.size > 200) cache.clear();
  cache.set(src, out);
  return out;
}
