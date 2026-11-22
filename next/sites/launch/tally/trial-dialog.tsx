import * as React from "react";
import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { StatefulButton } from "@/interactions/stateful-button";

import type { TrialIntent } from "./trial";

/**
 * 提交接口的占位. 拷走后换成你的后端.
 * 演示用: 邮箱以 @fail.test 结尾时模拟失败, 方便看失败态.
 */
export async function submitTrial(data: { email: string; company: string; intent: TrialIntent }): Promise<void> {
  await new Promise((r) => setTimeout(r, 900));
  if (data.email.endsWith("@fail.test")) throw new Error("提交失败");
}

const COPY = {
  trial: { title: "免费试用 14 天", desc: "不用绑卡。填好后我们会把激活链接发到你的邮箱。", cta: "开始试用", done: "激活链接已发送" },
  demo: { title: "预约演示", desc: "30 分钟线上演示，用你自己的一个月流水跑一遍。", cta: "预约", done: "已收到预约" },
};

/** 表单弹层本体. 由 trial.tsx 按需加载, 首屏不带 Dialog / 表单 / 有状态按钮的代码. */
export default function TrialDialog({ intent, onClose, opener }: { intent: TrialIntent | null; onClose: () => void; opener: React.RefObject<HTMLElement | null> }) {
  const [sentTo, setSentTo] = React.useState<string | null>(null);
  const formRef = React.useRef<HTMLFormElement>(null);
  // 每次重新打开都回到表单
  React.useEffect(() => { if (intent) setSentTo(null); }, [intent]);
  // 关闭动画期间 intent 已经是 null, 沿用上一次的文案, 免得标题闪一下
  const last = React.useRef(intent);
  if (intent) last.current = intent;
  const shown = intent ?? last.current;
  const kind = shown?.kind ?? "trial";
  const copy = COPY[kind];

  const send = async () => {
    const form = new FormData(formRef.current!);
    const email = String(form.get("email"));
    await submitTrial({ email, company: String(form.get("company")), intent: shown! });
    // 让按钮上的"已提交"停留一下, 再切到结果页
    window.setTimeout(() => setSentTo(email), 500);
  };

  return (
      <Dialog open={intent !== null} onOpenChange={(o) => !o && onClose()}>
        <DialogContent
          className="sm:max-w-md"
          onCloseAutoFocus={(e) => {
            if (!opener.current?.isConnected) return;
            e.preventDefault();
            opener.current.focus();
          }}
        >
          {sentTo ? (
            <div role="status" className="flex flex-col items-start gap-3 py-2">
              <CheckCircle2 className="size-6 text-success" />
              <DialogTitle>{copy.done}</DialogTitle>
              <DialogDescription>
                已发送到 <span className="font-medium text-foreground">{sentTo}</span>，几分钟内没收到请看看垃圾邮件。
              </DialogDescription>
              <DialogFooter className="mt-2 w-full">
                <Button type="button" variant="outline" onClick={onClose}>好的</Button>
              </DialogFooter>
            </div>
          ) : (
            <form ref={formRef} onSubmit={(e) => e.preventDefault()} className="flex flex-col gap-5">
              <DialogHeader>
                <DialogTitle>{copy.title}</DialogTitle>
                <DialogDescription>
                  {copy.desc}
                  {shown?.plan && <span className="mt-1.5 block">已选：<span className="font-medium text-foreground">{shown.plan}</span></span>}
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-2">
                <Label htmlFor="trial-email">工作邮箱</Label>
                <Input id="trial-email" name="email" type="email" required autoComplete="email" placeholder="you@company.com" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="trial-company">公司名称</Label>
                <Input id="trial-company" name="company" required autoComplete="organization" placeholder="蓝鲸物流" />
              </div>
              <DialogFooter>
                <StatefulButton
                  type="submit"
                  action={send}
                  guard={() => formRef.current?.reportValidity() ?? false}
                  resetAfter={2400}
                  pendingLabel="提交中"
                  successLabel="已提交"
                  errorLabel="没发出去，再试一次"
                >
                  {copy.cta}
                </StatefulButton>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
  );
}
