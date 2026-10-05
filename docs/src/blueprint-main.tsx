"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type JSX } from "react";
import { createRoot } from "react-dom/client";
import "./styles.css";

import {
  BlueprintCanvas, BlueprintEditor, BlueprintPalette,
  createRegistry, demoRegistry, demoGraph,
  validateGraph, autoLayout, applyLayout,
  SyncChannel, graphFromUrl, graphToHash,
  Badge, Button, Card, CardContent, CardHeader, CardTitle,
  cn, type BlueprintGraph,
} from "@hx/ui";
import { createDshRegistry, buildRootGraph, dshAgentLoopGraph, createSourceRegistry } from "@hx/blueprint-demo";
import { RfPane } from "./RfPane";

/**
 * 蓝图的**独立页面**。
 *
 * ## 为什么是独立页面而不是内嵌全屏
 *
 * 内嵌全屏做到头也只是"画布变大": 文档站的侧栏、顶栏、内容区滚动容器
 * 都还在, 而且画布尺寸受限于内容区。独立页面给的是**整屏归蓝图**,
 * 还能白拿浏览器原生的窗口管理 —— 新标签页、独立窗口、左右分屏。
 *
 * ## 数据从哪来 (三路, 按优先级)
 *
 *   1. URL 里的 `#graph=<base64>`   直接内联, 打开就有内容, 不等同步
 *   2. BroadcastChannel 同步        同源其它页面正在编辑的同一张图
 *   3. 内置的 dsh / demo 图         都没拿到时的兜底
 *
 * 顺序有讲究: 先内联再同步。只靠同步的话新页面会先白一下再跳变,
 * 那个跳变很难看, 而且会让用户以为"没打开成功"。
 */

/**
 * 三套数据源, 每套**必须**配与自己同源的注册表。
 *
 * ⚠️ 这里踩过一次实打实的坑, 值得写下来:
 *   原来 `dsh` 这一档是 `createDshRegistry()` (架构层, 10 个大步骤)
 *   配 `dshAgentLoopGraph` (源码层, 33 个节点, 类型名是 agentCreated / kick /
 *   turnStart …)。两套东西**不是一套命名空间**: 架构层的注册表里根本没有
 *   agentCreated 这个类型。
 *
 *   后果不是报错, 而是**静默降级**: 33 个节点全部渲染成"未知节点"红卡片,
 *   页面顶部报 "85 个错误", 而 tsc / 构建 / 冒烟全绿 —— 因为"未注册"是
 *   运行期的一条合法分支。用户看到的就是"这库一滩狗屎、功能全失效",
 *   而代码看着毫无问题。
 *
 *   所以这里把三套各自配好, 并且**新增 src=source 这一档**让旧的源码层
 *   图仍然可访问 (它有价值: 60 个节点对应真实控制流, 可逐条核对)。
 */
type Source = "dsh" | "source" | "demo";

const REGISTRIES: Record<Source, () => ReturnType<typeof createRegistry>> = {
  // 架构层: 根图 10 个大步骤 + 可进入的子图
  dsh: () => createDshRegistry() as ReturnType<typeof createRegistry>,
  // 源码层: 33 个节点对应 dsh 源码控制流
  source: () => createSourceRegistry() as ReturnType<typeof createRegistry>,
  // 库自带的最小演示
  demo: () => demoRegistry as ReturnType<typeof createRegistry>,
};

/**
 * 从 hash 里读一个参数。
 *
 * ⚠️ 分隔符必须同时认 `#` / `&` / `?`, 不能只写 `(?:^|&)`:
 *   `location.hash` 是 **带 `#` 的** (`"#src=demo"`), 而 `^` 匹配的是
 *   `"src"` 那个位置之前的开头 —— 那里是 `#` 不是行首, 于是匹配不上。
 *   实测三个 source 全都返回同一张图就是这个原因: src 从来没生效过,
 *   页面一直用默认的 dsh。
 *
 *   同一个坑 sync.ts 的 graphFromUrl 里已经踩过并修了 (注释也在那儿),
 *   这里漏修会造成"文档说支持 #src=, 实际不支持"这种静默失效。
 */
function readHashParam(key: string): string | null {
  const m = new RegExp(`(?:^|[&#?])${key}=([^&]+)`).exec(window.location.hash);
  return m ? decodeURIComponent(m[1]) : null;
}

function readSource(): Source {
  const v = readHashParam("src");
  if (v === "demo") return "demo";
  if (v === "source") return "source";
  return "dsh";
}

/**
 * 默认图按 source 现算, 不预先构造。
 *
 * 为什么: buildRootGraph() 每次返回**新的**节点 id 与对象。在模块顶层直接
 * 求值的话, 三个 source 的图会在 import 时就全部构造一遍 (浪费), 而且
 * dshAgentLoopGraph 那份是模块级常量、被多处共享, 一旦被编辑过就会带着
 * 改动污染下一次打开 —— 表现是"我明明刷新了, 怎么还是改过的样子"。
 */
function defaultGraph(source: Source): BlueprintGraph {
  switch (source) {
    case "dsh": return buildRootGraph().graph as BlueprintGraph;
    case "source": return dshAgentLoopGraph as BlueprintGraph;
    default: return demoGraph as BlueprintGraph;
  }
}

function readChannel(): string {
  return readHashParam("channel") ?? "hx-blueprint";
}

