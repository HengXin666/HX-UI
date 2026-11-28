"use client";

import * as React from "react";
import { useReducedMotion } from "@/motion/use-reduced-motion";
import { cn } from "@/lib/utils";
import { resolveColors, useFrameLoop, useThemeVersion } from "./use-frame-loop";

export interface AuroraProps {
  /** 2 到 5 个颜色, 从左到右混合. 支持 var(--token) / oklch / hex */
  colorStops?: string[];
  /** 边缘波浪的高度 */
  amplitude?: number;
  /** 边缘有多柔, 0-1 */
  blend?: number;
  /** 极光伸进容器多深, 0-1 */
  height?: number;
  /** 流动速度 */
  speed?: number;
  /** 波浪尺寸, 越小越宽缓 */
  scale?: number;
  /** 光越过边缘后的柔和外溢 */
  glow?: number;
  /** 整体亮度 */
  brightness?: number;
  /** 幕帘层数 1-3, 后面的层更暗, 有纵深 */
  layers?: number;
  /** 从顶部垂下还是从底部升起 */
  direction?: "top" | "bottom";
  /** 光会朝光标轻轻伸过去 */
  mouseInteraction?: boolean;
  /** 挂载时淡入展开 */
  intro?: boolean;
  /** 整体透明度 */
  opacity?: number;
  /** 白底上画成柔和粉彩 */
  lightMode?: boolean;
  /** 用自己的时钟驱动 (比如滚动进度), 秒 */
  time?: number;
  /** 冻结 */
  paused?: boolean;
  /** 最大像素比, 上限 2 */
  dpr?: number;
  className?: string;
  /** 画布上的 class (混合模式, 滤镜等) */
  canvasClassName?: string;
  style?: React.CSSProperties;
  /** 叠在极光上的内容 */
  children?: React.ReactNode;
}

const VERT = `#version 300 es
in vec2 p; void main(){ gl_Position = vec4(p, 0., 1.); }`;

