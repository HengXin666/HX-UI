import { Field } from "@/components/ui/field";
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectSeparator, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import type { DemoProps } from "../types";
import { FormCard } from "./_form";

const REGIONS = [
  { group: "中国大陆", items: [["sh", "华东 · 上海"], ["bj", "华北 · 北京"], ["sz", "华南 · 深圳"]] },
  { group: "海外", items: [["sg", "新加坡"], ["fra", "法兰克福"], ["sfo", "旧金山"]] },
];

export default function SelectDemo({ values }: DemoProps) {
  const size = values.size as "sm" | "default" | "lg";
  const grouped = Boolean(values.grouped);
  return (
    <FormCard title="新建项目">
      <Field label="部署区域" description="离用户越近，访问越快。" disabled={Boolean(values.disabled)} error={values.error ? "请选择一个区域。" : undefined}>
        <Select defaultValue={values.error ? undefined : "sh"} key={String(values.error)}>
          <SelectTrigger size={size} className="w-full"><SelectValue placeholder="选择区域" /></SelectTrigger>
          <SelectContent>
            {grouped
              ? REGIONS.map((g, i) => (
                  <SelectGroup key={g.group}>
                    {i > 0 && <SelectSeparator />}
                    <SelectLabel>{g.group}</SelectLabel>
                    {g.items.map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}
                  </SelectGroup>
                ))
              : REGIONS.flatMap((g) => g.items).map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}
          </SelectContent>
        </Select>
      </Field>
      <div className="mt-4 flex justify-end"><Button>创建</Button></div>
    </FormCard>
  );
}
