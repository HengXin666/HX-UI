import { Avatar, AvatarBadge, AvatarFallback, AvatarGroup, AvatarGroupCount } from "@/components/ui/avatar";
import type { DemoProps } from "../types";

const TEAM = [
  { n: "林晓", r: "产品经理", a: "LX", c: "oklch(0.5 0.17 262)", on: true },
  { n: "周屿", r: "前端工程师", a: "ZY", c: "oklch(0.48 0.12 160)", on: true },
  { n: "陈默", r: "设计师", a: "CM", c: "oklch(0.52 0.14 55)", on: false },
  { n: "苏青", r: "后端工程师", a: "SQ", c: "oklch(0.5 0.19 330)", on: false },
];

/** 两个真实场景: 项目卡片上的成员叠放, 成员列表 */
export default function AvatarDemo({ values }: DemoProps) {
  const size = values.size as "sm" | "default" | "lg";
  const fb = (t: (typeof TEAM)[number]) => (
    <AvatarFallback className="font-medium text-white" style={{ background: t.c }}>{t.a}</AvatarFallback>
  );
  return (
    <div className="grid w-full max-w-md gap-4">
      <div className="flex items-center justify-between rounded-2xl border bg-background/85 p-4 shadow-float backdrop-blur">
        <div>
          <p className="font-medium">tally-web</p>
          <p className="text-[13px] text-muted-foreground">更新于 17:20</p>
        </div>
        <AvatarGroup aria-label="项目成员 12 人">
          {TEAM.slice(0, Number(values.max)).map((t) => (
            <Avatar key={t.n} size={size} title={t.n}>{fb(t)}</Avatar>
          ))}
          <AvatarGroupCount>+{12 - Number(values.max)}</AvatarGroupCount>
        </AvatarGroup>
      </div>
      <ul className="divide-y rounded-2xl border bg-background/85 shadow-float backdrop-blur">
        {TEAM.map((t) => (
          <li key={t.n} className="flex items-center gap-3 px-4 py-3">
            <Avatar size={size}>
              {fb(t)}
              {values.status ? <AvatarBadge className={t.on ? "bg-success" : "bg-muted-foreground"} aria-label={t.on ? "在线" : "离线"} /> : null}
            </Avatar>
            <div className="flex-1">
              <p className="text-sm font-medium">{t.n}</p>
              <p className="text-[13px] text-muted-foreground">{t.r}</p>
            </div>
            {values.status ? <span className="text-xs text-muted-foreground">{t.on ? "在线" : "2 小时前"}</span> : null}
          </li>
        ))}
      </ul>
    </div>
  );
}
