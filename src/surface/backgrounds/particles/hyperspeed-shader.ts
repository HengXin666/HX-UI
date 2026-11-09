// 行为规格参照 docs/research/catalog/backgrounds-1.md 的 Hyperspeed 条目, 实现为 HX 自有.
// 场景在离屏通道里画, 泛光走 ../bloom.ts 的降采样金字塔.
import { fragmentSource, GLSL_HASH, GLSL_UTIL } from "../../backdrop/kernel";
import { BLOOM_ENCODE } from "../bloom";

export type HyperspeedCurve = "straight" | "winding" | "turbulent";

export const HYPERSPEED = {
  /** 规格 TRAVEL: 可见路段长度 (世界单位), 也是雾的远端. */
  travel: 400,
  /** 规格 MAX_POLES / MAX_COLORS. */
  maxPoles: 80,
  maxColors: 8,
  /** 规格: 加速升起 0.28s, 回落 0.85s. */
  boostRise: 0.28,
  boostFall: 0.85,
  /** 规格: 视场弹簧 刚度 90, 阻尼 13. */
  fovStiffness: 90,
  fovDamping: 13,
  /** 规格: 转向跟随 0.35s. */
  steerTau: 0.35,
  /** 本库定: 每秒前进的世界单位 (乘 speed). */
  cruise: 60,
  /** 本库定: 每侧最多车道数 (着色器循环上限). */
  maxLanes: 6,
  /** 本库定: 泛光金字塔级数, 亮部阈值 / 软膝, glow prop 到泛光强度的倍率. */
  bloomLevels: 4,
  bloomThreshold: 0.6,
  bloomKnee: 0.5,
  bloomGain: 1.5,
} as const;

/** 弯道的形状系数: 路中心横移 = curvature * z^2 * k * bend(travel). */
export const CURVE_KIND: Readonly<Record<HyperspeedCurve, number>> = { straight: 0, winding: 1, turbulent: 2 };

export interface HyperspeedState {
  travel: number;
  boost: number;
  fov: number;
  fovVelocity: number;
  steer: number;
}

export function makeHyperspeedState(fov: number): HyperspeedState {
  return { travel: 0, boost: 0, fov, fovVelocity: 0, steer: 0 };
}

/** 一帧的输入: 想要的加速量, 目标视场, 目标横移. */
export interface HyperspeedInput {
  readonly wanted: number;
  readonly fovTarget: number;
  readonly steerTarget: number;
  /** 每秒前进 (已乘 speed). */
  readonly cruise: number;
}

/**
 * 推进行驶状态: 加速一阶跟随 (升快落慢), 视场半隐式弹簧, 转向一阶跟随, 行程按 (1 + boost) 倍速累加.
 *
 * @param s 状态, 原地更新.
 * @param dt 帧长 (秒).
 * @param input 本帧目标.
 */
export function stepHyperspeed(s: HyperspeedState, dt: number, input: HyperspeedInput): void {
  const tau = input.wanted > s.boost ? HYPERSPEED.boostRise : HYPERSPEED.boostFall;
  s.boost += (input.wanted - s.boost) * (1 - Math.exp(-dt / tau));
  s.fovVelocity += ((input.fovTarget - s.fov) * HYPERSPEED.fovStiffness - s.fovVelocity * HYPERSPEED.fovDamping) * dt;
  s.fov += s.fovVelocity * dt;
  s.steer += (input.steerTarget - s.steer) * (1 - Math.exp(-dt / HYPERSPEED.steerTau));
  s.travel += dt * input.cruise * (1 + s.boost);
}

