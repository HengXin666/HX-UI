// 行为规格参照 docs/research/catalog/backgrounds-1.md 的 GradientWaves 条目, 实现为 HX 自有.
import { fragmentSource, GLSL_HASH, GLSL_NOISE, GLSL_UTIL } from "../../backdrop/kernel/glsl";
import { GLOW_GLSL } from "./glow-kit";

/** 同时生效的点击涌浪上限 (规格 MAX_SWELLS): 读 u_taps 最近 4 次. */
export const GRADIENT_WAVES_MAX_SWELLS = 4;
/** 涌浪寿命秒 (规格 SWELL_SECONDS). */
export const GRADIENT_WAVES_SWELL_SECONDS = 3.2;
/** 涌浪隆起高度, 以 amplitude 为单位 (规格 SWELL_GAIN). */
export const GRADIENT_WAVES_SWELL_GAIN = 2.8;
/** 涌浪环的宽度, 世界单位 (规格 SWELL_WIDTH). */
export const GRADIENT_WAVES_SWELL_WIDTH = 8;
/** 入场时长秒 (规格 INTRO_SECONDS). */
export const GRADIENT_WAVES_INTRO_SECONDS = 2.6;
/** 相机离平均水面的高度, 世界单位 (规格 CAMERA_HEIGHT), 对应 height prop 的默认 5.5. */
export const GRADIENT_WAVES_CAMERA_HEIGHT = 30;
/** 三档质量对应的步进次数上限 (规格 QUALITY). */
export const GRADIENT_WAVES_QUALITY = { low: 56, medium: 84, high: 120 } as const;
/** 视线最远距离, 世界单位 (规格 FAR). */
export const GRADIENT_WAVES_FAR = 4000;
/** 视角跟随指针的时间常数秒 (规格 exp(-dt / 0.45)). */
export const GRADIENT_WAVES_LOOK_TAU = 0.45;
/** 浪向转向的时间常数秒 (规格 exp(-dt / 0.6)). */
export const GRADIENT_WAVES_STEER_TAU = 0.6;
/** 涌浪环外扩速度, 世界单位每秒 (本库定). */
export const GRADIENT_WAVES_SWELL_SPEED = 22;

const MAX_STEPS = GRADIENT_WAVES_QUALITY.high;

