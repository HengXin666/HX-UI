/**
 * 发布产物脚本 (build-lib.ts, verify-pack.ts) 专用的路径与文件名.
 * 通用的编码, stdio 与包根导出键复用 quality.ts 里的 UTF8 / STDIO_INHERIT / DOT / NODE_MODULES.
 */

/** 源码目录: CSS 入口从这里拷进 dist. */
export const SRC_DIR = "src";

/** 随包分发的许可证文件. */
export const LICENSE_FILE = "LICENSE";
