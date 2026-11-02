/**
 * Checkbox: 渲染 (role=checkbox, 标签关联, 半选 mixed), APG checkbox 键盘 (Space 切换, Enter 不切换),
 * 受控与非受控, 禁用态, 以及 axe 扫描.
 */
import * as React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { Checkbox } from "@src/primitives/checkbox";

function Labeled(props: React.ComponentProps<typeof Checkbox> & { label?: string }): React.JSX.Element {
	const { label = "接收通知", id = "notify", ...rest } = props;
	return (
		<div>
			<Checkbox id={id} {...rest} />
			<label htmlFor={id}>{label}</label>
		</div>
	);
}

const box = (name = "接收通知"): HTMLElement => screen.getByRole("checkbox", { name });

describe("Checkbox", () => {
	it("渲染 role=checkbox, 名称来自 label, 默认未选", () => {
		render(<Labeled />);
		const checkbox = box();
		expect(checkbox).toHaveAttribute("data-slot", "checkbox");
		expect(checkbox).not.toBeChecked();
		expect(checkbox).toHaveAttribute("aria-checked", "false");
	});

	it("checked=indeterminate 渲染为 aria-checked=mixed", () => {
		render(<Labeled checked="indeterminate" onCheckedChange={() => {}} />);
		expect(box()).toHaveAttribute("aria-checked", "mixed");
		expect(box()).toHaveAttribute("data-state", "indeterminate");
	});

	it("键盘: Tab 聚焦, Space 切换, Enter 不切换", async () => {
		const user = userEvent.setup();
		render(<Labeled />);
		await user.tab();
		const checkbox = box();
		expect(checkbox).toHaveFocus();
		await user.keyboard(" ");
		expect(checkbox).toBeChecked();
		await user.keyboard("{Enter}");
		expect(checkbox).toBeChecked();
		await user.keyboard(" ");
		expect(checkbox).not.toBeChecked();
	});

	it("非受控: defaultChecked 起步, 点击 label 也能切换", async () => {
		const user = userEvent.setup();
		const onCheckedChange = vi.fn();
		render(<Labeled defaultChecked onCheckedChange={onCheckedChange} />);
		expect(box()).toBeChecked();
		await user.click(screen.getByText("接收通知"));
		expect(box()).not.toBeChecked();
		expect(onCheckedChange).toHaveBeenLastCalledWith(false);
	});

	it("受控: checked 不变时只通知 onCheckedChange, 父组件更新后才切换", async () => {
		const user = userEvent.setup();
		const onCheckedChange = vi.fn();
		const { rerender } = render(<Labeled checked={false} onCheckedChange={onCheckedChange} />);
		await user.click(box());
		expect(onCheckedChange).toHaveBeenLastCalledWith(true);
		expect(box()).not.toBeChecked();

		rerender(<Labeled checked onCheckedChange={onCheckedChange} />);
		expect(box()).toBeChecked();
	});

	it("disabled 时不可聚焦, 点击不切换", async () => {
		const user = userEvent.setup();
		const onCheckedChange = vi.fn();
		render(
			<>
				<Labeled disabled onCheckedChange={onCheckedChange} />
				<button type="button">之后</button>
			</>,
		);
		await user.tab();
		expect(screen.getByRole("button", { name: "之后" })).toHaveFocus();
		await user.click(box());
		expect(onCheckedChange).not.toHaveBeenCalled();
		expect(box()).toBeDisabled();
	});

	it("axe: 未选 / 选中 / 半选 / 禁用都没有 serious / critical 违规", async () => {
		render(
			<div>
				<Labeled id="a" label="未选" />
				<Labeled id="b" label="选中" defaultChecked />
				<Labeled id="c" label="半选" checked="indeterminate" onCheckedChange={() => {}} />
				<Labeled id="d" label="禁用" disabled />
			</div>,
		);
		await expect(document.body).toHaveNoSeriousA11yViolations();
	});
});
