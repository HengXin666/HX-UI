// 行为规格参照 docs/research/catalog/animations.md 的 GlowCursor (SPLAT, ADVECT, MACCORMACK, DIVERGENCE, PRESSURE_STEPS) 与 GhostCursor (SIM: uDecay, uDrag, uDrift, uTurbulence) 条目, 实现为 HX 自有.
/**
 * HaloCursor / HazeCursor 共用的离屏通道: 速度 (自平流, 拖拽, 上漂, 旋度噪声湍流, 线段溅点按 flow 并入), 散度, 压力 Jacobi,
 * 染料 (单遍 MacCormack 近似: 前向取样加一半往返误差, 夹到邻域内; 三通道各自按保留率衰减, 溅点补色).
 * 速度单位为模拟格每秒, 按范围编码 (内核退到 RGBA8 时也能存). project 关时不做压力投影 (HazeCursor 的烟雾场).
 *
 * .agents/notes/implemented/feature/2026-11-10-surface-cursor.md
 */
import { fragmentSource, GLSL_HASH, GLSL_NOISE, GLSL_UTIL } from "../../backdrop/kernel/glsl";
import { CURSOR_FLUID } from "../tokens";

const N = CURSOR_FLUID.maxSplats;

function codec(project: boolean): string {
  return `
const float VR = ${CURSOR_FLUID.velocityRange.toFixed(1)};
const float PR = ${CURSOR_FLUID.pressureRange.toFixed(1)};
vec2 decV(vec4 c) { return (c.xy - 0.5) * 2.0 * VR; }
vec4 encV(vec2 v) { return vec4(clamp(0.5 + v / (2.0 * VR), 0.0, 1.0), 0.0, 1.0); }
float decP(vec4 c) { return (c.r - 0.5) * 2.0 * PR; }
vec4 encP(float p) { return vec4(clamp(0.5 + p / (2.0 * PR), 0.0, 1.0), 0.0, 0.0, 1.0); }
${project ? "uniform sampler2D u_press;" : ""}
vec2 velAt(vec2 uv) {
${project ? `  vec2 px = 1.0 / vec2(textureSize(u_press, 0));
  float l = decP(texture(u_press, uv - vec2(px.x, 0.0)));
  float r = decP(texture(u_press, uv + vec2(px.x, 0.0)));
  float d = decP(texture(u_press, uv - vec2(0.0, px.y)));
  float u = decP(texture(u_press, uv + vec2(0.0, px.y)));
  return decV(texture(u_vel, uv)) - 0.5 * vec2(r - l, u - d);` : "  return decV(texture(u_vel, uv));"}
}
`;
}

const SPLATS = `
uniform vec4 u_splat_seg[${N}];
uniform vec4 u_splat_vel[${N}];
uniform vec4 u_splat_dye[${N}];
uniform float u_splat_count;
uniform float u_aspect;
vec2 splatDelta(vec2 uv, vec4 seg) {
  vec2 a = seg.xy;
  vec2 b = seg.zw;
  vec2 ab = (b - a) * vec2(u_aspect, 1.0);
  vec2 ap = (uv - a) * vec2(u_aspect, 1.0);
  float h = clamp(dot(ap, ab) / max(dot(ab, ab), 1e-9), 0.0, 1.0);
  return ap - ab * h;
}
float splatWeight(vec2 d, float r) { return exp(-dot(d, d) / max(r * r, 1e-8)); }
`;

/** 速度通道. project 为 true 时读 u_press 做投影 (投影滞后一帧). */
export function fluidVelocityPass(project: boolean): string {
  return fragmentSource(`
uniform vec2 u_target_res;
uniform sampler2D u_vel;
uniform float u_dt;
uniform float u_drag;
uniform float u_lift;
uniform float u_turb;
uniform float u_detail;
uniform float u_flow;
${codec(project)}
${SPLATS}
void main() {
  vec2 px = 1.0 / u_target_res;
  vec2 v = velAt(v_uv);
  vec2 nv = velAt(v_uv - u_dt * v * px) * u_drag;
  nv.y += u_lift;
  if (u_turb > 0.0) {
    vec2 q = v_uv * vec2(u_aspect, 1.0) * 4.0 * u_detail + vec2(0.0, u_time * 0.3);
    float e = 0.05;
    float n0 = hx_vnoise(q);
    vec2 curl = vec2(hx_vnoise(q + vec2(0.0, e)) - n0, -(hx_vnoise(q + vec2(e, 0.0)) - n0)) / e;
    nv += curl * u_turb * u_dt;
  }
  for (int i = 0; i < ${N}; i++) {
    if (float(i) >= u_splat_count) break;
    vec4 sv = u_splat_vel[i];
    vec2 d = splatDelta(v_uv, u_splat_seg[i]);
    float w = splatWeight(d, sv.z);
    vec2 target = sv.w > 0.5 ? d / max(length(d), 1e-4) * sv.x : sv.xy;
    nv = mix(nv, sv.w > 0.5 ? nv + target : target, clamp(w * u_flow, 0.0, 1.0));
  }
  o_color = encV(nv);
}
`, GLSL_HASH, GLSL_NOISE, GLSL_UTIL);
}

