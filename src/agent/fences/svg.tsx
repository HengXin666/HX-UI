"use client";
import * as React from "react";
import { CodeBlock } from "../code/code-block";
import type { FenceRendererProps } from "../markdown/context";
import { DiagramFrame } from "../parts/diagram-frame";
import { sanitizeSvg } from "./sanitize-svg";

/** ```svg 围栏: 闭合后清洗并内联预览, 生成中先显示源码 */
export function SvgFence({ code, incomplete, theme, meta }: FenceRendererProps) {
  const res = React.useMemo(() => (incomplete ? null : sanitizeSvg(code)), [code, incomplete]);
  const error = res && res.error ? res.error : null;
  const svg = res && res.svg ? res.svg : null;
  return (
    <DiagramFrame
      label={meta.title ?? "svg"}
      source={code}
      showSource={incomplete}
      error={error}
      download={() => (svg ? [`${meta.title ?? "image"}.svg`.replace(/\.svg\.svg$/, ".svg"), svg, "image/svg+xml"] : null)}
      sourceView={<CodeBlock bare code={code} language="svg" theme={theme} incomplete={incomplete} hideLanguage maxHeight={420} />}
    >
      {svg ? <div className="max-w-full [&>svg]:max-h-[480px]" dangerouslySetInnerHTML={{ __html: svg }} /> : null}
    </DiagramFrame>
  );
}
