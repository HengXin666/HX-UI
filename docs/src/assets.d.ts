declare module "*.webp" { const url: string; export default url; }
declare module "*.png" { const url: string; export default url; }

/** Vite 的 worker 导入: 返回一个构造函数, 调用后得到 Worker 实例. */
declare module "*?worker" {
  const WorkerFactory: new () => Worker;
  export default WorkerFactory;
}
