/**
 * 软件产品页模板 (标杆页 C): 一份产品数据, 产出带叙事节拍, 美术方向与 SoftwareApplication JSON-LD 的 PageSpec.
 * 七拍: 开场 (慢) → 导览 (匀) → 功能 (快) → 实测 (匀) → 定价 (慢) → 口碑与合规 (匀) → 收尾 (快); 缺数据的拍省掉.
 * 节奏顺序保证省掉任意几拍后也不会出现同节奏三连.
 */
import type { ReactNode } from "react";
import type { Cta } from "../blocks/_shared/types";
import type { MatrixGroup } from "../blocks/marketing/ComparisonMatrix";
import type { CalcPlan } from "../blocks/marketing/PricingCalculator";
import type { TourStop } from "../blocks/marketing/ProductTour";
import type { StatBandItem } from "../blocks/marketing/StatBand";
import type { TestimonialItem } from "../blocks/marketing/Testimonials";
import { MONEY_PERIOD } from "../constants/blocks";
import { PRICING_BILLING } from "../constants/blocks-marketing-pricing";
import { BEAT_LAYOUT as L, BEAT_PACE as P, DIRECTION_NAME } from "../constants/page-beat";
import { SAAS_BEAT as B, SAAS_FIXTURE as F, SAAS_LD, SAAS_SHOT_PREFERENCE as S, SAAS_TEXT } from "../constants/templates-saas";
import type { DirectionName } from "./beat";
import { section, type PageSpec, type StoryBeat } from "./define";
import { softwareLd, type LdRating } from "./meta";
import { shotFor } from "./pdp";

/** 一个档位: 计算器用的席位价 + 定价卡上的权益. */
export interface SaasPlan extends CalcPlan {
  description?: string;
  features: string[];
  /** 档位卡上的按钮; 默认用页面第一个 CTA 的文案. */
  cta?: Cta;
  highlight?: boolean;
}

export interface SaasPoint {
  title: string;
  body: string;
}

export interface SaasModel {
  name: string;
  url?: string;
  /** ISO 4217. */
  currency: string;
  title: string;
  lead: string;
  /** 第一个是主按钮. */
  ctas: Cta[];
  /** 导览: 各站 + 被讲解的真实界面. */
  tour?: { stops: TourStop[]; screen: ReactNode };
  features?: SaasPoint[];
  metrics?: StatBandItem[];
  plans: SaasPlan[];
  /** 对比矩阵的行; 列就是 plans. */
  matrix?: MatrixGroup[];
  testimonials?: TestimonialItem[];
  security?: SaasPoint[];
  rating?: LdRating;
  /** 收尾拍; 默认复用开场标题与按钮. */
  closing?: { title: string; lead?: string; ctas?: Cta[] };
}

export interface SaasTemplateInput {
  product: SaasModel;
  direction?: DirectionName;
  texts?: Partial<typeof SAAS_TEXT>;
  seats?: { min: number; max: number; step?: number; default: number };
}

export type SaasIssueCode = "SAAS-NO-PLAN" | "SAAS-NO-CTA" | "SAAS-MATRIX-PLAN" | "SAAS-TOUR-EMPTY";

export interface SaasIssue {
  code: SaasIssueCode;
  message: string;
}

/** 数据问题: 页面仍能渲染, 但应在构建期报出来. */
export function validateSaas(product: SaasModel): SaasIssue[] {
  const issues: SaasIssue[] = [];
  if (product.plans.length === 0) issues.push({ code: "SAAS-NO-PLAN", message: "至少要有一个档位" });
  if (product.ctas.length === 0) issues.push({ code: "SAAS-NO-CTA", message: "至少要有一个行动按钮" });
  if (product.tour && product.tour.stops.length === 0) issues.push({ code: "SAAS-TOUR-EMPTY", message: "导览没有站点" });
  const keys = new Set(product.plans.map((p) => p.key));
  for (const group of product.matrix ?? []) {
    for (const row of group.rows) {
      for (const key of Object.keys(row.values)) {
        if (!keys.has(key)) issues.push({ code: "SAAS-MATRIX-PLAN", message: `对比矩阵引用了不存在的档位 ${key}` });
      }
    }
  }
  return issues;
}

/** 按年付的年总价, 定价卡切到按年时折成每月显示. */
const yearTotal = (plan: SaasPlan): number => Math.round(plan.perSeat * (1 - (plan.yearDiscount ?? 0)) * 12);

const lowestPerSeat = (plans: readonly SaasPlan[]): number | undefined => (plans.length ? Math.min(...plans.map((p) => p.perSeat)) : undefined);

/**
 * 拼一张 SaaS 产品页. 返回 spec 与数据问题.
 * .agents/notes/implemented/architecture/2026-11-20-saas-benchmark.md
 */
