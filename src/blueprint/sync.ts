import type { BlueprintGraph } from "./types";
import { parseGraph, serializeGraph } from "./serialize";

/**
 * 多标签页之间的图同步。
 *
 * ## 为什么需要
 *
 * 蓝图开在独立页面里编辑, 而用户可能开了好几个 —— 或者文档站那个页面
 * 也开着同一张图。不同步的话, 两个页面各自改各自的, 后存的那份会覆盖
 * 前一份, 而用户看到的却是"我明明改了, 怎么没了"。
 *
 * ## 三条可选的路, 以及为什么选 BroadcastChannel
 *
 *   1. **BroadcastChannel** —— 同源多标签页直连。零依赖、零后端、零磁盘,
 *      消息内存传递, 延迟亚毫秒。缺点: 只在**打开着的**页面之间同步,
 *      全关了就没了; 且不能跨浏览器/跨设备。
 *   2. **localStorage + storage 事件** —— 能持久化, 但它是"写全量字符串",
 *      一张大图每次改动都全量 JSON 序列化一遍并落盘, 高频拖节点时会很卡
 *      (拖一次 = 一次 stringify + 一次磁盘写)。而且 storage 事件**不发给
 *      写入的那个页面**, 处理起来容易绕。
 *   3. **Web Locks + SharedWorker / 轮询文件** —— 最强, 但要一个 worker 文件
 *      与构建配置, 且 File System Access API 只有 Chromium 完整支持。
 *
 * 选 1 作为**主通道**, 并把它设计成"可插拔的 Transport": 想落盘就把一个
 * localStorage / 文件的 transport 追加进来, 同步层不用改。
 *
 * ## 关于"基于本地文件"
 *
 * 浏览器不能像 Node 那样直接写任意路径。能落盘的只有两条路:
 *   - File System Access API (`showSaveFilePicker`): 需要用户手动授权一次,
 *     之后可以拿到 FileSystemFileHandle 并**持久化到 IndexedDB**, 下次免授权。
 *     这是唯一"真的是文件"的路, 但 Chromium 系才有。
 *   - localStorage / IndexedDB: 都在浏览器私有目录里, 不是用户可见的文件。
 *
 * 所以这里的取舍是: **内存同步用 BroadcastChannel 做默认, 落盘做成可选
 * transport**。不为了"文件"这个词去强推一个兼容性差的方案。
 */

/** 一次同步消息。 */
export type SyncMessage =
  | { readonly kind: "graph"; readonly graph: BlueprintGraph; readonly origin: string; readonly rev: number }
  | { readonly kind: "request"; readonly origin: string }
  | { readonly kind: "hello"; readonly origin: string };

/** 同步通道。实现它就能换掉底层 (BroadcastChannel / localStorage / 文件…)。 */
export interface SyncTransport {
  readonly post: (msg: SyncMessage) => void;
  readonly close: () => void;
}

/** 建一个 BroadcastChannel transport。不可用时返回 null。 */
export function createBroadcastTransport(
  channel: string,
  onMessage: (msg: SyncMessage) => void
): SyncTransport | null {
  if (typeof BroadcastChannel === "undefined") return null;
  const bc = new BroadcastChannel(channel);
  bc.onmessage = (ev: MessageEvent) => {
    const data = ev.data as SyncMessage;
    if (data && typeof data === "object" && typeof data.kind === "string") onMessage(data);
  };
  return {
    post: (msg) => bc.postMessage(msg),
    close: () => bc.close(),
  };
}

/**
 * localStorage transport。
 *
 * 它是**持久化**的那一路: 写入全量 JSON, 靠 storage 事件广播。
 * 只在 BroadcastChannel 不可用、或明确要求落盘时启用。
 *
 * 节流放在外面 (SyncChannel 层), 这里不自己节流 ——
 * transport 只管"怎么传", 不管"多久传一次"。
 */
