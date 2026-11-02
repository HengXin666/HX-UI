/**
 * 皮肤层桶文件: 皮肤与密度的名称清单, 以及把选择写进 DOM 的辅助函数.
 *
 * 只操作 document.documentElement 的 data-* 属性, 不引任何依赖, 不碰组件.
 * 样式在同目录 index.css (foundation + 五套皮肤 + density), 由集成任务接进 src/styles.css.
 * 服务端渲染 (无 document) 时所有写入函数静默返回, 读取函数返回默认值.
 *
 * .agents/notes/implemented/feature/2026-11-02-skins-density.md
 */
import {
  DENSITY,
  DENSITY_LIST,
  SKIN,
  SKIN_ATTR,
  SKIN_LIST,
  SKIN_VARIANT,
  type DensityName,
  type SkinName,
  type SkinVariant,
} from "../constants/skins";

export { DENSITY, DENSITY_LIST, SKIN, SKIN_ATTR, SKIN_LIST, SKIN_VARIANT };
export type { DensityName, SkinName, SkinVariant };

/** 全部皮肤名, 顺序同 SKIN_LIST. */
export const SKIN_NAMES: readonly SkinName[] = SKIN_LIST.map((s) => s.name);

/** 全部密度名, 由紧到松. */
export const DENSITY_NAMES: readonly DensityName[] = DENSITY_LIST.map((d) => d.name);

/** 选项: variant 只对带形态档的皮肤 (retail) 生效, 其余皮肤会清掉该属性. */
export interface ApplySkinOptions {
  readonly variant?: SkinVariant;
}

function root(): HTMLElement | null {
  return typeof document === "undefined" ? null : document.documentElement;
}

export function isSkinName(value: unknown): value is SkinName {
  return typeof value === "string" && (SKIN_NAMES as readonly string[]).includes(value);
}

export function isDensityName(value: unknown): value is DensityName {
  return typeof value === "string" && (DENSITY_NAMES as readonly string[]).includes(value);
}

/**
 * 切换皮肤. default 直接移除 data-skin, 让根元素回到没有皮肤层时的原样.
 * 未知名字按 default 处理, 不会留下一个无样式的属性值.
 */
export function applySkin(name: SkinName, options: ApplySkinOptions = {}): void {
  const el = root();
  if (!el) return;
  const skin = isSkinName(name) ? name : SKIN.default;
  if (skin === SKIN.default) el.removeAttribute(SKIN_ATTR.skin);
  else el.setAttribute(SKIN_ATTR.skin, skin);

  const allowed = SKIN_LIST.find((s) => s.name === skin)?.variants;
  const variant = options.variant;
  if (variant && allowed?.includes(variant)) el.setAttribute(SKIN_ATTR.variant, variant);
  else el.removeAttribute(SKIN_ATTR.variant);
}

/** 切换密度. 传 null 移除属性, 回到不声明密度的原样 (Tailwind 默认间距). */
export function applyDensity(name: DensityName | null): void {
  const el = root();
  if (!el) return;
  if (name && isDensityName(name)) el.setAttribute(SKIN_ATTR.density, name);
  else el.removeAttribute(SKIN_ATTR.density);
}

/** 读当前皮肤; 没有属性或值不认识时返回 default. */
export function readSkin(): SkinName {
  const value = root()?.getAttribute(SKIN_ATTR.skin);
  return isSkinName(value) ? value : SKIN.default;
}

/** 读当前皮肤形态档; 没有时返回 null. */
export function readSkinVariant(): SkinVariant | null {
  const value = root()?.getAttribute(SKIN_ATTR.variant);
  return value === SKIN_VARIANT.sharp || value === SKIN_VARIANT.round ? value : null;
}

/** 读当前密度; 没有属性时返回 comfortable (等于默认间距). */
export function readDensity(): DensityName {
  const value = root()?.getAttribute(SKIN_ATTR.density);
  return isDensityName(value) ? value : DENSITY.comfortable;
}
