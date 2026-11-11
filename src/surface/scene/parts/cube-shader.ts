// 行为规格参照 docs/research/catalog/animations.md 的 Cubes 条目, 实现为 HX 自有.
/**
 * CubeField 的上屏片元 (一遍): 方阵 n x n 块方块, 每像素对所在格与 8 个邻格的方块做射线与旋转盒求交 (方块绕 x / y 倾斜,
 * 可能伸进邻格), 取最近的命中; 面按兰伯特打光 (shading), 边线按 solid / dashed / dotted / none 画在命中面上,
 * 掠射面上的边线按规格 smoothstep(0.06, 0.28, |n.z|) 收掉; 涟漪发亮混入 rippleColor. perspective 为 0 时正交俯视.
 * 坐标: 以格为单位, 原点在网格中心, y 朝上. 每块状态从 RGBA8 数据纹理 u_cube_tex 取 (packCubes 的 16 位编码).
 *
 * .agents/notes/implemented/feature/2026-11-10-surface-scene.md
 */
import { fragmentSource, GLSL_HASH, GLSL_UTIL } from "../../backdrop/kernel/glsl";

export const CUBE_FRAGMENT = fragmentSource(`
uniform sampler2D u_cube_tex;
float hi16(vec2 b) { return (floor(b.x * 255.0 + 0.5) * 256.0 + floor(b.y * 255.0 + 0.5)) / 65535.0; }
vec4 cubeAt(vec2 g) {
  vec4 a = texelFetch(u_cube_tex, ivec2(int(g.x) * 2, int(g.y)), 0);
  vec4 b = texelFetch(u_cube_tex, ivec2(int(g.x) * 2 + 1, int(g.y)), 0);
  return vec4((hi16(a.rg) * 2.0 - 1.0) * 3.14159265, (hi16(vec2(a.b, b.r)) * 2.0 - 1.0) * 3.14159265, b.g, b.b);
}
uniform float u_n;
uniform float u_gap;
uniform float u_persp;
uniform vec3 u_face;
uniform vec3 u_edge;
uniform vec3 u_ripple;
uniform float u_edge_width;
uniform float u_style;
uniform float u_face_opacity;
uniform float u_shading;
mat3 rotX(float a) { float c = cos(a); float s = sin(a); return mat3(1.0, 0.0, 0.0, 0.0, c, s, 0.0, -s, c); }
mat3 rotY(float a) { float c = cos(a); float s = sin(a); return mat3(c, 0.0, -s, 0.0, 1.0, 0.0, s, 0.0, c); }
void main() {
  float cellPx = min(u_res.x, u_res.y) / max(u_n, 1.0);
  vec2 q = (gl_FragCoord.xy - 0.5 * u_res) / cellPx;
  float top = 0.5 * (1.0 - u_gap);
  vec3 ro = vec3(q, 4.0);
  vec3 rd = vec3(0.0, 0.0, -1.0);
  if (u_persp > 0.0) {
    ro = vec3(0.0, 0.0, u_n * 1.5 / u_persp);
    rd = normalize(vec3(q, top) - ro);
  }
  float half_n = (u_n - 1.0) * 0.5;
  vec2 base = floor(q + 0.5 + half_n);
  float best = 1e9;
  vec3 hitL = vec3(0.0);
  vec3 nrmL = vec3(0.0);
  mat3 hitR = mat3(1.0);
  float hb = 0.0;
  float glow = 0.0;
  for (int j = -1; j <= 1; j++) {
    for (int i = -1; i <= 1; i++) {
      vec2 g = base + vec2(float(i), float(j));
      if (g.x < 0.0 || g.y < 0.0 || g.x >= u_n || g.y >= u_n) continue;
      vec4 c = cubeAt(g);
      float h = top * c.w;
      if (h <= 0.001) continue;
      vec3 center = vec3(g.x - half_n, g.y - half_n, 0.0);
      mat3 R = rotY(c.y) * rotX(c.x);
      mat3 Rt = transpose(R);
      vec3 o = Rt * (ro - center);
      vec3 d = Rt * rd;
      vec3 inv = 1.0 / (d + vec3(1e-6));
      vec3 t0 = (-vec3(h) - o) * inv;
      vec3 t1 = (vec3(h) - o) * inv;
      vec3 tn = min(t0, t1);
      vec3 tf = max(t0, t1);
      float tmin = max(max(tn.x, tn.y), tn.z);
      float tmax = min(min(tf.x, tf.y), tf.z);
      if (tmax < max(tmin, 0.0) || tmin >= best) continue;
      best = tmin;
      hitL = o + d * tmin;
      nrmL = tn.x >= tn.y && tn.x >= tn.z ? vec3(-sign(d.x), 0.0, 0.0) : tn.y >= tn.z ? vec3(0.0, -sign(d.y), 0.0) : vec3(0.0, 0.0, -sign(d.z));
      hitR = R;
      hb = h;
      glow = c.z;
    }
  }
  if (best > 1e8) { o_color = vec4(0.0); return; }
  vec3 nw = hitR * nrmL;
  vec3 a = abs(hitL);
  vec2 other = abs(nrmL.x) > 0.5 ? a.yz : abs(nrmL.y) > 0.5 ? a.xz : a.xy;
  vec2 otherSigned = abs(nrmL.x) > 0.5 ? hitL.yz : abs(nrmL.y) > 0.5 ? hitL.xz : hitL.xy;
  vec2 gapTo = vec2(hb) - other;
  float e = min(gapTo.x, gapTo.y);
  float along = (gapTo.x < gapTo.y ? otherSigned.y : otherSigned.x) / (2.0 * hb) + 0.5;
  float dpx = e * cellPx;
  float hw = u_edge_width * 0.5 * u_dpr;
  float cover = 1.0 - smoothstep(hw - 0.5, hw + 0.5, dpx);
  if (u_style > 0.5 && u_style < 1.5) {
    float offset = abs(fract(along * 4.0) - 0.5);
    float stp = 0.04;
    cover *= 1.0 - smoothstep(0.25 - stp, 0.25 + stp, offset);
  } else if (u_style > 1.5 && u_style < 2.5) {
    float seg = 2.0 * hb * cellPx / 5.0;
    float dd = length(vec2(dpx, (fract(along * 5.0) - 0.5) * seg));
    float radius = max(hw * 1.6, 1.0);
    cover = 1.0 - smoothstep(radius - 0.75, radius + 0.75, dd);
  } else if (u_style > 2.5) {
    cover = 0.0;
  }
  cover *= smoothstep(0.06, 0.28, abs(nw.z));
  vec3 L = normalize(vec3(-0.4, 0.55, 1.0));
  float lambert = max(dot(nw, L), 0.0);
  vec3 face = u_face * (1.0 - u_shading + u_shading * lambert);
  face = mix(face, u_ripple, clamp(glow, 0.0, 1.0) * 0.7);
  vec3 edge = mix(u_edge, u_ripple, clamp(glow, 0.0, 1.0));
  o_color = vec4(mix(face, edge, cover), max(u_face_opacity, cover));
}
`, GLSL_HASH, GLSL_UTIL);
