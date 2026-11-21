import { ArrowRight, FileCheck2, GitMerge, ScanLine, Workflow, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SiteHeader } from "@/blocks/marketing/site-header";
import { Hero } from "@/blocks/marketing/hero";
import { LogoCloud } from "@/blocks/marketing/logo-cloud";
import { Section } from "@/blocks/marketing/section";
import { FeatureBento } from "@/blocks/marketing/feature-bento";
import { Pricing } from "@/blocks/marketing/pricing";
import { Testimonials } from "@/blocks/marketing/testimonials";
import { Faq } from "@/blocks/marketing/faq";
import { Cta } from "@/blocks/marketing/cta";
import { SiteFooter } from "@/blocks/marketing/site-footer";
import { ThemeToggle } from "@/blocks/shell/theme-toggle";
import { ShimmerButton } from "@/effects/shimmer-button";
import { Magnetic } from "@/effects/magnetic";
import { AreaTrend } from "@/data/charts/area-trend";
import { AnimatedNumber } from "@/motion/animated-number";
import { Stagger, StaggerItem } from "@/motion/reveal";
import { BrowserFrame } from "../demos/browser-frame";
import { revenue } from "../demos/data";
import { BackLink } from "../pages/back-link";

const brand = <span className="flex items-center gap-2"><span className="grid size-6 place-items-center rounded-md bg-brand text-xs font-bold text-brand-foreground">T</span>Tally</span>;

function HeroMedia() {
  return (
    <BrowserFrame>
      <div className="grid gap-4 p-4 md:grid-cols-[180px_1fr]">
        <div className="hidden flex-col gap-1 text-sm md:flex">
          {["总览", "银行流水", "发票", "对账规则", "报表"].map((n, i) => (
            <div key={n} className={i === 0 ? "rounded-md bg-accent px-3 py-1.5 font-medium" : "px-3 py-1.5 text-muted-foreground"}>{n}</div>
          ))}
        </div>
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-3">
            {[["本月自动核销", 12_486], ["待人工确认", 37], ["差异金额 (¥)", 1_284.6]].map(([l, v]) => (
              <div key={l as string} className="rounded-lg border p-3">
                <div className="text-xs text-muted-foreground">{l}</div>
                <AnimatedNumber value={v as number} format={{ maximumFractionDigits: 1 }} className="mt-1 block text-xl font-semibold" />
              </div>
            ))}
          </div>
          <div className="rounded-lg border p-3">
            <AreaTrend data={revenue} x="month" series={[{ key: "订阅", label: "订阅" }, { key: "增购", label: "增购" }]} stacked height={200} />
          </div>
        </div>
      </div>
    </BrowserFrame>
  );
}

