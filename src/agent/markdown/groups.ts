/**
 * 组合代码块 (纯逻辑, 服务端安全): 相邻且 `[组名-标签]` 组名相同的围栏合成一块, 渲染成选项卡.
 *
 *   ```cpp [解法-C++]      ```py [解法-Python]
 *
 * 流式渲染把 Markdown 按顶层块切开再逐块解析, 所以分两步:
 *   1. mergeGroupBlocks: 切块后把同组的相邻围栏块并回一块
 *   2. remarkCodeGroups: 在一块里把同组的相邻 code 节点包进 <hx-code-group>
 */
import { parseMarkdownIntoBlocks } from "streamdown";

export const CODE_GROUP_TAG = "hx-code-group";
const FENCE_OPEN = /^(?: {0,3})(`{3,}|~{3,})([^\n]*)/;
const GROUP = /\[([^\]-]+)-([^\]]+)\]/;

/** 块的围栏组名 (不是围栏或没写组时为 null) */
export function fenceGroupOf(block: string): string | null {
  const m = block.match(FENCE_OPEN);
  if (!m) return null;
  const g = m[2].match(GROUP);
  return g ? g[1].trim() : null;
}

export function mergeGroupBlocks(blocks: string[]): string[] {
  const out: string[] = [];
  let lastGroup: string | null = null;
  for (const b of blocks) {
    const g = fenceGroupOf(b.trimStart());
    if (g && lastGroup === g && out.length) {
      const prev = out[out.length - 1];
      out[out.length - 1] = prev.endsWith("\n") ? prev + b : `${prev}\n${b}`;
    } else out.push(b);
    if (b.trim() !== "") lastGroup = g;
  }
  return out;
}

/** 给 Streamdown 的 parseMarkdownIntoBlocksFn */
export function parseBlocksWithGroups(markdown: string): string[] {
  return mergeGroupBlocks(parseMarkdownIntoBlocks(markdown));
}

interface MdNode {
  type: string;
  meta?: string | null;
  lang?: string | null;
  children?: MdNode[];
  data?: Record<string, unknown>;
}

/** remark 插件: 顶层相邻同组 code 节点 -> 一个容器节点 (转 hast 后是 <hx-code-group>) */
export function remarkCodeGroups() {
  return (tree: MdNode) => {
    const kids = tree.children;
    if (!kids) return;
    const out: MdNode[] = [];
    for (const n of kids) {
      const g = n.type === "code" && n.meta ? n.meta.match(GROUP) : null;
      const prev = out[out.length - 1];
      if (g && prev && prev.type === "hxCodeGroup" && prev.data?.group === g[1].trim()) prev.children!.push(n);
      else if (g) out.push({ type: "hxCodeGroup", data: { group: g[1].trim(), hName: CODE_GROUP_TAG, hProperties: { dataGroup: g[1].trim() } }, children: [n] });
      else out.push(n);
    }
    tree.children = out;
  };
}
