/** 组件页用法代码的拼装工具: 只写与默认不同的属性, 包成可直接粘贴的 Demo 组件. */
import type { Values } from "./types";

export const NL = "\n";
export const INDENT = "  ";

/** 一个 JSX 标签的用法代码: 只写与 base 不同的属性, 布尔 true 写成裸属性. */
export function tag(name: string, props: Values, base: Values, children?: string): string {
  const attrs = Object.entries(props)
    .filter(([key, value]) => value !== base[key])
    .map(([key, value]) => (value === true ? key : typeof value === "string" ? `${key}=${JSON.stringify(value)}` : `${key}={${JSON.stringify(value)}}`));
  const open = [name, ...attrs].join(" ");
  return children === undefined ? `<${open} />` : `<${open}>${children}</${name}>`;
}

function indent(code: string, depth: number): string {
  return code
    .split(NL)
    .map((line) => INDENT.repeat(depth) + line)
    .join(NL);
}

export function demo(imports: readonly string[], body: string, head = ""): string {
  return `import { ${imports.join(", ")} } from "@hx/ui";${head}\n\nexport function Demo() {\n  return (\n${indent(body, 2)}\n  );\n}`;
}
