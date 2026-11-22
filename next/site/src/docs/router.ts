import { useSyncExternalStore } from "react";

export type Route = { name: "overview" } | { name: "component"; slug: string } | { name: "foundation" };

const sub = (cb: () => void) => {
  window.addEventListener("hashchange", cb);
  return () => window.removeEventListener("hashchange", cb);
};

export function parse(hash: string): Route {
  const h = hash.replace(/^#\/?/, "");
  const [a, b] = h.split("/");
  if (a === "c" && b) return { name: "component", slug: decodeURIComponent(b) };
  if (a === "foundation") return { name: "foundation" };
  return { name: "overview" };
}

export function useHash(): string {
  return useSyncExternalStore(sub, () => window.location.hash, () => "");
}

export const href = {
  overview: "#/",
  component: (slug: string) => `#/c/${slug}`,
  foundation: "#/foundation",
};
