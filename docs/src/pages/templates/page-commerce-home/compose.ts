/**
 * 电商整页模板 (V2-02) 共用的组装工具: 区块节点构造, 三皮肤清单, 示例图替换.
 * 只有纯函数与常量, 不含组件与类名; page-product 也从这里取.
 */
import type { BlockNode, SkinName } from "@hx/ui";

/** 模板支持的三套皮肤 (设计文档 7 节回归矩阵: default / mono / retail). */
export const TEMPLATE_SKINS: ReadonlyArray<{ key: SkinName; label: string }> = [
  { key: "default", label: "default" },
  { key: "retail", label: "retail" },
  { key: "mono", label: "mono" },
];

/**
 * 示例图前缀: data.ts 里的图片地址都以它开头, 指向仓内静态占位图 docs/src/public/demo/*.svg.
 * 用 "./demo/" 而不是 "/demo/": vite base 默认 "./" + hash 路由, 部署在 GitHub Pages 的 /HX-UI/ 子路径时
 * 站点根相对的 "/demo/" 会 404, 相对 index.html 的 "./demo/" 在根路径, 子路径与本地预览下都能取到.
 * 文档预览时若 canvas 现画的图就绪, 仍会替换成现画的图; 未就绪或失败时显示这里的 SVG, 不会出现坏图.
 */
export const DEMO_CDN = "./demo/";

/** 一张示例图: name 同时是 useDemoImages 的标签. */
export const demoImg = (name: string, alt: string) => ({
  src: `${DEMO_CDN}${name}.svg`,
  // SVG 与分辨率无关, 两档都指向同一文件, 保留 srcSet 结构但不产生 404
  srcSet: `${DEMO_CDN}${name}.svg 640w, ${DEMO_CDN}${name}.svg 1280w`,
  alt,
});

/**
 * 按区块名约束 props 的节点构造器. P 是 "区块名 -> props" 的映射,
 * 这样 data.ts 写错字段会在类型层报错, 产物仍是可 JSON 序列化的 BlockNode.
 */
export function blockFactory<P extends object>() {
  return function block<K extends keyof P & string>(type: K, key: string, props: P[K]): BlockNode {
    return { type, key, props: props as unknown as Record<string, unknown> };
  };
}

/** React 元素 (CheckoutSteps 的 content 等) 不参与遍历: 既不收集也不克隆. */
const isOpaque = (value: object): boolean => "$$typeof" in value;

/** 收集一组节点里出现的全部示例图标签 (去重, 保持首次出现顺序). */
export function collectDemoKeys(data: unknown): string[] {
  const keys: string[] = [];
  const walk = (value: unknown): void => {
    if (Array.isArray(value)) {
      value.forEach(walk);
      return;
    }
    if (!value || typeof value !== "object" || isOpaque(value)) return;
    const src = (value as { src?: unknown }).src;
    if (typeof src === "string" && src.startsWith(DEMO_CDN)) {
      const key = src.slice(DEMO_CDN.length).replace(/\.svg$/, "");
      if (!keys.includes(key)) keys.push(key);
    }
    Object.values(value).forEach(walk);
  };
  walk(data);
  return keys;
}

interface DemoImageLike {
  src: string;
  srcSet: string;
  placeholder: string;
}

/** 把示例图地址换成现画的图 (结构不变); 图还没画好时原样返回. */
export function withDemoMedia<T>(data: T, keys: readonly string[], images: readonly DemoImageLike[]): T {
  if (images.length === 0) return data;
  const walk = (value: unknown): unknown => {
    if (Array.isArray(value)) return value.map(walk);
    if (!value || typeof value !== "object" || isOpaque(value)) return value;
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value)) out[k] = walk(v);
    if (typeof out.src === "string" && out.src.startsWith(DEMO_CDN)) {
      const image = images[keys.indexOf(out.src.slice(DEMO_CDN.length).replace(/\.svg$/, ""))];
      if (image) Object.assign(out, { src: image.src, srcSet: image.srcSet, placeholder: image.placeholder });
    }
    return out;
  };
  return walk(data) as T;
}

/** 给指定类型的节点补上不可序列化的 props (回调), 其余节点原样返回. */
export function injectProps(blocks: readonly BlockNode[], type: string, extra: Record<string, unknown>): BlockNode[] {
  return blocks.map((node) => (node.type === type ? { ...node, props: { ...node.props, ...extra } } : node));
}