const BODY = `
uniform vec3 u_horizon;
uniform vec3 u_wave;
uniform vec3 u_crest;
uniform vec3 u_bg;
uniform float u_bg_on;
uniform float u_amp;
uniform float u_wave_k;
uniform float u_ratio;
uniform float u_swell_amt;
uniform float u_turb;
uniform float u_top;
uniform float u_eye;
uniform float u_pitch;
uniform float u_focal;
uniform vec2 u_look;
uniform float u_steer;
uniform float u_fog;
uniform float u_relief;
uniform vec3 u_light_dir;
uniform float u_sheen;
uniform float u_bright;
uniform float u_steps;
uniform vec3 u_intro;

const float FAR = ${GRADIENT_WAVES_FAR}.0;
vec4 g_sw[${GRADIENT_WAVES_MAX_SWELLS}];
vec3 g_eye;
vec3 g_fwd;
vec3 g_right;
vec3 g_up;

vec3 viewRay(vec2 p) {
  return normalize(g_fwd * u_focal + g_right * p.x + g_up * p.y);
}

float field(vec2 p) {
  float t = u_time * 2.0;
  vec2 q = hx_rot(u_steer) * vec2(p.x * u_ratio, p.y);
  float k = u_wave_k;
  float h = sin(q.y * k + t * 1.1) * 0.5;
  h += sin(dot(q, vec2(0.6, 0.8)) * k * 1.7 - t * 1.4 + 1.3) * 0.28;
  h += sin(dot(q, vec2(-0.7, 0.7)) * k * 2.9 + t * 1.9) * 0.14;
  h += u_swell_amt * sin(q.y * k * 0.38 + t * 0.6 + sin(q.x * k * 0.21));
  h += u_turb * (hx_vnoise(q * k * 1.6 + vec2(t * 0.5, -t * 0.8)) - 0.5) * 1.2;
  return h * u_amp;
}

float swells(vec2 p) {
  float h = 0.0;
  for (int i = 0; i < ${GRADIENT_WAVES_MAX_SWELLS}; i++) {
    vec4 s = g_sw[i];
    if (s.w < 0.5) continue;
    float ring = (length(p - s.xy) - s.z * ${GRADIENT_WAVES_SWELL_SPEED}.0) / ${GRADIENT_WAVES_SWELL_WIDTH}.0;
    float life = 1.0 - s.z / ${GRADIENT_WAVES_SWELL_SECONDS};
    h += ${GRADIENT_WAVES_SWELL_GAIN} * u_amp * life * life * exp(-ring * ring);
  }
  return h;
}

float surface(vec2 xy) {
  float d = length(xy - g_eye.xz);
  float rise = 1.0;
  if (u_intro.z > 0.0) rise = mix(1.0, smoothstep(u_intro.y * 0.45, u_intro.y * 1.6, d), u_intro.z);
  return field(xy) * rise + swells(xy);
}

void collectSwells() {
  int n = 0;
  for (int i = 0; i < ${GRADIENT_WAVES_MAX_SWELLS}; i++) g_sw[i] = vec4(0.0);
  for (int k = 0; k < 8; k++) {
    if (float(k) >= u_tap_count) break;
    if (float(k) < u_tap_count - ${GRADIENT_WAVES_MAX_SWELLS}.0) continue;
    vec4 tap = u_taps[k];
    if (tap.z > ${GRADIENT_WAVES_SWELL_SECONDS}) continue;
    vec3 rd = viewRay((tap.xy - 0.5) * u_res / min(u_res.x, u_res.y));
    if (rd.y > -1e-3 || n >= ${GRADIENT_WAVES_MAX_SWELLS}) continue;
    vec3 hit = g_eye + rd * (g_eye.y / -rd.y);
    g_sw[n] = vec4(hit.xz, tap.z, 1.0);
    n++;
  }
}

void main() {
  vec2 frag = gl_FragCoord.xy;
  float pd = u_pitch + u_look.y;
  g_eye = vec3(0.0, u_eye, 0.0);
  g_fwd = vec3(sin(u_look.x) * cos(pd), -sin(pd), -cos(u_look.x) * cos(pd));
  g_right = normalize(cross(g_fwd, vec3(0.0, 1.0, 0.0)));
  g_up = cross(g_right, g_fwd);
  collectSwells();
  vec3 rd = viewRay(hx_centered(frag));
  vec3 col = u_horizon * 0.85 * u_bright;
  float density = 0.5 * exp(-max(rd.y, 0.0) * 6.0);
  if (rd.y < 0.0) {
    float t = max((g_eye.y - u_top) / -rd.y, 0.0);
    float prev = t;
    bool hit = false;
    for (int i = 0; i < ${MAX_STEPS}; i++) {
      if (float(i) >= u_steps || t > FAR) break;
      vec3 pos = g_eye + rd * t;
      float gap = pos.y - surface(pos.xz);
      if (gap < 0.0) { hit = true; break; }
      prev = t;
      t += gap * 0.5 / max(-rd.y, 0.15) + t * 0.003 + 0.02;
    }
    if (hit) {
      for (int j = 0; j < 5; j++) {
        float mid = 0.5 * (prev + t);
        vec3 pos = g_eye + rd * mid;
        if (pos.y < surface(pos.xz)) t = mid; else prev = mid;
      }
    }
    float dist = min(t, FAR);
    vec3 pos = g_eye + rd * dist;
    float h = surface(pos.xz);
    float e = 0.15 + dist * 0.002;
    vec3 n = normalize(vec3(h - surface(pos.xz + vec2(e, 0.0)), e, h - surface(pos.xz + vec2(0.0, e))));
    float crest = clamp(h / max(u_top, 1e-3) * 0.5 + 0.5, 0.0, 1.0);
    vec3 body = mix(u_wave, u_crest, smoothstep(0.45, 1.0, crest) * 0.5);
    float diffuse = max(dot(n, u_light_dir), 0.0);
    float spec = pow(max(dot(reflect(rd, n), u_light_dir), 0.0), 40.0);
    float haze = 1.0 - exp(-dist / (u_fog * 5.0));
    float fade = 1.0 - smoothstep(0.35, 1.0, haze);
    vec3 lit = body * (1.0 - 0.35 * u_relief + 0.7 * u_relief * diffuse) + u_crest * spec * u_sheen * fade;
    lit += u_crest * smoothstep(0.8, 1.0, crest) * 0.15 * fade;
    col = mix(lit, u_horizon, smoothstep(0.0, 1.0, haze)) * 0.85 * u_bright;
    density = 1.0;
    density *= 1.0 - 0.5 * smoothstep(0.0, 1.0, haze);
  }
  vec4 c = glow_finish(col, density, frag);
  o_color = mix(c, vec4(mix(u_bg, c.rgb, c.a), 1.0), u_bg_on);
}
`;

/** GradientWaves 的上屏程序. */
export const GRADIENT_WAVES_FRAGMENT = fragmentSource(BODY, GLSL_HASH, GLSL_NOISE, GLSL_UTIL, GLOW_GLSL);
