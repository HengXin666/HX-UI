// 行为规格参照 docs/research/catalog/backgrounds-1.md 的 GridScan 条目, 实现为 HX 自有.
import { fragmentSource, GLSL_HASH, GLSL_UTIL } from "../../backdrop/kernel/glsl";

/** 规格常数. */
export const GRID_SCAN = {
  /** 同时显示的点击脉冲个数 (取最近几次). */
  maxPings: 4,
  /** 点击脉冲寿命 (秒). */
  pingLife: 2.4,
  /** 入场: 网格由近到远亮起的时长 (秒). */
  introSeconds: 2.2,
  /** 眼睛到隧道口的距离 (隧道半高为 1). */
  eyeDistance: 1.25,
  /** 视差眼位跟随时间常数 (秒). */
  eyeTau: 0.08,
  /** 指针光斑强度跟随时间常数 (秒). */
  hoverTau: 0.25,
} as const;

/** 线型到着色器枚举. */
export const SCAN_LINE_STYLES = { solid: 0, dashed: 1, dotted: 2 } as const;
export type ScanLineStyle = keyof typeof SCAN_LINE_STYLES;

/**
 * 隧道网格. 眼睛在隧道口前 EYE 处, 隧道横截面贴合画面 (半宽 A, 半高 1), 深 u_depth.
 * 每个像素的视线与四壁求交 (超深处落在尽头墙), 壁面坐标上画网格线, 交点处可有闪烁的点;
 * 一道扫描面沿深度推进, 带拖尾; 点击在壁面上打出外扩的环.
 */
