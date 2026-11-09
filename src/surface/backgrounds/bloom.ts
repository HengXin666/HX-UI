// 行为规格参照 docs/research/catalog/backgrounds-1.md 与 backgrounds-2.md 的 Lightfall / PrismaticBurst 条目 (BLOOM_LEVELS / DOWNSAMPLE / BLUR), 实现为 HX 自有.
/**
 * 背景层共用的泛光金字塔. 只用内核已有的 ShaderSpec.passes, 不碰内核.
 *
 * 接线三步:
 * 1. 场景: 把组件原来的上屏片元改成离屏场景片元. 片元里带上 `BLOOM_ENCODE`, 结尾写
 *    `o_color = bloom_encode(light, alpha);` (light 为线性 HDR 光, 不做色调压缩).
 * 2. 通道: `const bloom = bloomPyramid({ scene, sceneUniforms, levels, sceneScale, threshold, knee, weights, strength })`,
 *    把 `bloom.passes` 原样给 `ShaderSpec.passes` (场景在前, 之后是逐级亮部提取 + 降采样模糊).
 *    组件原来的有状态 uniforms 函数挂在 sceneUniforms 上, 每帧只调一次.
 * 3. 合成: 上屏片元 `fragmentSource(MAIN, ...chunks, bloom.compositeGlsl)`, main 里
 *    `vec4 s = bloom_scene(v_uv); vec3 light = s.rgb + bloom_glow(v_uv);` 再按组件自己的出光方式输出;
 *    上屏 uniforms 里展开 `...bloom.uniforms`.
 *
 * 场景缓冲按 c / (1 + c) 编码, 在 RGBA16F 下无损, 退到 RGBA8 时暗部精度仍够且亮部不截断.
 * 每级比上一级小一半 (相对画布 0.5, 0.25, 0.125, 0.0625, 不超过场景比例), 13 点降采样核自带模糊;
 * 合成时每级用 5 点帐篷核双线性上采样, 按权重归一后乘 strength. 画质档用 BLOOM_TIER_LEVELS 选级数.
 * 级数或 prefix 变了片元源码随之变, 内核会重建程序; 只改阈值, 权重, 强度不重建.
 */
import type { UniformMap } from "../backdrop/kernel/gl";
import { fragmentSource } from "../backdrop/kernel/glsl";
import { clamp } from "../backdrop/kernel/math";
import type { PassSpec } from "../backdrop/kernel/shader";
import type { BackdropFrame } from "../backdrop/kernel/use-backdrop";

/** 金字塔级数上限 (BLOOM_LEVELS). */
export const BLOOM_MAX_LEVELS = 4;

/** 画质档到级数: 低档只留近处两级, 省掉最宽的两层. */
export const BLOOM_TIER_LEVELS = { low: 2, medium: 3, high: 4 } as const;

export type BloomTier = keyof typeof BLOOM_TIER_LEVELS;

/** 默认各级权重 (本库定): 近级略重, 远级给大范围的柔光. */
export const BLOOM_DEFAULT_WEIGHTS: readonly number[] = [1, 0.85, 0.7, 0.55];

const DEFAULT_PREFIX = "u_bloom";
const DEFAULT_THRESHOLD = 1;
const DEFAULT_KNEE = 0.5;
const LEVEL_STEP = 0.5;

/** 场景与各级缓冲的编解码: c / (1 + c) 与其反函数. 场景片元与每级通道都要带上. */
export const BLOOM_ENCODE = `
vec4 bloom_encode(vec3 c, float a) { c = max(c, 0.0); return vec4(c / (1.0 + c), a); }
vec3 bloom_decode(vec4 t) { vec3 c = min(t.rgb, vec3(0.999)); return c / (1.0 - c); }
`;

