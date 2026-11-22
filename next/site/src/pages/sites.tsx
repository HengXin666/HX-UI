import { ArrowUpRight } from "lucide-react";
import { SITES } from "@sites/registry";

/** 成品封面墙. 首页和 #/sites 共用. */
export function SiteGrid() {
  return (
    <div className="grid border-t border-l md:grid-cols-2">
      {SITES.map((s) => (
        <a key={s.id} href={`#/${s.id}`} className="group flex flex-col border-r border-b">
          <div className="aspect-[16/9] overflow-hidden bg-muted">
            <img src={s.cover} alt="" loading="lazy" className="size-full object-cover transition-transform duration-700 group-hover:scale-[1.03]" />
          </div>
          <div className="flex items-start justify-between gap-4 border-t px-4 py-3.5">
            <div>
              <div className="flex items-center gap-2 text-sm font-medium">
                {s.title}
                <span className="rounded-sm border px-1.5 py-px font-mono text-[10px] font-normal text-muted-foreground">{s.kind}</span>
                <span className="ml-1 inline-flex items-center gap-1.5 text-xs font-normal text-muted-foreground">
                  <span className={s.done ? "size-1.5 rounded-full bg-success" : "size-1.5 rounded-full bg-warning"} />
                  {s.done ? "已完成" : "制作中"}
                </span>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">{s.direction}</p>
            </div>
            <ArrowUpRight className="size-4 shrink-0 text-muted-foreground transition-colors group-hover:text-foreground" />
          </div>
        </a>
      ))}
    </div>
  );
}
