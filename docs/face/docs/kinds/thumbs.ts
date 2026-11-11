import { useEffect, useState } from "react";

/** 缩略图尺寸 (CSS 像素), 拍摄台与 scripts/docs-thumbs.ts 同用这一组. */
export const THUMB_PX = { width: 640, height: 400 } as const;
export const THUMB_STATE = { loading: "loading", ok: "ok", error: "error", missing: "missing" } as const;
export type ThumbState = (typeof THUMB_STATE)[keyof typeof THUMB_STATE];
/** 构建产物里缩略图的目录 (相对 index.html; 站点是 hash 路由, 页面地址恒为 index.html), manifest.json 列出拍成功的条目 id. */
export const THUMB_DIR = "thumbs";

let cache: Promise<ReadonlySet<string>> | undefined;

/** 读 thumbs/manifest.json; 没跑过 scripts/docs-thumbs.ts (开发时) 就是空集, 卡片不出图, 不放占位. */
function loadManifest(): Promise<ReadonlySet<string>> {
  cache ??= fetch(`./${THUMB_DIR}/manifest.json`)
    .then((res) => (res.ok ? (res.json() as Promise<{ ok?: string[] }>) : { ok: [] }))
    .then((data) => new Set(data.ok ?? []))
    .catch(() => new Set<string>());
  return cache;
}

/** 有构建期截图的条目 id 集合. */
export function useThumbs(): ReadonlySet<string> {
  const [ids, setIds] = useState<ReadonlySet<string>>(() => new Set());
  useEffect(() => {
    let live = true;
    void loadManifest().then((set) => live && setIds(set));
    return () => {
      live = false;
    };
  }, []);
  return ids;
}

export function thumbUrl(id: string): string {
  return `./${THUMB_DIR}/${id}.png`;
}
