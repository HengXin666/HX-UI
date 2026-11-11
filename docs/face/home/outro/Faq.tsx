import type { JSX } from "react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@hx/ui";
import { TYPE, WRAP } from "../kit/layout";
import { FACTS, VERSION } from "../site-facts";

const QA: ReadonlyArray<{ readonly q: string; readonly a: string }> = [
  { q: "HX UI 里有什么?", a: `${FACTS.docs} 篇组件文档 · ${FACTS.components} 个组件, 分 ${FACTS.groups} 组: 基础控件, 浮层, 数据展示, 图表, AI 交互, ${FACTS.blocks} 组区块与 ${FACTS.templates} 套整页模板. 当前版本 v${VERSION}.` },
  { q: "怎么装?", a: "npm i @hx/ui, 再在项目的样式入口 @import \"@hx/ui/styles.css\". 完整入口已含令牌, 主题映射与组件样式." },
  { q: "依赖哪些版本?", a: "React 19 与 react-dom 19. Tailwind 4 可选; 代码编辑器, 流程图, 高亮与流式 Markdown 是可选的 peer 依赖, 用到才装." },
  { q: "怎么换肤?", a: `一共 ${FACTS.skins} 套皮肤, 在根元素写 data-skin (或调 applySkin). 皮肤只覆盖语义令牌, 组件一行不动.` },
  { q: "亮色和暗色怎么切?", a: "根元素的 data-mode 写 light 或 dark. 暗色是默认, 亮色不是反相, 主色在亮色下压暗以保住对比度." },
  { q: "为什么颜色只走令牌?", a: "组件里不写色值, 换肤, 亮暗和密度才能只改一份变量. 门禁会把硬编色值, 非 1px 线和 transition-all 拦成退出码." },
  { q: "动效会尊重减弱动效吗?", a: "会. 系统开了减弱动效时, 入场, 循环与弹簧都直接给终点, 跑马灯停下改为可手动横滑." },
  { q: "可以商用吗?", a: "可以. 仓库以 Apache-2.0 许可发布, 保留许可与 NOTICE 即可." },
  { q: "能和 AI 编程工具一起用吗?", a: "能. 每个演示旁边就是它的源码, 复制给 Cursor, Copilot 或 Claude Code 就能照着拼; 组件与常量都有公共导出." },
];

/** 常见问题: 左标题, 右手风琴 (库里的 Accordion). 回答都是仓库里能查到的事实. */
export function Faq(): JSX.Element {
  return (
    <section aria-labelledby="faq-title" className={`${WRAP} grid gap-10 pt-[120px] md:grid-cols-[576px_minmax(0,1fr)] md:gap-0`}>
      <div>
        <h2 id="faq-title" className={TYPE.h2}>常见问题</h2>
        <p className={`${TYPE.lede} mt-4 max-w-[20rem] text-[15px]`}>装什么, 怎么换肤, 这些部件怎么拼到一起.</p>
      </div>
      <Accordion type="single" collapsible className="grid gap-2">
        {QA.map((item, index) => (
          <AccordionItem key={item.q} value={`q${index}`} className="rounded-xl border border-border bg-card px-5 last:border-b">
            <AccordionTrigger className="py-[18px] text-[16px] font-normal text-foreground hover:no-underline">{item.q}</AccordionTrigger>
            <AccordionContent className="text-[14px] leading-[22px] text-muted-foreground">{item.a}</AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </section>
  );
}
