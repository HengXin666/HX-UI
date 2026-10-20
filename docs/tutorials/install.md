# 安装

本库**不依赖 npm 账号**: 三种取用方式任选,

## 方式一: GitHub Release 的 tarball (推荐)

```sh
pnpm add https://github.com/HengXin666/HX-UI/releases/download/v0.1.0/hx-ui-0.1.0.tgz
```

不需要 token 也不需要登录, tag 与文件名对应: `v<version>` 对应 `hx-ui-<version>.tgz`,
打 tag 时 `.github/workflows/release.yml` 会自动构建并把 tarball 挂到 Release,

## 方式二: git 依赖 (跟着 main 走)

```json
{ "dependencies": { "@hx/ui": "github:HengXin666/HX-UI" } }
```

安装 git 依赖时 pnpm 会执行 `prepare` (等于 `npm run build:lib`), 由本仓库的 tsc 现构建产物,

## 方式三: 源码别名 (做主题定制时)

```ts
// vite.config.ts
resolve: { alias: [{ find: /^@hx\/ui$/, replacement: resolve(uiSrc(), "index.ts") }] }
```

## 关于 npmjs

发布到 npmjs 需要 npm 账号与 token, 本仓库默认不走这条路, 需要时把 `package.json` 的
`publishConfig` 指到目标 registry 再 `npm publish`, 产物与 Release 里的 tarball 完全一致,

## 包内容

| 入口 | 路径 |
|---|---|
| 组件与类型 | `dist/index.js` / `dist/index.d.ts` |
| 令牌 (零依赖) | `@hx/ui/tokens.css` |
| Tailwind 4 桥接 | `@hx/ui/styles.css` |
| 动效 / 自旋 / 原生下拉 | `@hx/ui/motion.css`, `spin-variants.css`, `native-select.css` |
| 源码 | `@hx/ui/src/*` (给别名方式用) |
