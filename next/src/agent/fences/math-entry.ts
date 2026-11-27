/**
 * "@hx/ui/agent/math": 公式 (可选 peer: @streamdown/math 与 katex; 另需引 "katex/dist/katex.min.css").
 *
 *   引入: math, mathFences (自 "@hx/ui/agent/math")
 *   <Markdown plugins={{ math }} fences={mathFences}>{text}</Markdown>
 *
 * - math: $$...$$ 块级公式 (单个 $ 行内公式默认关: 回答里的 "$5 到 $10" 会被误认; 需要时 createMathPlugin({ singleDollarTextMath: true }))
 * - mathFences: ```math / ```latex / ```katex / ```tex 围栏
 */
import { createMathPlugin } from "@streamdown/math";
import { MathFence } from "./math";

export { MathFence, createMathPlugin };
export const math = createMathPlugin({ errorColor: "var(--destructive)" });
export const mathFences = { math: MathFence, latex: MathFence, katex: MathFence, tex: MathFence };
