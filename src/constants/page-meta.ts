/**
 * 页面 head 与 JSON-LD 的词表. 帮手与 PageHead 只读这里, 不在调用处手写 schema.org 名字或 og 键名.
 * .agents/notes/implemented/architecture/2026-11-19-page-meta-jsonld.md
 */

export const SCHEMA_CONTEXT = "https://schema.org";

export const LD_SCRIPT_TYPE = "application/ld+json";

export const LD_TYPE = {
  product: "Product",
  offer: "Offer",
  rating: "AggregateRating",
  brand: "Brand",
  software: "SoftwareApplication",
  faq: "FAQPage",
  question: "Question",
  answer: "Answer",
  breadcrumb: "BreadcrumbList",
  listItem: "ListItem",
} as const;

/** 库存态到 schema.org 枚举 URL. 输入只收这四个, 拼错在编译期报. */
export const LD_AVAILABILITY = {
  inStock: "https://schema.org/InStock",
  outOfStock: "https://schema.org/OutOfStock",
  preOrder: "https://schema.org/PreOrder",
  backOrder: "https://schema.org/BackOrder",
} as const;

/** 软件免费时 offer 的价格. schema.org 要求 offers 存在才给富结果, 免费也要写 "0". */
export const LD_FREE_PRICE = "0";

/** breadcrumb 的 position 从 1 起 (schema.org 约定), 不是数组下标. */
export const LD_POSITION_BASE = 1;

export const OG_KEY = {
  title: "og:title",
  description: "og:description",
  image: "og:image",
  type: "og:type",
  url: "og:url",
  card: "twitter:card",
} as const;

export const META_NAME = {
  description: "description",
} as const;

export const OG_DEFAULT_TYPE = "website";

/** `<` 转义成 \u003c: JSON-LD 写进 script 内联, 字符串里的 `</script>` 不能提前闭合标签. */
export const LD_ESCAPE = { from: /</g, to: "\\u003c" } as const;