export function createStorageTransport(
  key: string,
  onMessage: (msg: SyncMessage) => void
): SyncTransport | null {
  if (typeof localStorage === "undefined") return null;
  const onStorage = (ev: StorageEvent) => {
    if (ev.key !== key || !ev.newValue) return;
    try {
      const parsed = JSON.parse(ev.newValue);
      if (parsed && typeof parsed === "object" && typeof parsed.kind === "string") onMessage(parsed);
    } catch {
      // 别的页面写了非本协议的键, 忽略 —— 不该让一个脏键打断同步
    }
  };
  window.addEventListener("storage", onStorage);
  return {
    post: (msg) => {
      try {
        localStorage.setItem(key, JSON.stringify(msg));
      } catch {
        // 配额满 / 隐私模式: 静默降级, 同步不可用但编辑照常
      }
    },
    close: () => window.removeEventListener("storage", onStorage),
  };
}

export interface SyncOptions {
  /** 频道名。同一张图用同一个名字。 */
  readonly channel?: string;
  /** 节流间隔 (ms)。拖节点时每帧都发会把主线程打满。 */
  readonly throttleMs?: number;
  /** 是否启用 localStorage 持久化 (默认关 —— 它不是免费的)。 */
  readonly persist?: boolean;
  /** 收到远端图时。 */
  readonly onRemote: (graph: BlueprintGraph) => void;
  /**
   * 收到远端图时的**兼容性校验**。
   *
   * 为什么必须要有: 同步频道只是一个名字, 谁都可以用同一个名字开页面。
   * 若一端是源码层图 (33 节点)、另一端是架构层图 (10 节点), 无条件接受
   * 对方推来的图就会让**所有节点变成"未注册"** —— 架构层注册表不认识
   * 源码层的类型名。实测: 拖一下触发广播, 对面立刻 85 个错误。
   *
   * 返回 false 表示"这张图我不认", 该消息被丢弃 (本地图保持不动)。
   */
  readonly accept?: (graph: BlueprintGraph) => boolean;
  /** 有页面问"现在是什么状态"时。返回当前图, 返回 null 表示"我不知道"。 */
  readonly onRequest?: () => BlueprintGraph | null;
}

/**
 * 同步通道。
 *
 * 用法:
 * ```ts
 * const sync = new SyncChannel({ onRemote: setGraph, onRequest: () => graph });
 * sync.publish(graph);   // 本地改了就调
 * sync.close();          // 卸载时
 * ```
 *
 * 两个关键行为:
 *   - **回声抑制**: 两种 transport 都不会把消息发回给写入方, 但仍然按
 *     origin id 过滤一遍, 这样换 transport 时行为不依赖它的内部保证。
 *   - **后加入者拉全量**: 新开的页面不知道当前状态, 所以发一条 `request`,
 *     已有页面回一条 `graph`。谁先回算谁的 (不做仲裁 —— 同时有多个页面
 *     改同一张图本身就是用户该自己避免的用法)。
 */
export class SyncChannel {
  private readonly transports: SyncTransport[] = [];
  private readonly origin: string;
  private readonly throttleMs: number;
  private readonly opts: SyncOptions;
  private timer: ReturnType<typeof setTimeout> | null = null;
  private pending: BlueprintGraph | null = null;
  private rev = 0;
  private closed = false;

  constructor(opts: SyncOptions) {
    this.opts = opts;
    this.throttleMs = opts.throttleMs ?? 120;
    // 页面唯一 id: 用于回声抑制与"谁在问"
    this.origin = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

    const onMessage = (msg: SyncMessage) => this.receive(msg);
    const channel = opts.channel ?? "hx-blueprint";

    const bc = createBroadcastTransport(channel, onMessage);
    if (bc) this.transports.push(bc);
    if (opts.persist) {
      const st = createStorageTransport(`${channel}:state`, onMessage);
      if (st) this.transports.push(st);
    }

    // 新页面加入: 问一句"现在是什么状态"
    this.post({ kind: "request", origin: this.origin });
  }

