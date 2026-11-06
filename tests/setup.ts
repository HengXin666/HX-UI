/**
 * Vitest 全局 setup: jest-dom 断言, axe-core 无障碍断言, happy-dom 缺失 API 的 polyfill, 每条用例后卸载.
 * 新断言或新 polyfill 加在这里, 用法见 docs/reference/quality/frontend-tests.md.
 */
import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach, expect } from "vitest";
import axe from "axe-core";

// ── axe-core: serious / critical 判失败; happy-dom 无布局与配色, 依赖渲染的规则关闭, 交给浏览器检查 ──

/** 判为失败的影响等级. */
export const BLOCKING_IMPACTS: ReadonlyArray<string> = ["serious", "critical"];

/** 在 DOM 模拟环境里无意义或必然误报的规则. */
const DISABLED_RULES: Record<string, { enabled: boolean }> = {
	"color-contrast": { enabled: false },
	"color-contrast-enhanced": { enabled: false },
	// 单个组件不在 landmark 里是测试夹具的形态, 不是组件问题
	region: { enabled: false },
	"landmark-one-main": { enabled: false },
	"page-has-heading-one": { enabled: false },
};

export interface A11yScanResult {
	readonly blocking: axe.Result[];
	readonly all: axe.Result[];
}

/** 扫描 root (默认整个 document.body, 这样 Portal 里的弹层也在范围内). */
export async function scanA11y(root: Element = document.body): Promise<A11yScanResult> {
	const results = await axe.run(root, {
		rules: DISABLED_RULES,
		resultTypes: ["violations"],
	});
	const blocking = results.violations.filter((v) => v.impact != null && BLOCKING_IMPACTS.includes(v.impact));
	return { blocking, all: results.violations };
}

/** 违规的可读摘要: 规则 id, 等级, 帮助文本与命中节点的选择器. */
export function formatViolations(violations: ReadonlyArray<axe.Result>): string {
	return violations
		.map((v) => {
			const nodes = v.nodes.map((n) => "    " + n.target.join(" ")).join("\n");
			return `[${v.impact}] ${v.id}: ${v.help}\n${nodes}`;
		})
		.join("\n");
}

// ── 断言: await expect(el).toHaveNoSeriousA11yViolations() ──

interface A11yMatchers<R = unknown> {
	/** axe 扫描 received (默认传 document.body), serious / critical 违规为 0 才通过. */
	toHaveNoSeriousA11yViolations(): Promise<R>;
}

declare module "vitest" {
	// eslint-disable-next-line @typescript-eslint/no-empty-object-type
	interface Assertion<T = any> extends A11yMatchers<T> {}
	// eslint-disable-next-line @typescript-eslint/no-empty-object-type
	interface AsymmetricMatchersContaining extends A11yMatchers {}
}

expect.extend({
	async toHaveNoSeriousA11yViolations(received: Element) {
		const { blocking, all } = await scanA11y(received);
		const minor = all.filter((v) => !blocking.includes(v));
		if (minor.length > 0) {
			console.info("axe (非阻断):\n" + formatViolations(minor));
		}
		return {
			pass: blocking.length === 0,
			message: () =>
				blocking.length === 0
					? "期望存在 serious / critical 违规, 实际没有"
					: "axe 发现 serious / critical 违规:\n" + formatViolations(blocking),
		};
	},
});

// ── happy-dom polyfill: 只在缺失时补, 不覆盖环境已有实现 ──

if (typeof window.matchMedia !== "function") {
	Object.defineProperty(window, "matchMedia", {
		writable: true,
		configurable: true,
		value: (query: string): MediaQueryList => {
			const listeners = new Set<EventListenerOrEventListenerObject>();
			return {
				matches: false,
				media: query,
				onchange: null,
				addListener: (cb: EventListenerOrEventListenerObject | null) => cb && listeners.add(cb),
				removeListener: (cb: EventListenerOrEventListenerObject | null) => cb && listeners.delete(cb),
				addEventListener: (_type: string, cb: EventListenerOrEventListenerObject) => listeners.add(cb),
				removeEventListener: (_type: string, cb: EventListenerOrEventListenerObject) => listeners.delete(cb),
				dispatchEvent: () => false,
			} as unknown as MediaQueryList;
		},
	});
}

class ResizeObserverStub implements ResizeObserver {
	observe(): void {}
	unobserve(): void {}
	disconnect(): void {}
}

if (typeof globalThis.ResizeObserver !== "function") {
	globalThis.ResizeObserver = ResizeObserverStub;
	window.ResizeObserver = ResizeObserverStub;
}

class IntersectionObserverStub {
	readonly root = null;
	readonly rootMargin = "0px";
	readonly thresholds: ReadonlyArray<number> = [0];
	observe(): void {}
	unobserve(): void {}
	disconnect(): void {}
	takeRecords(): IntersectionObserverEntry[] {
		return [];
	}
}

if (typeof globalThis.IntersectionObserver !== "function") {
	globalThis.IntersectionObserver = IntersectionObserverStub as unknown as typeof IntersectionObserver;
}

// Radix Select / Popper 打开时调用的 Element API, happy-dom 未必实现
const elementProto = Element.prototype as Element & Record<string, unknown>;
if (typeof elementProto.scrollIntoView !== "function") {
	elementProto.scrollIntoView = function scrollIntoView(): void {};
}
if (typeof elementProto.hasPointerCapture !== "function") {
	elementProto.hasPointerCapture = function hasPointerCapture(): boolean {
		return false;
	};
}
if (typeof elementProto.setPointerCapture !== "function") {
	elementProto.setPointerCapture = function setPointerCapture(): void {};
}
if (typeof elementProto.releasePointerCapture !== "function") {
	elementProto.releasePointerCapture = function releasePointerCapture(): void {};
}

// globals: false 时 Testing Library 不会自动注册 cleanup
afterEach(() => {
	cleanup();
});
