/**
 * Dialog: 渲染 (role=dialog 与标题 / 描述关联), APG dialog 键盘 (Enter 打开, Tab 焦点困在框内,
 * Escape 关闭并把焦点还给触发器), 受控与非受控, 以及打开态 axe 扫描.
 */
import * as React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import {
	Dialog,
	DialogClose,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@src/primitives/dialog";
import { Button } from "@src/primitives/button";

function Sample(props: React.ComponentProps<typeof Dialog>): React.JSX.Element {
	return (
		<Dialog {...props}>
			<DialogTrigger asChild>
				<Button type="button">打开设置</Button>
			</DialogTrigger>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>项目设置</DialogTitle>
					<DialogDescription>修改后立即生效</DialogDescription>
				</DialogHeader>
				<label htmlFor="project-name">名称</label>
				<input id="project-name" defaultValue="HX" />
				<DialogFooter>
					<DialogClose asChild>
						<Button type="button">完成</Button>
					</DialogClose>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}

describe("Dialog", () => {
	it("默认关闭; 打开后渲染 role=dialog, 名称来自标题, 描述来自 Description", async () => {
		const user = userEvent.setup();
		render(<Sample />);
		expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
		await user.click(screen.getByRole("button", { name: "打开设置" }));
		const dialog = await screen.findByRole("dialog", { name: "项目设置" });
		expect(dialog).toHaveAccessibleDescription("修改后立即生效");
		expect(dialog).toHaveAttribute("data-slot", "dialog-content");
		// 内置右上角关闭按钮带 sr-only 文案
		expect(screen.getByRole("button", { name: "Close" })).toBeInTheDocument();
	});

	it("键盘: Enter 打开, Tab 焦点不离开对话框, Escape 关闭并还焦点给触发器", async () => {
		const user = userEvent.setup();
		render(<Sample />);
		const trigger = screen.getByRole("button", { name: "打开设置" });
		trigger.focus();
		await user.keyboard("{Enter}");
		const dialog = await screen.findByRole("dialog");
		expect(trigger).toHaveAttribute("aria-expanded", "true");

		for (let step = 0; step < 5; step += 1) {
			await user.tab();
			expect(dialog).toContainElement(document.activeElement as HTMLElement);
		}
		await user.tab({ shift: true });
		expect(dialog).toContainElement(document.activeElement as HTMLElement);

		await user.keyboard("{Escape}");
		await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
		expect(trigger).toHaveFocus();
		expect(trigger).toHaveAttribute("aria-expanded", "false");
	});

	it("非受控: defaultOpen 打开, DialogClose 关闭", async () => {
		const user = userEvent.setup();
		render(<Sample defaultOpen />);
		expect(screen.getByRole("dialog")).toBeInTheDocument();
		await user.click(screen.getByRole("button", { name: "完成" }));
		await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
	});

	it("受控: open 由父组件决定, Escape 只通知 onOpenChange(false)", async () => {
		const user = userEvent.setup();
		const onOpenChange = vi.fn();
		const { rerender } = render(<Sample open onOpenChange={onOpenChange} />);
		expect(screen.getByRole("dialog")).toBeInTheDocument();

		await user.keyboard("{Escape}");
		expect(onOpenChange).toHaveBeenLastCalledWith(false);
		// 父组件没改 open, 对话框保持打开
		expect(screen.getByRole("dialog")).toBeInTheDocument();

		rerender(<Sample open={false} onOpenChange={onOpenChange} />);
		await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
	});

	it("axe: 打开态的对话框内容没有 serious / critical 违规", async () => {
		render(<Sample defaultOpen />);
		const dialog = await screen.findByRole("dialog");
		// 只扫对话框自身: 打开时 Radix 给 body 的其余子节点加 aria-hidden, 并在两侧插入可聚焦的
		// focus guard span (data-radix-focus-guard), 扫 document.body 会把这套焦点困住机制报成
		// aria-hidden-focus, 那不是本组件渲染的内容
		await expect(dialog).toHaveNoSeriousA11yViolations();
	});
});
