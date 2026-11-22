import type { ComponentType } from "react";
import { IMG } from "./_shared/assets";
import launchCover from "./launch/cover.png";
import status from "./status.json";

export type SiteKind = "网站" | "应用";

export interface SiteEntry {
  id: string;
  title: string;
  kind: SiteKind;
  /** 一句话美术方向 */
  direction: string;
  cover: string;
  /** done: 过完 docs/done.md 全部条目 */
  done: boolean;
  load: () => Promise<{ default: ComponentType }>;
}

/** L3 成品清单. 每套在 sites/<id>/ 下, R3 起各自带 art.css 与 prompt.md. */
const done = (id: string) => (status as Record<string, string>)[id] === "done";

export const SITES: readonly SiteEntry[] = [
  { id: "launch", done: done("launch"), title: "Tally 发布页", kind: "网站", direction: "近白底、发丝线，首屏放真实对账工作台", cover: launchCover, load: () => import("./launch/page") },
  { id: "shop", done: done("shop"), title: "商城", kind: "网站", direction: "摄影为主、推镜画廊、粘性购买条", cover: IMG.shoeA, load: () => import("./shop/page") },
  { id: "ops", done: done("ops"), title: "运维控制台", kind: "应用", direction: "侧栏、⌘K、服务状态板、实时日志", cover: IMG.headphones, load: () => import("./ops/page") },
  { id: "analytics", done: done("analytics"), title: "数据看板", kind: "应用", direction: "指标与联动图表，增量动画", cover: IMG.watch, load: () => import("./analytics/page") },
];
