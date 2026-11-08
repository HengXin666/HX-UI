// 行为规格参照 docs/research/catalog/backgrounds-1.md 的 LightRays 条目, 实现为 HX 自有.
import { fragmentSource, GLSL_HASH, GLSL_NOISE, GLSL_UTIL } from "../../backdrop/kernel/glsl";
import { RAYS_COMPOSE } from "./field";

/** LightRays 的命名常数. 括号里是条目原名或 "本库定". */
export const LIGHT_RAYS = {
  /** 像素预算 (PIXEL_BUDGET). */
  pixelBudget: 2.4e6,
  /** 同时可见的点击脉冲 (MAX_PULSES). */
  maxPulses: 4,
  /** 开场时长 秒 (opening + dt / 1.8). */
  openSeconds: 1.8,
  /** 光束转向时间常数 秒 (steer = 1 - exp(-dt / 0.2)). */
  steerTau: 0.2,
  /** 指针影子跟手时间常数 秒 (glide = 1 - exp(-dt / 0.08)). */
  glideTau: 0.08,
  /** 影子出现 / 消退时间常数 秒 (0.25 / 0.5). */
  shadeInTau: 0.25,
  shadeOutTau: 0.5,
  /** 减弱动效时的时钟倍率 (reduced ? 0.35 : 1); 内核减弱动效只画一帧, 此值只记规格. */
  reducedRate: 0.35,
} as const;

const BODY = `
uniform vec3 u_color;
uniform vec2 u_source;
uniform vec2 u_aim;
uniform float u_rate;
uniform float u_spread;
uniform float u_length;
uniform float u_density;
uniform float u_sharp;
uniform float u_glow;
uniform float u_haze;
uniform float u_atmo;
uniform float u_intensity;
uniform float u_pulsate;
uniform float u_sat;
uniform float u_noise;
uniform float u_distort;
uniform vec3 u_shade;
uniform vec2 u_intro;
uniform float u_pulse_on;

const float EPS = 0.0001;
const float PULSE_LIFE = 1.6;
const int MAX_PULSES = 4;
const int TAP_SLOTS = 8;

float strands(float ang, float t) {
  float strength = 0.6 * hx_vnoise(vec2(ang * 24.0 * u_density, t * 0.25)) + 0.4 * hx_vnoise(vec2(ang * 57.0 * u_density + 3.0, t * 0.4));
  float edge = 0.18 * (1.0 - u_sharp) + 0.02;
  return mix(strength, smoothstep(0.62 - edge, 0.62 + edge, strength), u_sharp);
}

void main() {
  float t = u_time * u_rate;
  vec2 asp = u_res / min(u_res.x, u_res.y);
  vec2 p = v_uv * asp;
  vec2 s = u_source * asp;
  vec2 d = p - s;
  float depth = length(d);
  vec2 dir = d / max(depth, EPS);
  vec2 aim = normalize(u_aim + vec2(EPS, 0.0));
  float cosAngle = dot(dir, aim);
  float ang = atan(dir.y * aim.x - dir.x * aim.y, cosAngle);
  ang += u_distort * 0.15 * sin(depth * 6.0 - t);
  float width = u_spread * 1.1 + 0.05;
  float cone = exp(-pow(ang / width, 2.0)) * step(0.0, cosAngle + 0.3);

  float reach = exp(-depth / max(u_length * 0.45, EPS));
  float light = strands(ang, t) * cone * reach;
  float glowLight = u_glow * exp(-depth * 5.0) * smoothstep(-0.2, 0.6, cosAngle);

  vec2 drift = p + vec2(t * 0.03, t * 0.01);
  float fog = 0.65 * hx_vnoise(drift * vec2(3.0, 1.0)) + 0.35 * hx_vnoise(drift * vec2(7.0, 2.3) + 4.1);
  float haze = u_haze * u_atmo * fog * cone * mix(1.0, reach, 0.5) * 0.6;

  float boost = 0.0;
  int shown = 0;
  for (int i = TAP_SLOTS - 1; i >= 0; i--) {
    if (float(i) >= u_tap_count || u_pulse_on < 0.5) continue;
    float age = u_taps[i].z;
    if (age > PULSE_LIFE || shown >= MAX_PULSES) continue;
    shown++;
    float front = age * 1.4;
    boost += exp(-pow((depth - front) / 0.09, 2.0)) * (1.0 - age / PULSE_LIFE) * cone;
  }

  vec2 m = u_shade.xy * asp;
  vec2 toM = m - s;
  float lenM = max(length(toM), EPS);
  vec2 axis = toM / lenM;
  float along = dot(d, axis) / lenM;
  float side = abs(dot(d, vec2(-axis.y, axis.x)));
  float trail = max(along - 1.0, 0.0) * lenM;
  float sw = 0.04 + 0.08 * trail;
  float behind = smoothstep(0.97, 1.25, along) * exp(-trail * 1.1);
  float shade = (1.0 - smoothstep(sw * 0.3, sw * 1.6, side)) * behind * u_shade.z;

  float reveal = u_intensity * u_intro.y * (1.0 - smoothstep(u_intro.x - 0.35, u_intro.x, depth));
  float pulse = 1.0 + u_pulsate * 0.25 * sin(t * 2.0);
  float energy = (light * 1.4 + haze + glowLight + boost * 0.8) * reveal * pulse * (1.0 - 0.8 * shade);
  energy *= rays_edge(v_uv);
  energy += hx_grain(v_uv * u_res, t) * u_noise * 0.15 * energy;
  o_color = rays_compose(rays_saturate(u_color, u_sat) * max(energy, 0.0));
}
`;

/** LightRays 的上屏片元: 角向噪声成束 + 尖锐阈值 0.62, 源头辉光, 雾气, 指针影子, 点击外扩脉冲. */
export const LIGHT_RAYS_FRAGMENT = fragmentSource(BODY, GLSL_HASH, GLSL_NOISE, GLSL_UTIL, RAYS_COMPOSE);
