/** controls 层组件页共用: 用法代码从 @hx/ui/controls 引入 (三层只从子路径发布), 只写与默认不同的属性. */
import { INDENT, NL, tag } from "../usage-code";
import type { Values } from "../types";

export const CONTROLS_FROM = "@hx/ui/controls";

/** 包成可直接粘贴的 Demo 组件; head 是 import 之后的附加行 (例如 useState). */
export function controlDemo(imports: readonly string[], body: string, head = ""): string {
  const inner = body
    .split(NL)
    .map((line) => INDENT.repeat(2) + line)
    .join(NL);
  return `import { ${imports.join(", ")} } from "${CONTROLS_FROM}";${head}\n\nexport function Demo() {\n  return (\n${inner}\n  );\n}`;
}

/** 单个标签的用法: 控件值里与初始值不同的才写; children 给了就包起来. */
export function controlUsage(name: string, values: Values, base: Values, children?: string): string {
  return controlDemo([name], tag(name, values, base, children));
}

/** 控件值里取出不进标签属性的键 (演示用的子内容等), 其余原样当属性. */
export function omit(values: Values, keys: readonly string[]): Values {
  return Object.fromEntries(Object.entries(values).filter(([key]) => !keys.includes(key)));
}
