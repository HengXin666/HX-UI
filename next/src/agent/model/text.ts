import type { AgentPart } from "./types";

/** 一条消息里所有正文拼起来 (复制用) */
export function textOfParts(parts: readonly AgentPart[]): string {
  return parts.flatMap((p) => (p.type === "text" ? [p.text] : [])).join("\n\n");
}
