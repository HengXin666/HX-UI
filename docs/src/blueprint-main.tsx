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
import { createDshRegistry, dshAgentLoopGraph } from "@hx/blueprint-demo";

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

type Source = "dsh" | "demo";

const REGISTRIES: Record<Source, () => ReturnType<typeof createRegistry>> = {
  dsh: () => createDshRegistry() as ReturnType<typeof createRegistry>,
  demo: () => demoRegistry as ReturnType<typeof createRegistry>,
};

const DEFAULT_GRAPHS: Record<Source, BlueprintGraph> = {
  dsh: dshAgentLoopGraph,
  demo: demoGraph as BlueprintGraph,
};

function readSource(): Source {
  const m = /(?:^|&)src=([^&]+)/.exec(window.location.hash);
  return m && m[1] === "demo" ? "demo" : "dsh";
}

function readChannel(): string {
  const m = /(?:^|&)channel=([^&]+)/.exec(window.location.hash);
  return m ? decodeURIComponent(m[1]) : "hx-blueprint";
}

function BlueprintApp(): JSX.Element {
  const [source, setSource] = useState<Source>(() => readSource());
  const channel = useMemo(() => readChannel(), []);
  const registry = useMemo(() => REGISTRIES[source](), [source]);

  const [graph, setGraph] = useState<BlueprintGraph>(
    () => graphFromUrl(window.location.hash) ?? DEFAULT_GRAPHS[source]
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
          {(["dsh", "demo"] as const).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => {
                setSource(s);
                setGraph(DEFAULT_GRAPHS[s]);
              }}
              className={cn(
                "rounded px-1.5 py-0.5 text-[11px] transition-colors",
                source === s ? "bg-accent text-foreground" : "text-muted-foreground hover:text-foreground"
              )}
            >
              {s === "dsh" ? "dsh agent loop" : "演示节点"}
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
        <BlueprintEditor
          registry={registry}
          value={graph}
          onChange={onGraphChange}
          height="100%"
          paletteWidth={190}
        />
      </div>
    </div>
  );
}

const el = document.getElementById("root");
if (el) createRoot(el).render(<BlueprintApp />);
