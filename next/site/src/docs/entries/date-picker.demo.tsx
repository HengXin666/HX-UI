import * as React from "react";
import { Field } from "@/components/ui/field";
import { DatePicker, DateRangePicker, RANGE_PRESETS, type DateRange } from "@/components/ui/date-picker";
import type { DemoProps } from "../types";
import { FormCard } from "./_form";

const today = () => { const d = new Date(); d.setHours(0, 0, 0, 0); return d; };

export default function DatePickerDemo({ values }: DemoProps) {
  const [d, setD] = React.useState<Date | undefined>(() => { const t = today(); t.setDate(t.getDate() + 3); return t; });
  const [r, setR] = React.useState<DateRange | undefined>(() => RANGE_PRESETS[1].range());
  const past = values.noPast ? { before: today() } : undefined;
  return values.mode === "range" ? (
    <FormCard title="导出报表" className="max-w-md">
      <Field label="时间范围" description="最多一次导出 366 天。">
        <DateRangePicker value={r} onChange={setR} presets={values.presets ? RANGE_PRESETS : []} months={Number(values.months)} />
      </Field>
    </FormCard>
  ) : (
    <FormCard title="预约上门安装">
      <Field label="上门日期" required error={!d ? "请选择日期。" : undefined}>
        <DatePicker value={d} onChange={setD} disabledDays={past} />
      </Field>
    </FormCard>
  );
}
