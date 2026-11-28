/**
 * "@hx/ui/agent/mermaid": Mermaid 图围栏 (mermaid 是可选 peer, 引这个入口才需要装).
 *
 *   引入: mermaidFences (自 "@hx/ui/agent/mermaid")
 *   <Markdown fences={mermaidFences}>{text}</Markdown>
 */
import { MermaidFence } from "./mermaid";

export { MermaidFence };
export const mermaidFences = { mermaid: MermaidFence };
