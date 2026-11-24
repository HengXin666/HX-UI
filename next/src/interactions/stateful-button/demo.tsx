"use client";

import type { ControlValues } from "../types";
import { StatefulButton } from "./index";

export default function StatefulButtonDemo({ values }: { values: ControlValues }) {
  const latency = Number(values.latency);
  const fail = Boolean(values.fail);
  return (
    <div className="flex w-full max-w-xs flex-col gap-3 rounded-lg border bg-card p-4">
      <div className="text-sm font-medium">通知设置</div>
      <p className="text-xs text-muted-foreground">每天 09:00 发送对账摘要到团队频道。</p>
      <StatefulButton
        className="self-end"
        size="sm"
        action={() => new Promise((ok, no) => setTimeout(fail ? no : ok, latency))}
      >
        {String(values.label)}
      </StatefulButton>
    </div>
  );
}
