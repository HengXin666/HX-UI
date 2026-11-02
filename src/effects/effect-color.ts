/**
 * 效果件的拼色: 把调用方传入的语义令牌名拼成 CSS 渐变字符串. 这里只产出 var(--令牌) 与 color-mix,
 * 不出现任何字面色值; 组件 tsx 把结果写进 CSS 变量, 由 effects.css 消费.
 */
import {
	EFFECT_GLOW_STOP,
	EFFECT_TOKEN_FALLBACK,
	EFFECT_TOKEN_PATTERN,
	MESH_MAX_MIX,
	MESH_STOPS,
	PERCENT_MAX,
} from "../constants/effects";

/** 夹到 [min, max], 非有限数回退到 min. */
export function clamp(value: number, min: number, max: number): number {
	return Number.isFinite(value) ? Math.min(max, Math.max(min, value)) : min;
}

/** 令牌名 ("primary" / "--accent-2") → var(--primary). 不合法的名字回退到 primary. */
export function tokenVar(name: string): string {
	const bare = name.trim().replace(/^-+/, "");
	return `var(--${EFFECT_TOKEN_PATTERN.test(bare) ? bare : EFFECT_TOKEN_FALLBACK})`;
}

/** 令牌按百分比混入透明, 用于光团与光束. */
export function tokenMix(name: string, percent: number): string {
	return `color-mix(in oklab, ${tokenVar(name)} ${clamp(percent, 0, PERCENT_MAX)}%, transparent)`;
}

/** mesh: 每个令牌一团径向光, 位置循环取 MESH_STOPS; intensity 0..1. */
export function meshLayers(tokens: readonly string[], intensity: number): string {
	const mix = clamp(intensity, 0, 1) * MESH_MAX_MIX;
	return tokens
		.map((token, index) => {
			const stop = MESH_STOPS[index % MESH_STOPS.length];
			return `radial-gradient(${stop.rx}% ${stop.ry}% at ${stop.x}% ${stop.y}%, ${tokenMix(token, mix)}, transparent ${EFFECT_GLOW_STOP})`;
		})
		.join(", ");
}

/** 静态线性渐变: 令牌依次作为色标; 只给一个令牌时退化为单色. */
export function linearTokens(tokens: readonly string[], angle: number): string {
	const stops = tokens.length > 0 ? tokens.map(tokenVar) : [tokenVar(EFFECT_TOKEN_FALLBACK)];
	const list = stops.length === 1 ? [stops[0], stops[0]] : stops;
	return `linear-gradient(${angle}deg, ${list.join(", ")})`;
}
