/**
 * Tabs: 渲染 (tablist / tab / tabpanel 及 aria 关联), APG tabs 键盘 (左右方向键循环, Home / End,
 * 自动激活, 跳过禁用项, Tab 从标签进入面板), 受控与非受控, 两种形态与 animated 指示器, 以及 axe 扫描.
 */
import * as React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@src/primitives/tabs";

type SampleProps = React.ComponentProps<typeof Tabs> & {
	variant?: "underline" | "pill";
	animated?: boolean;
	disableLogs?: boolean;
};

function Sample({ variant, animated, disableLogs, ...props }: SampleProps): React.JSX.Element {
	return (
		<Tabs {...props}>
			<TabsList aria-label="项目视图" variant={variant} animated={animated}>
				<TabsTrigger value="overview">概览</TabsTrigger>
				<TabsTrigger value="logs" disabled={disableLogs}>
					日志
				</TabsTrigger>
				<TabsTrigger value="config">配置</TabsTrigger>
			</TabsList>
			<TabsContent value="overview">概览内容</TabsContent>
			<TabsContent value="logs">日志内容</TabsContent>
			<TabsContent value="config">
				配置内容 <button type="button">保存配置</button>
			</TabsContent>
		</Tabs>
	);
}

const tab = (name: string): HTMLElement => screen.getByRole("tab", { name });

describe("Tabs", () => {
	it("渲染 tablist / tab / tabpanel, 选中项与面板互相关联", () => {
		render(<Sample defaultValue="overview" />);
		expect(screen.getByRole("tablist", { name: "项目视图" })).toHaveAttribute("data-variant", "underline");
		expect(screen.getAllByRole("tab")).toHaveLength(3);
		const selected = tab("概览");
		expect(selected).toHaveAttribute("aria-selected", "true");
		expect(tab("日志")).toHaveAttribute("aria-selected", "false");
		const panel = screen.getByRole("tabpanel");
		expect(panel).toHaveTextContent("概览内容");
		expect(selected).toHaveAttribute("aria-controls", panel.id);
		expect(panel).toHaveAttribute("aria-labelledby", selected.id);
	});

	it("键盘: 右 / 左方向键循环移动并自动激活, Home / End 跳到首尾", async () => {
		const user = userEvent.setup();
		render(<Sample defaultValue="overview" />);
		await user.tab();
		expect(tab("概览")).toHaveFocus();

		await user.keyboard("{ArrowRight}");
		expect(tab("日志")).toHaveFocus();
		expect(tab("日志")).toHaveAttribute("aria-selected", "true");
		expect(screen.getByRole("tabpanel")).toHaveTextContent("日志内容");

		await user.keyboard("{ArrowRight}{ArrowRight}");
		expect(tab("概览")).toHaveFocus();

		await user.keyboard("{ArrowLeft}");
		expect(tab("配置")).toHaveFocus();

		await user.keyboard("{Home}");
		expect(tab("概览")).toHaveFocus();
		await user.keyboard("{End}");
		expect(tab("配置")).toHaveFocus();
		expect(tab("配置")).toHaveAttribute("aria-selected", "true");
	});

	it("键盘: 方向键跳过禁用项; Tab 停靠点是 roving 的选中标签与可见面板", async () => {
		const user = userEvent.setup();
		render(<Sample defaultValue="overview" disableLogs />);
		await user.tab();
		await user.keyboard("{ArrowRight}");
		expect(tab("配置")).toHaveFocus();

		// roving tabindex: 只有选中标签在 Tab 序列里, 其余标签 -1
		expect(tab("配置")).toHaveAttribute("tabindex", "0");
		expect(tab("概览")).toHaveAttribute("tabindex", "-1");
		expect(tab("日志")).toBeDisabled();

		// Radix 同时渲染全部面板: 选中面板可见且 tabindex=0, 未选面板带 hidden 属性
		const active = screen.getByRole("tabpanel", { name: "配置" });
		expect(active).toHaveAttribute("data-state", "active");
		expect(active).toHaveAttribute("tabindex", "0");
		expect(active).not.toHaveAttribute("hidden");
		const inactive = screen
			.getAllByRole("tabpanel", { hidden: true })
			.filter((panel) => panel.getAttribute("data-state") === "inactive");
		expect(inactive).toHaveLength(2);
		for (const panel of inactive) {
			expect(panel).toHaveAttribute("hidden");
		}
		// 不用 user.tab() 断言 "下一个焦点是面板": happy-dom 下 user-event 的 Tab 序列不排除带 hidden
		// 属性的元素, 会先落到 DOM 顺序靠前的未选面板上; 浏览器会跳过它们. 真实落点由浏览器检查覆盖.
	});

	it("非受控: defaultValue 起步, 点击切换并通知 onValueChange", async () => {
		const user = userEvent.setup();
		const onValueChange = vi.fn();
		render(<Sample defaultValue="overview" onValueChange={onValueChange} />);
		await user.click(tab("配置"));
		expect(onValueChange).toHaveBeenLastCalledWith("config");
		expect(tab("配置")).toHaveAttribute("aria-selected", "true");
		expect(screen.getByRole("tabpanel")).toHaveTextContent("配置内容");
	});

	it("受控: value 不变时点击只通知, 父组件改 value 后才切换", async () => {
		const user = userEvent.setup();
		const onValueChange = vi.fn();
		const { rerender } = render(<Sample value="overview" onValueChange={onValueChange} />);
		await user.click(tab("日志"));
		expect(onValueChange).toHaveBeenLastCalledWith("logs");
		expect(tab("概览")).toHaveAttribute("aria-selected", "true");

		rerender(<Sample value="logs" onValueChange={onValueChange} />);
		expect(tab("日志")).toHaveAttribute("aria-selected", "true");
		expect(screen.getByRole("tabpanel")).toHaveTextContent("日志内容");
	});

	it("pill 形态由 TabsList 下发给每个 trigger; animated 时指示器跟着选中项走", async () => {
		const user = userEvent.setup();
		render(<Sample defaultValue="overview" variant="pill" animated />);
		for (const trigger of screen.getAllByRole("tab")) {
			expect(trigger).toHaveAttribute("data-variant", "pill");
		}
		const indicatorIn = (el: HTMLElement): Element | null => el.querySelector("span[aria-hidden]:not([data-ripple])");
		expect(indicatorIn(tab("概览"))).not.toBeNull();
		await user.click(tab("配置"));
		expect(indicatorIn(tab("概览"))).toBeNull();
		expect(indicatorIn(tab("配置"))).not.toBeNull();
	});

	it("axe: underline 与 pill 两种形态都没有 serious / critical 违规", async () => {
		const { unmount } = render(<Sample defaultValue="overview" />);
		await expect(document.body).toHaveNoSeriousA11yViolations();
		unmount();
		render(<Sample defaultValue="config" variant="pill" animated disableLogs />);
		await expect(document.body).toHaveNoSeriousA11yViolations();
	});
});