const BODY = `
uniform float u_travel;
uniform float u_focal;
uniform float u_cam_x;
uniform float u_boost;
uniform float u_curve_kind;
uniform float u_curvature;
uniform float u_lanes;
uniform float u_road_w;
uniform float u_median;
uniform float u_density;
uniform float u_trail;
uniform float u_light_size;
uniform float u_poles;
uniform float u_pole_h;
uniform float u_dust;
uniform float u_glow;
uniform float u_reflect;
uniform float u_road_alpha;
uniform float u_head_count;
uniform float u_tail_count;
uniform float u_pole_count;
uniform vec3 u_heads[${HYPERSPEED.maxColors}];
uniform vec3 u_tails[${HYPERSPEED.maxColors}];
uniform vec3 u_pole_colors[${HYPERSPEED.maxColors}];
uniform vec3 u_road;
uniform vec3 u_line;

const float TRAVEL = ${HYPERSPEED.travel.toFixed(1)};
const float EYE = 1.6;

vec3 hx_pick(vec3 list[${HYPERSPEED.maxColors}], float count, float h) {
  float k = floor(h * count);
  vec3 c = list[0];
  for (int i = 1; i < ${HYPERSPEED.maxColors}; i++) {
    if (float(i) == k) c = list[i];
  }
  return c;
}

float hx_bend(float z) {
  if (u_curve_kind < 0.5) return 0.0;
  float b = sin(u_travel * 0.004);
  if (u_curve_kind > 1.5) b = 0.6 * sin(u_travel * 0.009) + 0.4 * sin(u_travel * 0.023 + 1.7);
  return u_curvature * z * z * 0.0004 * b;
}

vec3 hx_lights(float u, float depth, float pixel, out float energy) {
  vec3 col = vec3(0.0);
  energy = 0.0;
  float laneW = u_road_w / max(u_lanes, 1.0);
  float spacing = TRAVEL * max(u_lanes, 1.0) / max(u_density, 1.0);
  for (int side = 0; side < 2; side++) {
    float sgn = side == 0 ? -1.0 : 1.0;
    float rate = side == 0 ? 1.65 : 0.35;
    for (int i = 0; i < ${HYPERSPEED.maxLanes}; i++) {
      if (float(i) >= u_lanes) break;
      float center = sgn * (u_median * 0.5 + (float(i) + 0.5) * laneW);
      float du = abs(abs(u - center) - laneW * 0.22);
      float q = depth + u_travel * rate + float(i) * 37.0 + float(side) * 101.0;
      float cell = floor(q / spacing);
      float h = hx_hash2(vec2(cell, float(i) + float(side) * 11.0));
      if (h > 0.85) continue;
      float len = spacing * u_trail * (0.25 + 0.35 * hx_hash1(cell + h));
      float local = fract(q / spacing) * spacing;
      if (local > len) continue;
      float along = side == 0 ? 1.0 - local / len : local / len;
      float w = 0.12 * u_light_size;
      float we = max(w, pixel * depth * 1.5);
      float core = exp(-pow(du / we, 2.0)) * (w / we);
      float sheen = exp(-pow(du / (we * 4.0), 2.0)) * u_reflect * 0.15;
      float halo = exp(-pow(du / (we * 10.0), 2.0)) * u_glow * 0.04;
      float e = (core + sheen + halo) * mix(0.25, 1.0, along);
      vec3 tint = side == 0 ? hx_pick(u_heads, u_head_count, h * 6.13) : hx_pick(u_tails, u_tail_count, h * 6.13);
      col += tint * e;
      energy += e;
    }
  }
  return col;
}

void main() {
  vec2 p = (v_uv * u_res - 0.5 * u_res) / (0.5 * u_res.y);
  vec3 ray = normalize(vec3(p, -u_focal));
  float pixel = 2.0 / (u_focal * u_res.y);
  vec3 col = vec3(0.0);
  float alpha = 0.0;
  if (ray.y < -1e-4) {
    float t = EYE / -ray.y;
    vec3 hit = ray * t;
    float depth = -hit.z;
    float fog = smoothstep(TRAVEL * 0.25, TRAVEL, depth);
    float u = hit.x + u_cam_x - hx_bend(depth);
    float edge = u_median * 0.5 + u_road_w;
    float onRoad = step(abs(u), edge);
    col += u_road * u_road_alpha * onRoad * (1.0 - fog);
    alpha += u_road_alpha * onRoad * (1.0 - fog);
    float laneW = u_road_w / max(u_lanes, 1.0);
    float k = (abs(u) - u_median * 0.5) / laneW;
    float lineDist = abs(k - floor(k + 0.5)) * laneW;
    float dash = step(0.5, fract((depth + u_travel) / 8.0));
    float lw = max(0.06, pixel * depth);
    float mark = (1.0 - smoothstep(lw * 0.5, lw, lineDist)) * dash * onRoad * step(-0.01, k) * (1.0 - fog) * (0.06 / lw);
    col += u_line * mark * 0.6;
    alpha += mark * 0.6;
    float energy;
    vec3 lights = hx_lights(u, depth, pixel, energy) * (1.0 - fog);
    col += lights;
    alpha += energy * (1.0 - fog);
  }
  float spacing = TRAVEL / max(u_poles, 1.0);
  float offset = mod(u_travel, spacing);
  for (int k = 0; k < ${HYPERSPEED.maxPoles}; k++) {
    if (float(k) >= u_poles) break;
    float z = (float(k) + 1.0) * spacing - offset;
    float fade = 1.0 - smoothstep(TRAVEL * 0.3, TRAVEL, z);
    for (int side = 0; side < 2; side++) {
      float sgn = side == 0 ? -1.0 : 1.0;
      float x = sgn * (u_median * 0.5 + u_road_w + 1.5) + hx_bend(z) - u_cam_x;
      float sx = x / z * u_focal;
      float bottom = -EYE / z * u_focal;
      float top = (u_pole_h * 4.0 - EYE) / z * u_focal;
      float hw = max(0.06 / z * u_focal, pixel);
      float inX = 1.0 - smoothstep(hw, hw * 1.6, abs(p.x - sx));
      float inY = step(bottom, p.y) * step(p.y, top);
      float lamp = exp(-length(vec2(p.x - sx, p.y - top)) / max(hw * 3.0, pixel)) * (0.5 + u_glow);
      vec3 tint = hx_pick(u_pole_colors, u_pole_count, hx_hash1(float(k) + float(side) * 0.37));
      col += tint * (inX * inY * 0.35 + lamp) * fade;
      alpha += (inX * inY * 0.35 + lamp) * fade;
    }
  }
  if (u_dust > 0.5) {
    float ang = atan(p.y, p.x) / HX_TAU + 0.5;
    float lane = ang * u_dust;
    float h = hx_hash1(floor(lane) + 0.5);
    float thin = 1.0 - smoothstep(0.02, 0.08, abs(fract(lane) - 0.5) * length(p));
    float r = length(p);
    float head = fract(h * 7.0 + u_travel * 0.002 * (0.5 + h)) * 1.6;
    float tail = 0.04 * (1.0 + u_boost * 3.0);
    float streak = smoothstep(tail, 0.0, head - r) * step(r, head) * thin * 0.35;
    col += u_line * streak;
    alpha += streak;
  }
  o_color = bloom_encode(col, clamp(alpha, 0.0, 1.0));
}
`;

