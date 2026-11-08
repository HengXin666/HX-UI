// 行为规格参照 docs/research/catalog/backgrounds-1.md 的 Backgrounds 族共用 (单画布, DPR 上限, 离屏停帧) 条目, 实现为 HX 自有.

/** 一个 uniform 的值. 数字 / 布尔是 float; 2 到 4 个数是 vecN; UniformList 是数组 uniform. */
export type UniformValue = number | boolean | readonly number[] | UniformList;
export type UniformMap = Readonly<Record<string, UniformValue | undefined>>;

/** 数组 uniform (float u_x[8] 或 vec3 u_x[5]): 平铺的数, 每个元素 size 个分量. */
export interface UniformList {
  readonly list: ArrayLike<number>;
  readonly size: 1 | 2 | 3 | 4;
}

export type UniformKind = "1f" | "2f" | "3f" | "4f" | "1fv" | "2fv" | "3fv" | "4fv";

const VEC_KINDS: Readonly<Record<number, UniformKind>> = { 2: "2f", 3: "3f", 4: "4f" };
const LIST_KINDS: Readonly<Record<number, UniformKind>> = { 1: "1fv", 2: "2fv", 3: "3fv", 4: "4fv" };

/** 全屏三角形的顶点着色器: 一个盖住裁剪空间的大三角, 比两个三角少一条对角线上的重复片元. */
export const FULLSCREEN_VERTEX = `#version 300 es
in vec2 a_corner;
out vec2 v_uv;
void main() {
  v_uv = a_corner * 0.5 + 0.5;
  gl_Position = vec4(a_corner, 0.0, 1.0);
}`;
/** 顶点 (-1,-1) (3,-1) (-1,3): 先写成 0..4 的格点再整体平移. */
const FULLSCREEN_TRIANGLE = new Float32Array([0, 0, 4, 0, 0, 4].map((v) => v - 1));
const CORNER_ATTRIBUTE = "a_corner";
const TRIANGLE_VERTICES = 3;

/**
 * 由值的形状推断 uniform 的写入函数. 推不出 (空数组, 5 个以上的裸数组) 返回 null, 调用方跳过.
 * 纯函数, 不碰 GL, 单测直接覆盖.
 */
export function uniformKind(value: UniformValue | undefined): UniformKind | null {
  if (value === undefined) return null;
  if (typeof value === "number" || typeof value === "boolean") return "1f";
  if ("list" in value) return LIST_KINDS[value.size] ?? null;
  return VEC_KINDS[value.length] ?? null;
}

/** uniform 值摊平成 Float32Array, 供 uniformNfv 用. */
export function uniformData(value: UniformValue): Float32Array {
  if (typeof value === "number") return new Float32Array([value]);
  if (typeof value === "boolean") return new Float32Array([value ? 1 : 0]);
  if ("list" in value) return value.list instanceof Float32Array ? value.list : Float32Array.from(value.list);
  return Float32Array.from(value);
}

function compile(gl: WebGL2RenderingContext, type: number, source: string): WebGLShader | null {
  const shader = gl.createShader(type);
  if (!shader) return null;
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (gl.getShaderParameter(shader, gl.COMPILE_STATUS)) return shader;
  console.warn(gl.getShaderInfoLog(shader));
  gl.deleteShader(shader);
  return null;
}

/** 一个片元程序及其全屏几何. */
export interface ShaderPass {
  readonly program: WebGLProgram;
  readonly vao: WebGLVertexArrayObject;
  readonly locations: Map<string, WebGLUniformLocation | null>;
}

/**
 * 编译链接一个全屏片元程序. 失败时在控制台留下编译日志并返回 null, 调用方退到 CSS 兜底.
 *
 * @param gl WebGL2 上下文.
 * @param fragment 完整的 GLSL ES 3.00 片元源码.
 */
export function createPass(gl: WebGL2RenderingContext, fragment: string): ShaderPass | null {
  const vs = compile(gl, gl.VERTEX_SHADER, FULLSCREEN_VERTEX);
  const fs = compile(gl, gl.FRAGMENT_SHADER, fragment);
  const program = vs && fs ? gl.createProgram() : null;
  if (!program) return null;
  gl.attachShader(program, vs);
  gl.attachShader(program, fs);
  gl.bindAttribLocation(program, 0, CORNER_ATTRIBUTE);
  gl.linkProgram(program);
  gl.deleteShader(vs);
  gl.deleteShader(fs);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    console.warn(gl.getProgramInfoLog(program));
    gl.deleteProgram(program);
    return null;
  }
  const vao = gl.createVertexArray();
  const buffer = gl.createBuffer();
  gl.bindVertexArray(vao);
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, FULLSCREEN_TRIANGLE, gl.STATIC_DRAW);
  gl.enableVertexAttribArray(0);
  gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
  gl.bindVertexArray(null);
  return { program, vao, locations: new Map() };
}

function locate(gl: WebGL2RenderingContext, pass: ShaderPass, name: string): WebGLUniformLocation | null {
  if (!pass.locations.has(name)) pass.locations.set(name, gl.getUniformLocation(pass.program, name));
  return pass.locations.get(name) ?? null;
}

/**
 * 写一批 uniform. 着色器里没用到 (被编译器裁掉) 的名字静默跳过, 位置查询按名字缓存.
 *
 * @param gl WebGL2 上下文, 调用前 useProgram 已指向 pass.program.
 * @param pass 目标程序.
 * @param values 名字到值.
 */
export function applyUniforms(gl: WebGL2RenderingContext, pass: ShaderPass, values: UniformMap): void {
  for (const name of Object.keys(values)) {
    const value = values[name];
    const kind = uniformKind(value);
    const at = kind ? locate(gl, pass, name) : null;
    if (!at) continue;
    const data = uniformData(value);
    if (kind === "1f") gl.uniform1f(at, data[0]);
    else if (kind === "2f") gl.uniform2fv(at, data);
    else if (kind === "3f") gl.uniform3fv(at, data);
    else if (kind === "4f") gl.uniform4fv(at, data);
    else if (kind === "1fv") gl.uniform1fv(at, data);
    else if (kind === "2fv") gl.uniform2fv(at, data);
    else if (kind === "3fv") gl.uniform3fv(at, data);
    else gl.uniform4fv(at, data);
  }
}

/** 把采样器名绑到纹理单元. */
export function bindTexture(gl: WebGL2RenderingContext, pass: ShaderPass, name: string, texture: WebGLTexture | null, unit: number): void {
  const at = locate(gl, pass, name);
  if (!at || !texture) return;
  gl.activeTexture(gl.TEXTURE0 + unit);
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.uniform1i(at, unit);
}

/** 画一遍全屏三角. */
export function drawPass(gl: WebGL2RenderingContext, pass: ShaderPass): void {
  gl.bindVertexArray(pass.vao);
  gl.drawArrays(gl.TRIANGLES, 0, TRIANGLE_VERTICES);
}

/**
 * 上传图像为线性过滤, 边缘夹取的纹理. 已有纹理时原地覆盖, 返回同一个句柄.
 *
 * @param gl WebGL2 上下文.
 * @param image 图像, 画布或视频帧.
 * @param reuse 要覆盖的已有纹理.
 */
export function uploadTexture(gl: WebGL2RenderingContext, image: TexImageSource, reuse?: WebGLTexture | null): WebGLTexture | null {
  const texture = reuse ?? gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  return texture;
}

/** 释放一个 pass 的程序与几何. */
export function disposePass(gl: WebGL2RenderingContext, pass: ShaderPass): void {
  gl.deleteProgram(pass.program);
  gl.deleteVertexArray(pass.vao);
}
