/**
 * SKU 与选择的纯函数: 按已选条件算每个选项值能不能选, 找当前 SKU, 默认选择, 价格区间.
 * 规则: 判断某轴某值时, 只用其他轴已选的值做条件, 本轴自己的已选值不参与; 这样切换颜色时尺码的库存随之变化.
 */
import { OPTION_KIND, VALUE_STATE } from "../constants/model-commerce";
import type { OptionAxis, ProductModel, Selection, ValueState, VariantModel } from "./catalog";

export interface ValueAvailability {
  readonly value: string;
  readonly state: ValueState;
  /** 满足条件的 SKU 库存合计. */
  readonly stock: number;
}

/** SKU 是否满足 selection 里除 skip 之外的每一个轴. */
function matches(variant: VariantModel, selection: Selection, skip?: string): boolean {
  return Object.entries(selection).every(([axis, value]) => axis === skip || variant.options[axis] === value);
}

/**
 * 一条轴上每个值的可选状态, 条件是其他轴的已选值.
 * .agents/notes/implemented/architecture/2026-11-20-omni-content-model.md
 */
export function axisAvailability(product: ProductModel, axis: OptionAxis, selection: Selection): ValueAvailability[] {
  return axis.values.map(({ value }) => {
    const pool = product.variants.filter((v) => v.options[axis.name] === value && matches(v, selection, axis.name));
    const stock = pool.reduce((sum, v) => sum + Math.max(0, v.stock), 0);
    const state = pool.length === 0 ? VALUE_STATE.missing : stock > 0 ? VALUE_STATE.available : VALUE_STATE.soldOut;
    return { value, state, stock };
  });
}

/** 每条轴都选了值时返回对应 SKU, 否则 undefined. */
export function findVariant(product: ProductModel, selection: Selection): VariantModel | undefined {
  if (!product.options.every((axis) => selection[axis.name] !== undefined)) return undefined;
  return product.variants.find((v) => matches(v, selection));
}

/** 满足已选条件的 SKU (未选完时为候选集). */
export function candidates(product: ProductModel, selection: Selection): VariantModel[] {
  return product.variants.filter((v) => matches(v, selection));
}

/**
 * 默认选择: 取有货 SKU 里最便宜的一个, 只预选 swatch 轴 (颜色可以替用户选, 尺码不替用户选).
 * 全部缺货时取第一个 SKU 的 swatch 值.
 */
export function defaultSelection(product: ProductModel): Selection {
  const inStock = product.variants.filter((v) => v.stock > 0);
  const pick = [...(inStock.length > 0 ? inStock : product.variants)].sort((a, b) => a.price - b.price)[0];
  const out: Record<string, string> = {};
  if (!pick) return out;
  for (const axis of product.options) {
    if (axis.kind === OPTION_KIND.swatch && pick.options[axis.name] !== undefined) out[axis.name] = pick.options[axis.name];
  }
  return out;
}

/**
 * 改一条轴后的新选择: 其他轴里与新值组合不出 SKU 的已选值会被清掉 (而不是留着一个不存在的组合).
 */
export function selectValue(product: ProductModel, selection: Selection, axis: string, value: string): Selection {
  const next: Record<string, string> = { ...selection, [axis]: value };
  for (const other of product.options) {
    if (other.name === axis || next[other.name] === undefined) continue;
    const exists = product.variants.some((v) => matches(v, { [axis]: value, [other.name]: next[other.name] }));
    if (!exists) delete next[other.name];
  }
  return next;
}

export interface PriceRange {
  readonly min: number;
  readonly max: number;
  /** 区间内最低价对应的划线价 (有才给). */
  readonly compareAt?: number;
}

/** 候选 SKU 的价格区间; 没有候选时返回 undefined. */
export function priceRange(variants: readonly VariantModel[]): PriceRange | undefined {
  if (variants.length === 0) return undefined;
  const sorted = [...variants].sort((a, b) => a.price - b.price);
  const low = sorted[0];
  return { min: low.price, max: sorted[sorted.length - 1].price, compareAt: low.compareAt };
}

/** 选择到读屏 / 订单行用的一句话: "颜色: 沙色 / 尺码: 42". 只列已选的轴, 按轴顺序. */
export function describeSelection(product: ProductModel, selection: Selection, joiner = " / "): string {
  return product.options
    .filter((axis) => selection[axis.name] !== undefined)
    .map((axis) => `${axis.name}: ${axis.values.find((v) => v.value === selection[axis.name])?.label ?? selection[axis.name]}`)
    .join(joiner);
}