// 2D simplex noise (Gustavson 公开算法) + 幕帘
const FRAG = `#version 300 es
precision highp float;
out vec4 o;
uniform vec2 uRes; uniform float uT;
uniform vec3 uC[5]; uniform int uN;
uniform float uAmp, uBlend, uH, uScale, uGlow, uBright, uIntro, uOpacity, uLight, uDir;
uniform int uLayers; uniform vec3 uMouse;
vec3 perm(vec3 x){ return mod(((x*34.)+1.)*x, 289.); }
float sn(vec2 v){
  const vec4 C = vec4(.211324865405187, .366025403784439, -.577350269189626, .024390243902439);
  vec2 i = floor(v + dot(v, C.yy)); vec2 x0 = v - i + dot(i, C.xx);
  vec2 i1 = x0.x > x0.y ? vec2(1.,0.) : vec2(0.,1.);
  vec4 x12 = x0.xyxy + C.xxzz; x12.xy -= i1; i = mod(i, 289.);
  vec3 p = perm(perm(i.y + vec3(0., i1.y, 1.)) + i.x + vec3(0., i1.x, 1.));
  vec3 m = max(.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy), dot(x12.zw,x12.zw)), 0.); m = m*m; m = m*m;
  vec3 x = 2.*fract(p*C.www) - 1.; vec3 h = abs(x) - .5; vec3 a0 = x - floor(x + .5);
  m *= 1.79284291400159 - .85373472095314*(a0*a0 + h*h);
  vec3 g; g.x = a0.x*x0.x + h.x*x0.y; g.yz = a0.yz*x12.xz + h.yz*x12.yw;
  return 130.*dot(m, g);
}
vec3 hsv(vec3 c){
  vec4 K = vec4(0., -1./3., 2./3., -1.); vec4 p = mix(vec4(c.bg, K.wz), vec4(c.gb, K.xy), step(c.b, c.g));
  vec4 q = mix(vec4(p.xyw, c.r), vec4(c.r, p.yzx), step(p.x, c.r)); float d = q.x - min(q.w, q.y);
  return vec3(abs(q.z + (q.w - q.y) / (6.*d + 1e-10)), d / (q.x + 1e-10), q.x);
}
vec3 rgb(vec3 c){ vec3 p = abs(fract(c.xxx + vec3(1., 2./3., 1./3.)) * 6. - 3.); return c.z * mix(vec3(1.), clamp(p - 1., 0., 1.), c.y); }
// 相邻色按色相最短路径插值, 紫到绿会经过蓝和青, 比直接混合更像真的极光
vec3 ramp(float x){
  float f = clamp(x, 0., 1.) * float(uN - 1);
  int i = int(floor(f)); float k = smoothstep(0., 1., fract(f));
  vec3 a = uC[0], b = uC[0];
  for (int j = 0; j < 5; j++) { if (j == i) a = uC[j]; if (j == min(i + 1, uN - 1)) b = uC[j]; }
  vec3 ha = hsv(a), hb = hsv(b);
  if (ha.y < .08) ha.x = hb.x; if (hb.y < .08) hb.x = ha.x;
  float dh = hb.x - ha.x; dh -= floor(dh + .5);
  return rgb(vec3(fract(ha.x + dh * k), mix(ha.y, hb.y, k), mix(ha.z, hb.z, k)));
}
void main(){
  vec2 uv = gl_FragCoord.xy / uRes;
  float y = uDir > .5 ? uv.y : 1. - uv.y;       // 离起始边的距离, 0 在边上
  float x = uv.x; float asp = uRes.x / uRes.y;
  vec3 acc = vec3(0.); float al = 0.;
  for (int l = 0; l < 3; l++) {
    if (l >= uLayers) break;
    float fl = float(l);
    float w = l == 0 ? 1. : .55 / fl;
    float t = uT * (.16 + fl * .04) + fl * 5.7;
    float nx = x * asp * .9 * uScale;
    float wave = sn(vec2(nx + fl * 3.3, t)) * .7 + sn(vec2(nx * 2.1 - t * .6, t * .8 + fl * 1.7)) * .3;
    float pull = uMouse.z * .14 * exp(-pow((x - uMouse.x) / .18, 2.));
    float edge = (uH * (1.15 + fl * .22) + uAmp * .2 * uH * 2.2 * wave + pull) * uIntro;
    edge = max(edge, .002);
    float body = smoothstep(1., 1. - (.3 + .65 * uBlend), y / edge);
    float halo = uGlow * .35 * exp(-max(0., y - edge) / (.04 + .12 * uGlow)) * step(.0, edge);
    float shade = .82 + .18 * sn(vec2(nx * 1.7 + fl * 4., uT * .12));
    float k = (body * shade + halo) * w;
    vec3 c = ramp(x + .06 * sn(vec2(x * 2. + fl, uT * .08)));
    if (uLight > .5) { c = mix(c, vec3(1.), .12); k *= .8; }
    acc += c * k; al += k;
  }
  float io = smoothstep(0., 1., uIntro) * uOpacity;
  float a = clamp(al * uBright, 0., 1.) * io;
  vec3 col = min(clamp(acc * uBright, 0., 1.) * io, vec3(a));
  o = vec4(col, a);
}`;

function compile(gl: WebGL2RenderingContext, type: number, src: string) {
  const s = gl.createShader(type)!;
  gl.shaderSource(s, src);
  gl.compileShader(s);
  if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s) ?? "shader");
  return s;
}

