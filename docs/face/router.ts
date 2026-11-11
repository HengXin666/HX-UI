import { useEffect, useState } from "react";
import { isShellRoute } from "./docs/catalog";

export const FACE_HOME = "home";
export const FACE_PREVIEW = "preview";
export const PREVIEW_FIELD = "field";
export const PREVIEW_KILN = "kiln";

export const FACE_BENCH = "bench";
/** 缩略图拍摄台 #/thumb/<id>: 只给 scripts/docs-thumbs.ts 用, 不进导航. */
export const FACE_THUMB = "thumb";
/** 减少动效对照台 #/reduced/<id>/<调参值>: 只给组件页 "减少动效对照" 段的 iframe 用, 整份文档按 prefers-reduced-motion: reduce 作答, 不进导航. */
export const FACE_REDUCED = "reduced";

export type FaceRoute =
  | { readonly kind: "home" }
  | { readonly kind: "bench" }
  | { readonly kind: "preview"; readonly which: typeof PREVIEW_FIELD | typeof PREVIEW_KILN }
  | { readonly kind: "thumb"; readonly id: string }
  | { readonly kind: "reduced"; readonly id: string; readonly values: string }
  | { readonly kind: "doc"; readonly id: string };

/** 空地址和 #/home 都是首页. 不把空 hash 改写成某个组件页. 文档外壳认得的 id (目录条目与组件索引) 进文档. */
export function readFaceRoute(): FaceRoute {
  const raw = window.location.hash.replace(/^#\/?/, "").trim();
  if (!raw || raw === FACE_HOME) return { kind: "home" };
  if (raw === FACE_BENCH) return { kind: "bench" };
  const [head, rest, values] = raw.split("/");
  if (head === FACE_PREVIEW && (rest === PREVIEW_FIELD || rest === PREVIEW_KILN)) {
    return { kind: "preview", which: rest };
  }
  if (head === FACE_THUMB && rest) return { kind: "thumb", id: rest };
  if (head === FACE_REDUCED && rest) return { kind: "reduced", id: rest, values: values ?? "" };
  const id = head ?? "";
  return isShellRoute(id) ? { kind: "doc", id } : { kind: "home" };
}

export function useFaceRoute(): [FaceRoute, (id: string) => void] {
  const [route, setRoute] = useState<FaceRoute>(readFaceRoute);

  useEffect(() => {
    const sync = (): void => setRoute(readFaceRoute());
    window.addEventListener("hashchange", sync);
    window.addEventListener("popstate", sync);
    return () => {
      window.removeEventListener("hashchange", sync);
      window.removeEventListener("popstate", sync);
    };
  }, []);

  const go = (id: string): void => {
    const next = id === FACE_HOME ? `#/${FACE_HOME}` : id === FACE_BENCH ? `#/${FACE_BENCH}` : id.startsWith(`${FACE_PREVIEW}/`) ? `#/${id}` : `#/${id}`;
    if (window.location.hash === next) {
      setRoute(readFaceRoute());
      return;
    }
    window.location.hash = next;
  };

  return [route, go];
}
