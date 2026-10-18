import { DOC } from "@hx/ui";

/** 列分隔符: 类型签名里常有 |, 所以用 ~. */
const CELL_SEPARATOR = "~";

/**
 * 把多行 "a ~ b ~ c" 文本解析成单元格数组: 导航清单与属性表共用. 空行忽略.
 * columns 是每行的列数: 前 columns - 1 个 ~ 分列, 其后的 ~ 原样留在最后一列 (说明里可以写 "~300ms" 或 "0~100").
 * 一行不足 columns 列时抛错并带上该行内容, 不静默错位.
 */
export function parseSpec(text: string, columns: number): string[][] {
  return text
    .split(DOC.newline)
    .filter((line) => line.trim())
    .map((line) => {
      const cells = line.split(CELL_SEPARATOR);
      if (cells.length < columns) {
        throw new Error(`parseSpec: 期望 ${columns} 列, 实际 ${cells.length} 列: ${line.trim()}`);
      }
      const head = cells.slice(0, columns - 1);
      const tail = cells.slice(columns - 1).join(CELL_SEPARATOR);
      return [...head, tail].map((cell) => cell.trim());
    });
}
