import { LD_AVAILABILITY, LD_ESCAPE, LD_FREE_PRICE, LD_POSITION_BASE, LD_TYPE, SCHEMA_CONTEXT } from "../constants/page-meta";

/**
 * 页面 head 的描述与四个 JSON-LD 帮手. 帮手只收业务字段, 输出 schema.org 形状; 值为 undefined 的字段不输出.
 * .agents/notes/implemented/architecture/2026-11-19-page-meta-jsonld.md
 */

/** 一段 JSON-LD. 顶层必有 @context 与 @type, 其余字段由帮手决定. */
export type JsonLd = Readonly<{ "@context": typeof SCHEMA_CONTEXT; "@type": string } & Record<string, unknown>>;

export interface OgMeta {
  /** 缺省取 PageMeta.title. */
  title?: string;
  /** 缺省取 PageMeta.description. */
  description?: string;
  image?: string;
  /** 缺省 website. */
  type?: string;
  /** 缺省取 PageMeta.canonical. */
  url?: string;
  /** twitter:card, 例如 summary_large_image. */
  card?: string;
}

export interface PageMeta {
  title: string;
  description?: string;
  canonical?: string;
  og?: OgMeta;
  /** 帮手返回 undefined 时 (例如空 FAQ) 直接跳过, 调用方不必判空. */
  jsonLd?: JsonLd | ReadonlyArray<JsonLd | undefined>;
}

export type LdAvailability = keyof typeof LD_AVAILABILITY;

export interface LdRating {
  value: number;
  count: number;
}

/** 去掉 undefined 字段: schema.org 校验器把 null 当错误值, 缺省就该不出现. */
function compact<T extends Record<string, unknown>>(obj: T): T {
  return Object.fromEntries(Object.entries(obj).filter(([, v]) => v !== undefined)) as T;
}

function ld(type: string, fields: Record<string, unknown>): JsonLd {
  return compact({ "@context": SCHEMA_CONTEXT, "@type": type, ...fields }) as JsonLd;
}

/** 评分数为 0 时不输出: 搜索引擎对零评价的 AggregateRating 报错. */
function ratingOf(rating: LdRating | undefined): Record<string, unknown> | undefined {
  if (!rating || rating.count <= 0) return undefined;
  return { "@type": LD_TYPE.rating, ratingValue: rating.value, reviewCount: rating.count };
}

export interface ProductLdInput {
  name: string;
  image: string | ReadonlyArray<string>;
  description?: string;
  sku?: string;
  brand?: string;
  price: number;
  currency: string;
  availability: LdAvailability;
  url?: string;
  rating?: LdRating;
}

export function productLd(input: ProductLdInput): JsonLd {
  return ld(LD_TYPE.product, {
    name: input.name,
    image: input.image,
    description: input.description,
    sku: input.sku,
    brand: input.brand ? { "@type": LD_TYPE.brand, name: input.brand } : undefined,
    offers: compact({
      "@type": LD_TYPE.offer,
      price: String(input.price),
      priceCurrency: input.currency,
      availability: LD_AVAILABILITY[input.availability],
      url: input.url,
    }),
    aggregateRating: ratingOf(input.rating),
  });
}

export interface SoftwareLdInput {
  name: string;
  os: string;
  category: string;
  /** 缺省按免费处理. */
  price?: number;
  currency?: string;
  version?: string;
  url?: string;
  rating?: LdRating;
}

export function softwareLd(input: SoftwareLdInput): JsonLd {
  return ld(LD_TYPE.software, {
    name: input.name,
    operatingSystem: input.os,
    applicationCategory: input.category,
    softwareVersion: input.version,
    url: input.url,
    offers: compact({
      "@type": LD_TYPE.offer,
      price: input.price === undefined ? LD_FREE_PRICE : String(input.price),
      priceCurrency: input.currency,
    }),
    aggregateRating: ratingOf(input.rating),
  });
}

export interface FaqItem {
  q: string;
  a: string;
}

/** 空列表返回 undefined: 空的 FAQPage 会被判为无效结构化数据. */
export function faqLd(items: ReadonlyArray<FaqItem>): JsonLd | undefined {
  if (items.length === 0) return undefined;
  return ld(LD_TYPE.faq, {
    mainEntity: items.map((item) => ({
      "@type": LD_TYPE.question,
      name: item.q,
      acceptedAnswer: { "@type": LD_TYPE.answer, text: item.a },
    })),
  });
}

export interface BreadcrumbItem {
  name: string;
  url: string;
}

export function breadcrumbLd(items: ReadonlyArray<BreadcrumbItem>): JsonLd | undefined {
  if (items.length === 0) return undefined;
  return ld(LD_TYPE.breadcrumb, {
    itemListElement: items.map((item, i) => ({
      "@type": LD_TYPE.listItem,
      position: i + LD_POSITION_BASE,
      name: item.name,
      item: item.url,
    })),
  });
}

/** 写进 script 内联用的序列化. 只转义 `<`, JSON.parse 回去与原对象相等. */
export function serializeLd(value: JsonLd): string {
  return JSON.stringify(value).replace(LD_ESCAPE.from, LD_ESCAPE.to);
}

/** 统一成去空的数组, PageHead 与测试共用. */
export function ldList(jsonLd: PageMeta["jsonLd"]): JsonLd[] {
  if (!jsonLd) return [];
  const list: ReadonlyArray<JsonLd | undefined> = Array.isArray(jsonLd) ? jsonLd : [jsonLd as JsonLd];
  return list.filter((x): x is JsonLd => x !== undefined);
}