export interface BloomOptions {
  /** 完整的场景片元源码 (fragmentSource 拼出), 带 BLOOM_ENCODE, 以 bloom_encode 写出线性光. */
  readonly scene: string;
  /** 场景通道的 uniform, 每帧调一次 (组件的有状态步进放这里). */
  readonly sceneUniforms?: (frame: BackdropFrame) => UniformMap;
  /** 级数 0..4, 默认 4; 0 时只有场景通道, bloom_glow 恒为 0. */
  readonly levels?: number;
  /** 场景缓冲相对画布的比例, 默认 1. */
  readonly sceneScale?: number;
  /** 采样器名前缀, 默认 u_bloom (得到 u_bloom_scene, u_bloom_l0..). 与组件自有通道重名时改它. */
  readonly prefix?: string;
  /** 亮部阈值 (线性光的通道峰值), 默认 1. */
  readonly threshold?: number;
  /** 阈值软膝宽度, 默认 0.5. */
  readonly knee?: number;
  /** 各级权重, 只取前 levels 个并归一. 默认 BLOOM_DEFAULT_WEIGHTS. */
  readonly weights?: readonly number[];
  /** 泛光总强度, 默认 1. */
  readonly strength?: number;
}

export interface BloomPyramid {
  /** 按序给 ShaderSpec.passes: 场景, 然后 levels 级降采样. */
  readonly passes: readonly PassSpec[];
  /** 上屏片元要拼进去的片段: 声明采样器与 uniform, 提供 bloom_scene(uv) 与 bloom_glow(uv). */
  readonly compositeGlsl: string;
  /** 上屏程序的 uniform (强度与归一后的权重). */
  readonly uniforms: UniformMap;
  /** 实际级数 (夹在 0..4). */
  readonly levels: number;
  /** 采样器名: 场景与各级. */
  readonly names: { readonly scene: string; readonly levels: readonly string[] };
}

/** 级数夹到 0..BLOOM_MAX_LEVELS 的整数. */
export function bloomLevelCount(levels: number | undefined): number {
  return Math.round(clamp(levels ?? BLOOM_MAX_LEVELS, 0, BLOOM_MAX_LEVELS));
}

/** 第 i 级缓冲相对画布的比例: 0.5^(i+1), 不超过场景比例. */
export function bloomLevelScale(index: number, sceneScale: number = 1): number {
  return Math.min(LEVEL_STEP ** (index + 1), sceneScale);
}

/** 只取前 levels 个权重并归一为和 1 (全为 0 时平分), 不足 BLOOM_MAX_LEVELS 位补 0. */
export function bloomWeights(levels: number, weights: readonly number[] = BLOOM_DEFAULT_WEIGHTS): number[] {
  const out = Array.from({ length: BLOOM_MAX_LEVELS }, (_, i) => (i < levels ? Math.max(0, weights[i] ?? 0) : 0));
  const sum = out.reduce((a, b) => a + b, 0);
  return out.map((w, i) => (i >= levels ? 0 : sum > 0 ? w / sum : 1 / levels));
}

/** 软膝亮部提取 (与着色器同式), 导出给单测: 返回该峰值保留的比例. */
export function bloomBrightFactor(peak: number, threshold: number, knee: number): number {
  const k = Math.max(knee, 1e-4);
  const soft = clamp(peak - threshold + k, 0, 2 * k);
  const curve = (soft * soft) / (4 * k);
  return Math.max(curve, peak - threshold) / Math.max(peak, 1e-4);
}

/** 一级降采样: 读上一级 (或场景) 做 13 点核模糊, 第 0 级另做软膝亮部提取. */
function levelFragment(source: string, bright: boolean): string {
  return fragmentSource(`
uniform sampler2D ${source};
uniform float u_bloom_threshold;
uniform float u_bloom_knee;
vec3 bloom_tap(vec2 uv) { return bloom_decode(texture(${source}, uv)); }
vec3 bloom_bright(vec3 c) {
  float peak = max(c.r, max(c.g, c.b));
  float k = max(u_bloom_knee, 0.0001);
  float soft = clamp(peak - u_bloom_threshold + k, 0.0, 2.0 * k);
  soft = soft * soft / (4.0 * k);
  return c * max(soft, peak - u_bloom_threshold) / max(peak, 0.0001);
}
void main() {
  vec2 o = 1.0 / vec2(textureSize(${source}, 0));
  vec2 uv = v_uv;
  vec3 outer = bloom_tap(uv + o * vec2(-2.0, 2.0)) + bloom_tap(uv + o * vec2(2.0, 2.0))
    + bloom_tap(uv + o * vec2(-2.0, -2.0)) + bloom_tap(uv + o * vec2(2.0, -2.0));
  vec3 sides = bloom_tap(uv + o * vec2(0.0, 2.0)) + bloom_tap(uv + o * vec2(-2.0, 0.0))
    + bloom_tap(uv + o * vec2(2.0, 0.0)) + bloom_tap(uv + o * vec2(0.0, -2.0));
  vec3 inner = bloom_tap(uv + o * vec2(-1.0, 1.0)) + bloom_tap(uv + o * vec2(1.0, 1.0))
    + bloom_tap(uv + o * vec2(-1.0, -1.0)) + bloom_tap(uv + o * vec2(1.0, -1.0));
  vec3 c = bloom_tap(uv) * 0.125 + outer * 0.03125 + sides * 0.0625 + inner * 0.125;
  ${bright ? "c = bloom_bright(c);" : ""}
  o_color = bloom_encode(c, 1.0);
}
`, BLOOM_ENCODE);
}

