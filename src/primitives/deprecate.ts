declare const process: { env: { NODE_ENV?: string } };

/**
 * 一条废弃的描述. id 用来去重, 同一个 id 在一个页面生命周期里只警告一次.
 */
export interface DeprecationNotice {
	/** 去重键, 形如 `<模块>.<符号>[.<prop>]`, 例如 `card.Card.shadow`. */
	id: string;
	/** 说明哪里废弃了. */
	message: string;
	/** 替代写法, 可省略. */
	replacement?: string;
	/** 计划删除的版本, 例如 `0.8.0`, 可省略. */
	removeIn?: string;
}

const warned = new Set<string>();

function isProduction(): boolean {
	try {
		return process.env.NODE_ENV === "production";
	} catch {
		return false;
	}
}

function format(notice: DeprecationNotice): string {
	const parts = [`[@hx/ui] ${notice.message}`];
	if (notice.replacement) parts.push(`改用 ${notice.replacement}`);
	if (notice.removeIn) parts.push(`将在 ${notice.removeIn} 删除`);
	return parts.join(". ");
}

/**
 * 报告一次废弃用法.
 *
 * 开发环境下用 console.warn 输出, 同一个 id 只输出一次; 生产环境
 * (打包器把 process.env.NODE_ENV 替换为 "production") 完全静默.
 * 拿不到 process 时按开发环境处理.
 *
 * 可以直接放在组件渲染函数里调用, 不需要包 useEffect.
 *
 * @example
 * if (props.shadow !== undefined) deprecate({ id: "card.Card.shadow", message: "Card 的 shadow prop 已废弃", replacement: "variant=elevated", removeIn: "0.8.0" });
 *
 * @param notice 废弃描述, 见 DeprecationNotice.
 * @returns 本次是否真的输出了警告.
 */
export function deprecate(notice: DeprecationNotice): boolean {
	if (isProduction()) return false;
	if (warned.has(notice.id)) return false;
	warned.add(notice.id);
	console.warn(format(notice));
	return true;
}

/**
 * 清空已警告记录, 只给测试用, 让同一个 id 可以再次触发警告.
 */
export function resetDeprecationWarnings(): void {
	warned.clear();
}
