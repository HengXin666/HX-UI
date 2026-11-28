/**
 * 容错解析流式到达的 JSON (工具参数): `{"command": "npm te` -> { command: "npm te" }.
 * 做法: 扫一遍记下未闭合的字符串 / 对象 / 数组, 去掉末尾半截的 key 或逗号, 补齐闭合符号再 JSON.parse.
 * 完整 JSON 直接 parse; 实在补不出来返回 undefined.
 */
export function parsePartialJson(text: string): unknown {
  const s = text.trim();
  if (!s) return undefined;
  try {
    return JSON.parse(s);
  } catch {
    // 继续补全
  }
  const stack: string[] = [];
  let inStr = false;
  let esc = false;
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (inStr) {
      if (esc) esc = false;
      else if (c === "\\") esc = true;
      else if (c === '"') inStr = false;
      continue;
    }
    if (c === '"') inStr = true;
    else if (c === "{" || c === "[") stack.push(c);
    else if (c === "}" || c === "]") stack.pop();
  }
  let body = s;
  if (inStr) {
    // 半截转义 (`\` 或 `\u12`) 先去掉
    body = body.replace(/\\(u[0-9a-fA-F]{0,3})?$/, "");
    body += '"';
  }
  const close = () => stack.slice().reverse().map((c) => (c === "{" ? "}" : "]")).join("");
  const attempts = [
    body,
    // 去掉末尾悬空的逗号 / 冒号 / 半截 key: {"a": 1, "b   {"a": 1, "b":
    body.replace(/,\s*$/, ""),
    body.replace(/,?\s*"(?:[^"\\]|\\.)*"\s*:?\s*$/, ""),
    // 半截字面量 tr / fals / nul / 12.
    body.replace(/,?\s*(?:"(?:[^"\\]|\\.)*"\s*:\s*)?(?:t|tr|tru|f|fa|fal|fals|n|nu|nul|-|\d+\.)$/, ""),
  ];
  for (const a of attempts) {
    try {
      return JSON.parse(a + close());
    } catch {
      // 换下一种
    }
  }
  return undefined;
}

/** 解析成对象 (工具参数一定是对象), 失败给 undefined */
export function parsePartialArgs(text: string | undefined): Record<string, unknown> | undefined {
  if (!text) return undefined;
  const v = parsePartialJson(text);
  return v && typeof v === "object" && !Array.isArray(v) ? (v as Record<string, unknown>) : undefined;
}
