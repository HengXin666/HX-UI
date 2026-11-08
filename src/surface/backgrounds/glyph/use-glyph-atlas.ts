// 行为规格参照 docs/research/catalog/backgrounds-1.md 与 backgrounds-2.md 的 Backgrounds 条目, 实现为 HX 自有. glyph 路字形图集钩子.
"use client";

import { useMemo } from "react";
import { createGlyphAtlas, type GlyphAtlas } from "../../backdrop/kernel/atlas";
import { ATLAS_CELL, fontOf } from "./kit";

/**
 * 字形图集, 字符或字体变了才重画. 拿不到 2d 上下文时为 null, 着色器退到方块画法.
 *
 * @param characters 要画的字符.
 * @param fontFamily 字体族或 CSS 变量名.
 */
export function useGlyphAtlas(characters: string, fontFamily: string): GlyphAtlas | null {
  return useMemo(() => createGlyphAtlas(characters || " ", ATLAS_CELL, fontOf(fontFamily)), [characters, fontFamily]);
}

