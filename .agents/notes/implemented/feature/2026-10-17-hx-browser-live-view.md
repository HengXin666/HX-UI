# Agent Note: hx-browser 实时预览做成库组件, 下游前端直接复用

Status: implemented

Decision-ID: hx-browser-live-view

## Code

- `src/index.ts`
- `src/constants/hxbrowser.ts`
- `src/hxbrowser/BrowserLiveWall.tsx`
- `src/hxbrowser/core/protocol.ts`
- `docs/src/App.tsx`
- `docs/src/pages/BrowserLivePage.tsx`
- `scripts/quality/runtime/graph.ts`
- `scripts/tests/hxbrowser/resolve.ts`

## Problem

hx-browser (HX-Jungle services/hx-browser) 提供多副本实时预览与远程操作: `GET /api/v1/live/envs` 列在跑副本, `WS /api/v1/environments/{id}/live?preset=grid|focus` 下行 CDP screencast 帧, 上行鼠标 / 键盘 / 文本 / 导航 / 标签切换. 第一版的协议客户端和平铺墙 / 聚焦视图写在 HX-Jungle 的 console/hark 里, 别的依赖 hx-browser 的前端想看同一套画面只能再抄一遍协议, 而协议里最容易错的部分 (关闭码语义, 握手后才 4502 的重试计数, 拖出画面后的鼠标释放, 失焦后的按键释放, 聚焦副本消失后的输入去向) 每抄一次就要重新踩一次.

## Decision

- 新增 `src/hxbrowser/`: 协议取值与组件复用的类名 / 变体名按 PROJECT-CONST-DUP 放在 `src/constants/hxbrowser.ts`, 类型在 `core/protocol.ts`. `core/` 是不依赖 React 的部分 (protocol 唯一定义消息, 端点, 关闭码与画质档; transport 解析 baseUrl / apiKey / wsUrlBuilder / WebSocketImpl / fetchImpl; connection 是建连, 停流续流与重连的状态机; input 是输入换算与按下态记账; focus 是聚焦判据; labels 是可覆盖文案). 上层是钩子 `useHxBrowserLive` / `useHxBrowserLiveEnvs` / `useDocumentVisible` / `useElementInView` / `useLiveInput` 与组件 `BrowserLiveTile` / `BrowserLiveView` / `BrowserLiveWall`. 由 `src/hxbrowser/index.ts` 汇总并从 `src/index.ts` 整体导出; 包子路径 `@hx/ui/hxbrowser` 指向同一出口, `@hx/ui/hxbrowser/protocol` 只含协议, 非 React 使用方只引它.
- 关闭码 4400 / 4401 / 4404 不重连; 4502 与网络断开按指数退避 (默认 1.5s 起, 封顶 20s, 5 次). 失败计数在连接保持打开 stableMs (默认 5s) 后才清零, 因为服务端是先 accept 再以 4502 关闭, 在 onopen 清零会让上限永远不触发.
- 断线期间的输入直接丢弃不排队: 排队的点击在重连后落下, 位置和页面都可能已经变了.
- 远程输入安全: 平铺墙里聚焦中的副本从列表消失时回到平铺并提示, 不回退到另一个副本; 列表读取失败不算副本停止. 只有用户在分段控件上主动点聚焦时才选第一个支持预览的副本.
- 聚焦视图在页面转入后台时暂停推流, 瓦片在滚出视口或页面转入后台时暂停. 瓦片画面 object-contain, 不裁切.
- 鼠标按下后在 window 上接管 move / up, 拖出画面松开也转发 up (坐标由服务端夹回); move 带按下时记录的按钮, 右键拖动不会变成左键拖动. 已转发 keydown 的键在失焦, 窗口失焦, 关闭捕获和卸载时补发 keyUp.
- 视觉只用库内组件与语义 token, 图标用 lucide; 水波纹只在按钮, 标签条与分段控件上 (沿用这些组件的默认), 画面容器与瓦片画面不加.
- 单测在 `scripts/tests/hxbrowser/`, node:test 加假 WebSocket 与手动时钟驱动 core; resolve 钩子只给无扩展名相对导入补 .ts. 接入 ci.json 的 tests 与影响图, src 改动会选中它.

## Alternatives considered

- 什么都不做 / 复用现有 (协议与组件留在 HX-Jungle console/hark): 最强理由是只有一个使用方, 放在库里是提前抽象. 否决: 用户明确要求预览浏览器由 HX-UI 提供, 下游依赖 hx-browser 的前端要直接复用; 而且第一版评审里的前端问题几乎全在协议细节上, 留在应用里每个使用方都要各修一遍.
- 只把协议客户端放进库, 组件留给使用方: 依赖最轻. 否决: 平铺 / 聚焦切换的输入安全判据和停流规则正是要共享的部分, 留给使用方等于没共享.
- 用 canvas 渲染帧: 能逐帧做叠加层. 否决: 帧本身是 JPEG, img 直接解码显示, 输入坐标只需要显示矩形, canvas 多一层 drawImage 没有收益.
- 单测引入 vitest / jsdom: 能测组件渲染. 否决: 新增直接依赖要走 HC-DEPS 审批, 而要守的约束都在 core 的纯逻辑里, node:test 足够.

## Consequences

下游只需 `<BrowserLiveWall transport={{ baseUrl: "/hxbr" }} />`. 协议字段改名必须同时改 HX-Jungle 服务端与 `core/protocol.ts`. api_key 走 WS 查询串会进代理日志, 推荐由代理注入 x-api-key 并在 transport 里留空. 没有真浏览器的环境只验证到 core 单测与类型检查, 组件交互要在有 Chromium 的机器上手测.