  private post(msg: SyncMessage): void {
    if (this.closed) return;
    for (const t of this.transports) t.post(msg);
  }

  private receive(msg: SyncMessage): void {
    if (this.closed) return;
    if (msg.origin === this.origin) return; // 回声抑制

    if (msg.kind === "request") {
      const cur = this.opts.onRequest?.();
      if (cur) this.post({ kind: "graph", graph: cur, origin: this.origin, rev: this.rev });
      return;
    }
    if (msg.kind === "graph") {
      // 只接受更新的版本, 免得两个页面互相把对方拉回旧状态
      if (msg.rev < this.rev) return;
      // 兼容性优先于版本: 不认识的图再新也不能收, 否则整张图会变非法
      if (this.opts.accept && !this.opts.accept(msg.graph)) return;
      this.rev = msg.rev;
      this.opts.onRemote(msg.graph);
    }
  }

  /**
   * 发布本地改动。
   *
   * 节流是这里的关键: 拖一个节点每帧都会触发 onChange, 不节流的话
   * 每帧一次 JSON 序列化 + 广播会把主线程打满。
   * 节流窗口内只保留**最后一次** —— 中间态没有意义, 用户要的是最终位置。
   */
  publish(graph: BlueprintGraph): void {
    if (this.closed) return;
    this.pending = graph;
    if (this.timer) return;
    this.timer = setTimeout(() => {
      this.timer = null;
      const g = this.pending;
      this.pending = null;
      if (!g || this.closed) return;
      this.rev += 1;
      this.post({ kind: "graph", graph: g, origin: this.origin, rev: this.rev });
    }, this.throttleMs);
  }

  /** 立即发出待发的改动 (卸载前用, 免得最后一笔丢了)。 */
  flush(): void {
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
    const g = this.pending;
    this.pending = null;
    if (g && !this.closed) {
      this.rev += 1;
      this.post({ kind: "graph", graph: g, origin: this.origin, rev: this.rev });
    }
  }

  close(): void {
    if (this.closed) return;
    this.flush();
    this.closed = true;
    for (const t of this.transports) t.close();
    this.transports.length = 0;
  }
}

/**
 * 从 URL 读图。独立页面用它拿到初始状态, 免得一开就是空白再等同步。
 *
 * 支持两种:
 *   - `#graph=<base64>`  直接内联 (小图够用, 大图会让 URL 变得很长)
 *   - `?channel=<name>`  只给频道名, 内容靠同步拉
 */
export function graphFromUrl(hash: string): BlueprintGraph | null {
  /**
   * 分隔符是 `&` **或** `#` 或 `?`。
   *
   * 只写 `(?:^|&)` 时 `#graph=...` 匹配不到 —— `#` 既不是行首也不是 `&`,
   * 于是那种 URL 会悄悄失效, 页面打开是空的且不报错。
   */
  const m = /(?:^|[&#?])graph=([^&]+)/.exec(hash);
  if (!m) return null;
  try {
    // base64 -> UTF-8: 直接 atob 处理不了中文, 必须走 TypedArray 解码
    const bin = atob(decodeURIComponent(m[1]));
    const bytes = Uint8Array.from(bin, (c) => c.charCodeAt(0));
    const text = new TextDecoder().decode(bytes);
    return parseGraph(JSON.parse(text));
  } catch {
    return null;
  }
}

/** 把图编码进 URL。超过阈值返回 null —— 别把 URL 撑爆。 */
export function graphToHash(graph: BlueprintGraph, maxChars = 8000): string | null {
  try {
    const text = JSON.stringify(serializeGraph(graph));
    const bytes = new TextEncoder().encode(text);
    let bin = "";
    for (const b of bytes) bin += String.fromCharCode(b);
    const enc = encodeURIComponent(btoa(bin));
    return enc.length > maxChars ? null : enc;
  } catch {
    return null;
  }
}
