import * as React from "react";
import { Eye, EyeOff, Mail } from "lucide-react";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import type { DemoProps } from "../types";
import { FormCard } from "./_form";

export default function InputDemo({ values }: DemoProps) {
  const [show, setShow] = React.useState(false);
  const size = values.size as "sm" | "default" | "lg";
  const icons = Boolean(values.icons);
  return (
    <FormCard title="创建账号">
      <div className="grid gap-4">
        <Field label="工作邮箱" required={Boolean(values.required)} disabled={Boolean(values.disabled)} error={values.error ? "这个邮箱已经注册过了。" : undefined}>
          <Input key={String(values.error)} size={size} type="email" placeholder="you@company.com" defaultValue={values.error ? "lin@tally.so" : undefined} leading={icons ? <Mail /> : undefined} autoComplete="email" />
        </Field>
        <Field label="密码" description="至少 8 位，包含数字。" required={Boolean(values.required)} disabled={Boolean(values.disabled)}>
          <Input
            size={size}
            type={show ? "text" : "password"}
            autoComplete="new-password"
            trailing={
              <button type="button" onClick={() => setShow((v) => !v)} aria-label={show ? "隐藏密码" : "显示密码"} aria-pressed={show} className="grid size-7 place-items-center rounded-md hover:bg-accent hover:text-foreground">
                {show ? <EyeOff /> : <Eye />}
              </button>
            }
          />
        </Field>
        <Field label="团队主页" disabled={Boolean(values.disabled)}>
          <Input size={size} placeholder="your-team" leading={<span className="text-sm">tally.so/</span>} className="[&_input]:ps-[4.75rem]" />
        </Field>
      </div>
    </FormCard>
  );
}
