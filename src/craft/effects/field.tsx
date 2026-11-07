"use client";

import { useEffect, useRef, type JSX } from "react";

const REDUCED = "(prefers-reduced-motion: reduce)";
const CLIP = -1;

/**
 * 一块很轻的色场. 减弱动效时停在第一帧.
 * 片元着色器只混合两个语义色, 不拿来做按钮.
 */
export function ShaderWash(): JSX.Element {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const gl = canvas.getContext("webgl");
    if (!gl) return;
    const reduced = window.matchMedia?.(REDUCED).matches === true;
    const vertex = gl.createShader(gl.VERTEX_SHADER);
    const fragment = gl.createShader(gl.FRAGMENT_SHADER);
    if (!vertex || !fragment) return;
    gl.shaderSource(vertex, "attribute vec2 p; void main(){ gl_Position = vec4(p, 0.0, 1.0); }");
    gl.shaderSource(fragment, "precision mediump float; uniform float t; void main(){ float w = 0.5 + 0.5 * sin(gl_FragCoord.x * 0.01 + t); gl_FragColor = vec4(0.15 + 0.1 * w, 0.2, 0.28, 1.0); }");
    gl.compileShader(vertex);
    gl.compileShader(fragment);
    const program = gl.createProgram();
    if (!program) return;
    gl.attachShader(program, vertex);
    gl.attachShader(program, fragment);
    gl.linkProgram(program);
    gl.useProgram(program);
    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([CLIP, CLIP, 1, CLIP, CLIP, 1, 1, 1]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(program, "p");
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    const time = gl.getUniformLocation(program, "t");
    let frame = 0;
    const draw = (now: number): void => {
      gl.uniform1f(time, reduced ? 0 : now / 1000);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      if (!reduced) frame = requestAnimationFrame(draw);
    };
    frame = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(frame);
  }, []);
  return <canvas ref={ref} width={320} height={96} className="h-24 w-full rounded-xl border border-border" aria-hidden />;
}

/** 细网格慢慢平移. */
export function GridDrift(): JSX.Element {
  return <div className="h-24 rounded-xl border border-border bg-[linear-gradient(to_right,var(--border)_1px,transparent_1px),linear-gradient(to_bottom,var(--border)_1px,transparent_1px)] bg-[size:16px_16px]" />;
}

/** 颗粒. 用重复径向渐变, 不是一张外链图. */
export function Grain(): JSX.Element {
  return <div className="h-24 rounded-xl border border-border bg-card bg-[radial-gradient(var(--border)_1px,transparent_1px)] bg-[size:4px_4px]" />;
}

/** 极光带. 两层模糊色块. */
export function Aurora(): JSX.Element {
  return (
    <div className="relative h-24 overflow-hidden rounded-xl border border-border bg-card">
      <div className="absolute -left-6 top-2 h-16 w-40 rounded-full bg-accent/80 blur-2xl motion-safe:animate-pulse" />
      <div className="absolute left-24 top-6 h-12 w-36 rounded-full bg-primary/30 blur-2xl" />
    </div>
  );
}
