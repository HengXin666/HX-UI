import type { JSX } from "react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger, Button, Collapsible, CollapsibleContent, CollapsibleTrigger } from "@hx/ui";
import { useState } from "react";
import { Callout, H2, P, Preview, PropsTable } from "../components/DocKit";

/**
 * Accordion / Collapsible 页。
 *
 * 这一页也是"动画地基"的验收现场: 在此之前本库根本没装 tw-animate-css,
 * 也没定义 data-open 变体, 因此所有弹层的进场类名都是死的。折叠面板的高度动画
 * 走的是关键帧 (见 src/motion.css), 所以这里能直接看出关键帧有没有被加载 ——
 * 若加载失败, 收起会瞬间跳掉而不是滑动。
 */
export function AccordionPage(): JSX.Element {
  const [open, setOpen] = useState(false);

  return (
    <>
      <H2>Accordion: 一组互斥条目</H2>
      <P>
        <code className="rounded-md bg-muted/60 px-1.5 py-0.5 font-mono text-[11.5px]">type="single"</code> 一次只开一个 (内容短、
        彼此相关时用), <code className="rounded-md bg-muted/60 px-1.5 py-0.5 font-mono text-[11.5px]">type="multiple"</code> 可以全开。
      </P>
      <Preview
        align="start"
        code={`<Accordion type="single" collapsible className="w-full">
  <AccordionItem value="a">
    <AccordionTrigger>什么是出口节点?</AccordionTrigger>
    <AccordionContent>账号出网时实际使用的那个 IP。</AccordionContent>
  </AccordionItem>
  <AccordionItem value="b">
    <AccordionTrigger>保活多久跑一次?</AccordionTrigger>
    <AccordionContent>默认 6 小时, 可在设置里改。</AccordionContent>
  </AccordionItem>
</Accordion>`}
      >
        <Accordion type="single" collapsible className="w-full">
          <AccordionItem value="a">
            <AccordionTrigger>什么是出口节点?</AccordionTrigger>
            <AccordionContent>账号出网时实际使用的那个 IP。更换出口会让该账号的登录态失效。</AccordionContent>
          </AccordionItem>
          <AccordionItem value="b">
            <AccordionTrigger>保活多久跑一次?</AccordionTrigger>
            <AccordionContent>默认 6 小时, 可在设置页改动。</AccordionContent>
          </AccordionItem>
          <AccordionItem value="c">
            <AccordionTrigger>探测结论和人工标注冲突时听谁的?</AccordionTrigger>
            <AccordionContent>听人工。探测器只有 HTTP 码与 vcard 两个判据, 用户可能知道更多。</AccordionContent>
          </AccordionItem>
        </Accordion>
      </Preview>

      <H2>Collapsible: 单个可折叠块</H2>
      <P>
        只有一个折叠块时不该套 Accordion —— 那会多出一层 item 语义与一套 roving 焦点。
      </P>
      <Preview
        align="start"
        code={`const [open, setOpen] = useState(false);

<Collapsible open={open} onOpenChange={setOpen}>
  <CollapsibleTrigger asChild>
    <Button variant="outline" size="sm">
      {open ? "收起" : "展开"}高级选项
    </Button>
  </CollapsibleTrigger>
  <CollapsibleContent>
    <div className="pt-3 text-[12px] text-muted-foreground">这里放次要配置…</div>
  </CollapsibleContent>
</Collapsible>`}
      >
        <Collapsible open={open} onOpenChange={setOpen} className="w-full">
          <CollapsibleTrigger asChild>
            <Button variant="outline" size="sm">{open ? "收起" : "展开"}高级选项</Button>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="mt-3 flex flex-col gap-1.5 text-[12px] text-muted-foreground">
              <span>并发数: 4</span>
              <span>重试次数: 3</span>
              <span>超时: 30s</span>
            </div>
          </CollapsibleContent>
        </Collapsible>
      </Preview>

      <Callout title="高度动画为什么用关键帧而不是 transition">
        radix 的 Presence 靠 getComputedStyle 判定"元素还能不能卸载"。
        CSS transition 在部分路径上不被识别 —— 表现是展开有动画、收起瞬间消失。
        关键帧每次都被认定, 于是两端都有动画。高度取 radix 实测的 CSS 变量
        (--radix-accordion-content-height), 不用 height: auto (auto 不可插值)。
      </Callout>

      <H2>属性</H2>
      <PropsTable
        rows={[
          { name: "Accordion.type", type: '"single" | "multiple"', desc: "单选还是多开。" },
          { name: "Accordion.collapsible", type: "boolean", desc: "type=single 时允许全部收起。" },
          { name: "Accordion.defaultValue", type: "string | string[]", desc: "默认展开项。" },
          { name: "AccordionItem.value", type: "string", desc: "该项的标识。" },
          { name: "Collapsible.open / defaultOpen", type: "boolean", desc: "受控 / 非受控开合。" },
          { name: "Collapsible.onOpenChange", type: "(open: boolean) => void", desc: "开合变化回调。" },
        ]}
      />
    </>
  );
}
