// hx:server-safe DOMParser 只在函数里用, 服务端调用返回 null
/**
 * 清洗模型写出来的 SVG, 再内联进页面:
 * - 删 script, foreignObject, iframe, object, embed, 以及 set / animate 里改 href 的动画
 * - 删所有 on* 事件属性
 * - href / xlink:href 只留页内锚点 (#id) 和 data:image/(png|jpeg|gif|webp)
 * - style 里的 url() 只留页内锚点; 删 @import
 * 解析失败返回 { error }.
 */
const DROP = new Set(["script", "foreignobject", "iframe", "object", "embed", "audio", "video", "link", "meta", "base"]);
const SAFE_HREF = /^(#|data:image\/(png|jpe?g|gif|webp);)/i;

export type SanitizeResult = { svg: string; error?: undefined } | { svg?: undefined; error: string };

export function sanitizeSvg(source: string): SanitizeResult | null {
  if (typeof DOMParser === "undefined") return null;
  const doc = new DOMParser().parseFromString(source.trim(), "image/svg+xml");
  const err = doc.querySelector("parsererror");
  if (err) return { error: (err.textContent ?? "SVG 解析失败").split("\n")[0].slice(0, 200) };
  const root = doc.documentElement;
  if (root.nodeName.toLowerCase() !== "svg") return { error: "根元素不是 <svg>" };
  const walk = (el: Element) => {
    for (const child of Array.from(el.children)) {
      const name = child.nodeName.toLowerCase();
      if (DROP.has(name) || ((name === "set" || name === "animate") && /href/i.test(child.getAttribute("attributeName") ?? ""))) {
        child.remove();
        continue;
      }
      walk(child);
    }
    for (const attr of Array.from(el.attributes)) {
      const n = attr.name.toLowerCase();
      if (n.startsWith("on")) el.removeAttribute(attr.name);
      else if ((n === "href" || n === "xlink:href" || n.endsWith(":href")) && !SAFE_HREF.test(attr.value.trim())) el.removeAttribute(attr.name);
      else if (n === "style" && /url\(\s*['"]?(?!#)|@import|expression\(/i.test(attr.value)) el.removeAttribute(attr.name);
    }
    if (el.nodeName.toLowerCase() === "style" && /@import|url\(\s*['"]?(?!#)/i.test(el.textContent ?? "")) el.textContent = "";
  };
  walk(root);
  if (!root.getAttribute("viewBox")) {
    const w = parseFloat(root.getAttribute("width") ?? "");
    const h = parseFloat(root.getAttribute("height") ?? "");
    if (w > 0 && h > 0) root.setAttribute("viewBox", `0 0 ${w} ${h}`);
  }
  return { svg: new XMLSerializer().serializeToString(root) };
}
