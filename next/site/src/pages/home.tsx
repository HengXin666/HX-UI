import { ArrowRight, BarChart3, Boxes, Rocket, ServerCog, ShoppingBag, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Hero } from "@/blocks/marketing/hero";
import { Section } from "@/blocks/marketing/section";
import { SiteHeader } from "@/blocks/marketing/site-header";
import { FeatureBento } from "@/blocks/marketing/feature-bento";
import { ThemeToggle } from "@/blocks/shell/theme-toggle";
import { ShimmerButton } from "@/effects/shimmer-button";
import { Stagger, StaggerItem } from "@/motion/reveal";
import { TiltCard } from "@/effects/tilt-card";
import { go } from "../router";
import { IMG } from "../assets";

const TEMPLATES = [
  { id: "launch", title: "产品发布页", desc: "首屏逐词入场、便当格特性、定价切换、证言跑马灯", icon: Rocket, img: IMG.carry },
  { id: "shop", title: "电商详情 + 列表", desc: "推镜画廊、变体库存联动、粘性购买条、网格筛选", icon: ShoppingBag, img: IMG.shoeA },
  { id: "ops", title: "运维控制台", desc: "可折叠侧栏、⌘K、服务状态板、实时日志流", icon: ServerCog, img: IMG.headphones },
  { id: "analytics", title: "统计分析", desc: "弹簧 KPI、多图联动、时间范围切换、排序搜索大表", icon: BarChart3, img: IMG.watch },
];

export function Home() {
  return (
    <div>
      <SiteHeader
        brand={<span className="flex items-center gap-2"><span className="size-5 rounded-md bg-brand" />HX-UI</span>}
        links={[{ label: "模板", href: "#templates" }, { label: "组件", href: "#/components" }, { label: "设计", href: "#stack" }]}
        actions={<><ThemeToggle /><Button size="sm" variant="outline" asChild><a href="#/components">源码</a></Button></>}
      />
      <Hero
        eyebrow={{ label: "HX-UI 2.0 预览 · 基于 shadcn/ui", href: "#templates" }}
        title="现代界面，"
        highlight="拿来就能上线"
        description="shadcn/ui 的组件底座，Motion 的手感，精选的特效和真实可用的区块。发布页、电商、运维面板、统计大屏，一套搞定。"
        actions={
          <>
            <ShimmerButton onClick={() => go("launch")}>看模板 <ArrowRight className="size-4" /></ShimmerButton>
            <Button size="lg" variant="outline" className="h-11 rounded-full px-6" onClick={() => go("components")}>浏览组件</Button>
          </>
        }
      />
      <Section id="templates" eyebrow="四张成品页" title="每一张都是真实可用的页面" description="只用库的公开组件拼成，改数据和文案就能变成你的产品。">
        <Stagger className="grid gap-5 md:grid-cols-2">
          {TEMPLATES.map((t) => (
            <StaggerItem key={t.id}>
              <button type="button" onClick={() => go(t.id)} className="group block w-full text-left">
                <TiltCard max={5} className="overflow-hidden rounded-2xl border bg-card shadow-soft transition-shadow group-hover:shadow-float">
                  <div className="relative aspect-[16/9] overflow-hidden bg-muted">
                    <img src={t.img} alt="" className="size-full object-cover transition duration-700 group-hover:scale-105" loading="lazy" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                    <t.icon className="absolute bottom-4 left-4 size-6 text-white" />
                  </div>
                  <div className="flex items-center justify-between p-5">
                    <div>
                      <h3 className="font-medium">{t.title}</h3>
                      <p className="mt-1 text-sm text-muted-foreground">{t.desc}</p>
                    </div>
                    <ArrowRight className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-1 group-hover:text-foreground" />
                  </div>
                </TiltCard>
              </button>
            </StaggerItem>
          ))}
        </Stagger>
      </Section>
      <Section id="stack" eyebrow="站在巨人的肩上" title="只选成熟的轮子，把手感做到位">
        <FeatureBento
          features={[
            { title: "shadcn/ui 底座", description: "Radix 无障碍原语 + Tailwind v4。主题与 shadcn 格式兼容，市面上的主题直接可用。", icon: Boxes, span: 3 },
            { title: "Motion 动效", description: "一份弹簧档位与入场预设，全部尊重减弱动效，只动 transform 与 opacity.", icon: Sparkles, span: 3 },
            { title: "数据可视化", description: "Recharts 图表 + TanStack Table，统一配色令牌，亮暗主题自动跟随。", icon: BarChart3, span: 2 },
            { title: "精选特效", description: "光斑、流光边框、跑马灯、极光底纹、磁吸、3D 倾斜。少而精，有预算。", icon: Sparkles, span: 2 },
            { title: "AI 友好", description: "组件即源码，一份 llms.txt 和逐件示例，AI 照着就能拼页面。", icon: Rocket, span: 2 },
          ]}
        />
      </Section>
      <footer className="border-t px-4 py-10 text-center text-sm text-muted-foreground">HX-UI 2 · Apache-2.0</footer>
    </div>
  );
}
