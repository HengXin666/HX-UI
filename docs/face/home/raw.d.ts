/** Vite 的 ?raw 导入: 文件原文. 首页从 package.json 原文里读版本号, 不另写一份. */
declare module "*?raw" {
  const text: string;
  export default text;
}
