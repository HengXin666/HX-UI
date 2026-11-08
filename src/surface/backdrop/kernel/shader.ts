// 行为规格参照 docs/research/catalog/backgrounds-1.md 的 Backgrounds 族共用 (单画布, DPR 上限, 离屏停帧) 条目, 实现为 HX 自有.
import type { RefObject } from "react";
import { createPingPong, disposePingPong, feedbackSize, resizePingPong, swapPingPong } from "./feedback";
import { applyUniforms, bindTexture, createPass, disposePass, drawPass, uploadTexture, type ShaderPass, type UniformMap } from "./gl";
import { BACKDROP_MAX_TAPS } from "./glsl";
import type { CanvasFit } from "./math";
import { TAP_LIFETIME, type PointerState } from "./pointer";
import type { BackdropFactory, BackdropFrame, BackdropRenderer } from "./use-backdrop";

/** 一个着色器背景的全部可变部分. 由组件每次渲染给出, 渲染器每帧从 ref 读最新的. */
export interface ShaderSpec {
  /** 上屏的片元源码, 通常由 fragmentSource 拼出. 变了会重建程序. */
  readonly fragment: string;
  /** 每帧额外的 uniform; 内核自带的 u_res, u_time 等不必再给. */
  readonly uniforms?: (frame: BackdropFrame) => UniformMap;
  /** 采样器名到图像. 每帧取一次, 对象身份变了才重新上传. */
  readonly textures?: () => Readonly<Record<string, TexImageSource | null | undefined>>;
  /**
   * 离屏状态通道, 按顺序每帧先跑一遍, 再上屏. 每个通道自带一对乒乓缓冲,
   * 输出以 name 为采样器名, 后面的通道和上屏程序都能读; 通道读自己的 name 拿到的是上一次的输出.
   */
  readonly passes?: readonly PassSpec[];
}

/** 一个离屏通道 (拖尾, 流体的平流 / 散度 / 压力 / 染料等). */
export interface PassSpec {
  /** 输出的采样器名, 如 u_trail. 通道之间不可重名. */
  readonly name: string;
  readonly fragment: string;
  /** 每次迭代的 uniform, iteration 从 0 起. */
  readonly uniforms?: (frame: BackdropFrame, iteration: number) => UniformMap;
  /** 状态缓冲相对画布的缩放, 默认 0.5. */
  readonly scale?: number;
  /** 每帧迭代次数 (压力求解一类), 默认 1. */
  readonly iterations?: number;
}

/** 由 spec 得到渲染器身份: 任一片元源码变了就重建. */
export function shaderKey(spec: ShaderSpec): string {
  return [spec.fragment, ...(spec.passes ?? []).map((p) => p.name + p.fragment)].join("\n");
}

const TAP_STRIDE = 4;
const DEFAULT_PASS_SCALE = 0.5;
const CONTEXT_LOST = "webglcontextlost";

/** 内核自带的 uniform: 画布, 时钟, 指针, 点击队列. 纯函数, 单测覆盖映射. */
export function kernelUniforms(frame: Pick<BackdropFrame, "fit" | "time" | "elapsed">, pointer: PointerState): UniformMap {
  const taps = new Float32Array(BACKDROP_MAX_TAPS * TAP_STRIDE);
  let count = 0;
  for (const tap of pointer.taps) {
    const age = frame.elapsed - tap.at;
    if (!Number.isFinite(age) || age < 0 || age > TAP_LIFETIME || count >= BACKDROP_MAX_TAPS) continue;
    taps.set([tap.x, tap.y, age, 1], count * TAP_STRIDE);
    count += 1;
  }
  return {
    u_res: [frame.fit.width, frame.fit.height],
    u_time: frame.time,
    u_dpr: frame.fit.scale,
    u_pointer: [pointer.x, pointer.y, pointer.presence, pointer.down ? 1 : 0],
    u_taps: { list: taps, size: TAP_STRIDE },
    u_tap_count: count,
  };
}

