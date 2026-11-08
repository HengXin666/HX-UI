// 行为规格参照 docs/research/catalog/backgrounds-1.md 的 AcidSquares 条目, 实现为 HX 自有.
import { fragmentSource, GLSL_HASH } from "../../backdrop/kernel/glsl";
import { ACID_SQUARES } from "./acid-squares-motion";

/**
 * 方柱阵列. 地面 xz, 一格边长 1, 柱子向下无底; 每格柱顶高度 = 三列正弦波 + 脉冲环 + 点击涟漪 + 悬停压 / 抬 + 入场隆起,
 * 未揭开的格沉到底面之下. 视线从柱顶上方的平面切入, 每步只看所在格的柱子 (柱子不越格),
 * 步长取 "到本格柱子的距离" 与 "走出本格的距离" 中较小者; 命中后有限差分求法线,
 * 两盏绕场旋转的点光 (按距离 1 / (1 + 0.02 d^2) 衰减) 分光着色, 加 Schlick 菲涅尔与高光.
 */
const BODY = `
uniform vec3 u_base;
uniform vec3 u_accent;
uniform vec3 u_second;
uniform vec3 u_eye;
uniform vec3 u_fwd;
uniform vec3 u_right;
uniform vec3 u_up;
uniform float u_focal;
uniform float u_half;
uniform float u_round;
uniform float u_soft;
uniform float u_bulge;
uniform float u_shape;
uniform float u_gloss;
uniform vec4 u_wave;      // x 波幅, y 空间频率, z 波时钟, w 最高柱顶
uniform vec4 u_pulse;     // x 强度, y 环距, z 环宽, w 相位
uniform float u_pulse_origin;
uniform vec4 u_hover;     // xy 屏幕悬停点, z 在场, w 按下 (+1) / 抬起 (-1)
uniform vec4 u_reveal;    // x 前沿格数, y 是否揭完, z 入场隆起, w 灯光时钟
uniform vec2 u_range;
uniform float u_bright;
uniform float u_mono;
uniform float u_steps;
const float LIFE = ${ACID_SQUARES.rippleLife.toFixed(2)};
const float RSPEED = ${ACID_SQUARES.rippleSpeed.toFixed(2)};

float smoother(float x) { x = clamp(x, 0.0, 1.0); return x * x * x * (x * (x * 6.0 - 15.0) + 10.0); }

vec3 view_ray(vec2 uv) {
  vec2 s = (uv * 2.0 - 1.0) * vec2(u_res.x / u_res.y, 1.0);
  return normalize(u_fwd * u_focal + u_right * s.x + u_up * s.y);
}

// 屏幕点落到地面 y = 0 上的 xz.
vec2 ground(vec2 uv) {
  vec3 rd = view_ray(uv);
  float t = u_eye.y / max(-rd.y, 1e-3);
  return (u_eye + rd * t).xz;
}

// 格 c 中心的柱顶高度, on 为揭开程度.
float cell_height(vec2 ctr, vec2 spot, vec2 origin, out float on) {
  float d = length(ctr);
  float delay = hx_hash3(vec3(floor(ctr), 7.0)) * 1.1;
  on = max(smoother((u_reveal.x - d - delay) / 1.6), u_reveal.y);
  vec2 q = ctr * 0.35 * u_wave.y;
  float a1 = q.x * 0.9 + q.y * 0.4 + u_wave.z * 1.1;
  float a2 = -q.x * 0.3 + q.y * 1.1 + u_wave.z * 0.8;
  float a3 = (q.x + q.y) * 1.7 - u_wave.z * 1.4;
  float h = (0.55 * sin(a1) + 0.4 * sin(a2) + 0.22 * sin(a3)) * 0.6 * u_wave.x;
  float pd = length(ctr - origin) / max(u_pulse.y * 6.0, 0.5);
  float ring = (fract(pd - u_pulse.w + 0.5) - 0.5) * u_pulse.y * 6.0;
  h += u_pulse.x * 0.5 * exp(-ring * ring / max(u_pulse.z * u_pulse.z * 0.8, 1e-3));
  for (int i = 0; i < 8; i++) {
    if (float(i) >= u_tap_count) break;
    vec4 r = u_taps[i];
    if (r.z > LIFE) continue;
    float life = 1.0 - r.z / LIFE;
    float radius = r.z * RSPEED;
    float x = length(ctr - ground(r.xy)) - radius;
    float strength = r.w * 0.7 * life * life * smoothstep(0.0, 1.5, radius);
    h += strength * sin(x * 2.0) * exp(-x * x * 0.5);
  }
  vec2 hs = ctr - spot;
  h -= u_hover.w * 0.6 * u_hover.z * exp(-dot(hs, hs) / 1.6);
  float sw = d - u_reveal.x * 0.6;
  h += u_reveal.z * exp(-sw * sw / 18.0);
  return mix(-u_wave.w - 4.0, h, on);
}

// 本格柱子的距离场: 截面方 / 圆, 竖边圆角 u_round, 顶边倒角 u_soft, 顶面隆起 u_bulge.
float pillar(vec3 p, vec2 ctr, float h) {
  vec2 l = p.xz - ctr;
  float r = u_round * u_half;
  vec2 q = abs(l) - (u_half - r);
  float dxz = u_shape > 0.5 ? length(l) - u_half : length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - r;
  float top = h + u_bulge * u_half * 0.5 * (1.0 - dot(l, l) / (u_half * u_half * 2.0));
  float k = u_soft * u_half * 0.6;
  vec2 w = vec2(dxz, p.y - top) + k;
  return min(max(w.x, w.y), 0.0) + length(max(w, 0.0)) - k;
}

void main() {
  vec3 rd = view_ray(v_uv);
  vec3 ro = u_eye;
  vec2 spot = ground(u_hover.xy);
  vec2 origin = u_pulse_origin > 0.5 ? spot : vec2(0.0);
  float hmax = u_wave.w;
  float t = ro.y > hmax ? (ro.y - hmax) / max(-rd.y, 1e-4) : 0.0;
  float tEnd = (ro.y + hmax + 4.0) / max(-rd.y, 1e-4);
  vec2 cell = vec2(1e9);
  float h = 0.0, on = 0.0, hit = 0.0;
  for (int i = 0; i < 96; i++) {
    if (float(i) >= u_steps || t > tEnd) break;
    vec3 p = ro + rd * t;
    vec2 c = floor(p.xz);
    if (c != cell) { cell = c; h = cell_height(c + 0.5, spot, origin, on); }
    float d = pillar(p, c + 0.5, h);
    if (d < 0.0015 * t) { hit = 1.0; break; }
    vec2 f = p.xz - c;
    vec2 dir = step(0.0, rd.xz);
    vec2 ex = (dir - f) / ((dir * 2.0 - 1.0) * max(abs(rd.xz), vec2(1e-5)));
    t += min(d * 0.85, min(ex.x, ex.y) + 0.002);
  }
  vec3 p = ro + rd * t;
  float dist = length(p.xz - ground(vec2(0.5)));
  float fade = 1.0 - smoother((dist - u_range.x) / max(u_range.y - u_range.x, 1e-3));
  if (hit < 0.5) { o_color = vec4(u_base * 0.12 * u_bright, fade * 0.85 * on); return; }

  vec2 ctr = cell + 0.5;
  vec2 e = vec2(0.002, 0.0);
  vec3 n = normalize(vec3(
    pillar(p + e.xyy, ctr, h) - pillar(p - e.xyy, ctr, h),
    pillar(p + e.yxy, ctr, h) - pillar(p - e.yxy, ctr, h),
    pillar(p + e.yyx, ctr, h) - pillar(p - e.yyx, ctr, h)));
  vec3 v = -rd;
  float az = 0.8 + u_reveal.w * 0.25;
  vec3 la = vec3(cos(az) * 7.0, 5.0, sin(az) * 7.0);
  vec3 lb = vec3(-cos(az) * 7.0, 3.5, -sin(az) * 7.0);
  float da = length(la - p);
  float db = length(lb - p);
  float fa = 1.0 / (1.0 + da * da * 0.02);
  float fb = 1.0 / (1.0 + db * db * 0.02);
  vec3 l1 = normalize(la - p);
  vec3 l2 = normalize(lb - p);
  vec3 fill = mix(u_second, u_accent, u_mono);
  float ndv = clamp(dot(n, v), 0.0, 1.0);
  float fresnel = 0.04 + 0.96 * pow(1.0 - ndv, 5.0);
  float shin = mix(8.0, 96.0, u_gloss);
  float s1 = pow(max(dot(n, normalize(l1 + v)), 0.0), shin) * u_gloss;
  float s2 = pow(max(dot(n, normalize(l2 + v)), 0.0), shin) * u_gloss;
  vec3 col = u_base * (0.35 + 0.35 * max(n.y, 0.0));
  col += u_accent * max(dot(n, l1), 0.0) * fa * 3.0 + fill * max(dot(n, l2), 0.0) * fb * 2.4;
  col += (u_accent * s1 * fa + fill * s2 * fb) * 3.0;
  col += mix(u_accent, fill, 0.5 + 0.5 * n.x) * fresnel * (0.3 + u_gloss * 0.7);
  vec2 hs = ctr - spot;
  col += u_accent * 0.3 * u_hover.z * abs(u_hover.w) * exp(-dot(hs, hs) / 1.6);
  float footprint = t * 2.0 / (u_focal * u_res.y);
  float crowd = smoothstep(0.08, 0.3, footprint);
  col = mix(col, u_base * 0.5 + (u_accent + fill) * 0.15, crowd * 0.6);
  o_color = vec4(clamp(col * u_bright, 0.0, 1.0), clamp(fade * on, 0.0, 1.0));
}
`;

/** AcidSquares 的完整片元源码. */
export const ACID_SQUARES_FRAGMENT = fragmentSource(BODY, GLSL_HASH);
