import type { ConnectFailReason } from "../connect";
import type { IssueCode } from "../types";

/** Chinese UI copy, keyed by the logic layer's stable codes (its messages are English for tools / AI). */

export const CONNECT_REASON: Record<ConnectFailReason, string> = {
  "missing-node": "节点不存在",
  "missing-pin": "两端方向相同，需要一个输出接一个输入",
  "self-loop": "不能连回同一个节点",
  "exec-data-mix": "执行引脚只能连执行引脚",
  duplicate: "这两个引脚已经连着了",
  "type-mismatch": "类型不兼容",
  cycle: "会形成数据环",
};

export const ISSUE_LABEL: Record<IssueCode, string> = {
  "unknown-node-type": "未知节点类型",
  "unknown-pin": "引脚不存在",
  "dangling-edge": "连线悬空",
  "duplicate-edge": "重复连线",
  "duplicate-id": "节点 id 重复",
  "type-mismatch": "类型不匹配",
  "exec-data-mix": "执行与数据混连",
  "self-loop": "节点连回自身",
  cycle: "存在环路",
  "input-occupied": "输入引脚接了多条线",
  "output-occupied": "执行输出接了多条线",
  "missing-input": "必填输入未连接",
  "missing-subgraph": "折叠图丢失",
  "unknown-variable": "变量不存在",
  "function-exec": "函数只能有一个执行输入和输出",
  "disabled-node": "节点已禁用",
  "no-entry": "执行流没有入口",
  custom: "节点自检",
};

export const TYPE_LABEL: Record<string, string> = {
  exec: "执行", any: "任意", number: "数字", string: "文本", boolean: "布尔", object: "对象",
};
