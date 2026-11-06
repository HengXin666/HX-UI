/**
 * Button: 渲染, APG button 键盘 (Enter / Space 激活), 受控 (aria-pressed 由父组件驱动) 与
 * 非受控 (不写 type 时保留原生 submit 语义), 以及 axe 扫描.
 */
import * as React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { Button } from "@src/primitives/button";

describe("Button", () => {
	it("渲染原生 button, 带 data-slot 与默认变体, 不补 type", () => {
		render(<Button>保存</Button>);
		const button = screen.getByRole("button", { name: "保存" });
		expect(button.tagName).toBe("BUTTON");
		expect(button).toHaveAttribute("data-slot", "button");
		expect(button).toHaveAttribute("data-variant", "default");
		expect(button).toHaveAttribute("data-size", "default");
		expect(button).not.toHaveAttribute("type");
	});

	it("asChild 时把行为与类名交给子元素", () => {
		render(
			<Button asChild variant="link">
				<a href="#docs">文档</a>
			</Button>,
		);
		const link = screen.getByRole("link", { name: "文档" });
		expect(link).toHaveAttribute("data-slot", "button");
		expect(link).toHaveAttribute("data-variant", "link");
	});

	it("键盘: Tab 聚焦, Enter 与 Space 都触发 onClick", async () => {
		const user = userEvent.setup();
		const onClick = vi.fn();
		render(
			<Button type="button" onClick={onClick}>
				执行
			</Button>,
		);
		await user.tab();
		const button = screen.getByRole("button", { name: "执行" });
		expect(button).toHaveFocus();
		await user.keyboard("{Enter}");
		expect(onClick).toHaveBeenCalledTimes(1);
		await user.keyboard(" ");
		expect(onClick).toHaveBeenCalledTimes(2);
	});

	it("disabled 时不可聚焦也不触发 onClick", async () => {
		const user = userEvent.setup();
		const onClick = vi.fn();
		render(
			<>
				<Button type="button" disabled onClick={onClick}>
					禁用
				</Button>
				<Button type="button">下一个</Button>
			</>,
		);
		await user.tab();
		expect(screen.getByRole("button", { name: "下一个" })).toHaveFocus();
		await user.click(screen.getByRole("button", { name: "禁用" }));
		expect(onClick).not.toHaveBeenCalled();
	});

	it("调用方的 onKeyDown 仍会被调用 (波纹不吞事件)", async () => {
		const user = userEvent.setup();
		const onKeyDown = vi.fn();
		render(
			<Button type="button" onKeyDown={onKeyDown}>
				键
			</Button>,
		);
		await user.tab();
		await user.keyboard("{Enter}");
		expect(onKeyDown).toHaveBeenCalled();
	});

	it("受控: aria-pressed 完全由父组件状态决定", async () => {
		const user = userEvent.setup();
		const onToggle = vi.fn();
		function Controlled(): React.JSX.Element {
			const [pressed, setPressed] = React.useState(false);
			return (
				<Button
					type="button"
					aria-pressed={pressed}
					onClick={() => {
						onToggle(!pressed);
						setPressed(!pressed);
					}}
				>
					加粗
				</Button>
			);
		}
		render(<Controlled />);
		const button = screen.getByRole("button", { name: "加粗" });
		expect(button).toHaveAttribute("aria-pressed", "false");
		await user.click(button);
		expect(button).toHaveAttribute("aria-pressed", "true");
		expect(onToggle).toHaveBeenLastCalledWith(true);
		await user.keyboard(" ");
		expect(button).toHaveAttribute("aria-pressed", "false");
	});

	it("非受控: 表单里不写 type 的 Button 按原生语义提交表单", async () => {
		const user = userEvent.setup();
		const onSubmit = vi.fn((event: React.FormEvent) => event.preventDefault());
		render(
			<form onSubmit={onSubmit} aria-label="表单">
				<Button>提交</Button>
				<Button type="button">取消</Button>
			</form>,
		);
		await user.click(screen.getByRole("button", { name: "取消" }));
		expect(onSubmit).not.toHaveBeenCalled();
		await user.click(screen.getByRole("button", { name: "提交" }));
		expect(onSubmit).toHaveBeenCalledTimes(1);
	});

	it("axe: 文字按钮与带 sr-only 文案的图标按钮没有 serious / critical 违规", async () => {
		render(
			<div>
				<Button type="button">保存</Button>
				<Button type="button" size="icon" aria-label="关闭">
					<svg aria-hidden="true" />
				</Button>
				<Button type="button" disabled>
					禁用
				</Button>
			</div>,
		);
		await expect(document.body).toHaveNoSeriousA11yViolations();
	});
});