function BlueprintApp(): JSX.Element {
  const [source, setSource] = useState<Source>(() => readSource());
  /**
   * 默认走 React Flow 版画布。
   *
   * 手写版已下线, 但保留 `&rf=0` 以便对照回归 —— 并行期结束后删掉。
   */
  const useRF = useMemo(() => !/[&#?]rf=0/.test(window.location.hash), []);
  const channel = useMemo(() => readChannel(), []);
  const registry = useMemo(() => REGISTRIES[source](), [source]);

  const [graph, setGraph] = useState<BlueprintGraph>(
    () => graphFromUrl(window.location.hash) ?? defaultGraph(source)
  );
  const [linkCopied, setLinkCopied] = useState(false);
  const [peerCount, setPeerCount] = useState(0);

  /**
   * 同步通道。
   *
   * `onRequest` 返回当前图, 让后开的页面能立刻拿到状态, 而不是白屏等。
   * 用 ref 读最新图 —— 回调是在构造时注册的, 闭包会读到旧值。
   */
  const graphRef = useRef(graph);
  graphRef.current = graph;

  const syncRef = useRef<SyncChannel | null>(null);
  useEffect(() => {
    const sync = new SyncChannel({
      channel,
      onRemote: (g) => setGraph(g),
      onRequest: () => graphRef.current,
    });
    syncRef.current = sync;
    return () => {
      sync.close();
      syncRef.current = null;
    };
  }, [channel]);

  // 本地改动 -> 广播
  const onGraphChange = useCallback((g: BlueprintGraph) => {
    setGraph(g);
    syncRef.current?.publish(g);
  }, []);

  // 卸载 / 关页前把最后一笔发出去
  useEffect(() => {
    const onLeave = () => syncRef.current?.flush();
    window.addEventListener("pagehide", onLeave);
    return () => window.removeEventListener("pagehide", onLeave);
  }, []);

  const v = useMemo(() => validateGraph(registry, graph), [registry, graph]);
  const errors = v.issues.filter((i) => i.level === "error");

  /** 把当前图编码成可分享的链接。太大就退回只带频道名。 */
  const shareLink = useCallback(() => {
    const enc = graphToHash(graph);
    const base = `${window.location.origin}${window.location.pathname}`;
    const tail = enc
      ? `#src=${source}&channel=${encodeURIComponent(channel)}&graph=${enc}`
      : `#src=${source}&channel=${encodeURIComponent(channel)}`;
    void navigator.clipboard?.writeText(base + tail).catch(() => undefined);
    setLinkCopied(true);
    setTimeout(() => setLinkCopied(false), 1600);
  }, [graph, source, channel]);

  const tidy = useCallback(() => {
    const layout = autoLayout(registry, graph);
    onGraphChange(applyLayout(graph, layout));
  }, [registry, graph, onGraphChange]);

  return (
    <div className="flex h-dvh flex-col bg-background text-foreground">
      {/* 顶栏。刻意很矮 —— 这一页的主角是画布。 */}
      <header className="flex shrink-0 items-center gap-2 border-b border-border px-3 py-1.5">
        <span className="text-[13px] font-medium">蓝图</span>

        <div className="flex items-center gap-1">
          {(["dsh", "source", "demo"] as const).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => {
                setSource(s);
                setGraph(defaultGraph(s));
              }}
              className={cn(
                "rounded px-1.5 py-0.5 text-[11px] transition-colors",
                source === s ? "bg-accent text-foreground" : "text-muted-foreground hover:text-foreground"
              )}
            >
              {s === "dsh" ? "dsh agent loop" : s === "source" ? "源码层" : "演示节点"}
            </button>
          ))}
        </div>

        <span className="mx-1 h-3 w-px bg-border" />

        <Badge variant={errors.length ? "destructive" : "success"}>
          {errors.length ? `${errors.length} 个错误` : "校验通过"}
        </Badge>
        <span className="text-[11px] tabular-nums text-muted-foreground">
          {graph.nodes.length} 节点 / {graph.edges.length} 连线
        </span>

        <div className="ml-auto flex items-center gap-1.5">
          <span className="text-[11px] text-muted-foreground">
            频道 <code className="rounded bg-muted/60 px-1">{channel}</code>
          </span>
          <Button size="xs" variant="outline" onClick={tidy} title="按流向分层重排 (确定性)">
            整理布局
          </Button>
          <Button size="xs" variant="outline" onClick={shareLink}>
            {linkCopied ? "已复制" : "复制链接"}
          </Button>
          <a
            href="../#/blueprint-dsh"
            className="rounded border border-border px-1.5 py-0.5 text-[11px] text-muted-foreground transition-colors hover:text-foreground"
          >
            回文档
          </a>
        </div>
      </header>

      <div className="min-h-0 flex-1 p-2">
        {useRF ? (
          <RfPane registry={registry} graph={graph} validation={v} onChange={onGraphChange} />
        ) : (
          // 手写版仅作对照 (&rf=0), 并行期结束后随 BlueprintEditor 一起删
          <BlueprintEditor registry={registry} value={graph} onChange={onGraphChange} height="100%" paletteWidth={190} />
        )}
      </div>
    </div>
  );
}

const el = document.getElementById("root");
if (el) createRoot(el).render(<BlueprintApp />);
