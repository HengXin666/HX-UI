import type { BlueprintNode, NodeTypeDef, NodeKind } from "./types";
import { NODE_KIND_TITLE } from "./types";

/**
 * 蓝图的外观层。
 *
 * 单独成文件有两个理由:
 * 1. BlueprintNode.tsx 要被行预算压住, 而"节点属于哪个类别""引脚画成什么
 * 形状"这类判定是纯函数, 与 JSX 没有纠缠, 搬出来更好测。
 * 2. 这些判定要在**多处复用**: 节点卡片要画标题栏, 画布的连线预览要按
 * 类型着色, 缩略图也要。写两遍必然漂移。
 *
 * ## 关于"对齐 UE5"这件事的边界
 *
 * 只对齐**有据可查**的部分: 引脚按类型着色 (引擎源码默认表)、未连接空心
 * 已连接实心 (Epic 官方明文)、执行引脚楔形尖朝右、标题栏按类别配色。
 * 查不到的 (节点圆角、阴影数值) 用一套自洽的暗色值, 不编造来源。
 */

/**
 * 节点类别推导。显式 kind 优先, 否则按结构推。
 *
 * 推导顺序照 UE5 的实际观感排:
 * 1. 引用子图 -> macro (折叠起来的一片, 灰)
 * 2. 有执行入口且是起点 (无入边时不好判断, 退而求其次: 有执行入口 = 动作)
 * 3. 多执行出口 -> flow (分支/序列, 紫)
 * 4. 有执行入口 -> function (蓝)
 * 5. 无执行入口但有输出 -> pure (绿, 不产生副作用)
 * 6. 其余 -> default
 */
export function nodeKindOf(def: NodeTypeDef | undefined, node?: BlueprintNode): NodeKind {
  if (def?.kind) return def.kind;
  if (!def) return "default";
  if (node?.subgraph) return "macro";
  const execOuts = def.execOut?.length ?? 0;
  if (execOuts > 1) return "flow";
  if (def.execIn) return "function";
  if ((def.outputs?.length ?? 0) > 0) return "pure";
  return "default";
}

/** 类别 -> 标题栏类名。未知类别退回 default, 不会画出空背景。 */
export function titleStyle(kind: NodeKind): { readonly bg: string; readonly fg: string } {
  return NODE_KIND_TITLE[kind] ?? NODE_KIND_TITLE.default;
}