export default function Launch() {
  return (
    <div className="pb-4">
      <BackLink />
      <SiteHeader
        brand={brand}
        links={[{ label: "功能", href: "#features" }, { label: "定价", href: "#pricing" }, { label: "客户", href: "#customers" }, { label: "问答", href: "#faq" }]}
        actions={<><ThemeToggle /><Button size="sm" variant="ghost">登录</Button><Button size="sm">免费试用</Button></>}
      />
      <Hero
        eyebrow={{ label: "新功能：多币种自动对账已上线" }}
        title="月底对账，"
        highlight="从三天缩到二十分钟"
        description="Tally 把银行流水、发票和 ERP 订单自动匹配，只把真正有差异的 37 笔交给你。财务团队终于可以准点下班。"
        actions={
          <>
            <Magnetic><ShimmerButton>免费试用 14 天 <ArrowRight className="size-4" /></ShimmerButton></Magnetic>
            <Button size="lg" variant="outline" className="h-11 rounded-full px-6">预约演示</Button>
          </>
        }
        media={<HeroMedia />}
      />
      <LogoCloud label="1,800+ 家企业的财务团队在用" logos={["蓝鲸物流", "青禾生鲜", "极光电器", "北辰医疗", "云栖科技", "山海旅行", "千帆教育", "知行律所"]} />
      <Section id="features" eyebrow="为什么是 Tally" title="把重复劳动交给规则，把判断留给你">
        <FeatureBento
          features={[
            { title: "智能匹配", description: "金额、日期、摘要、对方户名四维打分，一对多与多对一拆分也能自动识别。准确率 99.2%.", icon: ScanLine, span: 4 },
            { title: "秒级同步", description: "直连 23 家银行企业网银，流水 5 分钟内入账。", icon: Zap, span: 2 },
            { title: "规则可视化", description: "拖拽式规则编辑，每条规则命中多少笔一目了然。", icon: Workflow, span: 2 },
            { title: "ERP 双向回写", description: "金蝶、用友、SAP 开箱即用，核销结果自动回写。", icon: GitMerge, span: 2 },
            { title: "审计留痕", description: "每次匹配、修改与审批都有记录，一键导出审计包。", icon: FileCheck2, span: 2 },
          ]}
        />
      </Section>
      <section className="px-4 py-12">
        <Stagger className="mx-auto grid max-w-5xl grid-cols-2 gap-8 text-center md:grid-cols-4">
          {[[96.4, "% 流水自动核销", 1], [18.6, "小时 每月节省", 1], [2_412, "万笔 累计处理", 0], [99.95, "% 服务可用率", 2]].map(([v, l, d]) => (
            <StaggerItem key={l as string}>
              <AnimatedNumber value={v as number} format={{ maximumFractionDigits: d as number, minimumFractionDigits: d as number }} className="text-4xl font-semibold tracking-tight" />
              <div className="mt-1 text-sm text-muted-foreground">{l}</div>
            </StaggerItem>
          ))}
        </Stagger>
      </section>
      <Section id="pricing" eyebrow="定价" title="按团队规模付费，随时升降级">
        <Pricing
          plans={[
            { name: "团队版", description: "适合 10 人以内财务团队", monthly: 399, yearly: 319, cta: "开始试用", features: ["3 个银行账户", "每月 5,000 笔流水", "基础匹配规则", "邮件支持"] },
            { name: "专业版", description: "多主体、多币种企业", monthly: 1_299, yearly: 1_039, cta: "开始试用", featured: true, features: ["不限银行账户", "每月 50,000 笔流水", "自定义规则与审批流", "ERP 双向回写", "专属客户成功经理"] },
            { name: "企业版", description: "集团化与私有化部署", monthly: 3_999, yearly: 3_199, cta: "联系销售", features: ["私有化 / 专属云", "SSO 与细粒度权限", "审计包与合规报告", "99.95% SLA"] },
          ]}
        />
      </Section>
      <Section id="customers" eyebrow="客户怎么说" title="财务团队的真实反馈">
        <Testimonials
          items={[
            { quote: "以前月结要三个人加班三天，现在一个人上午就能对完。", name: "王蕾", role: "蓝鲸物流 · 财务经理" },
            { quote: "多币种那块是真省心，汇差自动算好了还带凭证。", name: "赵一鸣", role: "极光电器 · 资金主管" },
            { quote: "审计来的时候直接导出审计包，第一次没被追着要材料。", name: "孙婉", role: "北辰医疗 · 财务总监" },
            { quote: "规则编辑器很直观，业务同事自己就能配。", name: "李想", role: "青禾生鲜 · 会计" },
            { quote: "接金蝶只花了一下午，比我们预想的快太多。", name: "周航", role: "云栖科技 · IT 负责人" },
            { quote: "差异清单一目了然，再也不用在 Excel 里 VLOOKUP 到半夜。", name: "陈曦", role: "千帆教育 · 出纳" },
          ]}
        />
      </Section>
      <Section id="faq" eyebrow="常见问题" title="还有疑问?">
        <Faq
          items={[
            { q: "数据安全怎么保证?", a: "银行直连走专线与国密加密，数据静态加密存储，已通过等保三级与 ISO 27001 认证。" },
            { q: "需要改动现有 ERP 吗?", a: "不需要。Tally 通过官方开放接口读写，不改动 ERP 本身。" },
            { q: "试用期结束会自动扣费吗?", a: "不会。试用不需要绑卡，到期后数据保留 30 天。" },
            { q: "支持私有化部署吗?", a: "企业版支持私有化与专属云部署，通常两周内交付。" },
          ]}
        />
      </Section>
      <Cta title="下个月底，准点下班" description="14 天免费试用，不需要绑卡。导入一个月的流水，当场看到核销结果。" actions={<><ShimmerButton>免费试用</ShimmerButton><Button variant="outline" className="h-11 rounded-full border-white/20 bg-transparent px-6 text-white hover:bg-white/10 hover:text-white">预约演示</Button></>} />
      <SiteFooter
        brand={brand}
        note="让财务团队把时间花在判断上，而不是搬运上。"
        columns={[
          { title: "产品", links: [{ label: "功能", href: "#features" }, { label: "定价", href: "#pricing" }, { label: "更新日志", href: "#" }] },
          { title: "资源", links: [{ label: "帮助中心", href: "#" }, { label: "API 文档", href: "#" }, { label: "安全白皮书", href: "#" }] },
          { title: "公司", links: [{ label: "关于我们", href: "#" }, { label: "加入我们", href: "#" }, { label: "联系销售", href: "#" }] },
        ]}
      />
    </div>
  );
}
