import { m, useReducedMotion } from "motion/react";
import { cn } from "@/lib/utils";
import { spring } from "./presets";

interface TextRevealProps {
  text: string;
  className?: string;
  /** 按词或按字; 默认自动: 含中日韩文字按字, 否则按词 */
  by?: "word" | "char";
  delay?: number;
  as?: "h1" | "h2" | "h3" | "p" | "span";
}

/** 标题逐词 / 逐字模糊上浮入场. 读屏读整句. */
const CJK = /[\u3040-\u30ff\u3400-\u9fff\uac00-\ud7af]/;

export function TextReveal({ text, className, by, delay = 0, as = "span" }: TextRevealProps) {
  const reduce = useReducedMotion();
  const mode = by ?? (CJK.test(text) ? "char" : "word");
  const Tag = m[as];
  if (reduce) return <Tag className={className}>{text}</Tag>;
  const parts = mode === "word" ? text.split(/(\s+)/) : Array.from(text);
  return (
    <Tag
      className={cn(className)}
      aria-label={text}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true }}
      variants={{ hidden: {}, show: { transition: { staggerChildren: mode === "word" ? 0.06 : 0.03, delayChildren: delay } } }}
    >
      {parts.map((p, i) =>
        /^\s+$/.test(p) ? (
          <span key={i}>{p}</span>
        ) : (
          <m.span
            key={i}
            aria-hidden
            className="inline-block will-change-transform"
            variants={{ hidden: { opacity: 0, y: "0.4em", filter: "blur(8px)" }, show: { opacity: 1, y: 0, filter: "blur(0px)" } }}
            transition={spring.smooth}
          >
            {p}
          </m.span>
        ),
      )}
    </Tag>
  );
}
