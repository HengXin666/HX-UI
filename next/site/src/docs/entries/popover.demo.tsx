import * as React from "react";
import { Check, Copy, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/ui/field";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverDescription, PopoverHeader, PopoverTitle, PopoverTrigger } from "@/components/ui/popover";
import type { DemoProps } from "../types";

/** 真实场景: 文档右上角的 "分享". 浮层里有输入和开关, 点外部或 Esc 关闭 */
export default function PopoverDemo({ values }: DemoProps) {
  const [copied, setCopied] = React.useState(false);
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline"><Share2 />分享</Button>
      </PopoverTrigger>
      <PopoverContent side={values.side as "bottom"} align={values.align as "center"} className="w-80">
        <PopoverHeader>
          <PopoverTitle>分享「2026Q4 对账单」</PopoverTitle>
          <PopoverDescription>拿到链接的人可以查看。</PopoverDescription>
        </PopoverHeader>
        <Field label="链接" className="mt-3">
          <Input
            readOnly
            value="https://tally.so/d/q4-2026"
            className="[&_input]:font-mono [&_input]:text-xs"
            trailing={
              <button type="button" aria-label={copied ? "已复制" : "复制链接"} onClick={() => { setCopied(true); setTimeout(() => setCopied(false), 1400); }} className="grid size-7 place-items-center rounded-md hover:bg-accent hover:text-foreground">
                {copied ? <Check className="text-success" /> : <Copy />}
              </button>
            }
          />
        </Field>
        <div className="mt-3 flex items-center justify-between">
          <Label htmlFor="pv-edit" className="font-normal">允许编辑</Label>
          <Switch id="pv-edit" size="sm" />
        </div>
      </PopoverContent>
    </Popover>
  );
}
