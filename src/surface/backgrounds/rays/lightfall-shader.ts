// 行为规格参照 docs/research/catalog/backgrounds-1.md 的 Lightfall 条目, 实现为 HX 自有.
// 场景在离屏通道里画, 泛光走 ../bloom.ts 的四级降采样金字塔.
import { fragmentSource, GLSL_HASH, GLSL_NOISE, GLSL_UTIL } from "../../backdrop/kernel/glsl";
import { BLOOM_ENCODE } from "../bloom";
import { RAYS_COMPOSE } from "./field";

/** Lightfall 的命名常数. 括号里是条目原名或 "本库定". */
export const LIGHTFALL = {
  /** 调色板上限 (MAX_COLORS). */
  maxColors: 8,
  /** 入场时长 秒 (INTRO_SECONDS). */
  introSeconds: 2.6,
  /** 按住时的冲刺倍率 (WARP_SPEED, travel 乘 1 + warp * 9). */
  warpSpeed: 9,
  /** 冲刺升 / 降速率 (1 - exp(-dt * 2.2) / 1 - exp(-dt * 1.6)). */
  warpRise: 2.2,
  warpFall: 1.6,
  /** 下落行程系数 (travel += dt * 0.1 * speed). */
  travelRate: 0.1,
  /** 透镜强度跟随速率 (1 - exp(-dt * 6)). */
  lensRate: 6,
  /** 指针在场程度的进 / 出速率 (1 - exp(-dt * 4) / 1 - exp(-dt * 2)). */
  touchIn: 4,
  touchOut: 2,
  /** 深度层数 (本库定). */
  layers: 4,
  /** 泛光金字塔级数 (BLOOM_LEVELS). */
  bloomLevels: 4,
  /** 泛光亮部阈值与软膝 (本库定, 对应旧解析增益的 smoothstep(0.5, 2.0, peak) 区间). */
  bloomThreshold: 0.8,
  bloomKnee: 0.6,
  /** bloom prop 到泛光强度的倍率 (本库定). */
  bloomGain: 2,
} as const;

/** 冲刺一步: 按住时以 2.2 的速率升向 1, 松开以 1.6 降回 0. */
export function warpStep(cur: number, holding: boolean, dt: number): number {
  if (dt <= 0) return cur;
  const rate = holding ? LIGHTFALL.warpRise : LIGHTFALL.warpFall;
  return cur + ((holding ? 1 : 0) - cur) * (1 - Math.exp(-dt * rate));
}

/** 指针跟随的时间常数换成每步比例: mouseDampening 为 0 时立即到位. */
export function dampFollow(dt: number, damping: number): number {
  return damping > 0 ? 1 - Math.exp(-dt / damping) : 1;
}

