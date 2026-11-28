import { useSyncExternalStore } from "react";
import type { DocEntry, SectionId } from "./types";

export type Route =
  | { name: "home" }
  | { name: "section"; section: SectionId }
  | { name: "component"; section: SectionId; slug: string }
  | { name: "full"; section: SectionId; slug: string };

/** 需要换地址的旧链接: legacy 按清单找分区, redirect 直接给出新地址 */
export type LegacyRoute = { name: "legacy"; slug: string } | { name: "redirect"; to: string };

const sub = (cb: () => void) => {
  window.addEventListener("hashchange", cb);
  return () => window.removeEventListener("hashchange", cb);
};

const isSection = (s: string): s is SectionId => s === "ui" || s === "visual" || s === "pages";

/** 已并入 UI 组件分区的旧分区 (Agent 页面现在是 UI 组件下的 "Agent" 分组, slug 不变) */
const MERGED_INTO_UI = "agent";

/** 并进别的页的旧条目: 多 Agent 编排不再单独成页, 它是会话里的一个框 */
const MOVED: Record<string, string> = { orchestra: "conversation" };

/** 旧链接 #/c/<slug> 由 app 按清单找到所属分区; 旧分区 #/agent/* 换成 #/ui/* */
export function parse(hash: string): Route | LegacyRoute {
  const h = hash.replace(/^#\/?/, "");
  const [a, b, c] = h.split("/");
  // 旧的「更多基础件」页已拆完, 地址回到 UI 组件总览
  if (a === "foundation" || (a === "ui" && b === "foundation")) return { name: "section", section: "ui" };
  if (a === "c" && b) return { name: "legacy", slug: decodeURIComponent(b) };
  if (a === MERGED_INTO_UI) return { name: "redirect", to: `#/${["ui", b, c].filter(Boolean).join("/")}` };
  if (a === "ui" && b && Object.hasOwn(MOVED, b)) return { name: "redirect", to: `#/ui/${MOVED[b]}` };
  if (isSection(a) && b && c === "full") return { name: "full", section: a, slug: decodeURIComponent(b) };
  if (isSection(a)) return b ? { name: "component", section: a, slug: decodeURIComponent(b) } : { name: "section", section: a };
  return { name: "home" };
}

export function useHash(): string {
  return useSyncExternalStore(sub, () => window.location.hash, () => "");
}

export const sectionOfRoute = (r: Route): SectionId | null =>
  r.name === "section" || r.name === "component" || r.name === "full" ? r.section : null;

export const href = {
  home: "#/",
  section: (s: SectionId) => `#/${s}`,
  entry: (e: Pick<DocEntry, "section" | "slug">) => `#/${e.section}/${e.slug}`,
  full: (e: Pick<DocEntry, "section" | "slug">) => `#/${e.section}/${e.slug}/full`,
};
