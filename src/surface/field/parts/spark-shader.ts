// 行为规格参照 docs/research/catalog/animations.md 的 ElectricLogo 条目, 实现为 HX 自有.
/**
 * SparkMark 的上屏片元: 形状的有符号距离 (两张距离场按逐像素进度形变), 沿轮廓有几股抖动的电弧 (第一股是主弧),
 * 轮廓外偶尔伸出的支弧, 沿轮廓 (按弧长参数图, 见 spark-map) 向两侧跑的脉冲, 形状内一层淡淡的本体光; 光标附近升温 (更亮, 更抖).
 * 能量按 1 - exp(-energy x gain) 合成不透明度. 坐标是设备像素, 原点居中, y 朝上.
 *
 * .agents/notes/implemented/feature/2026-11-10-surface-field.md
 */
import { fragmentSource, GLSL_HASH, GLSL_NOISE, GLSL_UTIL } from "../../backdrop/kernel/glsl";
import { SPARK_MARK } from "../tokens";
import { sdfGlsl } from "./sdf";
import { sparkMapGlsl } from "./spark-map";

export const SPARK_FRAGMENT = fragmentSource(`
uniform vec2 u_half_from;
uniform vec2 u_half_to;
uniform vec2 u_px;
uniform vec2 u_has;
uniform float u_morph;
uniform float u_unit;
uniform vec4 u_look;
uniform vec4 u_arc;
uniform float u_flicker;
uniform vec4 u_hover;
uniform vec4 u_pulses[${SPARK_MARK.pulses}];
uniform vec3 u_core;
uniform vec3 u_glow;
uniform float u_light;
uniform vec2 u_has_map;
uniform vec2 u_perim;
${sdfGlsl("u_from")}
${sdfGlsl("u_to")}
${sparkMapGlsl("u_map_from")}
${sparkMapGlsl("u_map_to")}
float wobble(vec2 p, float s) { return hx_vnoise(p + s * 13.17) * 2.0 - 1.0; }
float wrap(float x) { return x - floor(x + 0.5); }
float glowLine(float d, float w) { return w * w / (d * d + w * w); }
void main() {
  vec2 p = gl_FragCoord.xy - 0.5 * u_res;
  float unit = max(u_unit, 1e-3);
  float t = u_time;
  float to = u_has.y > 0.5 ? u_to_distance(p / (2.0 * u_half_to) + 0.5) * u_px.y : 1e4;
  float from = u_has.x > 0.5 ? u_from_distance(p / (2.0 * u_half_from) + 0.5) * u_px.x : to;
  float k = u_morph >= 1.0 ? 1.0 : smoothstep(0.0, 1.0, clamp(u_morph * 1.7 - 0.35 + 0.35 * wobble(p / unit * 0.018, 41.0), 0.0, 1.0));
  float base = mix(from, to, k);
  vec2 q = p / unit;
  // 沿轮廓的参数: 有轮廓参数图时取弧长 (形变过半换到新图形), 否则退回极角; perim 为该参数下一整圈的设备像素长.
  bool late = k >= 0.5;
  vec2 muv = late ? p / (2.0 * u_half_to) + 0.5 : p / (2.0 * u_half_from) + 0.5;
  bool mapped = late ? u_has_map.y > 0.5 : u_has_map.x > 0.5;
  float ang = mapped ? (late ? u_map_to_param(muv) : u_map_from_param(muv)) : atan(p.y, p.x) / HX_TAU + 0.5;
  float perim = mapped ? (late ? u_perim.y : u_perim.x) : length(p) * HX_TAU;
  vec2 hd = p - u_hover.xy;
  float heat = u_hover.w * exp(-dot(hd, hd) / max(u_hover.z * u_hover.z, 1.0));
  float breath = 1.0 + u_flicker * ${SPARK_MARK.breath.toFixed(1)} * wobble(vec2(t * 2.1, 7.0), 3.0);
  // 辉光: 有参数图时取它 B 通道的预模糊辉光 (两图按形变进度混合, glow 越大铺得越开), 否则按距离场解析衰减.
  vec2 guvF = p / (2.0 * u_half_from) + 0.5;
  vec2 guvT = p / (2.0 * u_half_to) + 0.5;
  float gTo = u_map_to_glow(guvT);
  float gFrom = u_has_map.x > 0.5 ? u_map_from_glow(guvF) : gTo;
  float baked = pow(clamp(mix(gFrom, gTo, k) * 2.0, 0.0, 1.0), 1.0 / max(u_look.y, 0.05));
  float halo = u_has_map.y > 0.5 ? baked : exp(-max(base, 0.0) / max(u_look.y * unit * 6.0, 1e-3));
  float energy = smoothstep(0.75, -0.75, base / unit) * u_look.w * (0.06 + 1.2 * min(halo, 1.0)) * (1.0 + heat * 0.5);
  energy += u_has_map.y > 0.5 ? baked * step(0.0, base) * u_look.y * ${SPARK_MARK.glowGain.toFixed(2)} : 0.0;
  float hot = 0.0;
  float w = u_look.z * unit * 0.35 * (1.0 + heat);
  for (int i = 0; i < ${SPARK_MARK.arcs}; i++) {
    float fi = float(i);
    if (fi >= u_arc.x) break;
    float lead = i == 0 ? 1.0 : 0.0;
    float jag = wobble(q * 0.08 * u_arc.y + vec2(t * 1.3, fi * 7.3), fi) + 0.5 * wobble(q * 0.25 * u_arc.y + vec2(-t * 2.7, fi * 3.1), fi + 11.0);
    float d = abs(base - jag * u_arc.z * (1.0 + heat) * unit * (lead > 0.5 ? 1.2 : 2.5));
    float swell = 0.5 + 0.5 * wobble(q * 0.06 + vec2(t * 0.9, fi * 5.1 - t * 0.6), fi + 8.0);
    float vis = mix(0.3 + 0.45 * smoothstep(-0.25, 0.2, wobble(q * 0.035 + vec2(t * 0.21, fi * 3.7), fi + 5.0)), 1.0, lead);
    float spark = 1.0 - u_flicker * ${SPARK_MARK.sparkDip.toFixed(1)} * (0.5 + 0.5 * wobble(vec2(t * 6.0, fi * 2.3), fi + 6.0));
    energy += glowLine(d, w) * swell * vis * spark * (lead > 0.5 ? 1.4 : 0.7);
    hot += exp(-d * d / max(w * w, 1e-4)) * vis;
  }
  float reach = ${SPARK_MARK.reach.toFixed(1)} * u_look.y * unit;
  float edge = max(base, 0.0);
  float fade = smoothstep(reach, reach * 0.55, edge) * step(0.0, base);
  for (int a = 0; a < ${SPARK_MARK.arcs}; a++) {
    float fa = float(a);
    if (fa >= u_arc.w) break;
    float beat = t * 1.5 + fa * 0.37;
    float ca = hx_hash1(floor(beat) * 7.0 + fa * 3.0);
    float flash = smoothstep(0.55, 0.75, fract(beat)) * (1.0 - smoothstep(0.85, 1.0, fract(beat)));
    float s = wrap(ang - ca) * perim + wobble(vec2(edge / unit * 0.4, beat), fa + 21.0) * unit * 1.5 * u_arc.z;
    energy += glowLine(s, w * 0.8) * fade * flash * 0.9;
  }
  for (int i = 0; i < ${SPARK_MARK.pulses}; i++) {
    vec4 pulse = u_pulses[i];
    float pos = pulse.y * 0.5;
    float front = min(abs(wrap(ang - pulse.x - pos)), abs(wrap(ang - pulse.x + pos))) * 20.0;
    float env = exp(-front * front) * pulse.w * exp(-pulse.z * ${SPARK_MARK.pulseDecay.toFixed(1)});
    float near = exp(-abs(base) / (unit * 2.5));
    energy += env * near * 2.0;
    hot += env * near;
  }
  energy *= u_look.x * breath * (1.0 + heat);
  float alpha = 1.0 - exp(-energy * 1.6);
  vec3 col = mix(u_glow, u_core, clamp(hot, 0.0, 1.0));
  o_color = vec4(u_light > 0.5 ? col * 0.8 : col, clamp(alpha, 0.0, 1.0));
}
`, GLSL_HASH, GLSL_NOISE, GLSL_UTIL);
