/**
 * 背景层共用泛光金字塔: 通道名唯一, 各级比例, 画质档级数, 权重归一, 软膝提取, 合成片段.
 */
import { describe, expect, it, vi } from "vitest";
import {
  BLOOM_DEFAULT_WEIGHTS, BLOOM_ENCODE, BLOOM_MAX_LEVELS, BLOOM_TIER_LEVELS, bloomBrightFactor, bloomLevelCount, bloomLevelScale, bloomPyramid,
  bloomWeights,
} from "@src/surface/backgrounds/bloom";
import type { BackdropFrame } from "@src/surface/backdrop/kernel/use-backdrop";

const SCENE = `#version 300 es\n${BLOOM_ENCODE}\nvoid main() { o_color = bloom_encode(vec3(1.0), 1.0); }`;

describe("bloomPyramid", () => {
  it("默认四级: 场景在前, 名字唯一, 比例 1 / 0.5 / 0.25 / 0.125 / 0.0625", () => {
    const b = bloomPyramid({ scene: SCENE });
    expect(b.levels).toBe(BLOOM_MAX_LEVELS);
    expect(b.passes.map((p) => p.name)).toEqual(["u_bloom_scene", "u_bloom_l0", "u_bloom_l1", "u_bloom_l2", "u_bloom_l3"]);
    expect(new Set(b.passes.map((p) => p.name)).size).toBe(b.passes.length);
    expect(b.passes.map((p) => p.scale)).toEqual([1, 0.5, 0.25, 0.125, 0.0625]);
    expect(b.passes[0].fragment).toBe(SCENE);
    expect(b.names).toEqual({ scene: "u_bloom_scene", levels: ["u_bloom_l0", "u_bloom_l1", "u_bloom_l2", "u_bloom_l3"] });
  });

  it("每级读上一级, 只有第 0 级做亮部提取并带阈值 uniform", () => {
    const b = bloomPyramid({ scene: SCENE, threshold: 0.7, knee: 0.3 });
    const [, l0, l1, l2, l3] = b.passes;
    expect(l0.fragment).toContain("uniform sampler2D u_bloom_scene;");
    expect(l0.fragment).toContain("c = bloom_bright(c);");
    expect(l1.fragment).toContain("uniform sampler2D u_bloom_l0;");
    expect(l1.fragment).not.toContain("c = bloom_bright(c);");
    expect(l2.fragment).toContain("textureSize(u_bloom_l1, 0)");
    expect(l3.fragment).toContain("uniform sampler2D u_bloom_l2;");
    const frame = {} as BackdropFrame;
    expect(l0.uniforms?.(frame, 0)).toEqual({ u_bloom_threshold: 0.7, u_bloom_knee: 0.3 });
    expect(l1.uniforms).toBeUndefined();
  });

  it("画质档 2 / 3 / 4 级, 夹取与 0 级", () => {
    expect(BLOOM_TIER_LEVELS).toEqual({ low: 2, medium: 3, high: 4 });
    for (const tier of ["low", "medium", "high"] as const) {
      const b = bloomPyramid({ scene: SCENE, levels: BLOOM_TIER_LEVELS[tier] });
      expect(b.passes).toHaveLength(1 + BLOOM_TIER_LEVELS[tier]);
      expect(b.names.levels).toHaveLength(BLOOM_TIER_LEVELS[tier]);
    }
    expect([bloomLevelCount(undefined), bloomLevelCount(9), bloomLevelCount(-1), bloomLevelCount(2.4)]).toEqual([4, 4, 0, 2]);
    const none = bloomPyramid({ scene: SCENE, levels: 0, strength: 3 });
    expect(none.passes.map((p) => p.name)).toEqual(["u_bloom_scene"]);
    expect(none.uniforms.u_bloom_strength).toBe(0);
    expect(none.compositeGlsl).toContain("vec3 bloom_glow(vec2 uv)");
  });

  it("各级比例不超过场景比例, 前缀改名", () => {
    expect([bloomLevelScale(0), bloomLevelScale(3), bloomLevelScale(0, 0.35), bloomLevelScale(1, 0.35)]).toEqual([0.5, 0.0625, 0.35, 0.25]);
    const b = bloomPyramid({ scene: SCENE, sceneScale: 0.35, prefix: "u_glare", levels: 2 });
    expect(b.passes.map((p) => [p.name, p.scale])).toEqual([["u_glare_scene", 0.35], ["u_glare_l0", 0.35], ["u_glare_l1", 0.25]]);
    expect(bloomPyramid({ scene: SCENE, sceneScale: 4 }).passes[0].scale).toBe(1);
  });

  it("权重只取前 levels 个并归一, 强度写进上屏 uniform", () => {
    const w = bloomWeights(2, [3, 1, 9, 9]);
    expect(w).toEqual([0.75, 0.25, 0, 0]);
    expect(bloomWeights(4).reduce((a, b) => a + b, 0)).toBeCloseTo(1, 9);
    expect(bloomWeights(3, [0, 0, 0])).toEqual([1 / 3, 1 / 3, 1 / 3, 0]);
    expect(BLOOM_DEFAULT_WEIGHTS).toHaveLength(BLOOM_MAX_LEVELS);
    const b = bloomPyramid({ scene: SCENE, levels: 3, strength: 0.8 });
    expect(b.uniforms.u_bloom_strength).toBe(0.8);
    expect(b.uniforms.u_bloom_weights).toEqual({ list: bloomWeights(3), size: 1 });
  });

  it("软膝提取: 阈值下为 0, 远高于阈值趋近 1 - threshold / peak", () => {
    expect(bloomBrightFactor(0.2, 1, 0.5)).toBe(0);
    expect(bloomBrightFactor(1, 1, 0.5)).toBeCloseTo(0.125, 6);
    expect(bloomBrightFactor(4, 1, 0.5)).toBeCloseTo(0.75, 6);
  });

  it("合成片段声明全部采样器, 场景 uniform 每帧只调一次", () => {
    const sceneUniforms = vi.fn(() => ({ u_x: 1 }));
    const b = bloomPyramid({ scene: SCENE, sceneUniforms });
    for (const n of [b.names.scene, ...b.names.levels]) expect(b.compositeGlsl).toContain(`uniform sampler2D ${n};`);
    expect(b.compositeGlsl).toContain("vec4 bloom_scene(vec2 uv)");
    expect(b.compositeGlsl).toContain(`uniform float u_bloom_weights[${BLOOM_MAX_LEVELS}];`);
    const frame = {} as BackdropFrame;
    expect(b.passes[0].uniforms?.(frame, 0)).toEqual({ u_x: 1 });
    expect(sceneUniforms).toHaveBeenCalledTimes(1);
    expect(sceneUniforms).toHaveBeenCalledWith(frame);
  });
});
