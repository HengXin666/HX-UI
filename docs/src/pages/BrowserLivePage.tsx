import type { JSX } from "react";
import {
  BrowserLiveStatus, BrowserLiveTile, LIVE_STATUS, type HxBrowserTransport, type LiveEnv, type LiveStatus,
} from "@hx/ui";
import { Callout, Code, H2, P, Preview, PropsTable } from "../components/DocKit";

/** 文档站没有 hx-browser 服务: 用一个永不握手的 WebSocket 演示连接中的瓦片. */
class SilentSocket {
  readyState = 0;
  onopen = null;
  onmessage = null;
  onclose = null;
  send(): void {}
  close(): void {}
}

const DEMO_TRANSPORT: HxBrowserTransport = {
  baseUrl: "/hxbr",
  WebSocketImpl: SilentSocket as unknown as typeof WebSocket,
};

const BASE_ENV: LiveEnv = {
  id: "demo-1", name: "cloak-01", group: "", kernel: "cloak", kernel_family: "blink",
  isolation: "sandbox", window_system: "x11", display: ":99", display_source: "xvfb",
  visible: false, running: true, supported: true, unsupported_reason: "",
};

const GECKO_ENV: LiveEnv = {
  ...BASE_ENV, id: "demo-2", name: "firefox-01", kernel: "firefox", kernel_family: "gecko",
  isolation: "process", supported: false,
  unsupported_reason: "Firefox 系内核没有 CDP Page.startScreencast, 实时预览暂不支持",
};

const STATUSES: LiveStatus[] = Object.values(LIVE_STATUS).filter((s) => s !== LIVE_STATUS.idle);

const USAGE = `import { BrowserLiveWall, type HxBrowserTransport } from "@hx/ui";

// 开发代理把 /hxbr 转到 hx-browser (需开启 ws), api_key 由代理注入请求头
const transport: HxBrowserTransport = { baseUrl: "/hxbr" };

export function LivePage() {
  return <BrowserLiveWall title="实时预览" transport={transport} />;
}`;

const HOOK = `const live = useHxBrowserLive({ baseUrl: "/hxbr", envId, preset: "focus", paused: !visible });
live.status;   // connecting | live | paused | reconnecting | refused | failed
live.frame;    // 最新一帧 data URL
live.send({ type: "navigate", url: "example.org" });`;

/**
 * hx-browser 实时预览组件页: 用法, 安全约束与属性表.
 *
 * .agents/notes/implemented/feature/2026-10-17-hx-browser-live-view.md
 */
export function BrowserLivePage(): JSX.Element {
  return (
    <>
      <P>
        hx-browser 多副本实时预览与远程操作. 协议客户端, 钩子与组件全部在库里, 任何依赖 hx-browser 的前端
        给一个 <Code>baseUrl</Code> 就能直接复用, 不需要再写一遍 WebSocket 协议.
      </P>
      <H2>整页: BrowserLiveWall</H2>
      <Preview code={USAGE}>
        <div className="grid w-full grid-cols-[repeat(auto-fill,minmax(16rem,1fr))] gap-3">
          <BrowserLiveTile env={BASE_ENV} transport={DEMO_TRANSPORT} />
          <BrowserLiveTile env={GECKO_ENV} transport={DEMO_TRANSPORT} />
        </div>
      </Preview>
      <Callout title="远程输入只落在用户选中的副本上">
        聚焦中的副本在别处被停掉时, 墙会回到平铺并提示, 不会自动换成另一个副本. 瓦片只看不操作.
      </Callout>
      <H2>连接状态</H2>
      <Preview>
        {STATUSES.map((s) => (
          <BrowserLiveStatus key={s} status={s} />
        ))}
      </Preview>
      <H2>只要协议: useHxBrowserLive</H2>
      <Preview code={HOOK}>
        <P>
          4400 / 4401 / 4404 不重连; 4502 与网络断开按指数退避重连, 连接稳定 5 秒后才清零失败计数.
          页面转入后台或瓦片滚出视口时自动暂停推流. 不用 React 时可直接用 <Code>LiveConnection</Code>,
          只要类型与常量可引 <Code>@hx/ui/hxbrowser/protocol</Code>.
        </P>
      </Preview>
      <H2>传输属性 (HxBrowserTransport)</H2>
      <PropsTable
        rows={[
          { name: "baseUrl", type: "string (URL 前缀)", desc: "服务前缀: 代理前缀, 空串 (同源) 或绝对地址" },
          { name: "apiKey", type: "string | undefined", desc: "WS 只能走查询串; 更稳妥的是在代理上注入 x-api-key" },
          { name: "wsUrlBuilder", type: "(path, query) => string", desc: "自定义 WS 地址, 例如经网关签名" },
          { name: "WebSocketImpl", type: "WebSocket 构造器", desc: "注入其他实现或测试替身" },
          { name: "fetchImpl", type: "fetch", desc: "读副本列表用的 fetch" },
          { name: "origin", type: "string (origin)", default: "location.origin", desc: "解析相对 baseUrl 用" },
        ]}
      />
    </>
  );
}
