import * as React from "react";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ControlValues } from "../types";
import { SpeedCounter } from "./index";

const FORMATS: Record<string, Intl.NumberFormatOptions> = {
  currency: { style: "currency", currency: "CNY", maximumFractionDigits: 2, minimumFractionDigits: 2 },
  decimal: { maximumFractionDigits: 0 },
  percent: { style: "percent", maximumFractionDigits: 1 },
};

function next(kind: string): number {
  if (kind === "percent") return Math.random();
  if (kind === "decimal") return Math.round(Math.random() * 99999);
  return Math.round(Math.random() * 2_000_000_00) / 100;
}

export default function SpeedCounterDemo({ values }: { values: ControlValues }) {
  const kind = String(values.format);
  const [value, setValue] = React.useState(1284903.27);
  React.useEffect(() => setValue(next(kind)), [kind]);
  return (
    <div className="flex flex-col items-center gap-6">
      <div className="text-xs text-muted-foreground">本月对账金额</div>
      <SpeedCounter value={value} format={FORMATS[kind]} duration={Number(values.duration)} style={{ fontSize: Number(values.size) }} className="font-medium tracking-tight" />
      <Button type="button" size="sm" variant="outline" onClick={() => setValue(next(kind))}>
        <RefreshCw /> 换个数
      </Button>
    </div>
  );
}
