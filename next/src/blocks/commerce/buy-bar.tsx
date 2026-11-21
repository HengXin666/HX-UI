import * as React from "react";
import { AnimatePresence, motion } from "motion/react";
import { Button } from "@/components/ui/button";
import { Price } from "./price";

/**
 * 粘性购买条: 观察的购买区 (target) 滚出视口后从底部滑入.
 * 只动 transform; 购买区可见时完全隐藏.
 */
export function BuyBar({ target, image, title, subtitle, amount, compareAt, ctaLabel, disabled, onBuy }: {
  target: React.RefObject<HTMLElement | null>;
  image?: string;
  title: string;
  subtitle?: string;
  amount: number;
  compareAt?: number;
  ctaLabel: string;
  disabled?: boolean;
  onBuy: () => void;
}) {
  const [show, setShow] = React.useState(false);
  React.useEffect(() => {
    const el = target.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setShow(!e.isIntersecting && e.boundingClientRect.top < 0));
    io.observe(el);
    return () => io.disconnect();
  }, [target]);
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ y: "110%" }}
          animate={{ y: 0 }}
          exit={{ y: "110%" }}
          transition={{ type: "spring", stiffness: 320, damping: 32 }}
          className="fixed inset-x-0 bottom-0 z-40 p-3"
        >
          <div className="mx-auto flex max-w-3xl items-center gap-3 rounded-2xl border bg-background/85 p-2.5 shadow-float backdrop-blur-xl">
            {image && <img src={image} alt="" className="size-12 rounded-lg object-cover" />}
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-medium">{title}</div>
              {subtitle && <div className="truncate text-xs text-muted-foreground">{subtitle}</div>}
            </div>
            <Price amount={amount} compareAt={compareAt} size="sm" className="hidden sm:flex" />
            <Button onClick={onBuy} disabled={disabled} className="rounded-xl">{ctaLabel}</Button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
