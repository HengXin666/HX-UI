import type { BlueprintGraph } from "./types";
import { serializeGraph, parseGraph, FORMAT_VERSION } from "./serialize";

/**
 * 保存 / 加载。
 *
 * ## 该存成什么
 *
 * 就是**一个 JSON 文件**。不加版本号以外的元数据、不加密、不压缩 
 * 蓝图是用户资产, 要能进 git diff、能被人手改、能被后端直接读。
 * 一旦加了包装, 这三件事全做不了, 而换来的只有"看起来更专业"。
 *
 * ## 文件扩展名
 *
 * `.bp.json`。带 `.json` 是因为它**就是** JSON  编辑器能直接高亮、
 * git 能直接 diff、双击能直接打开。只写 `.bp` 会让所有这些都失效。
 *
 * ## 为什么不做"自动保存到磁盘"
 *
 * 浏览器不能不经授权写任意路径。能落盘的两条路:
 * - File System Access API (`showSaveFilePicker`): 要用户授权一次, 之后
 * 可把 handle 存进 IndexedDB 免授权。只有 Chromium 系完整支持。
 * - 下载 / 读取: 零权限、全兼容, 但每次都要走一次文件对话框。
 *
 * 这里两条都给: `downloadGraph` 是零权限的兜底 (永远可用),
 * `saveGraphToHandle` 是"真的存到那个文件" (Chromium, 授权一次后免打扰)。
 * 不做"静默写回原文件"  那是用户没预期的副作用。
 */

export const GRAPH_EXT = ".bp.json";

/** 触发一次文件下载。全浏览器可用, 不需要任何权限。 */
export function downloadGraph(graph: BlueprintGraph, filename = `blueprint${GRAPH_EXT}`): void {
  const json = JSON.stringify(serializeGraph(graph), null, 2);
  const blob = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  // 必须挂进 DOM 再点  游离节点的 click() 在部分浏览器里不触发下载
  document.body.appendChild(a);
  a.click();
  a.remove();
  // 立刻 revoke 会让部分浏览器的下载拿不到数据
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/** 弹一个文件选择框并读回图。取消时 resolve(null)。 */
export function pickGraphFile(): Promise<BlueprintGraph | null> {
  return new Promise((resolve, reject) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json,application/json";
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return resolve(null);
      try {
        const text = await file.text();
        const parsed = parseGraph(JSON.parse(text));
        if (!parsed) {
          reject(new Error("这不是一份蓝图 JSON: 缺少 nodes / edges"));
          return;
        }
        resolve(parsed);
      } catch (e) {
        reject(e instanceof Error ? e : new Error(String(e)));
      }
    };
    input.click();
  });
}

/**
 * File System Access API 的落盘。
 *
 * 有 handle 就直写 (不会再弹框), 没有就先让用户选一次位置。
 * 不支持的浏览器 (Firefox / Safari) 返回 null  调用方退回 downloadGraph,
 * 不做"降级到 localStorage 假装存住了"这种骗人的事。
 */
export async function saveGraphToHandle(
  graph: BlueprintGraph,
  handle?: FileSystemFileHandleLike | null
): Promise<FileSystemFileHandleLike | null> {
  const fs = (globalThis as { showSaveFilePicker?: ShowSaveFilePicker }).showSaveFilePicker;
  if (!fs && !handle) return null;

  let h = handle ?? null;
  if (!h) {
    h = await fs!({
      suggestedName: `blueprint${GRAPH_EXT}`,
      types: [{ description: "蓝图", accept: { "application/json": [".json"] } }],
    });
  }
  const writable = await h.createWritable();
  await writable.write(JSON.stringify(serializeGraph(graph), null, 2));
  await writable.close();
  return h;
}

/** 从文本解析。给"粘贴 JSON" / 测试 / 后端返回用。 */
export function graphFromText(text: string): BlueprintGraph | null {
  try {
    return parseGraph(JSON.parse(text));
  } catch {
    return null;
  }
}

/** 版本号暴露出去, 导入时可以做兼容提示。 */
export { FORMAT_VERSION };

// ── File System Access API 的最小形状 ────────────────────────────────
// 只声明用到的部分: 完整类型要 lib.dom 的较新版本, 而本库要能在旧 TS 下编译。
interface FileSystemFileHandleLike {
  readonly createWritable: () => Promise<{ write(data: string): Promise<void>; close(): Promise<void> }>;
}
type ShowSaveFilePicker = (opts: {
  suggestedName?: string;
  types?: { description: string; accept: Record<string, string[]> }[];
}) => Promise<FileSystemFileHandleLike>;
