import { toast } from "@hx/ui";
import { COPIED } from "../constants";

/** 写剪贴板并给一条提示. 剪贴板不可用 (非安全上下文) 时提示失败, 不静默吞掉. */
export function copyText(text: string, what: string): void {
  const clip = globalThis.navigator?.clipboard;
  if (!clip) {
    toast.error("当前环境不能写剪贴板");
    return;
  }
  clip.writeText(text).then(
    () => toast.success(`${COPIED}: ${what}`),
    () => toast.error("复制失败"),
  );
}
