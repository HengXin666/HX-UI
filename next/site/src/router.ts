import { useSyncExternalStore } from "react";

/** 极简 hash 路由: #/launch → "launch". 文档站够用, 不引路由库. */
function read(): string {
  return window.location.hash.replace(/^#\/?/, "").split("?")[0] || "home";
}
function subscribe(cb: () => void) {
  window.addEventListener("hashchange", cb);
  return () => window.removeEventListener("hashchange", cb);
}
export function useRoute(): string {
  return useSyncExternalStore(subscribe, read, () => "home");
}
export function go(route: string): void {
  window.location.hash = `/${route}`;
  window.scrollTo({ top: 0 });
}
