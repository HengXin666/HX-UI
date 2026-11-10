// 行为规格参照 docs/research/catalog/animations.md 的 ShapeBlur 条目, 实现为 HX 自有.
/**
 * SoftShape 的上屏片元: 形状的有符号距离 (矩形, 圆, 正多边形的解析式, 或图片的距离场), 描边或填充, 向外的回声描边;
 * 整体按 blur 失焦, 指针处的透镜把它对焦 (focus 反过来: 整体清晰, 透镜处失焦), 三色按当前模糊错开出色散.
 * 失焦是真高斯: 形状遍 -> 横向高斯 -> 纵向高斯 (内核 passes), 上屏在解析的清晰层与失焦层之间按透镜插值.
 * 坐标是设备像素.
 *
 * .agents/notes/implemented/feature/2026-11-10-surface-field.md
 */
import { fragmentSource, GLSL_UTIL, GLSL_HASH } from "../../backdrop/kernel/glsl";
import { SOFT } from "../tokens";
import { SDF_GLSL } from "./sdf";

export const SOFT_SHAPES = { rect: 0, circle: 1, polygon: 2, image: 3 } as const;
export type SoftShapeKind = Exclude<keyof typeof SOFT_SHAPES, "image">;

const SOFT_COMMON = `
uniform vec4 u_shape;
uniform vec2 u_field_half;
uniform float u_has_field;
uniform vec4 u_line;
uniform vec4 u_blur;
uniform vec4 u_lens;
uniform float u_lens_soft;
uniform float u_angle;
uniform vec3 u_color;
${SDF_GLSL}
float sdBox(vec2 p, vec2 b, float r) {
  vec2 q = abs(p) - b + r;
  return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - r;
}
float sdPolygon(vec2 p, float n, float r) {
  float an = HX_PI / n;
  vec2 acs = vec2(cos(an), sin(an));
  float bn = mod(atan(p.x, p.y), 2.0 * an) - an;
  p = length(p) * vec2(cos(bn), abs(sin(bn)));
  p -= r * acs;
  p.y += clamp(-p.y, 0.0, r * acs.y);
  return length(p) * sign(p.x);
}
float shapeDistance(vec2 p) {
  float kind = u_shape.x;
  float half_ = u_shape.z;
  float round = u_shape.w * half_;
  if (kind < 0.5) return sdBox(p, vec2(half_), round);
  if (kind < 1.5) return length(p) - half_;
  if (kind < 2.5) return sdPolygon(p, max(3.0, u_shape.y), half_ - round) - round;
  if (u_has_field < 0.5) return 1e4;
  vec2 fuv = p / (2.0 * u_field_half) + 0.5;
  return u_field_distance(fuv) * (2.0 * u_field_half.x / float(textureSize(u_field, 0).x));
}
float coverage(float d, float w) {
  float hw = u_line.x;
  float aa = u_blur.w;
  float ww = aa + w;
  float a = u_line.y > 0.5 ? 1.0 - smoothstep(-ww, ww, d) : 0.0;
  float peak = (hw + aa) / (hw + ww);
  for (int k = 0; k < ${SOFT.maxEchoes}; k++) {
    if (float(k) >= u_line.z) break;
    float dk = d - float(k) * u_line.w;
    float fade = 1.0 - float(k) / max(u_line.z, 1.0) * 0.6;
    a = max(a, (1.0 - smoothstep(hw - ww, hw + ww, abs(dk))) * peak * fade);
  }
  return a;
}
`;

/** 第一遍: 清晰形状的覆盖, 三通道按最大失焦的色散错开 (r 内缩, b 外扩), 坐标同上屏. */
export const SOFT_SHAPE_PASS = fragmentSource(`
${SOFT_COMMON}
uniform vec2 u_full;
void main() {
  vec2 frag = v_uv * u_full;
  float d = shapeDistance(hx_rot(radians(u_angle)) * (frag - 0.5 * u_full));
  float shift = u_blur.x * u_blur.y * ${SOFT.chromaRatio.toFixed(2)};
  o_color = vec4(coverage(d - shift, 0.0), coverage(d, 0.0), coverage(d + shift, 0.0), 1.0);
}
`, GLSL_HASH, GLSL_UTIL);

/** 一维高斯 (方向 dir, 西格玛 sigma 以源纹理的纹素计), SOFT.taps 个采样点覆盖正负 3 西格玛, 权重归一. */
function blurPass(source: string): string {
  return fragmentSource(`
uniform sampler2D ${source};
uniform vec2 u_dir;
uniform float u_sigma;
void main() {
  vec2 px = u_dir / vec2(textureSize(${source}, 0));
  float sigma = max(u_sigma, 0.5);
  float stride = max(1.0, 6.0 * sigma / float(${SOFT.taps - 1}));
  vec3 acc = vec3(0.0);
  float wsum = 0.0;
  for (int i = 0; i < ${SOFT.taps}; i++) {
    float x = (float(i) - float(${(SOFT.taps - 1) / 2})) * stride;
    float w = exp(-0.5 * x * x / (sigma * sigma));
    acc += texture(${source}, v_uv + px * x).rgb * w;
    wsum += w;
  }
  o_color = vec4(acc / wsum, 1.0);
}
`);
}

/** 第二遍横向, 第三遍纵向 (规格 BLUR 的两遍可分离模糊). */
export const SOFT_BLUR_H = blurPass("u_soft_shape");
export const SOFT_BLUR_V = blurPass("u_soft_h");

export const SOFT_FRAGMENT = fragmentSource(`
${SOFT_COMMON}
uniform sampler2D u_soft_v;
void main() {
  vec2 frag = gl_FragCoord.xy;
  float d = shapeDistance(hx_rot(radians(u_angle)) * (frag - 0.5 * u_res));
  float lens = u_lens.w * (1.0 - smoothstep(u_lens.z * (1.0 - u_lens_soft), u_lens.z, length(frag - u_lens.xy)));
  float t = u_blur.z > 0.5 ? lens : 1.0 - lens;
  // 清晰层是解析的 (满分辨率), 失焦层是 u_soft_v (两遍可分离高斯后的最大失焦, 三通道带色散); 按透镜在两者间插值.
  vec3 blurred = u_blur.x > 0.5 ? texture(u_soft_v, v_uv).rgb : vec3(coverage(d, 0.0));
  vec3 a = mix(vec3(coverage(d, 0.0)), blurred, t);
  float alpha = max(a.r, max(a.g, a.b));
  o_color = vec4(u_color * a / max(alpha, 1e-4), alpha);
}
`, GLSL_HASH, GLSL_UTIL);
