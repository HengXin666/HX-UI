import * as React from "react";
import { Field } from "@/components/ui/field";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import type { DemoProps } from "../types";
import { FormCard } from "./_form";

export default function TextareaDemo({ values }: DemoProps) {
  const max = Number(values.maxLength);
  const [text, setText] = React.useState("导出 CSV 时，中文列名变成了乱码。");
  const over = text.length > max;
  return (
    <FormCard title="反馈问题">
      <Field label="问题描述" aside={values.counter ? <span className={over ? "text-destructive" : undefined}>{text.length}/{max}</span> : undefined} description="截图可以直接粘贴进来。" error={over ? `超出 ${text.length - max} 个字。` : values.error ? "请描述一下问题。" : undefined}>
        <Textarea value={text} onChange={(e) => setText(e.target.value)} placeholder="发生了什么？" className={values.autoGrow ? "max-h-60 min-h-24" : "h-28 resize-none [field-sizing:fixed]"} />
      </Field>
      <div className="mt-4 flex justify-end"><Button disabled={over || !text.trim()}>提交</Button></div>
    </FormCard>
  );
}
