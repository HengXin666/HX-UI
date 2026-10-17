/**
 * 让 Node 直接运行 src 下的无扩展名相对导入 (库按 bundler 解析写法, Node ESM 要求扩展名).
 * 只补 .ts 与 /index.ts, 不做任何转译; 类型由 Node 自带的类型擦除处理.
 */
import { register } from "node:module";

register("./resolve.ts", import.meta.url);
