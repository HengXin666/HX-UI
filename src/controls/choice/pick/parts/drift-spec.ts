/** DriftSelect 的规格常数, 尺寸档, 选项类型与菜单纵向几何. */

/** 菜单内边距, 选项间距, 菜单与触发器的距离. */
export const DRIFT_PAD = 4;
export const DRIFT_GAP = 1;
export const DRIFT_MENU_GAP = 6;
const FADE_MS = 150;
const SIZE_LG = 14;
/** 规格里的 CSS 过渡. */
export const DRIFT_MS = { triggerColor: 100, press: 160, swap: 160, chevron: 200, menuFade: FADE_MS, optionColor: FADE_MS, tagFade: FADE_MS } as const;
/** 尺寸档: [触发器高, 字号, 横向内边距, 选项高]. 规格只列名字未列数值, 这里与库内控件高度档对齐. */
export const DRIFT_SIZES = { sm: [28, 12, 10, 26], md: [34, 13, 12, 30], lg: [40, SIZE_LG, SIZE_LG, 34] } as const;
/** 弹出起始缩放与换字/弹出时的纵向位移. */
export const DRIFT_POP_FROM_SCALE = 0.96;
export const DRIFT_SHIFT_PX = 4;
/** 没有高亮项时的索引. */
export const DRIFT_NONE = -1;

export type DriftSize = keyof typeof DRIFT_SIZES;

export interface DriftOption {
	readonly value: string;
	readonly label: string;
	readonly tag?: string;
	readonly disabled?: boolean;
}

/** 第 i 个选项在菜单里的纵向位置. */
export function driftOffset(i: number, optionHeight: number): number {
	return DRIFT_PAD + i * (optionHeight + DRIFT_GAP);
}
