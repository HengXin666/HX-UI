import type { JSX } from "react";
import { Page, definePage } from "../../../../src/page";
import { MATERIALS_TITLE, PAGE_ORDER, pageSections } from "../stage/samples";

/** 商品页模板的同一份区块数据加两块可视化, 默认顺序; 区块定义与 #/page 舞台共用 stage/samples.ts. */
const SECTIONS = pageSections(MATERIALS_TITLE);
const SPEC = definePage({ sections: PAGE_ORDER.map((key) => SECTIONS[key]) });

/**
 * 一份 definePage 描述出整张商品页: 区块和可视化混排, 默认注册表, 不写一行版式.
 *
 * .agents/notes/implemented/architecture/2026-11-08-layered-entries.md
 */
export function PageStage(): JSX.Element {
  return <Page spec={SPEC} as="div" />;
}