export function Aurora({
  colorStops = ["#5227FF", "#7cff67", "#5227FF"],
  amplitude = 1,
  blend = 0.5,
  height = 0.45,
  speed = 1,
  scale = 1,
  glow = 0.6,
  brightness = 1,
  layers = 1,
  direction = "top",
  mouseInteraction = true,
  intro = true,
  opacity = 1,
  lightMode = false,
  time,
  paused = false,
  dpr = 2,
  className,
  canvasClassName,
  style,
  children,
}: AuroraProps) {
  const reduce = useReducedMotion();
  const canvas = React.useRef<HTMLCanvasElement>(null);
  const wrap = React.useRef<HTMLDivElement>(null);
  const theme = useThemeVersion();
  const glRef = React.useRef<{ gl: WebGL2RenderingContext; u: Record<string, WebGLUniformLocation | null> } | null>(null);
  const phase = React.useRef(0);
  const introT = React.useRef(intro && !reduce ? 0 : 1);
  const mouse = React.useRef({ x: 0.5, tx: 0.5, s: 0, ts: 0 });
  const [failed, setFailed] = React.useState(false);

  const stops = React.useMemo(() => (colorStops.length >= 2 ? colorStops.slice(0, 5) : [colorStops[0] ?? "#fff", colorStops[0] ?? "#fff"]), [colorStops]);
  const rgb = React.useMemo(() => resolveColors(wrap.current, stops), [stops, theme]); // eslint-disable-line react-hooks/exhaustive-deps
  const [, force] = React.useReducer((x: number) => x + 1, 0);
  React.useEffect(() => { force(); }, []); // 首次挂载后 wrap 才有, 重新解析一次主题色

  React.useEffect(() => {
    const el = canvas.current;
    if (!el) return;
    const gl = el.getContext("webgl2", { premultipliedAlpha: true, alpha: true, antialias: false });
    if (!gl) { setFailed(true); return; }
    try {
      const prog = gl.createProgram()!;
      gl.attachShader(prog, compile(gl, gl.VERTEX_SHADER, VERT));
      gl.attachShader(prog, compile(gl, gl.FRAGMENT_SHADER, FRAG));
      gl.linkProgram(prog);
      gl.useProgram(prog);
      const buf = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, buf);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
      const loc = gl.getAttribLocation(prog, "p");
      gl.enableVertexAttribArray(loc);
      gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
      const names = ["uRes", "uT", "uC", "uN", "uAmp", "uBlend", "uH", "uScale", "uGlow", "uBright", "uIntro", "uOpacity", "uLight", "uDir", "uLayers", "uMouse"];
      glRef.current = { gl, u: Object.fromEntries(names.map((n) => [n, gl.getUniformLocation(prog, n)])) };
    } catch {
      setFailed(true);
    }
    return () => { gl.getExtension("WEBGL_lose_context")?.loseContext(); glRef.current = null; };
  }, []);

  const still = reduce || paused;
  useFrameLoop(canvas, ({ dt, w, h, dpr: d }) => {
    const g = glRef.current;
    if (!g) return;
    const { gl, u } = g;
    if (!still) phase.current += dt * speed;
    if (introT.current < 1) introT.current = still ? 1 : Math.min(1, introT.current + dt / 1.4);
    const m = mouse.current;
    m.x += (m.tx - m.x) * Math.min(1, dt * 4);
    m.s += (m.ts - m.s) * Math.min(1, dt * 3);
    gl.viewport(0, 0, Math.round(w * d), Math.round(h * d));
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.uniform2f(u.uRes, w * d, h * d);
    gl.uniform1f(u.uT, time ?? phase.current);
    const flat = new Float32Array(15);
    rgb.forEach((c, i) => flat.set(c, i * 3));
    gl.uniform3fv(u.uC, flat);
    gl.uniform1i(u.uN, rgb.length);
    gl.uniform1f(u.uAmp, amplitude);
    gl.uniform1f(u.uBlend, blend);
    gl.uniform1f(u.uH, height);
    gl.uniform1f(u.uScale, scale);
    gl.uniform1f(u.uGlow, glow);
    gl.uniform1f(u.uBright, brightness);
    gl.uniform1f(u.uIntro, 1 - Math.pow(1 - introT.current, 3));
    gl.uniform1f(u.uOpacity, opacity);
    gl.uniform1f(u.uLight, lightMode ? 1 : 0);
    gl.uniform1f(u.uDir, direction === "bottom" ? 1 : 0);
    gl.uniform1i(u.uLayers, Math.max(1, Math.min(3, Math.round(layers))));
    gl.uniform3f(u.uMouse, m.x, 0, mouseInteraction ? m.s : 0);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  }, { maxDpr: Math.min(2, dpr), still, deps: [rgb, amplitude, blend, height, scale, glow, brightness, layers, direction, opacity, lightMode, time, mouseInteraction] });

  return (
    <div
      ref={wrap}
      className={cn("relative isolate h-full w-full overflow-hidden", className)}
      style={style}
      onPointerMove={mouseInteraction ? (e) => { const r = e.currentTarget.getBoundingClientRect(); mouse.current.tx = (e.clientX - r.left) / r.width; mouse.current.ts = 1; } : undefined}
      onPointerLeave={mouseInteraction ? () => { mouse.current.ts = 0; } : undefined}
    >
      <canvas
        ref={canvas}
        aria-hidden="true"
        className={cn("pointer-events-none absolute inset-0 -z-10 h-full w-full", canvasClassName)}
        style={failed ? { background: `linear-gradient(${direction === "bottom" ? "0deg" : "180deg"}, ${stops.map((s, i) => `color-mix(in oklch, ${s} ${40 - i * 8}%, transparent)`).join(", ")}, transparent ${Math.round(height * 100)}%)` } : undefined}
      />
      {children}
    </div>
  );
}