/** 散度通道. */
export const FLUID_DIVERGENCE_PASS = fragmentSource(`
uniform vec2 u_target_res;
uniform sampler2D u_vel;
${codec(false)}
void main() {
  vec2 px = 1.0 / vec2(textureSize(u_vel, 0));
  float l = decV(texture(u_vel, v_uv - vec2(px.x, 0.0))).x;
  float r = decV(texture(u_vel, v_uv + vec2(px.x, 0.0))).x;
  float d = decV(texture(u_vel, v_uv - vec2(0.0, px.y))).y;
  float u = decV(texture(u_vel, v_uv + vec2(0.0, px.y))).y;
  o_color = encP(0.5 * (r - l + u - d));
}
`);

/** 压力通道: Jacobi; 第一次迭代把上一帧的解乘 u_keep 热启动. */
export const FLUID_PRESSURE_PASS = fragmentSource(`
uniform vec2 u_target_res;
uniform sampler2D u_div;
uniform float u_keep;
uniform sampler2D u_vel;
${codec(true)}
void main() {
  vec2 px = 1.0 / u_target_res;
  float l = decP(texture(u_press, v_uv - vec2(px.x, 0.0)));
  float r = decP(texture(u_press, v_uv + vec2(px.x, 0.0)));
  float d = decP(texture(u_press, v_uv - vec2(0.0, px.y)));
  float u = decP(texture(u_press, v_uv + vec2(0.0, px.y)));
  float div = decP(texture(u_div, v_uv));
  o_color = encP((l + r + d + u) * u_keep * 0.25 - div * 0.25);
}
`);

/** 染料通道: 三通道各按 u_keep 衰减, 单遍 MacCormack 近似 (u_mac 为修正量 0..1), 溅点补色. */
export function fluidDyePass(project: boolean): string {
  return fragmentSource(`
uniform vec2 u_target_res;
uniform sampler2D u_dye;
uniform sampler2D u_vel;
uniform float u_dt;
uniform vec3 u_keep;
uniform vec2 u_sim_px;
uniform float u_mac;
${codec(project)}
${SPLATS}
void main() {
  vec2 v = velAt(v_uv);
  vec2 p1 = v_uv - u_dt * v * u_sim_px;
  vec3 c1 = texture(u_dye, p1).rgb;
  vec2 back = p1 + u_dt * velAt(p1) * u_sim_px;
  vec3 err = (texture(u_dye, v_uv).rgb - texture(u_dye, back).rgb) * 0.5;
  vec2 dpx = 1.0 / u_target_res;
  vec3 a = texture(u_dye, p1 + vec2(dpx.x, 0.0)).rgb;
  vec3 b = texture(u_dye, p1 - vec2(dpx.x, 0.0)).rgb;
  vec3 c = texture(u_dye, p1 + vec2(0.0, dpx.y)).rgb;
  vec3 d = texture(u_dye, p1 - vec2(0.0, dpx.y)).rgb;
  vec3 lo = min(min(min(a, b), min(c, d)), c1);
  vec3 hi = max(max(max(a, b), max(c, d)), c1);
  vec3 col = clamp(c1 + err * u_mac, lo, hi) * u_keep;
  for (int i = 0; i < ${N}; i++) {
    if (float(i) >= u_splat_count) break;
    vec2 dd = splatDelta(v_uv, u_splat_seg[i]);
    col += u_splat_dye[i].rgb * splatWeight(dd, u_splat_vel[i].z);
  }
  o_color = vec4(max(col, 0.0), 1.0);
}
`);
}
