/**
 * 区块层命名空间 (blocks-design 第 2 节): Blocks.Site.SiteHeader, Blocks.Marketing.Hero 这类分类写法.
 * 平铺导出与它并存, 由 src/index.ts 一并转出; 与站点外壳零件 (src/site/) 同名的区块在平铺层带 Blocks 前缀.
 */
import * as Shared from "./_shared";
import * as Site from "./site";
import * as Marketing from "./marketing";
import * as Commerce from "./commerce";
import * as Docs from "./docs";
import * as Portfolio from "./portfolio";

export const Blocks = { Shared, Site, Marketing, Commerce, Docs, Portfolio } as const;
