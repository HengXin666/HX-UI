import { Field } from "@/components/ui/field";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import type { DemoProps } from "../types";
import { FormCard } from "./_form";

const ROWS = [
  { id: "sw-2fa", label: "两步验证", desc: "登录时额外输入验证码。", on: true },
  { id: "sw-preview", label: "预览部署", desc: "每个分支自动生成预览地址。", on: true },
  { id: "sw-public", label: "公开项目", desc: "任何人都能看到源码。", on: false },
];

/** 设置列表: 标签在左, 开关在右 (开关的常见排法). 单个开关跟在文字后时可用 Field horizontal */
export default function SwitchDemo({ values }: DemoProps) {
  const size = values.size as "sm" | "default";
  return (
    <FormCard title="项目设置" className="max-w-md">
      <div className="divide-y">
        {ROWS.map((r) => (
          <div key={r.id} className="flex items-center justify-between gap-6 py-3 first:pt-0 last:pb-0">
            <div className="grid gap-1">
              <Label htmlFor={r.id}>{r.label}</Label>
              {values.descriptions ? <p id={`${r.id}-d`} className="text-[13px] text-muted-foreground">{r.desc}</p> : null}
            </div>
            <Switch id={r.id} size={size} defaultChecked={r.on} disabled={Boolean(values.disabled)} aria-describedby={values.descriptions ? `${r.id}-d` : undefined} />
          </div>
        ))}
      </div>
      <div className="mt-5 border-t pt-4">
        <Field label="记住这台设备" orientation="horizontal" disabled={Boolean(values.disabled)}>
          <Switch size="sm" />
        </Field>
      </div>
    </FormCard>
  );
}
