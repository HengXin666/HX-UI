/**
 * Select: 渲染 (combobox + 占位), APG select-only combobox 键盘 (Enter / ArrowDown 打开,
 * 方向键移动, Enter 选中, Escape 关闭, 首字母跳转), 受控与非受控, 以及关闭 / 打开两态 axe 扫描.
 */
import * as React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@src/primitives/select";

const FRUITS = [
	{ value: "apple", label: "Apple" },
	{ value: "banana", label: "Banana" },
	{ value: "cherry", label: "Cherry" },
] as const;

function Sample(props: React.ComponentProps<typeof Select>): React.JSX.Element {
	return (
		<Select {...props}>
			<SelectTrigger aria-label="水果">
				<SelectValue placeholder="选择水果" />
			</SelectTrigger>
			<SelectContent>
				{FRUITS.map((fruit) => (
					<SelectItem key={fruit.value} value={fruit.value}>
						{fruit.label}
					</SelectItem>
				))}
			</SelectContent>
		</Select>
	);
}

async function openWithKeyboard(user: ReturnType<typeof userEvent.setup>, key: string): Promise<HTMLElement> {
	const trigger = screen.getByRole("combobox", { name: "水果" });
	trigger.focus();
	await user.keyboard(key);
	return screen.findByRole("listbox");
}

describe("Select", () => {
	it("渲染 combobox 与占位文案, 默认收起", () => {
		render(<Sample />);
		const trigger = screen.getByRole("combobox", { name: "水果" });
		expect(trigger).toHaveAttribute("data-slot", "select-trigger");
		expect(trigger).toHaveAttribute("aria-expanded", "false");
		expect(trigger).toHaveTextContent("选择水果");
		expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
	});

	it("键盘: Enter 打开, ArrowDown 移动, Enter 选中并收起, 焦点回到触发器", async () => {
		const user = userEvent.setup();
		render(<Sample defaultValue="apple" />);
		const listbox = await openWithKeyboard(user, "{Enter}");
		expect(listbox).toBeInTheDocument();
		expect(screen.getAllByRole("option")).toHaveLength(FRUITS.length);

		await user.keyboard("{ArrowDown}");
		await waitFor(() => expect(screen.getByRole("option", { name: "Banana" })).toHaveFocus());
		await user.keyboard("{Enter}");

		const trigger = screen.getByRole("combobox", { name: "水果" });
		await waitFor(() => expect(screen.queryByRole("listbox")).not.toBeInTheDocument());
		expect(trigger).toHaveTextContent("Banana");
		expect(trigger).toHaveFocus();
	});

	it("键盘: ArrowDown 也能打开, Escape 收起且不改值", async () => {
		const user = userEvent.setup();
		render(<Sample defaultValue="cherry" />);
		await openWithKeyboard(user, "{ArrowDown}");
		await user.keyboard("{Escape}");
		await waitFor(() => expect(screen.queryByRole("listbox")).not.toBeInTheDocument());
		expect(screen.getByRole("combobox", { name: "水果" })).toHaveTextContent("Cherry");
	});

	it("键盘: 打开后输入首字母跳到匹配项", async () => {
		const user = userEvent.setup();
		render(<Sample defaultValue="apple" />);
		await openWithKeyboard(user, "{Enter}");
		await user.keyboard("c");
		await waitFor(() => expect(screen.getByRole("option", { name: "Cherry" })).toHaveFocus());
	});

	it("非受控: defaultValue 起步, 选中后触发器显示新值", async () => {
		const user = userEvent.setup();
		const onValueChange = vi.fn();
		render(<Sample defaultValue="apple" onValueChange={onValueChange} />);
		expect(screen.getByRole("combobox", { name: "水果" })).toHaveTextContent("Apple");
		await openWithKeyboard(user, "{Enter}");
		await user.click(screen.getByRole("option", { name: "Cherry" }));
		expect(onValueChange).toHaveBeenLastCalledWith("cherry");
		await waitFor(() => expect(screen.getByRole("combobox", { name: "水果" })).toHaveTextContent("Cherry"));
	});

	it("受控: value 不变时选择只通知 onValueChange, 父组件改 value 后才更新", async () => {
		const user = userEvent.setup();
		const onValueChange = vi.fn();
		const { rerender } = render(<Sample value="apple" onValueChange={onValueChange} />);
		await openWithKeyboard(user, "{Enter}");
		await user.keyboard("{ArrowDown}{Enter}");
		expect(onValueChange).toHaveBeenLastCalledWith("banana");
		await waitFor(() => expect(screen.queryByRole("listbox")).not.toBeInTheDocument());
		expect(screen.getByRole("combobox", { name: "水果" })).toHaveTextContent("Apple");

		rerender(<Sample value="banana" onValueChange={onValueChange} />);
		expect(screen.getByRole("combobox", { name: "水果" })).toHaveTextContent("Banana");
	});

	it("axe: 收起态的触发器与展开态的列表都没有 serious / critical 违规", async () => {
		const user = userEvent.setup();
		const { container } = render(<Sample defaultValue="apple" />);
		await expect(container).toHaveNoSeriousA11yViolations();
		const listbox = await openWithKeyboard(user, "{Enter}");
		// 展开态只扫列表本身: 列表在 Portal 里, Radix 打开时给其余内容加 aria-hidden 并插入可聚焦的
		// focus guard span (data-radix-focus-guard), 扫 document.body 会把这套机制报成 aria-hidden-focus
		await expect(listbox).toHaveNoSeriousA11yViolations();
	});
});
