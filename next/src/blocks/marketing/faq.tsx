import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { cn } from "@/lib/utils";

/** 常见问题: 手风琴. 放在 Section layout="split" 的右栏里最好看. */
export function Faq({ items, className }: { items: { q: string; a: string }[]; className?: string }) {
  return (
    <Accordion type="single" collapsible className={cn("border-t", className)}>
      {items.map((it, i) => (
        <AccordionItem key={i} value={`q${i}`}>
          <AccordionTrigger className="py-5 text-left text-[15px] font-medium hover:no-underline">{it.q}</AccordionTrigger>
          <AccordionContent className="pb-5 leading-relaxed text-muted-foreground">{it.a}</AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
}
