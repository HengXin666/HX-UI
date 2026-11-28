import { Field } from "@/components/ui/field";
import { RadioGroup, RadioGroupCard, RadioGroupItem } from "@/components/ui/radio-group";
import type { DemoProps } from "../types";
import { FormCard } from "./_form";

const PLANS = [
  { v: "hobby", t: "个人版", d: "1 个项目，社区支持。", p: "免费" },
  { v: "pro", t: "专业版", d: "无限项目，邮件支持。", p: "¥99/月" },
  { v: "team", t: "团队版", d: "成员权限，审计日志。", p: "¥399/月" },
];

export default function RadioDemo({ values }: DemoProps) {
  const disabled = Boolean(values.disabled);
  return (
    <FormCard title="选择套餐" className="max-w-md">
      <RadioGroup defaultValue="pro" aria-label="套餐" disabled={disabled} className="gap-2.5">
        {values.style === "card"
          ? PLANS.map((p) => <RadioGroupCard key={p.v} value={p.v} title={p.t} description={p.d} aside={values.price ? p.p : undefined} />)
          : PLANS.map((p) => (
              <Field key={p.v} label={`${p.t}${values.price ? `（${p.p}）` : ""}`} description={p.d} orientation="horizontal" disabled={disabled}>
                <RadioGroupItem value={p.v} />
              </Field>
            ))}
      </RadioGroup>
    </FormCard>
  );
}
