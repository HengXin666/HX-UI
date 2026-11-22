import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { INTERACTIONS } from "@/interactions/registry";
import { Hero } from "@sites/_blocks/marketing/hero";
import { Section } from "@sites/_blocks/marketing/section";
import { DocsHeader } from "./docs-header";
import { SiteGrid } from "./sites";
import { Stage } from "./stage";

const L1 = ["按钮", "表单", "弹层", "表格", "图表", "加载", "主题", "数字滚动"];

export function Home() {
  return (
    <div>
      <DocsHeader />
      <main className="mx-auto max-w-6xl md:border-x">
        <Hero
          align="left"
          backdrop="none"
          eyebrow={{ label: "HX-UI 2 预览", href: "#/sites" }}
          title="界面库，分三层。"
          highlight="控件够稳，交互出彩，整页拿来就发。"
          description="三层各管一件事：控件是底座，交互是亮点，成品是能直接上线的整套页面。"
          actions={
            <>
              <Button size="sm" asChild><a href="#/sites">看成品</a></Button>
              <Button size="sm" variant="ghost" asChild><a href="#/interactions">玩交互 <ArrowRight /></a></Button>
            </>
          }
        />
        <Section id="sites" divider eyebrow="L3 成品" title="整套页面，各有美术方向" description="网站和应用两类。每套自带字体、色板和一个招牌视觉。" align="left">
          <SiteGrid />
        </Section>
        <Section divider eyebrow="L2 交互" title="一件交互，一个产品瞬间" description="发送、确认、计数、对比。能直接玩，能调参，能单文件拷走。" align="left">
          <div className="grid border-t border-l md:grid-cols-2">
            {INTERACTIONS.map((e) => (
              <a key={e.meta.id} href={`#/interactions/${e.meta.id}`} className="flex flex-col border-r border-b">
                <Stage entry={e} className="pointer-events-none grid min-h-56 place-items-center p-8" />
                <span className="border-t px-4 py-3 text-sm font-medium">{e.meta.title}</span>
              </a>
            ))}
          </div>
        </Section>
        <Section divider eyebrow="L1 控件" title="shadcn 底座，统一令牌" description="Radix 无障碍原语 + Tailwind v4，亮暗主题与强调色一套令牌管到底。" align="left">
          <div className="flex flex-wrap items-center gap-2">
            {L1.map((x) => <span key={x} className="rounded-md border px-2.5 py-1 text-xs text-muted-foreground">{x}</span>)}
            <Button size="sm" variant="ghost" asChild><a href="#/components">全部控件 <ArrowRight /></a></Button>
          </div>
        </Section>
      </main>
      <footer className="mx-auto max-w-6xl border-t px-4 py-8 text-xs text-muted-foreground md:border-x">HX-UI 2 · Apache-2.0</footer>
    </div>
  );
}
