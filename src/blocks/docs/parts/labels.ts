"use client";

import { DOCS_TEXT_FALLBACK, DOCS_TEXT_PACKS } from "../../../constants/blocks-docs-v109";
import { BLOCK_LANG_SEPARATOR } from "../../../constants/blocks";
import { useBlocks } from "../../_shared/BlocksProvider";

export type DocsText = { [K in keyof typeof DOCS_TEXT_PACKS.zh]: string };

/**
 * 文档区块的可见兜底文案: 按 BlocksProvider 的 locale 取中英包, 再叠加调用方的 labels.
 * 区块的 labels prop 同时承载 BlockLabels 与 DocsText 的键, 显式 undefined 不覆盖.
 */
export function useDocsText(labels?: Partial<Record<string, string>>): DocsText {
  const { locale } = useBlocks();
  const language = locale.split(BLOCK_LANG_SEPARATOR)[0].toLowerCase() as keyof typeof DOCS_TEXT_PACKS;
  const pack: DocsText = { ...(DOCS_TEXT_PACKS[language] ?? DOCS_TEXT_PACKS[DOCS_TEXT_FALLBACK]) };
  for (const [key, value] of Object.entries(labels ?? {})) {
    if (value !== undefined && key in pack) (pack as Record<string, string>)[key] = value;
  }
  return pack;
}
