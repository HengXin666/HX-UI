import { useSyncExternalStore } from "react";
import type { DocEntry, SectionId } from "./types";

export type Route =
  | { name: "home" }
  | { name: "section"; section: SectionId }
  | { name: "component"; section: SectionId; slug: string };

const sub = (cb: () => void) => {
  window.addEventListener("hashchange", cb);
  return () => window.removeEventListener("hashchange", cb);
};

const isSection = (s: string): s is SectionId => s === "ui" || s === "visual" || s === "pages";

/** 旧链接 #/c/<slug> 由 app 按清单找到所属分区 */
export function parse(hash: string): Route | { name: "legacy"; slug: string } {
  const h = hash.replace(/^#\/?/, "");
  const [a, b] = h.split("/");
  // 旧的「更多基础件」页已拆完, 地址回到 UI 组件总览
  if (a === "foundation" || (a === "ui" && b === "foundation")) return { name: "section", section: "ui" };
  if (a === "c" && b) return { name: "legacy", slug: decodeURIComponent(b) };
  if (isSection(a)) return b ? { name: "component", section: a, slug: decodeURIComponent(b) } : { name: "section", section: a };
  return { name: "home" };
}

export function useHash(): string {
  return useSyncExternalStore(sub, () => window.location.hash, () => "");
}

export const sectionOfRoute = (r: Route): SectionId | null =>
  r.name === "section" || r.name === "component" ? r.section : null;

export const href = {
  home: "#/",
  section: (s: SectionId) => `#/${s}`,
  entry: (e: Pick<DocEntry, "section" | "slug">) => `#/${e.section}/${e.slug}`,
};