const BODY = `
uniform vec3 u_lines;
uniform vec3 u_scan;
uniform vec2 u_eye;
uniform float u_depth;
uniform float u_cells;
uniform float u_thick;
uniform float u_style;
uniform float u_depth_fade;
uniform float u_points;
uniform float u_reflection;
uniform float u_shading;
uniform float u_scan_z;
uniform float u_scan_alpha;
uniform float u_scan_dir;
uniform float u_scan_width;
uniform float u_trail;
uniform float u_glow;
uniform float u_reveal;
uniform float u_hover;
uniform float u_ping;
const float EYE = ${GRID_SCAN.eyeDistance.toFixed(2)};
const float LIFE = ${GRID_SCAN.pingLife.toFixed(2)};

// 视线与隧道求交: 返回命中点, face 0 侧壁, 1 地面 / 顶面, 2 尽头墙.
vec3 hit_tunnel(vec2 uv, vec2 eye, out float face) {
  float a = u_res.x / u_res.y;
  vec2 s = (uv * 2.0 - 1.0) * vec2(a, 1.0);
  vec2 d = s - eye;
  vec2 wall = vec2(a, 1.0);
  float tx = abs(d.x) > 1e-5 ? (sign(d.x) * wall.x - eye.x) / d.x : 1e9;
  float ty = abs(d.y) > 1e-5 ? (sign(d.y) * wall.y - eye.y) / d.y : 1e9;
  float t = min(tx, ty);
  face = tx < ty ? 0.0 : 1.0;
  float z = EYE * (t - 1.0);
  if (z > u_depth) { t = 1.0 + u_depth / EYE; z = u_depth; face = 2.0; }
  return vec3(eye + t * d, z);
}

// 壁面上的二维坐标 (以格计).
vec2 wall_coord(vec3 p, float face, float cell) {
  if (face < 0.5) return vec2(p.z, p.y) / cell;
  if (face < 1.5) return vec2(p.x, p.z) / cell;
  return p.xy / cell;
}

// 网格线覆盖: 线宽按像素, 格子远到挤在一起时退成平均覆盖, 避免摩尔纹.
float grid_cover(vec2 q) {
  vec2 fw = max(fwidth(q), vec2(1e-5));
  vec2 g = abs(fract(q - 0.5) - 0.5) / fw;
  vec2 line = 1.0 - clamp(g / u_thick, 0.0, 1.0);
  vec2 dash = vec2(1.0);
  if (u_style > 0.5 && u_style < 1.5) dash = step(fract(q.yx * 4.0), vec2(0.55));
  if (u_style > 1.5) dash = smoothstep(0.32, 0.18, abs(fract(q.yx * 6.0) - 0.5));
  vec2 dc = fw.yx * 6.0;
  dash = mix(dash, vec2(0.5), smoothstep(0.1, 0.4, dc));
  float cov = max(line.x * dash.x, line.y * dash.y);
  float du = max(fw.x, fw.y);
  float mean = clamp(u_thick * du, 0.0, 1.0);
  return mix(cov, mean, smoothstep(0.1, 0.4, du));
}

void main() {
  float face;
  vec3 p = hit_tunnel(v_uv, u_eye, face);
  float cell = 2.0 / max(u_cells, 1.0);
  vec2 q = wall_coord(p, face, cell);
  float cov = grid_cover(q);
  float lamp = 1.0 / (1.0 + p.z * p.z * 0.9);
  float shade = mix(1.0, lamp, u_shading);
  float fade = exp(-u_depth_fade * 2.0 * p.z / max(u_depth, 0.1));
  float reveal = smoothstep(u_reveal, u_reveal - 0.2, p.z);

  float behind = (u_scan_z - p.z) * u_scan_dir;
  float width = 0.12 * u_scan_width;
  float band = exp(-behind * behind / max(width * width, 1e-4)) * u_scan_alpha;
  float trail = exp(-max(behind, 0.0) / max(u_trail, 0.02)) * smoothstep(-width, width * 0.5, behind) * u_scan_alpha;
  float energy = band + 0.45 * trail;

  float ptrFace;
  vec3 ptr = hit_tunnel(u_pointer.xy, u_eye, ptrFace);
  vec3 dp = p - ptr;
  energy += u_hover * u_pointer.z * exp(-dot(dp, dp) / 0.12) * 0.6;
  for (int i = 0; i < 8; i++) {
    if (u_ping < 0.5 || float(i) >= u_tap_count) break;
    if (float(i) < u_tap_count - ${GRID_SCAN.maxPings}.0) continue;
    vec4 tap = u_taps[i];
    if (tap.z > LIFE) continue;
    float tf;
    vec3 origin = hit_tunnel(tap.xy, u_eye, tf);
    float dist = length(p - origin) - tap.z * 1.4;
    float life = 1.0 - tap.z / LIFE;
    energy += (exp(-dist * dist / 0.004) + exp(min(dist, 0.0) / 0.22) * smoothstep(0.03, -0.03, dist) * 0.25) * life * life;
  }

  float r = hx_hash2(floor(q) + face * 17.0);
  vec2 near = abs(fract(q + 0.5) - 0.5) / max(fwidth(q), vec2(1e-5));
  float spot = 1.0 - smoothstep(u_thick * 1.2, u_thick * 2.4, length(near));
  float gap = 1.0 / max(max(fwidth(q).x, fwidth(q).y), 1e-5);
  float flicker = 0.75 + 0.25 * sin(u_time * (3.0 + r * 5.0) + r * 40.0);
  float dots = u_points * spot * smoothstep(5.0, 10.0, gap) * smoothstep(0.25, 0.6, r) * (0.3 + 0.7 * r * r) * flicker;

  float sheen = 0.0;
  if (face > 0.5 && face < 1.5 && p.y < 0.0) {
    vec3 ray = normalize(p - vec3(u_eye, -EYE));
    float grazing = 1.0 - abs(ray.y);
    sheen = u_reflection * grazing * grazing * (band * 0.8 + trail * 0.3);
  }

  float glowAmt = clamp(energy * (0.5 + u_glow), 0.0, 2.0);
  vec3 col = u_lines * shade * cov;
  col = mix(col, u_scan, clamp(energy * (cov + 0.15 + dots), 0.0, 1.0));
  col += u_scan * (dots * (0.4 + energy) + sheen + glowAmt * 0.5 * u_glow);
  float alpha = clamp((cov * (0.55 + 0.45 * shade) + dots + glowAmt * 0.5 * u_glow + sheen) * fade, 0.0, 1.0) * reveal;
  o_color = vec4(clamp(col * fade * reveal / max(alpha, 1e-3), 0.0, 1.0), alpha);
}
`;

/** GridScan 的完整片元源码. */
export const GRID_SCAN_FRAGMENT = fragmentSource(BODY, GLSL_HASH, GLSL_UTIL);
