/**
 * 蓝图节点卡片 (BlueprintNode.tsx, node-parts.tsx, rf-node.tsx) 共用的取值.
 */

/** 卡片体的左右内边距 (px, 对应卡片上的 px-2), 说明见 node-parts.tsx 的 BODY_PAD_X. */
export const BP_BODY_PAD_X = 8;

/** 标题前给脱离文档流的执行引脚让位的占位元素类名. */
export const BP_PIN_SPACER_CLASS = "shrink-0";

/** 折叠按钮的字形: 折叠态显示加号, 展开态显示减号. */
export const BP_COLLAPSE_GLYPH = {
  collapsed: "+",
  expanded: "−",
} as const;

/** React Flow Handle 的定位样式: 不做变换, 叠在引脚之上. */
export const BP_HANDLE_STYLE = {
  transform: "none",
  zIndex: 2,
} as const;

/** 连线 path 不填充. */
export const BP_EDGE_FILL = "none";

/** 端口方向字面量: 引脚 / Handle / portRef 共用, 避免 "in" / "out" 散落各处. */
export const BP_PORT_DIR = { in: "in", out: "out" } as const;

/** 标题条执行入口的端口 id. */
export const BP_EXEC_IN = "exec-in";
