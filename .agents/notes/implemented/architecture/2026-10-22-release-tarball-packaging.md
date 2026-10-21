# Agent Note: 发布产物补齐 ESM 扩展名并逐个入口自检

Status: implemented

Decision-ID: release-tarball-packaging

## Code

- `scripts/build-lib.ts`

## Problem

GitHub Release 上的 tarball 能装, 但 node 直接 import 会报 ERR_MODULE_NOT_FOUND: dist 里的相对导入没有扩展名, 而包是 type: module。另外 exports 里几个入口指向 src, 而 files 只打包 dist, 装完这些入口全是 404; 还有一个版本的资产文件名与包内版本号不一致。这些问题在 tsc 与本地门禁里都不会暴露。

## Decision

- 构建改成 scripts/build-lib.ts: 跑 tsc 之后遍历 dist, 把相对说明符补成 .js 或 /index.js, 再拷 CSS, LICENSE 与 NOTICE。
- exports 全部指向 dist 下真实存在的文件, 并把 src 加进 files: 源码别名是已登记的使用方式, 不能指向一个没被打包的目录。
- React Flow 的骨架样式从组件里移到 src/styles.css: 组件内 import CSS 会让库在 Node 侧不可导入 (Node 不认 .css), 而画布样式本来就属于"引了样式才生效"的那一类。
- 新增 scripts/verify-pack.ts 并在 release 工作流里跑: 打包, 装进临时目录 (显式装 react 与 react-dom), 逐个 exports 入口做 import.meta.resolve, 再 import 一次包根。
- release 工作流改成从 npm pack --json 取真实资产名, 并在打包前断言 tag 与 package.json 的 version 一致。

## Alternatives considered

- 什么都不做 / 复用现有: 最强理由是 tarball 确实能装, 打包工具会自动补扩展名, 大多数消费方能跑。否决: 官方发布路径没有 registry 的安装反馈, SSR 与 Node 侧一用就炸, 而这种错误在本地门禁全绿。
- 只把打包工具换成 tsup / rollup: 一次解决扩展名问题。否决: 引入新的构建链与配置成本, 而且 tsc 的声明产物本来就要保留; 后处理只多一个脚本。
- 删掉 ./src/* 入口而不把 src 打进包: 包更小。否决: 源码别名是 README 里登记过的取用方式, 删掉会破坏已有使用方。
- 保留组件内的 CSS import, 只在文档里说明"仅打包器可用": 代码最少。否决: 那等于承认这个包不能被 Node 导入, 而降级到样式入口是一行改动。

## Consequences

发布产物在 Node 与打包器下都能导入, 每个 exports 入口在 CI 里被真实解析一次。代价是 dist 里多了 src 目录, tarball 变大; 新增或改名入口时必须同步 verify-pack 的期望。
