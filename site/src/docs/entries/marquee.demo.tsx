import { Marquee } from "@/effects/marquee";
import type { DemoProps } from "../types";

const BRANDS = ["蓝鲸物流", "青禾生鲜", "极光电器", "北辰医疗", "云栖科技", "山海文旅", "星河支付"];
const QUOTES = [
  ["接入一个下午就上线了。", "张敏 · 青禾生鲜"],
  ["调参面板直接给设计师用。", "陈露 · 极光电器"],
  ["终于不用自己写骨架屏了。", "王博 · 云栖科技"],
  ["读屏用户的投诉降到零。", "李然 · 北辰医疗"],
];

export default function MarqueeDemo({ values }: DemoProps) {
  const props = {
    duration: Number(values.duration),
    reverse: Boolean(values.reverse),
    vertical: Boolean(values.vertical),
    pauseOnHover: Boolean(values.pauseOnHover),
    fade: Boolean(values.fade),
    gap: Number(values.gap),
  };
  if (values.content === "quotes") {
    return (
      <Marquee {...props} className={props.vertical ? "h-80 w-full max-w-sm" : "w-full"}>
        {QUOTES.map(([q, who]) => (
          <figure key={who} className="w-72 shrink-0 rounded-xl border bg-card p-4">
            <blockquote className="text-sm">「{q}」</blockquote>
            <figcaption className="mt-3 font-mono text-xs text-muted-foreground">{who}</figcaption>
          </figure>
        ))}
      </Marquee>
    );
  }
  return (
    <Marquee {...props} className={props.vertical ? "h-72" : "w-full"}>
      {BRANDS.map((b) => <span key={b} className="text-2xl font-medium tracking-tight whitespace-nowrap text-muted-foreground">{b}</span>)}
    </Marquee>
  );
}
