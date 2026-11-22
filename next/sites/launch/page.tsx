import * as React from "react";
import { ArrowRight, Coins, FileCheck2, KeyRound, Landmark, Split, Stamp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SiteHeader } from "@sites/_blocks/marketing/site-header";
import { Hero } from "@sites/_blocks/marketing/hero";
import { LogoWall } from "@sites/_blocks/marketing/logo-wall";
import { Section } from "@sites/_blocks/marketing/section";
import { FeatureTabs } from "@sites/_blocks/marketing/feature-tabs";
import { FeatureGrid } from "@sites/_blocks/marketing/feature-grid";
import { Stats } from "@sites/_blocks/marketing/stats";
import { Quote } from "@sites/_blocks/marketing/quote";
import { Pricing } from "@sites/_blocks/marketing/pricing";
import { Faq } from "@sites/_blocks/marketing/faq";
import { Cta } from "@sites/_blocks/marketing/cta";
import { SiteFooter } from "@sites/_blocks/marketing/site-footer";
import { ThemeToggle } from "@sites/_blocks/shell/theme-toggle";
import { TallyWorkspace } from "./tally/workspace";
import { CloseResult, ErpVisual, MatchVisual, RulesVisual } from "./tally/vignettes";
import { TALLY_LOGOS } from "./tally/logos";
import { TrialProvider, useTrial } from "./tally/trial";
import "./art.css";

/** 单独构建 (npm run build:site launch) 时写进 <head> */
export const meta = {
  title: "Tally · 月底对账，从三天缩到二十分钟",
  description: "Tally 把银行流水、发票和 ERP 订单自动配对，只把真正有出入的那几十笔交给你。23 家银行直连，ERP 双向回写，14 天免费试用。",
  themeColor: "#faf9f6",
  icon: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 20 20'%3E%3Crect width='20' height='20' rx='5' fill='%23201d1a'/%3E%3Cpath d='M5.5 6.5h9M10 6.5v8' stroke='%23fff' stroke-width='2.2' stroke-linecap='round'/%3E%3C/svg%3E",
};

const brand = (
  <span className="flex items-center gap-2">
    <svg viewBox="0 0 20 20" className="size-5" aria-hidden>
      <rect width="20" height="20" rx="5" className="fill-foreground" />
      <path d="M5.5 6.5h9M10 6.5v8" className="stroke-background" strokeWidth="2.2" strokeLinecap="round" />
    </svg>
    Tally
  </span>
);

/** 主按钮 + 文字链: 成熟发布页的标准组合, 不做流光 / 磁吸 */
function Actions() {
  const trial = useTrial();
  return (
    <>
      <Button type="button" size="lg" className="h-10 rounded-full px-5" onClick={() => trial({ kind: "trial" })}>免费试用 14 天</Button>
      <button type="button" onClick={() => trial({ kind: "demo" })} className="group inline-flex items-center gap-1.5 text-sm font-medium">
        预约演示 <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
      </button>
    </>
  );
}

function HeaderTrial({ className }: { className?: string }) {
  const trial = useTrial();
  return <Button type="button" size="sm" className={className} onClick={() => trial({ kind: "trial" })}>免费试用</Button>;
}

/** 招牌视觉: 暖纸色发丝网格舞台, 真实工作台从舞台底部"长"出来, 底边裁切. */
function Stage({ children }: { children: React.ReactNode }) {
  return (
    <div className="launch-stage relative -mx-5 overflow-hidden border-y px-3 pt-3 sm:mx-0 sm:rounded-t-xl sm:border sm:border-b-0 sm:px-6 sm:pt-6 md:px-10 md:pt-10">
      <div className="max-h-[560px] overflow-hidden rounded-t-lg md:max-h-[620px]">{children}</div>
      <div aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-background to-transparent" />
    </div>
  );
}

/**
 * 水合分段: 预渲染的 HTML 里, 每个 Suspense 边界单独排队水合, 主线程在段与段之间可以喘气,
 * 不会一次卡住几百毫秒 (慢手机上的 TBT). 不会真的挂起, 所以不需要 fallback.
 */
const Lazy = ({ children }: { children: React.ReactNode }) => <React.Suspense>{children}</React.Suspense>;

