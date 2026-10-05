import type { BlueprintGraph, BlueprintRegistry, ValidationIssue } from "./types";

export interface BlueprintFlowProps {
  readonly registry: BlueprintRegistry;
  readonly graph: BlueprintGraph;
  readonly validation?: { readonly byNode: ReadonlyMap<string, { portErrors: Record<string, ValidationIssue> }> };
  readonly selected?: readonly string[];
  readonly onGraphChange?: (next: BlueprintGraph) => void;
  readonly onSelect?: (ids: readonly string[]) => void;
  readonly onParamChange?: (nodeId: string, key: string, value: unknown) => void;
  readonly onEnterSubgraph?: (sgId: string) => void;
  readonly onRemove?: (ids: readonly string[]) => void;
  readonly onUndo?: () => void;
  readonly onRedo?: () => void;
  readonly onComment?: (ids: readonly string[]) => void;
  readonly onTidy?: () => void;
  readonly onSearch?: () => void;
  readonly onRename?: (id: string) => void;
  /** 这批 change 属于哪一类 (用于给历史打 tag 以便合并)。 */
  readonly onMoveKind?: (kind: "move" | "remove" | "other") => void;
  /** 在画布坐标的指定位置加一个注释框 (右键菜单用)。 */
  readonly onCommentHere?: (at: { x: number; y: number }) => void;
  /** 拖线到空白松手时: 是否弹节点面板 (UE5 行为)。 */
  readonly onConnectEndAtBlank?: (at: { x: number; y: number }) => void;
  readonly className?: string;
  readonly height?: number | string;
}