/** 上屏主体: 场景线性光加泛光, 泛光的峰值同样记进覆盖率, 再按覆盖率出光 (无泛光时与原上屏一致). */
const COMPOSITE = `
void main() {
  vec4 scene = bloom_scene(v_uv);
  vec3 glow = bloom_glow(v_uv);
  float alpha = clamp(scene.a + max(glow.r, max(glow.g, glow.b)), 0.0, 1.0);
  o_color = vec4(clamp((scene.rgb + glow) / max(alpha, 1e-3), 0.0, 1.0), alpha);
}
`;

/**
 * Hyperspeed 的离屏场景片元: 光线打在路面上算车流光带, 竖杆与尘线逐个投影, 全程无三角网格.
 * 以 bloom_encode 写出未压缩的线性光与覆盖率, 由泛光金字塔 (../bloom.ts) 降采样模糊.
 */
export const HYPERSPEED_FRAGMENT = fragmentSource(BODY, GLSL_HASH, GLSL_UTIL, BLOOM_ENCODE);

/**
 * Hyperspeed 的上屏片元: 读场景与泛光金字塔合成.
 *
 * @param compositeGlsl bloomPyramid 返回的 compositeGlsl.
 */
export function hyperspeedComposite(compositeGlsl: string): string {
  return fragmentSource(COMPOSITE, compositeGlsl);
}
