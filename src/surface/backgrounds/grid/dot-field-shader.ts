// 行为规格参照 docs/research/catalog/backgrounds-1.md 的 DotField 条目, 实现为 HX 自有.
import { fragmentSource, GLSL_HASH, GLSL_UTIL } from "../../backdrop/kernel/glsl";

/** 点阵排布到着色器枚举. */
export const DOT_PATTERNS = { grid: 0, hex: 1, spiral: 2, scatter: 3 } as const;
export type DotPattern = keyof typeof DOT_PATTERNS;

/** 黄金角 (弧度), 螺旋排布每圈起点错开它, 圈与圈的点不对齐. */
export const GOLDEN_ANGLE = Math.PI * (3 - Math.sqrt(5));

/**
 * 点阵场. 坐标全部用 CSS 像素 (gl_FragCoord / u_dpr), 半径与间距 prop 直接对应屏幕尺寸.
 * 指针处是一面透镜: 采样点向指针收拢 (放大), 可带扭转, 点在透镜里变大并染上光色.
 */
const BODY = `
uniform vec3 u_from;
uniform vec3 u_to;
uniform vec3 u_glow;
uniform vec2 u_dir;
uniform vec2 u_mouse;
uniform float u_radius;
uniform float u_spacing;
uniform float u_pattern;
uniform float u_cursor;
uniform float u_bulge;
uniform float u_twist;
uniform float u_glow_radius;
uniform float u_glow_strength;
uniform float u_base;
uniform float u_wave;
uniform float u_sparkle;
uniform float u_focus;
uniform float u_lens;
uniform float u_zoom;
uniform float u_light;
const float GOLDEN = ${GOLDEN_ANGLE.toFixed(8)};

// 最近点的中心与编号. 六角与散点要看相邻格, 螺旋看相邻三圈.
vec2 grid_dot(vec2 p, float s, out vec2 id) { id = floor(p / s + 0.5); return id * s; }
vec2 hex_dot(vec2 p, float s, out vec2 id) {
  float h = s * 0.8660254;
  float row = floor(p.y / h + 0.5);
  vec2 best = vec2(1e9);
  for (float k = -1.0; k <= 1.0; k += 1.0) {
    float r = row + k;
    float shift = mod(r, 2.0) * 0.5 * s;
    float col = floor((p.x - shift) / s + 0.5);
    vec2 c = vec2(col * s + shift, r * h);
    if (dot(p - c, p - c) < dot(p - best, p - best)) { best = c; id = vec2(col, r); }
  }
  return best;
}
vec2 scatter_dot(vec2 p, float s, out vec2 id) {
  vec2 cell = floor(p / s);
  vec2 best = vec2(1e9);
  for (int j = -1; j <= 1; j++) for (int i = -1; i <= 1; i++) {
    vec2 n = cell + vec2(float(i), float(j));
    vec2 c = (n + 0.5 + (hx_hash22(n) - 0.5) * 0.7) * s;
    if (dot(p - c, p - c) < dot(p - best, p - best)) { best = c; id = n; }
  }
  return best;
}
vec2 spiral_dot(vec2 p, vec2 center, float s, out vec2 id) {
  vec2 d = p - center;
  float r = length(d);
  float a = atan(d.y, d.x);
  float ring = floor(r / s + 0.5);
  vec2 best = vec2(1e9);
  for (float k = -1.0; k <= 1.0; k += 1.0) {
    float n = max(ring + k, 0.0);
    float count = max(1.0, floor(HX_TAU * n));
    float step = HX_TAU / count;
    float off = n * GOLDEN;
    float j = floor((a - off) / step + 0.5);
    float th = off + j * step;
    vec2 c = center + n * s * vec2(cos(th), sin(th));
    if (dot(p - c, p - c) < dot(p - best, p - best)) { best = c; id = vec2(mod(j, count), n); }
  }
  return best;
}
vec2 nearest_dot(vec2 p, vec2 center, float s, out vec2 id) {
  if (u_pattern < 0.5) return grid_dot(p, s, id);
  if (u_pattern < 1.5) return hex_dot(p, s, id);
  if (u_pattern < 2.5) return spiral_dot(p, center, s, id);
  return scatter_dot(p, s, id);
}

void main() {
  vec2 css = u_res / u_dpr;
  vec2 p = gl_FragCoord.xy / u_dpr;
  vec2 d = p - u_mouse;
  float lens = u_lens * exp(-dot(d, d) / max(u_cursor * u_cursor, 1.0));
  float k = u_bulge * (1.0 + u_zoom) * lens;
  vec2 q = u_mouse + hx_rot(u_twist * lens) * d / (1.0 + k);
  vec2 id;
  vec2 c = nearest_dot(q, 0.5 * css, u_spacing, id);
  float seed = hx_hash2(id + 0.37);
  float phase = 0.5 + 0.5 * sin(u_time * (0.55 + seed * 0.9) + hx_hash2(id + 7.1) * HX_TAU);
  float wave = 1.0 + u_wave * 0.5 * sin(dot(c, vec2(0.021, 0.013)) - u_time * 1.5);
  float spark = u_sparkle * pow(phase, 8.0);
  float grow = 1.0 + k;
  float radius = u_radius * wave * mix(1.0, grow, 0.5) * mix(0.6, 1.0, u_focus);
  float dist = length(q - c) * grow;
  float edge = 1.0 / u_dpr;
  float cover = 1.0 - smoothstep(-0.5 * edge, 0.5 * edge, dist - radius);
  vec2 uv = p / css - 0.5;
  float t = clamp(0.5 + dot(uv, u_dir) / (abs(u_dir.x) + abs(u_dir.y)), 0.0, 1.0);
  vec3 tone = mix(u_from, u_to, t);
  float halo = u_glow_strength * u_lens * exp(-dot(d, d) / max(u_glow_radius * u_glow_radius, 1.0));
  vec3 lit = mix(tone, u_glow, clamp(halo, 0.0, 1.0) * (1.0 - u_light));
  lit = mix(lit, tone * 0.55, clamp(halo, 0.0, 1.0) * u_light);
  float pool = clamp(max(halo, spark), 0.0, 1.0);
  float alpha = mix(min(u_base * (0.85 + 0.15 * phase), 1.0), 1.0, pool) * smoothstep(0.0, 0.25, u_focus + 0.08);
  o_color = vec4(lit, cover * alpha);
}
`;

/** DotField 的完整片元源码. */
export const DOT_FIELD_FRAGMENT = fragmentSource(BODY, GLSL_HASH, GLSL_UTIL);