const BODY = `
uniform vec3 u_colors[8];
uniform float u_color_count;
uniform float u_travel;
uniform float u_twinkle_clock;
uniform float u_streaks;
uniform float u_width;
uniform float u_length;
uniform float u_glow;
uniform float u_density;
uniform float u_twinkle;
uniform float u_zoom;
uniform float u_bg_glow;
uniform float u_head;
uniform float u_depth;
uniform vec2 u_view;
uniform vec4 u_lens;
uniform float u_lens_amount;
uniform float u_warp;
uniform float u_intro;

const int LAYERS = 4;
const int MAX_STREAKS = 6;
const float COLUMN = 0.12;
const float PERIOD = 2.6;

vec3 fall_tint(float h) {
  float slot = floor(h * u_color_count);
  vec3 c = u_colors[0];
  for (int i = 1; i < 8; i++) if (float(i) == slot) c = u_colors[i];
  return c;
}

// 一层下落光痕: 竖列按哈希决定有无, 每列若干条头亮尾长的光痕, 列宽在像素级时退成整体光.
vec3 fall_layer(vec2 p, float layer, float pixel) {
  float scale = u_zoom * (1.0 + layer * (0.6 + u_depth));
  vec2 q = p * scale + u_view * (0.25 + layer * 0.35);
  float col = floor(q.x / COLUMN);
  float h = hx_hash2(vec2(col, layer + 3.7));
  if (h > u_density) return vec3(0.0);
  float across = (fract(q.x / COLUMN) - 0.5) * COLUMN;
  float edge = 0.3 * clamp(u_width, 0.05, 1.5);
  float spacingPx = COLUMN / (scale * pixel);
  float body = 1.0 - smoothstep(0.72 * edge, edge, abs(across) / COLUMN);
  float detail = smoothstep(1.6, 3.2, spacingPx);
  body = mix(edge * 1.2, body, detail);
  float rate = (0.6 + 0.8 * hx_hash1(col + layer * 17.0)) / (1.0 + layer * 0.5);
  float tail = 3.5 / max(u_length * (1.0 + u_warp * 2.5), 0.05);
  float light = 0.0;
  for (int k = 0; k < MAX_STREAKS; k++) {
    if (float(k) >= u_streaks) break;
    float seed = hx_hash2(vec2(col, float(k) + layer * 9.1));
    float head = (1.0 - fract(seed + u_travel * rate * 10.0 / PERIOD)) * PERIOD;
    float behind = mod(q.y - head + PERIOD * 0.5, PERIOD) - PERIOD * 0.5;
    float fall = behind < 0.0 ? 0.0 : exp(-tail * behind) * (1.0 - smoothstep(0.5, 0.95, behind / (0.5 * PERIOD)));
    fall *= 1.0 - smoothstep(1.2, 3.2, tail * behind);
    float headR = COLUMN * 0.6 * max(u_width, 0.2);
    float glow = exp(-dot(vec2(across, behind), vec2(across, behind)) / (headR * headR)) * u_head * detail;
    float twinkle = 1.0 - u_twinkle * 0.5 * (1.0 + sin(u_twinkle_clock * (3.0 + 4.0 * seed) + seed * HX_TAU));
    light += (fall * body + glow * 1.6) * twinkle;
  }
  float far = 1.0 / (1.0 + layer * (0.5 + 1.5 * clamp(u_depth, 0.0, 1.0)));
  return fall_tint(h / max(u_density, 0.0001)) * light * far;
}

void main() {
  vec2 p = hx_centered(v_uv * u_res);
  float pixel = 1.0 / min(u_res.x, u_res.y);
  vec2 toward = p - u_lens.xy;
  float near = exp(-dot(toward, toward) / max(u_lens.z * u_lens.z, 0.0001));
  p -= toward * near * u_lens_amount * u_lens.w;
  vec3 light = vec3(0.0);
  for (int i = 0; i < LAYERS; i++) light += fall_layer(p, float(i), pixel);
  vec3 mean = vec3(0.0);
  for (int i = 0; i < 8; i++) if (float(i) < u_color_count) mean += u_colors[i];
  mean /= max(u_color_count, 1.0);
  light += mean * u_bg_glow * (0.6 + 0.4 * v_uv.y) * (1.0 + u_warp);
  light *= u_glow * (1.0 + u_warp * 0.6);
  float reveal = smoothstep(0.0, 0.12, v_uv.y - (1.0 - 1.15 * u_intro));
  light *= reveal * rays_edge(v_uv);
  o_color = bloom_encode(light, 1.0);
}
`;

/**
 * Lightfall 的离屏场景片元: 四层视差的下落光痕, 头部辉光, 尾长随冲刺拉长, 指针透镜把周围光痕推开.
 * 输出编码后的线性光, 由泛光金字塔 (../bloom.ts) 降采样模糊后在上屏程序里合成.
 */
export const LIGHTFALL_SCENE = fragmentSource(BODY, GLSL_HASH, GLSL_NOISE, GLSL_UTIL, RAYS_COMPOSE, BLOOM_ENCODE);
