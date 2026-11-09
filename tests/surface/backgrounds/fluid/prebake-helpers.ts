/**
 * fluid 路预烘件的测试桩: 宿主画布拿到 WebGL2 记录桩, 预烘画布拿到 2D 记录桩 (createImageData 返回真字节, getImageData 给取色用).
 */

/**
 * 同时桩住 webgl2 与 2d 上下文.
 *
 * @param glCalls 记录 WebGL 调用名.
 * @param ctxCalls 记录 2D 调用名.
 */
export function mockWebgl2And2d(glCalls: string[], ctxCalls: string[]): () => void {
  const original = HTMLCanvasElement.prototype.getContext;
  const gl = new Proxy({}, {
    get: (_target, key) => (..._args: unknown[]) => {
      glCalls.push(String(key));
      return {};
    },
  });
  const ctx = new Proxy({}, {
    get: (_target, key) => {
      if (key === "then") return undefined;
      if (key === "getImageData") return () => ({ data: new Uint8ClampedArray(4) });
      if (key === "createImageData") return (w: number, h: number) => ({ data: new Uint8ClampedArray(w * h * 4) });
      return (..._args: unknown[]) => {
        ctxCalls.push(String(key));
      };
    },
    set: () => true,
  });
  HTMLCanvasElement.prototype.getContext = function getContext(kind: string) {
    if (kind === "webgl2") return gl;
    return kind === "2d" ? ctx : null;
  } as typeof original;
  return () => {
    HTMLCanvasElement.prototype.getContext = original;
  };
}
