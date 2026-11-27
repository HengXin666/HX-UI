"use client";
import { CodeBlock } from "../code/code-block";
import type { FenceRendererProps } from "../markdown/context";
import { DiagramFrame } from "../parts/diagram-frame";

/**
 * ```html 围栏的沙箱预览 (默认不注册, 显式放进 fences 才生效):
 * iframe srcdoc + sandbox="allow-scripts", 没有 allow-same-origin, 拿不到宿主页面的 cookie / storage.
 */
export function HtmlFence({ code, incomplete, theme, meta }: FenceRendererProps) {
  return (
    <DiagramFrame
      label={meta.title ?? "html"}
      source={code}
      showSource={incomplete}
      surface="none"
      download={() => [`${meta.title ?? "page"}.html`, code, "text/html"]}
      sourceView={<CodeBlock bare code={code} language="html" theme={theme} incomplete={incomplete} hideLanguage maxHeight={420} />}
    >
      {incomplete ? null : <iframe title={meta.title ?? "HTML 预览"} sandbox="allow-scripts" srcDoc={code} className="h-[360px] w-full resize-y rounded-md border bg-white" />}
    </DiagramFrame>
  );
}
