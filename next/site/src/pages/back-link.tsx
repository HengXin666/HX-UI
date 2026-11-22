import { ArrowLeft } from "lucide-react";
import { go } from "../router";

/** 模板页左下角的返回按钮, 不干扰页面本身. */
export function BackLink() {
  return (
    <button
      type="button"
      onClick={() => go("")}
      className="fixed bottom-4 left-1/2 z-50 -translate-x-1/2 inline-flex items-center gap-1.5 rounded-full border bg-background/80 px-3 py-1.5 text-xs text-muted-foreground shadow-float backdrop-blur transition-colors hover:text-foreground"
    >
      <ArrowLeft className="size-3.5" /> 返回总览
    </button>
  );
}
