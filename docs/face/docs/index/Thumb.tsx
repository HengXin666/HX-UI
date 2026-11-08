import type { CSSProperties, JSX } from "react";
import { cn } from "@hx/ui";
import { DEFAULT_NAV_ICON, NAV_ICONS } from "../../../src/navIcons";
import type { CatalogEntry } from "../catalog";
import { initialValues, propsOf } from "../specs/types";

/** 缩略图把真实预览按这个比例缩小, 文字类大标题在卡里放得下. */
const SCALE = 0.42;
function scaled(scale: number): CSSProperties {
  return { width: `${100 / scale}%`, height: `${100 / scale}%`, transform: `scale(${scale})`, transformOrigin: "0 0" };
}

/**
 * 卡片缩略: 可调组件页放真实组件 (初始参数, 缩小), 其余文档页没有可缩略的单一预览,
 * 如实放它在侧栏里的图标, 不放假截图.
 */
export function Thumb({ entry }: { readonly entry: CatalogEntry }): JSX.Element {
  const spec = entry.spec;
  if (spec) {
    const props = { ...spec.fixed, ...propsOf(spec, initialValues(spec.controls)) };
    return (
      <div aria-hidden inert className="pointer-events-none absolute inset-0 overflow-hidden">
        <div style={scaled(spec.thumbScale ?? SCALE)} className={spec.fill ? "" : "grid place-items-center text-center"}>
          {spec.render(props)}
        </div>
      </div>
    );
  }
  return (
    <div aria-hidden className="absolute inset-0 grid place-items-center">
      <span className={cn(NAV_ICONS[entry.id] ?? DEFAULT_NAV_ICON, "size-10 bg-current text-muted-foreground/60")} />
    </div>
  );
}