/** 上屏片段: 场景解码与各级帐篷核上采样的加权和. */
function compositeChunk(scene: string, names: readonly string[]): string {
  const samplers = [scene, ...names].map((n) => `uniform sampler2D ${n};`).join("\n");
  const sum = names.map((n, i) => `  sum += u_bloom_weights[${i}] * bloom_level(${n}, uv);`).join("\n");
  return `
${BLOOM_ENCODE}
${samplers}
uniform float u_bloom_strength;
uniform float u_bloom_weights[${BLOOM_MAX_LEVELS}];
vec4 bloom_scene(vec2 uv) { vec4 t = texture(${scene}, uv); return vec4(bloom_decode(t), t.a); }
vec3 bloom_level(sampler2D s, vec2 uv) {
  vec2 o = 1.0 / vec2(textureSize(s, 0));
  vec3 c = bloom_decode(texture(s, uv)) * 0.5;
  c += (bloom_decode(texture(s, uv + o * vec2(1.0, 1.0))) + bloom_decode(texture(s, uv + o * vec2(-1.0, 1.0)))
    + bloom_decode(texture(s, uv + o * vec2(1.0, -1.0))) + bloom_decode(texture(s, uv + o * vec2(-1.0, -1.0)))) * 0.125;
  return c;
}
vec3 bloom_glow(vec2 uv) {
  vec3 sum = vec3(0.0);
${sum}
  return sum * u_bloom_strength;
}
`;
}

/**
 * 组出泛光金字塔: 场景通道, 逐级降采样模糊通道, 上屏合成片段与 uniform.
 *
 * @param options 场景源码, 级数, 阈值 / 软膝, 权重, 强度等, 见 BloomOptions.
 */
export function bloomPyramid(options: BloomOptions): BloomPyramid {
  const prefix = options.prefix ?? DEFAULT_PREFIX;
  const levels = bloomLevelCount(options.levels);
  const sceneScale = clamp(options.sceneScale ?? 1, 0.05, 1);
  const scene = `${prefix}_scene`;
  const names = Array.from({ length: levels }, (_, i) => `${prefix}_l${i}`);
  const threshold = options.threshold ?? DEFAULT_THRESHOLD;
  const knee = options.knee ?? DEFAULT_KNEE;
  const sceneUniforms = options.sceneUniforms;
  const passes: PassSpec[] = [
    { name: scene, fragment: options.scene, scale: sceneScale, ...(sceneUniforms ? { uniforms: (frame: BackdropFrame) => sceneUniforms(frame) } : {}) },
    ...names.map((name, i): PassSpec => ({
      name,
      fragment: levelFragment(i === 0 ? scene : names[i - 1], i === 0),
      scale: bloomLevelScale(i, sceneScale),
      ...(i === 0 ? { uniforms: () => ({ u_bloom_threshold: threshold, u_bloom_knee: knee }) } : {}),
    })),
  ];
  return {
    passes,
    compositeGlsl: compositeChunk(scene, names),
    uniforms: {
      u_bloom_strength: levels > 0 ? Math.max(0, options.strength ?? 1) : 0,
      u_bloom_weights: { list: bloomWeights(levels, options.weights), size: 1 },
    },
    levels,
    names: { scene, levels: names },
  };
}