/**
 * WebGL2 渲染器工厂. 拿不到 webgl2 上下文或程序编译失败时返回 null, 内核退到 CSS 兜底.
 *
 * @param spec 最新的着色器描述, 每帧从这里读 uniform 与纹理.
 */
export function shaderFactory(spec: RefObject<ShaderSpec>): BackdropFactory {
  return (canvas, _host, fail) => {
    const gl = canvas?.getContext("webgl2", { alpha: true, antialias: false, depth: false, stencil: false, premultipliedAlpha: false, powerPreference: "low-power" }) ?? null;
    const main = gl ? createPass(gl, spec.current.fragment) : null;
    if (!gl || !main) return null;
    const passes = (spec.current.passes ?? []).map((p) => ({ name: p.name, pass: createPass(gl, p.fragment), state: createPingPong(gl, 1, 1) }));
    if (passes.some((p) => !p.pass)) {
      for (const p of passes) {
        disposePingPong(gl, p.state);
        if (p.pass) disposePass(gl, p.pass);
      }
      disposePass(gl, main);
      return null;
    }
    const uploaded = new Map<string, { image: TexImageSource; texture: WebGLTexture | null }>();
    const onLost = (e: Event): void => {
      e.preventDefault();
      fail();
    };
    canvas.addEventListener(CONTEXT_LOST, onLost);

    const bindImages = (pass: ShaderPass, firstUnit: number): void => {
      const images = spec.current.textures?.() ?? {};
      let unit = firstUnit;
      for (const name of Object.keys(images)) {
        const image = images[name];
        if (!image) continue;
        const known = uploaded.get(name);
        const texture = known?.image === image ? known.texture : uploadTexture(gl, image, known?.texture);
        uploaded.set(name, { image, texture });
        bindTexture(gl, pass, name, texture, unit);
        unit += 1;
      }
    };

    const run = (pass: ShaderPass, extra: UniformMap, base: UniformMap, width: number, height: number): void => {
      gl.viewport(0, 0, width, height);
      gl.useProgram(pass.program);
      applyUniforms(gl, pass, base);
      applyUniforms(gl, pass, { ...extra, u_target_res: [width, height] });
      passes.forEach((p, unit) => bindTexture(gl, pass, p.name, p.state.read.texture, unit));
      bindImages(pass, passes.length);
      drawPass(gl, pass);
    };

    const renderer: BackdropRenderer = {
      resize: (fit: CanvasFit) => {
        const specs = spec.current.passes ?? [];
        passes.forEach((p, i) => {
          const [w, h] = feedbackSize(fit.width, fit.height, specs[i]?.scale ?? DEFAULT_PASS_SCALE);
          resizePingPong(gl, p.state, w, h);
        });
      },
      render: (frame) => {
        const base = kernelUniforms(frame, frame.pointer);
        const current = spec.current;
        passes.forEach((p, i) => {
          const passSpec = current.passes?.[i];
          const rounds = Math.max(1, passSpec?.iterations ?? 1);
          for (let round = 0; round < rounds; round += 1) {
            gl.bindFramebuffer(gl.FRAMEBUFFER, p.state.write.fbo);
            run(p.pass, passSpec?.uniforms?.(frame, round) ?? {}, base, p.state.width, p.state.height);
            gl.bindFramebuffer(gl.FRAMEBUFFER, null);
            swapPingPong(p.state);
          }
        });
        run(main, current.uniforms?.(frame) ?? {}, base, frame.fit.width, frame.fit.height);
      },
      dispose: () => {
        canvas.removeEventListener(CONTEXT_LOST, onLost);
        for (const { texture } of uploaded.values()) gl.deleteTexture(texture);
        for (const p of passes) {
          disposePingPong(gl, p.state);
          disposePass(gl, p.pass);
        }
        disposePass(gl, main);
      },
    };
    return renderer;
  };
}