export function saasTemplate(input: SaasTemplateInput): { spec: PageSpec; issues: SaasIssue[] } {
  const { product: p, direction = DIRECTION_NAME.industrial, seats } = input;
  const t = { ...SAAS_TEXT, ...input.texts };
  const shot = (pref: readonly string[]) => shotFor(direction, pref);
  const primary = p.ctas[0];
  const story: StoryBeat[] = [
    {
      id: B.open, lead: t.openLead, shot: shot(S.open), layout: L.center, pace: P.slow,
      sections: [section("hero", { title: p.title, lead: p.lead, ctas: [...p.ctas], eyebrow: p.name }, B.open)],
    },
  ];
  if (p.tour) {
    story.push({
      id: B.tour, lead: t.tourLead, shot: shot(S.tour), layout: L.bleed, pace: P.even,
      sections: [section("tour", { id: B.tour, stops: p.tour.stops, children: p.tour.screen }, B.tour)],
    });
  }
  if (p.features?.length) {
    story.push({
      id: B.features, lead: t.featuresLead, shot: shot(S.features), layout: L.grid, pace: P.fast,
      sections: [section("features", { id: B.features, heading: { title: t.features }, items: p.features.map((f) => ({ title: f.title, body: f.body })) }, B.features)],
    });
  }
  if (p.metrics?.length) {
    story.push({
      id: B.metrics, lead: t.metricsLead, shot: shot(S.metrics), layout: L.stack, pace: P.even,
      sections: [section("stats", { id: B.metrics, heading: { title: t.metrics }, items: p.metrics }, B.metrics)],
    });
  }
  const pricing = [
    section("pricing", {
      id: B.pricing,
      heading: { title: t.pricing },
      billing: { options: [PRICING_BILLING.month, PRICING_BILLING.year], default: PRICING_BILLING.month },
      plans: p.plans.map((plan) => ({
        key: plan.key,
        name: plan.name,
        description: plan.description,
        prices: {
          month: { amount: plan.perSeat, currency: p.currency, period: MONEY_PERIOD.month },
          year: { amount: yearTotal(plan), currency: p.currency, period: MONEY_PERIOD.year },
        },
        features: plan.features,
        cta: plan.cta ?? { label: primary?.label ?? plan.name, href: primary?.href },
        highlight: plan.highlight,
      })),
    }, `${B.pricing}-plans`),
    section("calculator", { id: `${B.pricing}-calc`, plans: p.plans, currency: p.currency, seats }, `${B.pricing}-calc`),
  ];
  if (p.matrix?.length) {
    pricing.push(section("matrix", { id: `${B.pricing}-matrix`, heading: { title: t.matrix }, plans: p.plans.map((plan) => ({ key: plan.key, name: plan.name })), groups: p.matrix, featureLabel: t.feature }, `${B.pricing}-matrix`));
  }
  story.push({ id: B.pricing, lead: t.pricingLead, shot: shot(S.pricing), layout: L.stack, pace: P.slow, sections: pricing });
  const proof = [];
  if (p.testimonials?.length) proof.push(section("testimonials", { id: B.proof, heading: { title: t.proof }, items: p.testimonials }, `${B.proof}-quotes`));
  if (p.security?.length) proof.push(section("features", { id: `${B.proof}-security`, heading: { title: t.security }, items: p.security.map((s) => ({ title: s.title, body: s.body })) }, `${B.proof}-security`));
  if (proof.length) story.push({ id: B.proof, lead: t.proofLead, shot: shot(S.proof), layout: L.grid, pace: P.even, sections: proof });
  const closing = p.closing ?? { title: p.title, ctas: p.ctas };
  story.push({
    id: B.cta, lead: t.ctaLead, shot: shot(S.cta), layout: L.center, pace: P.fast,
    sections: [section("cta", { title: closing.title, lead: closing.lead, ctas: [...(closing.ctas ?? p.ctas)] }, B.cta)],
  });

  const spec: PageSpec = {
    direction,
    story,
    meta: {
      title: `${p.name} | ${p.title}`,
      description: p.lead,
      canonical: p.url,
      og: { type: "website", url: p.url },
      jsonLd: softwareLd({ name: p.name, os: SAAS_LD.os, category: SAAS_LD.category, price: lowestPerSeat(p.plans), currency: p.currency, url: p.url, rating: p.rating }),
    },
  };
  return { spec, issues: validateSaas(p) };
}

/**
 * 示例产品 Tally (团队对账工具) 的数据; 导览的真实界面由调用方给 (文档站放一个活的对账工作台).
 */
export function sampleSaas(screen?: ReactNode): SaasModel {
  return {
    name: F.name,
    url: F.url,
    currency: F.currency,
    title: F.title,
    lead: F.lead,
    ctas: [{ label: F.ctaStart }, { label: F.ctaDemo, variant: "secondary" }],
    tour: screen === undefined ? undefined : { stops: F.stops.map((s) => ({ ...s })), screen },
    features: F.features.map((f) => ({ ...f })),
    metrics: F.metrics.map((m) => ({ ...m })),
    plans: F.plans.map((plan, i) => ({ ...plan, features: [...F.planFeatures[plan.key]], highlight: i === 1 })),
    matrix: F.matrix.map((g) => ({ title: g.title, rows: g.rows.map((r) => ({ label: r.label, values: { ...r.values } })) })),
    testimonials: F.testimonials.map((q) => ({ quote: q.quote, person: { name: q.name, role: q.role, company: q.company } })),
    security: F.security.map((s) => ({ ...s })),
    rating: { value: F.rating.value, count: F.rating.count },
  };
}
