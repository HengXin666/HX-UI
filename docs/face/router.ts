import { useEffect, useState } from "react";
import { DOCS } from "../src/nav";

export const FACE_HOME = "home";
export const FACE_PREVIEW = "preview";
export const PREVIEW_FIELD = "field";
export const PREVIEW_KILN = "kiln";

export const FACE_BENCH = "bench";

export type FaceRoute =
  | { readonly kind: "home" }
  | { readonly kind: "bench" }
  | { readonly kind: "preview"; readonly which: typeof PREVIEW_FIELD | typeof PREVIEW_KILN }
  | { readonly kind: "doc"; readonly id: string };

/** 空地址和 #/home 都是首页. 不把空 hash 改写成某个组件页. */
export function readFaceRoute(): FaceRoute {
  const raw = window.location.hash.replace(/^#\/?/, "").trim();
  if (!raw || raw === FACE_HOME) return { kind: "home" };
  if (raw === FACE_BENCH) return { kind: "bench" };
  const [head, rest] = raw.split("/");
  if (head === FACE_PREVIEW && (rest === PREVIEW_FIELD || rest === PREVIEW_KILN)) {
    return { kind: "preview", which: rest };
  }
  const id = head ?? "";
  return DOCS.some((entry) => entry.id === id) ? { kind: "doc", id } : { kind: "home" };
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
