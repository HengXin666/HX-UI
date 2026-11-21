import { Marquee } from "@/effects/marquee";

export interface Testimonial {
  quote: string;
  name: string;
  role: string;
  avatar?: string;
}

function Card({ t }: { t: Testimonial }) {
  return (
    <figure className="w-80 shrink-0 rounded-xl border bg-card p-5 shadow-soft">
      <blockquote className="text-sm leading-relaxed">“{t.quote}”</blockquote>
      <figcaption className="mt-4 flex items-center gap-3">
        <div className="flex size-9 items-center justify-center rounded-full bg-brand-soft text-sm font-medium text-brand">{t.name.slice(0, 1)}</div>
        <div>
          <div className="text-sm font-medium">{t.name}</div>
          <div className="text-xs text-muted-foreground">{t.role}</div>
        </div>
      </figcaption>
    </figure>
  );
}

/** 证言墙: 两行反向跑马灯. */
export function Testimonials({ items }: { items: Testimonial[] }) {
  const half = Math.ceil(items.length / 2);
  return (
    <div className="space-y-4">
      <Marquee duration={50}>{items.slice(0, half).map((t) => <Card key={t.name} t={t} />)}</Marquee>
      <Marquee duration={50} reverse>{items.slice(half).map((t) => <Card key={t.name} t={t} />)}</Marquee>
    </div>
  );
}
