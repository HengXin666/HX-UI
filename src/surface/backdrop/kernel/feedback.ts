// 行为规格参照 docs/research/catalog/backgrounds-1.md 的 Backgrounds 族共用 (单画布, DPR 上限, 离屏停帧) 条目, 实现为 HX 自有.

/** 一张可渲染的纹理. */
interface Target {
  readonly fbo: WebGLFramebuffer | null;
  readonly texture: WebGLTexture | null;
}

/**
 * 乒乓缓冲: 上一帧的状态在 read, 本帧写进 write, 画完 swap. 流体染料, 拖尾, 迭代模拟都靠它.
 * 支持 EXT_color_buffer_float 时用半精度浮点, 否则退到 8 位 (精度不够的场在 note 里记为 ENGINE-GAP).
 */
export interface PingPong {
  read: Target;
  write: Target;
  width: number;
  height: number;
  readonly float: boolean;
}

/**
 * 状态缓冲的尺寸: 按 scale 缩小画布, 至少 1 像素. 模拟场不需要满分辨率.
 *
 * @param width 画布设备像素宽.
 * @param height 画布设备像素高.
 * @param scale 缩放, 0..1.
 */
export function feedbackSize(width: number, height: number, scale: number): readonly [number, number] {
  const s = Math.min(1, Math.max(0, scale)) || 1;
  return [Math.max(1, Math.round(width * s)), Math.max(1, Math.round(height * s))];
}

function makeTarget(gl: WebGL2RenderingContext, width: number, height: number, float: boolean): Target {
  const texture = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texImage2D(gl.TEXTURE_2D, 0, float ? gl.RGBA16F : gl.RGBA8, width, height, 0, gl.RGBA, float ? gl.HALF_FLOAT : gl.UNSIGNED_BYTE, null);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  const fbo = gl.createFramebuffer();
  gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
  gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);
  gl.clearColor(0, 0, 0, 0);
  gl.clear(gl.COLOR_BUFFER_BIT);
  gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  return { fbo, texture };
}

function dropTarget(gl: WebGL2RenderingContext, target: Target): void {
  gl.deleteFramebuffer(target.fbo);
  gl.deleteTexture(target.texture);
}

/** 建一对状态缓冲, 内容清零. */
export function createPingPong(gl: WebGL2RenderingContext, width: number, height: number): PingPong {
  const float = gl.getExtension("EXT_color_buffer_float") !== null;
  return { read: makeTarget(gl, width, height, float), write: makeTarget(gl, width, height, float), width, height, float };
}

/** 尺寸变了就重建 (状态清零); 没变什么都不做. */
export function resizePingPong(gl: WebGL2RenderingContext, pp: PingPong, width: number, height: number): void {
  if (pp.width === width && pp.height === height) return;
  dropTarget(gl, pp.read);
  dropTarget(gl, pp.write);
  pp.read = makeTarget(gl, width, height, pp.float);
  pp.write = makeTarget(gl, width, height, pp.float);
  pp.width = width;
  pp.height = height;
}

/** 本帧写完后交换读写. */
export function swapPingPong(pp: PingPong): void {
  const next = pp.read;
  pp.read = pp.write;
  pp.write = next;
}

/** 释放两张纹理与帧缓冲. */
export function disposePingPong(gl: WebGL2RenderingContext, pp: PingPong): void {
  dropTarget(gl, pp.read);
  dropTarget(gl, pp.write);
}
