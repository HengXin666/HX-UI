import * as React from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Field } from "@/components/ui/field";
import type { DemoProps } from "../types";
import { FormCard } from "./_form";

const ITEMS = [
  { id: "deploy", label: "部署结果", desc: "成功或失败都会通知。" },
  { id: "billing", label: "账单和用量", desc: "超出套餐 80% 时提醒。" },
  { id: "weekly", label: "每周报告", desc: "每周一 09:00 发送。" },
];

export default function CheckboxDemo({ values }: DemoProps) {
  const [on, setOn] = React.useState<Record<string, boolean>>({ deploy: true, billing: true, weekly: false });
  const n = Object.values(on).filter(Boolean).length;
  const all = n === ITEMS.length ? true : n === 0 ? false : "indeterminate";
  const disabled = Boolean(values.disabled);
  return (
    <FormCard title="邮件通知">
      <div className="grid gap-4">
        {values.selectAll ? (
          <Field label="全部" orientation="horizontal" disabled={disabled} className="border-b pb-3">
            <Checkbox checked={all} onCheckedChange={(v) => setOn(Object.fromEntries(ITEMS.map((i) => [i.id, v === true])))} />
          </Field>
        ) : null}
        {ITEMS.map((i) => (
          <Field key={i.id} label={i.label} description={values.descriptions ? i.desc : undefined} orientation="horizontal" disabled={disabled}>
            <Checkbox checked={on[i.id]} onCheckedChange={(v) => setOn((s) => ({ ...s, [i.id]: v === true }))} />
          </Field>
        ))}
      </div>
    </FormCard>
  );
}
