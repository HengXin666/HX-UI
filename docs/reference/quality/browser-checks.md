# 浏览器检查的背景与边界

本文保存 `scripts/check-smoke.ts`, `scripts/check-shell.ts` 与 `docs/scripts/check-icons.ts` 的设计原因, 脚本头注释只保留用途与用法.

## 文档站冒烟 (check-smoke)

补组件时曾有两个文档页渲染成全白: Tooltip 页因为 radix 在 Provider 之外抛 `must be used within TooltipProvider`, TimePicker 页因为误用了 SettingSection 的 API. 两者都通过了 `tsc --noEmit`, `vite build`, 设计规约门禁与图标门禁. 唯一能抓到的手段是真的在浏览器里打开一次, 看 DOM 里有没有内容.

判据两条同时看, 避免单条误判:

1. 渲染后的 DOM 里存在 `<h1>`, 每个文档页都有标题, 白屏时没有
2. DOM 体积不低于 20000 bytes, 正常页最少约 31KB, 白屏约 5.5KB

uncaught 错误只作为报告信息, 不单独判失败, 因为部分第三方库会打印无害警告. 页面清单从 `docs/src/nav.ts` 提取, 不在脚本里抄一份.

无浏览器时默认跳过并打印警告 (exit 0), 避免把本地开发卡在没装 chromium 上; CI 使用 `--strict`, 无浏览器即失败. chromium 按 `CHROMIUM_PATH` 与 PATH 中的 chromium, chromium-browser, google-chrome, google-chrome-stable 查找. 迁移到 .ts 时去掉了写死的系统绝对路径候选 (PROJECT-NO-ABS-PATH), 浏览器不在 PATH 时请设置 `CHROMIUM_PATH`.

## 外壳交互检查 (check-shell)

check-smoke 只回答页面是否渲染. 渲染正常但功能不对的问题需要断言行为: 生成物缺失 (目录在但标题没有 id, 目录点不动) 与交互没接上 (按钮在但点了没反应).

边界: 本检查能稳定抓到元素/属性缺失类故障, 抓不到只在开发模式显形的不纯 updater 写法. 曾经把主题切换状态误判为脱节, 实际是探针在 React 提交前读值; 因此读更新后的 DOM 一律等一次提交, 用 setTimeout 轮询.

探针页面是注入 dist 的临时文件, 用完立即删除, 避免被当成真实静态页.

## 产物目录

两个浏览器检查在设置 `HX_QUALITY_BUILD` 时读取其中的 `docs-dist` (CI 的 build 产物), 否则读取 `docs/dist`.

## 图标名校验 (check-icons)

Iconify 类串是字符串, Tailwind 与 TS 都管不到, 写错不会报错, 只会让位置空着. 脚本对照 `docs/node_modules/@iconify-json/<set>/icons.json` 校验 `docs/src` 与 `src` 中的 `icon-[<set>--<name>]`. 图标集是否已在根 package.json 声明由 PROJECT-UI-ICON-DECLARED 负责.
