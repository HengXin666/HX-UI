// 行为规格参照 docs/research/catalog/backgrounds-1.md 的 Beams 条目, 实现为 HX 自有.
import { fragmentSource, GLSL_HASH, GLSL_NOISE, GLSL_UTIL } from "../../backdrop/kernel/glsl";
import { RAYS_COMPOSE } from "./field";

/** Beams 的命名常数. 括号里是条目原名或 "本库定". */
export const BEAMS = {
  /** 入场时长 秒 (INTRO_SECONDS). */
  introSeconds: 1.6,
  /** 光源跟手速率 1/秒 (follow = 1 - exp(-dt * 7)). */
  followRate: 7,
  /** 指针在场时的 reach 升速, 离场时的降速 (3.2 / 1.8). */
  reachIn: 3.2,
  reachOut: 1.8,
  /** 场像素预算 (MAX_FIELD_PIXELS), 换成画布最长边上限交给内核. */
  maxFieldPixels: 1_600_000,
} as const;

const BODY = `
uniform vec3 u_color;
uniform float u_width;
uniform float u_turn;
uniform float u_wave;
uniform float u_depth;
uniform float u_sharp;
uniform float u_twist;
uniform float u_fill;
uniform float u_glow;
uniform float u_bright;
uniform float u_var;
uniform float u_grain;
uniform vec3 u_light;
uniform float u_intro;

const float FRESNEL_BASE = 0.028;
const float FRESNEL_SPAN = 0.972;
const float VIS_EPS = 0.0001;

void main() {
  vec2 frag = v_uv * u_res;
  vec2 q = hx_rot(u_turn) * (frag - 0.5 * u_res);
  float across = q.x / max(u_width, 1.0);
  float id = floor(across);
  float f = fract(across) - 0.5;
  float seed = hx_hash1(id + 0.5);
  float along = q.y / max(u_wave, 1.0);
  float rate = 0.6 + u_var * 0.8 * (seed - 0.5);
  float phase = along * HX_TAU + u_time * rate + seed * HX_TAU * u_var;
  float twist = u_twist * sin(along * HX_PI + u_time * 0.3);
  float rough = hx_vnoise(vec2(id * 3.1, along * 2.0 + u_time * 0.2)) - 0.5;
  float slope = clamp(sin(asin(clamp(f * 1.96, -0.98, 0.98)) + twist) * u_depth, -0.98, 0.98);
  float tilt = u_depth * 0.6 * cos(phase) + rough * 0.25 * u_var;
  vec3 local = normalize(vec3(slope, tilt, sqrt(max(1.0 - slope * slope, 0.0))));
  vec3 n = vec3(hx_rot(-u_turn) * local.xy, local.z);

  vec2 here = v_uv;
  vec2 lamp = u_light.xy;
  vec3 l = normalize(vec3((lamp - here) * u_res / min(u_res.x, u_res.y), 0.7));
  vec3 v = vec3(0.0, 0.0, 1.0);
  vec3 h = normalize(l + v);
  float nl = max(dot(n, l), 0.0);
  float nv = max(dot(n, v), 0.0);
  float nh = max(dot(n, h), 0.0);
  float vh = max(dot(v, h), 0.0);
  float a = mix(0.55, 0.035, u_sharp);
  float a2 = a * a;
  float dd = nh * nh * (a2 - 1.0) + 1.0;
  float distribution = a2 / (HX_PI * dd * dd);
  float gv = nl * sqrt(nv * nv * (1.0 - a2) + a2);
  float gvl = nv * sqrt(nl * nl * (1.0 - a2) + a2);
  float visibility = 0.5 / max(gv + gvl, VIS_EPS);
  float fresnel = FRESNEL_BASE + FRESNEL_SPAN * pow(1.0 - vh, 5.0);
  float spec = distribution * visibility * fresnel * nl;

  float pixel = 1.0 / max(u_width, 1.0);
  float seam = 0.5 - abs(f);
  float blend = 1.0 - 0.5 * (1.0 - smoothstep(0.0, pixel * 1.5, seam));
  float diffuse = u_fill * (0.35 + 0.65 * nl) * 0.25;
  float bloom = u_glow * 0.35 * pow(nh, 12.0) * (1.0 + u_light.z);
  float energy = (diffuse + spec * 0.6 + bloom) * blend * u_bright;
  energy *= 0.85 + 0.3 * u_light.z * exp(-4.0 * length((lamp - here) * u_res / min(u_res.x, u_res.y)));

  float sweep = u_intro * 1.6 - 0.3;
  float reveal = smoothstep(sweep, sweep - 0.3, 1.0 - v_uv.y * 0.6 - v_uv.x * 0.4);
  energy *= reveal * rays_edge(v_uv);
  energy += hx_grain(frag, u_time) * u_grain * 0.08 * energy;
  o_color = rays_compose(u_color * max(energy, 0.0));
}
`;

/** Beams 的上屏片元: 平行光束的曲面法线 + GGX 高光 + Schlick 菲涅尔 (0.028 + 0.972 (1 - vh)^5), 光源跟手. */
export const BEAMS_FRAGMENT = fragmentSource(BODY, GLSL_HASH, GLSL_NOISE, GLSL_UTIL, RAYS_COMPOSE);