/** 挂载时给 <html> 打上 data-site, art.css 的令牌对弹层 (挂在 body 上) 也生效. */
function useSiteArt(id: string) {
  React.useEffect(() => {
    const el = document.documentElement;
    el.dataset.site = id;
    return () => { delete el.dataset.site; };
  }, [id]);
}

const NAV = [
  { label: "产品", href: "#product" },
  { label: "细节", href: "#details" },
  { label: "客户", href: "#customers" },
  { label: "定价", href: "#pricing" },
  { label: "问答", href: "#faq" },
];

export default function Launch() {
  useSiteArt("launch");
  return (
    <TrialProvider>
      <LaunchPage />
    </TrialProvider>
  );
}

function LaunchPage() {
  const trial = useTrial();
  return (
    <div className="min-h-svh bg-background pb-4 text-foreground">
      <SiteHeader
        brand={<a href="#top" aria-label="Tally 首页">{brand}</a>}
        width="max-w-[1200px]"
        links={NAV}
        actions={<><ThemeToggle /><HeaderTrial className="hidden rounded-full sm:inline-flex" /></>}
        menuActions={<HeaderTrial className="h-10" />}
      />
      <main id="top" className="mx-auto max-w-[1200px] md:border-x">
        <Hero
          eyebrow={{ label: "多币种自动对账已上线", href: "#details" }}
          title="月底对账，"
          highlight="从三天缩到二十分钟。"
          description="Tally 把银行流水、发票和 ERP 订单自动配对，只把真正有出入的那几十笔交给你。"
          actions={<Actions />}
          media={<Stage><Lazy><TallyWorkspace /></Lazy></Stage>}
          tilt={false}
        />

        <Lazy>
          <LogoWall className="pt-8" label="1,800 多家企业的财务团队，每个月底都在用 Tally。" logos={TALLY_LOGOS} />

        </Lazy>
        <Lazy>
          <Section id="product" divider eyebrow="01 · 产品" title={<>重复的交给规则，<br className="hidden sm:block" />判断留给你。</>} description="匹配、记账、回写，一条流水从进账到凭证不用人碰。真正需要你的，只有那几笔说不清的。">
            <FeatureTabs
              tabs={[
                { title: "智能匹配", description: "金额、日期、户名、摘要四个维度打分。一对多、多对一的合并回款也能拆开认出来。", visual: <MatchVisual /> },
                { title: "规则引擎", description: "用读得懂的句子写规则，每条规则命中多少、改判多少，一眼看清。业务同事也能自己配。", visual: <RulesVisual /> },
                { title: "ERP 回写", description: "核销结果和凭证实时写回金蝶、用友、SAP。走官方接口，不动 ERP 的一行配置。", visual: <ErpVisual /> },
              ]}
            />
          </Section>

        </Lazy>
        <Lazy>
          <Section id="details" divider eyebrow="02 · 细节" title="财务会在意的那些事，都做好了。">
            <FeatureGrid
              features={[
                { icon: Landmark, title: "23 家银行直连", description: "企业网银直连，流水 5 分钟内到账，不用再导 Excel。" },
                { icon: Coins, title: "多币种与汇差", description: "按入账日汇率自动折算，汇差单独成凭证。" },
                { icon: Split, title: "拆分与合并", description: "一笔回款对多张发票，或多笔付款对一张合同，都能认。" },
                { icon: Stamp, title: "审批流", description: "大额、跨主体的差异按金额阈值自动流转审批。" },
                { icon: FileCheck2, title: "审计留痕", description: "每次匹配、改判、审批都有记录，一键导出审计包。" },
                { icon: KeyRound, title: "SSO 与权限", description: "按主体、账户、科目细分权限，支持飞书与企业微信登录。" },
              ]}
            />
          </Section>

        </Lazy>
        <Lazy>
          <section className="px-5 md:px-8">
            <div className="mx-auto max-w-6xl">
              <Stats items={[
                { value: 96.4, unit: "%", label: "流水自动核销", decimals: 1 },
                { value: 18.6, unit: "小时", label: "每人每月节省", decimals: 1 },
                { value: 2412, unit: "万笔", label: "累计处理流水" },
                { value: 99.95, unit: "%", label: "服务可用性", decimals: 2 },
              ]} />
            </div>
          </section>

        </Lazy>
        <Lazy>
          <Section id="customers" eyebrow="03 · 客户">
            <Quote
              quote="以前月结要三个人加班三天。现在一个人，一个上午就对完了。"
              name="王蕾"
              role="蓝鲸物流 · 财务经理"
              aside={
                <div className="space-y-6 text-sm">
                  <div><div className="text-muted-foreground">月结耗时</div><div className="mt-1 text-2xl font-semibold tracking-tight">3 天 → 2.5 小时</div></div>
                  <div><div className="text-muted-foreground">人工确认</div><div className="mt-1 text-2xl font-semibold tracking-tight">−94%</div></div>
                </div>
              }
            />
          </Section>

        </Lazy>
        <Lazy>
          <Section id="pricing" divider eyebrow="04 · 定价" title="按团队规模付费。" description="所有版本都含 14 天试用，不需要绑卡。随时升降级，按天折算。">
            <Pricing
              onSelect={(p, yearly) => (p.name === "企业版" ? trial({ kind: "demo", plan: p.name }) : trial({ kind: "trial", plan: `${p.name} · ${yearly ? "按年" : "按月"}` }))}
              plans={[
                { name: "团队版", description: "10 人以内的财务团队", monthly: 399, yearly: 319, cta: "开始试用", features: ["3 个银行账户", "每月 5,000 笔流水", "基础匹配规则", "邮件支持"] },
                { name: "专业版", description: "多主体、多币种企业", monthly: 1_299, yearly: 1_039, cta: "开始试用", featured: true, features: ["不限银行账户", "每月 50,000 笔流水", "自定义规则与审批流", "ERP 双向回写", "专属客户成功经理"] },
                { name: "企业版", description: "集团化与私有化部署", monthly: 3_999, yearly: 3_199, cta: "联系销售", features: ["私有化或专属云", "SSO 与细粒度权限", "审计包与合规报告", "99.95% SLA"] },
              ]}
            />
          </Section>

        </Lazy>
        <Lazy>
          <Section id="faq" divider layout="split" eyebrow="05 · 问答" title="常见问题" description={<>没找到答案？<button type="button" onClick={() => trial({ kind: "demo" })} className="text-foreground underline underline-offset-4">和我们聊聊</button></>}>
            <Faq
              items={[
                { q: "数据安全怎么保证？", a: "银行直连走专线与国密加密，数据静态加密存储，已通过等保三级与 ISO 27001 认证。" },
                { q: "需要改动现有 ERP 吗？", a: "不需要。Tally 通过官方开放接口读写，不改动 ERP 本身。" },
                { q: "试用期结束会自动扣费吗？", a: "不会。试用不需要绑卡，到期后数据保留 30 天。" },
                { q: "支持私有化部署吗？", a: "企业版支持私有化与专属云部署，通常两周内交付。" },
                { q: "从别的对账工具迁移麻烦吗？", a: "支持导入历史匹配结果与规则，客户成功团队会陪你完成第一个月结。" },
              ]}
            />
          </Section>

        </Lazy>
        <Lazy>
          <Cta
            title={<>下个月底，<br />准点下班。</>}
            description="导入一个月的流水，十分钟内看到自动核销结果。"
            actions={<Actions />}
            media={<CloseResult />}
          />
        </Lazy>
      </main>
      <Lazy>
        <SiteFooter
          brand={brand}
          width="max-w-[1200px]"
          note="让财务团队把时间花在判断上，而不是搬运上。"
          legal={<div className="flex flex-wrap justify-between gap-2"><span>© 2026 Tally 科技</span><span>沪 ICP 备 0000000 号</span></div>}
          columns={[
            { title: "产品", links: [{ label: "智能匹配", href: "#product" }, { label: "功能细节", href: "#details" }, { label: "定价", href: "#pricing" }] },
            { title: "了解", links: [{ label: "客户案例", href: "#customers" }, { label: "常见问题", href: "#faq" }, { label: "回到顶部", href: "#top" }] },
          ]}
        />
      </Lazy>
    </div>
  );
}
