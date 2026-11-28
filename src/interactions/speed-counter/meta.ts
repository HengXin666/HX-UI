import type { InteractionMeta } from "../types";

export const meta = {
  id: "speed-counter",
  title: "滚动计数",
  scene: "金额、指标、库存这类会变的数字。逐位滚动，一眼看出变了多少。",
  inspiredBy: "Aceternity Speed Counter",
  budgetKb: 3,
  controls: [
    { kind: "select", key: "format", label: "格式", default: "currency", options: [
      { value: "currency", label: "金额" },
      { value: "decimal", label: "数字" },
      { value: "percent", label: "百分比" },
    ] },
    { kind: "number", key: "duration", label: "时长 (秒)", min: 0.3, max: 2, step: 0.1, default: 0.9 },
    { kind: "number", key: "size", label: "字号", min: 24, max: 96, step: 4, default: 56 },
  ],
} as const satisfies InteractionMeta;
