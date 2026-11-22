import { useSyncExternalStore } from "react";

/**
 * 极简 hash 路由: #/launch → "launch". 文档站够用, 不引路由库.
 * 不以 "#/" 开头的 hash (#pricing 这类页内锚点) 不算换页: 保留当前路由, 交给浏览器滚动.
 * 成品页拷走后是普通锚点, 这里的兼容只为文档站.
 */
let last = "home";
function read(): string {
  const h = window.location.hash;
  if (h && !h.startsWith("#/")) return last;
  last = h.replace(/^#\/?/, "").split("?")[0] || "home";
  return last;
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
