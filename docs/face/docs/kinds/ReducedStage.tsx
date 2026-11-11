import { useMemo, type JSX } from "react";
import { findEntry } from "../catalog";
import { initialValues, propsOf, type Values } from "../specs/types";

const QUERY = "prefers-reduced-motion";
const REDUCE = /prefers-reduced-motion:\s*reduce/;
let forced = false;

/** 一份只会答固定结果的媒体查询: 组件只读 matches 并订阅 change, 这里不会再变, 订阅是空操作. */
function fixedQuery(media: string, matches: boolean): MediaQueryList {
  return {
    matches,
    media,
    onchange: null,
    addEventListener: () => undefined,
    removeEventListener: () => undefined,
    addListener: () => undefined,
    removeListener: () => undefined,
    dispatchEvent: () => false,
  };
}

/**
 * 让本文档里所有 prefers-reduced-motion 查询都按 reduce 作答. 组件读减弱动效走 matchMedia
 * (库的 useReducedMotion 与 prefersReducedMotion 都是), 所以换掉它就等于系统开了减少动效.
 * 只在对照台 (#/reduced/...) 这份独立文档里调用: 它在组件页的 iframe 里, 不影响外面那页.
 */
export function forceReducedMotion(): void {
  if (forced) return;
  forced = true;
  const native = window.matchMedia.bind(window);
  window.matchMedia = (media: string): MediaQueryList => (media.includes(QUERY) ? fixedQuery(media, REDUCE.test(media)) : native(media));
}

function parseValues(raw: string): Values {
  try {
    const parsed: unknown = JSON.parse(decodeURIComponent(raw));
    return parsed && typeof parsed === "object" ? (parsed as Values) : {};
  } catch {
    return {};
  }
}

/**
 * 减少动效对照台 (#/reduced/<id>/<调参值>): 组件页 "减少动效对照" 段右格的 iframe 内容.
 * 用组件页当前的调参值挂同一个演示, 外壳不出; 调用方先 forceReducedMotion 再渲染它.
 */
export function ReducedStage({ id, values }: { readonly id: string; readonly values: string }): JSX.Element {
  const entry = findEntry(id);
  const spec = entry?.spec;
  const props = useMemo(() => (spec ? { ...spec.fixed, ...propsOf(spec, { ...initialValues(spec.controls), ...parseValues(values) }) } : {}), [spec, values]);
  return (
    <main className="grid min-h-svh place-items-center overflow-hidden bg-background p-4 text-center text-foreground">
      <h1 className="sr-only">{entry?.label ?? id} 减少动效对照</h1>
      {spec ? (
        <div key={values} className="max-w-full">
          {spec.render(props)}
        </div>
      ) : null}
    </main>
  );
}
