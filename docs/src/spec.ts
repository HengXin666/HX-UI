import { DOC } from "@hx/ui";

/**
 * 把多行 "a ~ b ~ c" 文本解析成单元格数组: 导航清单与属性表共用.
 * 类型签名里常有 |, 所以列分隔符用 ~; 空行忽略.
 */
export function parseSpec(text: string): string[][] {
  return text
    .split(DOC.newline)
    .filter((line) => line.trim())
    .map((line) => line.split("~").map((cell) => cell.trim()));
}
