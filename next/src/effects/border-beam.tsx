import type * as React from "react";

interface BorderBeamProps {
  /** 一圈时长 (秒) */
  duration?: number;
  color?: string;
  width?: number;
}

/** 沿父元素边框流动的光. 父元素需 position: relative 并有圆角. */
export function BorderBeam({ duration = 6, color, width = 1 }: BorderBeamProps) {
  const style = {
    "--beam-duration": `${duration}s`,
    "--beam-width": `${width}px`,
    ...(color ? { "--beam-color": color } : {}),
  } as React.CSSProperties;
  return <span aria-hidden className="hx-beam animate-beam" style={style} />;
}
