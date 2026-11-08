import { toast } from "@hx/ui";
import { copyText as writeClipboard } from "../../../../src/constants/blocks-marketing-developer";
import { COPIED } from "../constants";

/**
 * 写剪贴板并给一条提示. 写入交给库的 copyText (安全上下文走 navigator.clipboard, 否则降级 execCommand),
 * 这里只把结果变成 toast, 失败也说出来.
 */
export function copyText(text: string, what: string): void {
  void writeClipboard(text).then((ok) => {
    if (ok) toast.success(`${COPIED}: ${what}`);
    else toast.error("复制失败");
  });
}
