import type { InteractionMeta } from "../types";

export const meta = {
  id: "stateful-button",
  title: "有状态按钮",
  scene: "保存、提交、付款。一个按钮讲清进行中、成功和失败，不用另弹提示。",
  inspiredBy: "Aceternity Stateful Button",
  budgetKb: 4,
  controls: [
    { kind: "number", key: "latency", label: "模拟耗时 (毫秒)", min: 300, max: 3000, step: 100, default: 1200 },
    { kind: "boolean", key: "fail", label: "模拟失败", default: false },
    { kind: "text", key: "label", label: "文案", default: "保存更改" },
  ],
} as const satisfies InteractionMeta;
