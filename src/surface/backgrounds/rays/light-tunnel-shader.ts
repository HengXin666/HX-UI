// 行为规格参照 docs/research/catalog/backgrounds-1.md 的 LightTunnel 条目, 实现为 HX 自有.
import { fragmentSource, GLSL_HASH, GLSL_NOISE, GLSL_UTIL } from "../../backdrop/kernel/glsl";
import { RAYS_COMPOSE } from "./field";

/** LightTunnel 的命名常数. 括号里是条目原名或 "本库定". */
export const LIGHT_TUNNEL = {
  /** 入场时长 秒 (INTRO_SECONDS). */
  introSeconds: 1.8,
  /** 漂移的基础速度 (drift += dt * (speed + 0.2)). */
  driftFloor: 0.2,
  /** 中心跟手时间常数 秒 (follow = 1 - exp(-dt / 0.6)). */
  followTau: 0.6,
  /** 揭开的总行程 (本库定, 含软边 0.6). */
  revealSpan: 1.6,
  /** 线缆数上限 (本库定). */
  maxCables: 256,
} as const;

/** 漂移量: 场时钟乘 (speed + 0.2). 时钟已含公共 speed. */
export function tunnelDrift(time: number, speed: number): number {
  return time * (speed + LIGHT_TUNNEL.driftFloor);
}

const BODY = `
uniform vec3 u_cable;
uniform vec3 u_pulse;
uniform vec3 u_tube;
uniform float u_tube_alpha;
uniform float u_drift;
uniform float u_phase;
uniform float u_dir;
uniform float u_plen;
uniform float u_pblend;
uniform float u_pwidth;
uniform float u_pdensity;
uniform float u_count;
uniform float u_thick;
uniform float u_rim;
uniform float u_wavy;
uniform float u_sway;
uniform float u_bend;
uniform float u_size;
uniform vec2 u_center;
uniform vec2 u_steer;
uniform float u_glow;
uniform float u_near;
uniform float u_far;
uniform float u_bright;
uniform float u_reveal;

void main() {
  vec2 p = hx_centered(v_uv * u_res) / max(u_size, 0.05) - u_center;
  float r0 = length(p);
  p -= u_steer * u_bend * exp(-r0 * 2.0);
  float r = max(length(p), 0.001);
  float a = atan(p.y, p.x);
  float depth = 1.0 / r;
  float z = depth * 2.0 + u_drift * u_dir;
  float pixel = 1.5 / (min(u_res.x, u_res.y) * max(u_size, 0.05));
  float cell = a / HX_TAU * u_count;
  float id = floor(cell + 0.5);
  float h1 = hx_hash1(id + 0.37);
  float h3 = hx_hash1(id * 1.7 + 4.1);
  float wave = u_wavy * 0.35 * sin(depth * 1.3 + id * 2.1 + u_time * u_sway);
  float pitch = HX_TAU / u_count * r;
  float d = abs(cell - id - wave) * pitch;
  float width = min(u_thick * pixel * (1.5 + 4.0 * r), 0.45 * pitch);
  float soft = pixel;
  float shade = 1.0 + 0.9 * (h3 - 0.5) * 0.5;
  float line = smoothstep(width + soft, max(width - soft, 0.0), d) * shade;
  float rimEdge = width * (1.0 + u_rim * 2.0);
  float rim = max(smoothstep(rimEdge + soft, rimEdge - soft, d) - line, 0.0);

  float spacing = 1.0 / max(u_pdensity, 0.05);
  float lead = (fract(z / spacing + h1 - u_phase * u_dir) - 0.5) * spacing;
  float limit = 0.5 * spacing;
  float head = exp(-pow(max(-lead, 0.0) / max(u_plen * 0.25, 0.01), 2.0)) * smoothstep(-limit, -limit * 0.8, lead);
  float tail = exp(-max(lead, 0.0) / max(u_plen, 0.01)) * smoothstep(limit, limit * 0.55, lead);
  float core = width * u_pwidth;
  float stroke = smoothstep(core + soft, max(core - soft, 0.0), d) * max(head, tail) * step(0.5 - u_pdensity * 0.5, h1);

  float lod = smoothstep(pixel * 4.0, pixel * 1.2, pitch);
  float body = clamp(width / max(pitch, 0.0001), 0.0, 1.0) * shade;
  line = mix(line, body, lod);
  float near = smoothstep(0.55, 1.25, r);
  vec3 light = u_cable * (line + rim * 0.5) * 0.45 * u_glow;
  light += mix(u_cable, u_pulse, u_pblend) * stroke * (0.6 + 0.8 * u_glow);
  light += u_tube * u_tube_alpha * (0.15 + 0.35 * near) * (1.0 - line);
  float reach = 1.0 - exp(-max(depth, 0.0) * 0.55);
  float fade = smoothstep(0.0, u_near * 0.4, r) * smoothstep(u_far, u_far * 0.55, r);
  fade *= 1.0 - smoothstep(u_reveal - 0.6, u_reveal, reach);
  light *= fade * u_bright * rays_edge(v_uv);
  o_color = rays_compose(light);
}
`;

/** LightTunnel 的上屏片元: 极坐标线缆隧道, 1 / r 深度投影, 头尾分形的脉冲沿缆流动, 远处线缆密到像素级时化成整体光. */
export const LIGHT_TUNNEL_FRAGMENT = fragmentSource(BODY, GLSL_HASH, GLSL_NOISE, GLSL_UTIL, RAYS_COMPOSE);
