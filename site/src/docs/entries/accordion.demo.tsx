import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import type { DemoProps } from "../types";

const FAQ = [
  ["可以随时取消订阅吗？", "可以。取消后用到当前计费周期结束，不再续费，数据保留 30 天。"],
  ["支持开发票吗？", "支持增值税普通发票和专用发票，在「账单」里填写抬头，付款后 1 个工作日内开出。"],
  ["数据存在哪里？", "默认存在华东（上海）机房，团队版可以选择华北、华南或新加坡。"],
  ["团队成员怎么计费？", "按月活跃成员计费，当月没有登录的成员不收费。"],
];

/** 真实场景: 定价页底部的常见问题 */
export default function AccordionDemo({ values }: DemoProps) {
  const multiple = values.type === "multiple";
  const common = { className: "w-full max-w-lg rounded-2xl border bg-background/85 px-5 shadow-float backdrop-blur" };
  const items = FAQ.map(([q, a], i) => (
    <AccordionItem key={q} value={`q${i}`}>
      <AccordionTrigger level={2}>{q}</AccordionTrigger>
      <AccordionContent className="text-muted-foreground">{a}</AccordionContent>
    </AccordionItem>
  ));
  return multiple
    ? <Accordion type="multiple" defaultValue={["q0"]} {...common}>{items}</Accordion>
    : <Accordion type="single" collapsible={Boolean(values.collapsible)} defaultValue="q0" {...common}>{items}</Accordion>;
}
